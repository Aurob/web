const img_canvas = document.getElementById('img_canvas');
const ctx = img_canvas.getContext('2d');

let hover_id = null;

var items = {};
var img = new Image();

// Helper: render all items as image slices, with x/y offset and angle, and highlight hovered
// Items being dragged are always rendered last, and get a diminishing prio as other items are dragged
// Each item can have a .renderPrio property (higher = rendered later), default 0
// The dragged item is always rendered last, and its prio is incremented each time it's dragged
let drag_prio_counter = 1; // global counter for diminishing prio
var broken = 0;
var played_rock_break = false;
var break_sounds = [
    './audio/break06-36414.mp3',
];

// Use a single AudioContext for the app
let break_audio_ctx = null;

function break_mug(item) {
    broken++;
    // Count total items (assume items is global and is an array)
    var total_items = Array.isArray(items) ? items.length : 0;

    // If we haven't played the rare sound and this is the last break, force it
    let sound;
    var idx = Math.floor(Math.random() * break_sounds.length);
    sound = break_sounds[idx];

    // Use Web Audio API for subtle variation
    if (!break_audio_ctx) {
        break_audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Fetch and decode the audio file
    fetch(sound)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => break_audio_ctx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = break_audio_ctx.createBufferSource();
            source.buffer = audioBuffer;

            // Add subtle random pitch and playback rate variation based on time
            // Use time for deterministic but changing value
            const now = Date.now();
            // Pitch: 0.95 - 1.05 range, modulated by time and a little randomness
            let base = 1 + 0.03 * Math.sin(now / 333 + Math.random() * 2);
            // Add a little more randomness
            base += (Math.random() - 0.5) * 0.03;
            source.playbackRate.value = Math.max(0.92, Math.min(1.08, base));

            // Optionally, add a slight filter for more variation
            const filter = break_audio_ctx.createBiquadFilter();
            filter.type = "highpass";
            // Cutoff between 200 and 600 Hz, modulated by time
            filter.frequency.value = 200 + (Math.abs(Math.sin(now / 1000)) * 400);

            source.connect(filter);
            filter.connect(break_audio_ctx.destination);

            source.start(0);
        })
        .catch(() => {
            // fallback: play with <audio> if Web Audio fails
            const audio = new Audio(sound);
            audio.currentTime = 0;
            audio.play().catch(() => {});
        });
    }

