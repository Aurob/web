function p3ToHex(r, g, b) {
    // 1. Linearize P3 (remove gamma) 
    // P3 uses the same transfer function as sRGB
    const lin = (v) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    const lr = lin(r), lg = lin(g), lb = lin(b);

    // 2. Apply Conversion Matrix (Linear P3 -> Linear sRGB)
    // Source: CSS Color Module Level 4 / Skia
    const sr = lr * 1.2249 + lg * -0.2247 + lb * -0.0002;
    const sg = lr * -0.0420 + lg * 1.0419 + lb * 0.0001;
    const sb = lr * -0.0197 + lg * -0.0786 + lb * 1.0979;

    // 3. Gamma Encode (sRGB transfer) and Clamp
    const gam = (v) => {
        const val = Math.abs(v); // protect against negative floating point errors
        const res = val <= 0.0031308 ? val * 12.92 : 1.055 * Math.pow(val, 1.0 / 2.4) - 0.055;
        // CLAMP: This is where the shift happens. 
        // If the P3 color is "too orange" for sRGB, we must cap it at 1.0.
        return Math.max(0, Math.min(1, res)); 
    };

    const toHex = (n) => {
        const int = Math.round(n * 255);
        return int.toString(16).padStart(2, '0').toUpperCase();
    }

    return `#${toHex(gam(sr))}${toHex(gam(sg))}${toHex(gam(sb))}`;
}

// Example Usage based on your values:
console.log("Blue:", p3ToHex(0.231, 0.309, 0.355));
console.log("Dark Blue:", p3ToHex(0.157, 0.192, 0.208));
console.log("White:", p3ToHex(0.985, 0.985, 0.95));
console.log("Orange:", p3ToHex(1, 0.6, 0.4));
console.log("Yellow:", p3ToHex(0.95, 0.85, 0.5));