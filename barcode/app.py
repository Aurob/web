from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
from pyzbar.pyzbar import decode
import base64

app = Flask(__name__)

# store unique scans globally for session
scanned = set()

def preprocess_image(img):
    """Apply multiple preprocessing techniques to improve barcode detection"""
    preprocessed_variants = []

    # Original image
    preprocessed_variants.append(('original', img))

    # Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    preprocessed_variants.append(('gray', gray))

    # Sharpen
    kernel_sharpen = np.array([[-1,-1,-1],
                                [-1, 9,-1],
                                [-1,-1,-1]])
    sharpened = cv2.filter2D(gray, -1, kernel_sharpen)
    preprocessed_variants.append(('sharpened', sharpened))

    # Adaptive threshold
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY, 11, 2)
    preprocessed_variants.append(('adaptive', adaptive))

    # High contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    contrast = clahe.apply(gray)
    preprocessed_variants.append(('contrast', contrast))

    # Blur + threshold (good for noisy images)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    preprocessed_variants.append(('thresh', thresh))

    # High contrast + sharpen
    contrast_sharp = cv2.filter2D(contrast, -1, kernel_sharpen)
    preprocessed_variants.append(('contrast_sharp', contrast_sharp))

    return preprocessed_variants

def detect_barcodes_multipass(img):
    """Try multiple preprocessing techniques and detection methods"""
    all_barcodes = {}

    # Get all preprocessing variants
    variants = preprocess_image(img)

    # Try pyzbar on each variant
    for name, processed in variants:
        barcodes = decode(processed)
        for b in barcodes:
            val = b.data.decode("utf-8", errors="replace")
            kind = b.type
            key = (kind, val)
            if key not in all_barcodes:
                all_barcodes[key] = b

    # Try OpenCV's barcode detector if available (OpenCV 4.x)
    try:
        detector = cv2.barcode.BarcodeDetector()
        for name, processed in variants[:3]:  # Try on first 3 variants only
            # Convert grayscale back to BGR for OpenCV detector
            if len(processed.shape) == 2:
                processed_bgr = cv2.cvtColor(processed, cv2.COLOR_GRAY2BGR)
            else:
                processed_bgr = processed

            retval, decoded_info, decoded_type, points = detector.detectAndDecode(processed_bgr)
            if retval:
                for info, dtype in zip(decoded_info, decoded_type):
                    if info:  # Skip empty detections
                        key = (dtype if dtype else "UNKNOWN", info)
                        if key not in all_barcodes:
                            # Create a fake barcode object for consistency
                            class FakeBarcode:
                                def __init__(self, data, btype, rect):
                                    self.data = data.encode('utf-8')
                                    self.type = btype if btype else "UNKNOWN"
                                    self.rect = rect

                            # Estimate rect from points if available
                            if points is not None and len(points) > 0:
                                pts = points[0].astype(int)
                                x, y, w, h = cv2.boundingRect(pts)
                                rect = (x, y, w, h)
                            else:
                                rect = (0, 0, img.shape[1], img.shape[0])

                            all_barcodes[key] = FakeBarcode(info, dtype, rect)
    except AttributeError:
        # OpenCV barcode module not available
        pass
    except Exception as e:
        print(f"OpenCV detector error: {e}")

    return list(all_barcodes.values())

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/scan", methods=["POST"])
def scan():
    global scanned
    data_url = request.json.get("image")
    if not data_url:
        return jsonify({"error": "No image"}), 400

    # decode base64
    header, encoded = data_url.split(",", 1)
    nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = []

    # Use multi-pass detection with preprocessing
    barcodes = detect_barcodes_multipass(img)

    # draw detection boxes and labels on the image
    for b in barcodes:
        kind = b.type
        val = b.data.decode("utf-8", errors="replace") if isinstance(b.data, bytes) else b.data
        key = (kind, val)

        # draw box for visual feedback
        x, y, w, h = b.rect
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(
            img,
            kind,
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2,
        )

        if key not in scanned:
            scanned.add(key)
            results.append({"type": kind, "value": val})

    # encode processed image back to base64
    _, buffer = cv2.imencode('.png', img)
    processed_img = base64.b64encode(buffer).decode('utf-8')
    processed_data_url = f"data:image/png;base64,{processed_img}"

    return jsonify({
        "new_scans": results,
        "all_scans": [{"type": k, "value": v} for k, v in scanned],
        "processed_image": processed_data_url,
        "detections": len(barcodes)
    })

if __name__ == "__main__":
    app.run(debug=True)