function renderItems(img, items, hover_id = null, dragging = false, drag_item_index = null, drag_mouse = null) {
    ctx.clearRect(0, 0, img_canvas.width, img_canvas.height);

    // 1. Draw the whole image first
    ctx.save();
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // 2. Render each item as a static polygon filled with a gradient based on adjacent pixel colors
    for (let index = 0; index < items.length; index++) {
        let item = items[index];
        let points = item.points;

        // Collect colors for each point by sampling the pixel adjacent to each point
        let r = 0, g = 0, b = 0, a = 0;
        for (let i = 0; i < points.length; i++) {
            let x = Math.round(points[i][0]);
            let y = Math.round(points[i][1]);
            // Sample the pixel to the right and down (adjacent)
            let sampleX = Math.min(x + 1, img_canvas.width - 1);
            let sampleY = Math.min(y + 1, img_canvas.height - 1);
            let pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
            r += pixel[0];
            g += pixel[1];
            b += pixel[2];
            a += pixel[3];
        }
        let n = points.length;
        r = Math.round(r / n);
        g = Math.round(g / n);
        b = Math.round(b / n);
        a = a / n / 255;
        let avgColor = `rgba(${r},${g},${b},${a})`;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.fillStyle = avgColor;
        ctx.globalAlpha = 1.0;
        ctx.fill();
        ctx.restore();
    }

    // --- Render priority logic ---
    // Build a list of items with their renderPrio, and index
    let renderList = [];
    for (let index = 0; index < items.length; index++) {
        let item = items[index];
        let prio = typeof item.renderPrio === "number" ? item.renderPrio : 0;
        // If this is the dragged item, give it a very high prio (always last)
        if (dragging && drag_item_index === index) {
            prio = 100000 + drag_prio_counter; // always last, but prio increases as more drags happen
        }
        renderList.push({index, prio});
    }
    // Sort by prio ascending, so higher prio rendered later (on top)
    renderList.sort((a, b) => a.prio - b.prio);

    // 3. Render each item as a slice of the original image, with its offset/angle (so it can move)
    for (let i = 0; i < renderList.length; i++) {
        let index = renderList[i].index;
        // If dragging, skip rendering the dragged item here (will render last)
        if (dragging && drag_item_index === index) continue;
        let item = items[index];
        let points = item.points;
        let offsetX = item.offsetX || 0;
        let offsetY = item.offsetY || 0;
        let angle = item.angle || 0;
        let _defaultX = item._defaultX || 0;
        let _defaultY = item._defaultY || 0;

        if(offsetY >  img_canvas.height-item.height*5 && !item.broken) {
            break_mug(item)
            item.broken = true;
        };
        // Apply gravity to y if item is not in its default position
        if (offsetX !== _defaultX || offsetY !== _defaultY) {
            // Simple gravity: increase offsetY by a small amount (e.g., 2 pixels per frame)
            // You may want to adjust this value or make it frame-rate independent
            item.offsetY = (item.offsetY || 0) + 50;
            offsetY = item.offsetY;
        }

        // --- Apply same scaling logic as in drag ---
        // Calculate scale based on offsetY: negative = smaller, positive = larger
        // Use the same formula as in drag: scale = 1 - (offsetY / 500)
        let scale = 1 - (offsetY / 500);
        scale = Math.max(0.75, Math.min(1.25, scale));

        // Find the center of the polygon to scale about its center
        let minX = Math.min(...points.map(p => p[0]));
        let maxX = Math.max(...points.map(p => p[0]));
        let minY = Math.min(...points.map(p => p[1]));
        let maxY = Math.max(...points.map(p => p[1]));
        let centerX = (minX + maxX) / 2;
        let centerY = (minY + maxY) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.rotate(angle);
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let j = 1; j < points.length; j++) {
            ctx.lineTo(points[j][0], points[j][1]);
        }
        ctx.closePath();
        ctx.clip();

        // Instead of filling with black, fill with a slice from the original position
        // Draw the image, but only inside the transformed polygon, using the original polygon's position
        ctx.drawImage(
            img,
            0, 0, img.width, img.height, // source: full image
            -_defaultX, -_defaultY, img.width, img.height // dest: offset so polygon aligns with original
        );

        ctx.restore();

        // If this is the hovered item, draw highlight (with transform and scaling)
        if (!dragging && hover_id === index) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.rotate(angle);
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let j = 1; j < points.length; j++) {
                ctx.lineTo(points[j][0], points[j][1]);
            }
            ctx.closePath();
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'red';
            ctx.stroke();
            // Do NOT fill with red highlight, just stroke
            ctx.restore();
        }
    }

    // If dragging, render the dragged item above everything as a slice of the original image at its dragged position
    if (dragging && drag_item_index !== null && drag_mouse) {
        // On each drag, increment the prio counter for diminishing prio effect
        if (!items[drag_item_index].hasOwnProperty("_lastDragPrio") || items[drag_item_index]._lastDragPrio !== drag_prio_counter) {
            items[drag_item_index].renderPrio = 100000 + drag_prio_counter;
            items[drag_item_index]._lastDragPrio = drag_prio_counter;
            drag_prio_counter++;
        }

        let item = items[drag_item_index];
        let points = item.points;
        let angle = item.angle || 0;
        let _defaultX = item._defaultX || 0;
        let _defaultY = item._defaultY || 0;

        let dx = drag_mouse.x - drag_start_mouse.x;
        let dy = drag_mouse.y - drag_start_mouse.y;
        let newOffsetX = drag_start_offset.x + dx;
        let newOffsetY = drag_start_offset.y + dy;

        // Calculate scale based on newOffsetY: negative = smaller, positive = larger
        // Let's use a base scale of 1, and scale factor of 1 + newOffsetY / 500 (tweak denominator for sensitivity)
        // Clamp scale to a reasonable range (e.g., 0.5 to 2)
        let scale = 1 - (newOffsetY / 500);
        scale = Math.max(0.75, Math.min(1.25, scale));

        // Find the center of the polygon to scale about its center
        let minX = Math.min(...points.map(p => p[0]));
        let maxX = Math.max(...points.map(p => p[0]));
        let minY = Math.min(...points.map(p => p[1]));
        let maxY = Math.max(...points.map(p => p[1]));
        let centerX = (minX + maxX) / 2;
        let centerY = (minY + maxY) / 2;

        ctx.save();
        ctx.translate(newOffsetX, newOffsetY);
        ctx.rotate(angle);
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.clip();

        // When scaling, the image slice must also be scaled about the same center
        // So, we need to adjust the drawImage destination accordingly
        // The offset for drawImage is still -_defaultX, -_defaultY, but also needs to be scaled about the polygon center
        // Since we've already transformed the context, we can just draw as before
        ctx.drawImage(
            img,
            0, 0, img.width, img.height, // source: full image
            -_defaultX, -_defaultY, img.width, img.height // dest: offset so polygon aligns with original
        );

        ctx.restore();
        // No highlight while dragging
    }
}

// --- Dragging state ---
let dragging = false;
let drag_item_index = null;
let drag_start_mouse = {x: 0, y: 0};
let drag_start_offset = {x: 0, y: 0};
let drag_mouse = null;

// Animation loop for rendering items
function animate() {
    renderItems(
        img,
        items,
        hover_id,
        dragging,
        drag_item_index,
        dragging ? drag_mouse : null
    );
    // Remove any items that are marked as broken
    requestAnimationFrame(animate);
}

function pointInTransformedPolygon(points, offsetX, offsetY, angle, x, y) {
    // Transform the point (x, y) into the local coordinate system of the polygon
    // 1. Translate by -offsetX, -offsetY
    // 2. Rotate by -angle
    let dx = x - offsetX;
    let dy = y - offsetY;
    let cos = Math.cos(-angle);
    let sin = Math.sin(-angle);
    let localX = dx * cos - dy * sin;
    let localY = dx * sin + dy * cos;

    // Now test if (localX, localY) is inside the polygon
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    let inside = ctx.isPointInPath(localX, localY);
    ctx.restore();
    return inside;
}

function loadEvents(img) {
    img_canvas.addEventListener('mousemove', function (event) {
        const rect = img_canvas.getBoundingClientRect();
        const scaleX = img_canvas.width / rect.width;
        const scaleY = img_canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (dragging && drag_item_index !== null) {
            // Move the dragged item visually (do not update the item's offset yet)
            drag_mouse = {x, y};
            // Don't update hover_id while dragging
            return;
        }

        // Not dragging: update hover_id
        hover_id = null;
        for (let index = 0; index < items.length; index++) {
            let item = items[index];
            let points = item.points;
            let offsetX = item.offsetX || 0;
            let offsetY = item.offsetY || 0;
            let angle = item.angle || 0;

            if (pointInTransformedPolygon(points, offsetX, offsetY, angle, x, y)) {
                hover_id = index;
            }
        }
    });

    img_canvas.addEventListener('mousedown', function (event) {
        const rect = img_canvas.getBoundingClientRect();
        const scaleX = img_canvas.width / rect.width;
        const scaleY = img_canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Check if mouse is over any item
        for (let index = 0; index < items.length; index++) {
            let item = items[index];
            let points = item.points;
            let offsetX = item.offsetX || 0;
            let offsetY = item.offsetY || 0;
            let angle = item.angle || 0;

            if (pointInTransformedPolygon(points, offsetX, offsetY, angle, x, y)) {
                dragging = true;
                drag_item_index = index;
                drag_start_mouse = {x, y};
                drag_start_offset = {
                    x: item.offsetX || 0,
                    y: item.offsetY || 0
                };
                drag_mouse = {x, y};
                // Set hover_id to the dragged item
                hover_id = index;
                break;
            }
        }
    });

    img_canvas.addEventListener('mouseup', function (event) {
        if (dragging && drag_item_index !== null && drag_mouse) {
            // On mouseup, update the item's offset to the new position
            let item = items[drag_item_index];
            let dx = drag_mouse.x - drag_start_mouse.x;
            let dy = drag_mouse.y - drag_start_mouse.y;
            item.offsetX = drag_start_offset.x + dx;
            item.offsetY = drag_start_offset.y + dy;
        }
        dragging = false;
        drag_item_index = null;
        drag_mouse = null;
    });

    img_canvas.addEventListener('mouseleave', function (event) {
        if (dragging && drag_item_index !== null && drag_mouse) {
            // On mouseleave, update the item's offset to the new position
            let item = items[drag_item_index];
            let dx = drag_mouse.x - drag_start_mouse.x;
            let dy = drag_mouse.y - drag_start_mouse.y;
            item.offsetX = drag_start_offset.x + dx;
            item.offsetY = drag_start_offset.y + dy;
        }
        dragging = false;
        drag_item_index = null;
        drag_mouse = null;
    });

    img_canvas.addEventListener('click', function (event) {
        // Only trigger click if not dragging
        if (dragging) return;
        if (hover_id == null) return;
        let item = items[hover_id];
        let item_label_url = item.label.replace(' ', '-');
        document.querySelector("#item_url").href = `https://starbucks-mugs.com/mug/been-there-${item_label_url}/`;
        document.querySelector("#item_url").innerText = item.label;
    });
}


window.addEventListener('load', function () {
    items = ITEMS.boxes;
    return new Promise((resolve) => {
        img = document.querySelector('img');
        // Use the loaded image's dimensions instead of hardcoded values
        const imgWidth = img.width;
        const imgHeight = img.height;
        for (const canvas of [img_canvas, img_canvas]) {
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            // Use the image's dimensions instead of hardcoded 2506 and 1774
            canvas.style.zoom = (((window.innerWidth + window.innerHeight) / 2) / ((imgWidth + imgHeight) / 2)) / 2;
            canvas.style.zIndex = 1;
        }
        ctx.drawImage(img, 0, 0);
        img.crossOrigin = "anonymous";
        resolve(); // Only resolve after image is loaded and drawn
    })
    .then(() => {
        loadEvents();
        animate();
    })
})