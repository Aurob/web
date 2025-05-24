const img_canvas = document.getElementById('img_canvas');
const ctx = img_canvas.getContext('2d');

let hover_id = null;
const TAPE_TRACKS = {
    'jean_michel_jarre_oxygen': '6qF91BDNaJY4PI0mSwYv8L',
    'jean_michel_jarre_rendezvous': '3YrKqMhEdhdvS3BrmKurFr'
};

TAPES = {
    "jean_michel_jarre_oxygene": {"tracks":[], "album":'6qF91BDNaJY4PI0mSwYv8L'},
    "jean_michel_jarre_rendez_vous": {"tracks":[], "album":'3YrKqMhEdhdvS3BrmKurFr'},
    "jean_michel_jarre_en_concert_houston_lyon": {"tracks":[], "album":'0DurQVgGyUkvvmK6FJYmmr'},
    "jean_michel_jarre_zoolook": {"tracks":[], "album":'5AWvWkGvVtkZy9JfPYnLeS'},
    "jean_michel_jarre_equinoxe": {"tracks":[], "album":'4jz8xe3ErCHfGc0m0aGGau'},
    "jean_michel_jarre_the_concerts_in_china": {"tracks":[], "album":'2n0xAPRdATKQC7W5PBeiUE'},
    "jean_michel_jarre_magnetic_fields": {"tracks":[], "album":'4YrK0borbHBjzhf85hzz5M'},
    "tangerine_dream_exit": {"tracks":[], "album":''},
    "tangerine_dream_optical_race_1": {"tracks":[], "album":''},
    "tangerine_dream_optical_race_2": {"tracks":[], "album":''},
    "tangerine_dream_underwater_sunlight": {"tracks":[], "album":''},
    "tangerine_dream_le_park": {"tracks":[], "album":''},
    "tangerine_dream_live": {"tracks":[], "album":''},
    "tangerine_dream_dream_sequence": {"tracks":[], "album":''},
    "tangerine_dream_rubycon": {"tracks":[], "album":''},
    "tangerine_dream_tangram": {"tracks":[], "album":''},
    "yellow_magic_orchestra": {"tracks":[], "album":'1rW3xNyDRIH4UH76b3DtQX'},
    "ymo_kyoretsu_na_rythm": {"tracks":[], "album":''},
    "mallsoft_mixtape_july_2024": {"tracks":[], "album":''},
    "the_gospel_according_to_scrooge": {"tracks":[], "album":''},
    "sony_hf_normal_bias_60_blank": {"tracks":[], "album":''},
    "the_music_of_raymond_scott": {"tracks":[], "album":''},
    "derelict_satellite_initial_launch": {"tracks":[], "album":''},
    "rainforest_melody": {"tracks":[], "album":''},
    "wayne_toups_and_zydecajun": {"tracks":[], "album":''}
}
  
const spotify_album_template = '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/{albumid}?utm_source=generator" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>'
const img = new Image();
const bb_img = new Image();

var tape_playing = false;

var dragState = {
    dragging: false,
    dragType: null, // "move" or "rotate"
    itemIndex: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origRotation: 0
};

// Helper: get polygon bounding box
function getPolygonBoundingBox(points) {
    let minX = points[0][0], minY = points[0][1], maxX = points[0][0], maxY = points[0][1];
    for (let i = 1; i < points.length; i++) {
        minX = Math.min(minX, points[i][0]);
        minY = Math.min(minY, points[i][1]);
        maxX = Math.max(maxX, points[i][0]);
        maxY = Math.max(maxY, points[i][1]);
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function load_tape(tape_id) {
    let error = false;
    if (tape_id in TAPES) {
        let tape = TAPES[tape_id];
        let albumid = tape.album;
        if(albumid)
            document.querySelector("#embed").innerHTML = spotify_album_template.replace('{albumid}', albumid);
        else error = true;
    }
    if(error) {
        document.querySelector("#message").innerHTML = `${tape_id} is not supported right now. Please try another tape`;
    }
}

// Draw the image inside each polygon, with x/y/rotation/active support
function drawImage() {
    ctx.clearRect(0, 0, img_canvas.width, img_canvas.height);

    // Draw bb_img at the top right, about 1/4 the size of the canvas
    const bbWidth = img_canvas.width / 3;
    const bbHeight = img_canvas.height / 3;
    const bbX = img_canvas.width/2 - bbWidth/2;
    const bbY = img_canvas.height/4;
    ctx.drawImage(
        bb_img,
        bbX, // x: right edge minus width
        bbY, // y: top
        bbWidth,
        bbHeight
    );

    // Helper: get bounding box for boombox
    const bbBox = {
        minX: bbX,
        minY: bbY,
        maxX: bbX + bbWidth,
        maxY: bbY + bbHeight,
        width: bbWidth,
        height: bbHeight
    };

    // Helper: polygon-rectangle intersection (AABB)
    function polygonIntersectsRect(points, rect) {
        // First, check if any polygon point is inside the rect
        for (let i = 0; i < points.length; i++) {
            const [px, py] = points[i];
            if (
                px >= rect.minX && px <= rect.maxX &&
                py >= rect.minY && py <= rect.maxY
            ) {
                return true;
            }
        }
        // Next, check if any rect corner is inside the polygon
        function pointInPoly(x, y, poly) {
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i][0], yi = poly[i][1];
                const xj = poly[j][0], yj = poly[j][1];
                const intersect = ((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi + 0.00001) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }
        const rectCorners = [
            [rect.minX, rect.minY],
            [rect.maxX, rect.minY],
            [rect.maxX, rect.maxY],
            [rect.minX, rect.maxY]
        ];
        for (let i = 0; i < rectCorners.length; i++) {
            if (pointInPoly(rectCorners[i][0], rectCorners[i][1], points)) {
                return true;
            }
        }
        // (Optional: could check for edge intersection, but above is enough for this use)
        return false;
    }

    // Helper: polygon-polygon AABB collision
    function polygonsAABBIntersect(pointsA, pointsB) {
        // Get AABB for both
        const a = getPolygonBoundingBox(pointsA);
        const b = getPolygonBoundingBox(pointsB);
        return (
            a.minX < b.maxX && a.maxX > b.minX &&
            a.minY < b.maxY && a.maxY > b.minY
        );
    }

    // Helper: transform polygon points by x/y/rotation
    function transformPoints(points, x, y, rotation, centerX, centerY, scale=1) {
        return points.map(([px, py]) => {
            // Apply x/y offset
            let tx = px + x - centerX;
            let ty = py + y - centerY;
            // Apply rotation
            let r = rotation;
            let rx = tx * Math.cos(r) - ty * Math.sin(r);
            let ry = tx * Math.sin(r) + ty * Math.cos(r);
            // Apply scale and translate back to screen
            return [
                centerX + rx * scale,
                centerY + ry * scale
            ];
        });
    }

    // --- GRAVITY & COLLISION LOGIC ---

    // We'll process items in order, but to avoid "falling through" we repeat gravity steps a few times
    const gravity = 1; // pixels per frame
    const maxGravitySteps = 1; // how many times to try to settle per draw

    // Precompute all item bounding boxes and centers
    let itemStates = items.map((item, idx) => {
        let points = item.points;
        // Default x/y/rotation/active if not present
        if (typeof item.x !== "number") item.x = 0;
        if (typeof item.y !== "number") item.y = 0;
        if (typeof item.rotation !== "number") item.rotation = 0;
        if (typeof item.active !== "boolean") item.active = false;

        // Get bounding box of polygon
        const bbox = getPolygonBoundingBox(points);

        // Compute center of item (with offset)
        const centerX = bbox.minX + bbox.width / 2 + item.x;
        const centerY = bbox.minY + bbox.height / 2 + item.y;

        // Save the original position as the "default" (max) scale reference
        if (item._defaultX === undefined) item._defaultX = centerX;
        if (item._defaultY === undefined) item._defaultY = centerY;

        return {
            item,
            points,
            bbox,
            centerX,
            centerY,
            x: item.x,
            y: item.y,
            rotation: item.rotation,
            active: item.active,
            index: idx
        };
    });

    // Gravity: for each item, try to move it down until it lands on another item or the bottom
    for (let step = 0; step < maxGravitySteps; step++) {
        for (let i = 0; i < itemStates.length; i++) {
            let state = itemStates[i];
            let {item, points, bbox, centerX, centerY, x, y, rotation, active, index} = state;

            // Only apply gravity if not being dragged (active)
            if (item.active) continue;

            // Transform points to screen coordinates
            let transformed = transformPoints(points, x, y, rotation, centerX, centerY);

            // Try to move down by gravity
            let canFall = (tape_playing != item.label && hover_id != item.label);
            let testY = y + gravity;

            // Test collision with other items (not self)
            for (let j = 0; j < itemStates.length; j++) {
                if (i === j) continue;
                let other = itemStates[j];
                // Don't check against items being dragged
                if (other.item.active) continue;

                // Move this item down by gravity, check for collision with other's current position
                let testTransformed = transformPoints(points, x, testY, rotation, centerX, centerY);
                let otherTransformed = transformPoints(other.points, other.x, other.y, other.rotation, other.centerX, other.centerY);

                // Use AABB for speed
                if (polygonsAABBIntersect(testTransformed, otherTransformed)) {
                    // Check if any point of this item is below and inside other's AABB
                    const otherBox = getPolygonBoundingBox(otherTransformed);
                    for (let k = 0; k < testTransformed.length; k++) {
                        let [px, py] = testTransformed[k];
                        if (
                            px >= otherBox.minX && px <= otherBox.maxX &&
                            py >= otherBox.minY && py <= otherBox.maxY &&
                            py > otherBox.minY // only if below top of other
                        ) {
                            canFall = false;
                            break;
                        }
                    }
                    if (!canFall) break;
                }
            }

            // Test collision with bottom of canvas
            let testTransformed = transformPoints(points, x, testY, rotation, centerX, centerY);
            let testBox = getPolygonBoundingBox(testTransformed);
            if (testBox.maxY >= img_canvas.height/1.5) {
                canFall = false;
            }

            // If can fall, update y
            if (canFall) {
                item.y = testY;
                // Update state for next step
                state.y = testY;
                // Recompute centerY
                state.centerY = bbox.minY + bbox.height / 2 + item.y;
            }
        }
    }

    // Now, draw all items at their (possibly updated) positions
    for (let s = 0; s < itemStates.length; s++) {
        let state = itemStates[s];
        let {item, points, bbox, centerX, centerY, x, y, rotation, active, index} = state;

        // Recompute centerX/centerY in case y changed
        const drawCenterX = bbox.minX + bbox.width / 2 + item.x;
        const drawCenterY = bbox.minY + bbox.height / 2 + item.y;

        let scale = 1;

        // Save context and set up transform
        ctx.save();

        // Move to center of polygon + offset
        ctx.translate(drawCenterX, drawCenterY);
        ctx.rotate(item.rotation);
        ctx.scale(scale, scale);

        // Clip to polygon (shifted by -center, then scaled)
        ctx.beginPath();
        ctx.moveTo((points[0][0] - drawCenterX + item.x) / scale, (points[0][1] - drawCenterY + item.y) / scale);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo((points[i][0] - drawCenterX + item.x) / scale, (points[i][1] - drawCenterY + item.y) / scale);
        }
        ctx.closePath();
        ctx.clip();

        // Draw the image so that the part of the image that would be in the polygon is shown
        // Map the image to the bounding box of the polygon (centered at 0,0 after translate/scale)
        ctx.drawImage(
            img,
            bbox.minX, bbox.minY, bbox.width, bbox.height, // source rect
            -bbox.width / 2 / scale, -bbox.height / 2 / scale, bbox.width / scale, bbox.height / scale // dest rect
        );

        ctx.restore();


        // Check intersection with boombox (in screen coordinates)
        // Transform points to screen coordinates (with x/y/rotation)
        let transformedPoints = points.map(([px, py]) => {
            // Apply x/y offset
            let tx = px + item.x - centerX;
            let ty = py + item.y - centerY;
            // Apply rotation
            let r = item.rotation;
            let rx = tx * Math.cos(r) - ty * Math.sin(r);
            let ry = tx * Math.sin(r) + ty * Math.cos(r);
            // Apply scale and translate back to screen
            return [
                centerX + rx * scale,
                centerY + ry * scale
            ];
        });

        // Try to get tapeid from item.label or item.id
        let tapeid = item.label || item.id;
        if (polygonIntersectsRect(transformedPoints, bbBox)) {
            if(tape_playing && tapeid != tape_playing) {
                document.querySelector("#message").innerHTML = `${tape_playing} is currently playing. Remove it from the boombox to play ${tapeid}`;
                continue;
            }
            if (tapeid) {
                // Normalize tapeid to match TAPES keys
                tapeid = tapeid.toLowerCase().replace(/ /g, "_");
                if (TAPES[tapeid]) {
                    if(!tape_playing) {
                        load_tape(tapeid);
                        tape_playing = tapeid;
                    }
                }
            }
        }
        else if(tape_playing == tapeid) {
            tape_playing = null;
            document.querySelector("#embed").innerHTML = '';
            document.querySelector("#message").innerHTML = '';
        }
    }
}


function loadEvents() {
    // --- Drag-to-move/rotate implementation ---

    img_canvas.addEventListener('mousemove', function (event) {
        const rect = img_canvas.getBoundingClientRect();
        const scaleX = img_canvas.width / rect.width;
        const scaleY = img_canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // If dragging, update item position or rotation
        if (dragState.dragging && dragState.itemIndex !== null) {
            let item = items[dragState.itemIndex];
            if (dragState.dragType === "move") {
                // Move: update x/y by drag delta
                item.x = dragState.origX + (x - dragState.startX);
                item.y = dragState.origY + (y - dragState.startY);
            } else if (dragState.dragType === "rotate") {
                // Rotate: calculate angle from center to mouse
                let points = item.points;
                // Get bounding box center
                const bbox = getPolygonBoundingBox(points);
                const centerX = bbox.minX + bbox.width / 2 + item.x;
                const centerY = bbox.minY + bbox.height / 2 + item.y;
                const angle0 = Math.atan2(dragState.startY - centerY, dragState.startX - centerX);
                const angle1 = Math.atan2(y - centerY, x - centerX);
                item.rotation = dragState.origRotation + (angle1 - angle0);
            }
            return;
        }

        // Not dragging: do hover logic
        hover_id = null;
        ctx.clearRect(0, 0, img_canvas.width, img_canvas.height);

        for (let index = 0; index < items.length; index++) {
            let item = items[index];
            let points = item.points;

            // Account for x/y/rotation
            ctx.save();
            if (typeof item.x !== "number") item.x = 0;
            if (typeof item.y !== "number") item.y = 0;
            if (typeof item.rotation !== "number") item.rotation = 0;
            ctx.translate(item.x, item.y);
            ctx.rotate(item.rotation);

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
            }
            ctx.closePath();

            if (ctx.isPointInPath(x, y)) {
                ctx.lineWidth = 5;
                ctx.strokeStyle = 'red';
                ctx.stroke();
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.fill();

                hover_id = index;
            }
            ctx.restore();
        }
    });

    img_canvas.addEventListener('mousedown', function (event) {
        if (hover_id != null) {
            // Only left mouse button
            if (event.button === 0) {
                dragState.dragging = true;
                dragState.itemIndex = hover_id;

                const rect = img_canvas.getBoundingClientRect();
                const scaleX = img_canvas.width / rect.width;
                const scaleY = img_canvas.height / rect.height;
                const x = (event.clientX - rect.left) * scaleX;
                const y = (event.clientY - rect.top) * scaleY;

                dragState.startX = x;
                dragState.startY = y;

                let item = items[hover_id];
                dragState.origX = item.x;
                dragState.origY = item.y;
                dragState.origRotation = item.rotation;

                // If right mouse button or altKey, rotate; else move
                if (event.altKey || event.button === 2) {
                    dragState.dragType = "rotate";
                } else {
                    dragState.dragType = "move";
                }
            }
        }
    });

    img_canvas.addEventListener('mouseup', function (event) {
        dragState.dragging = false;
        dragState.itemIndex = null;
        dragState.dragType = null;
    });

    img_canvas.addEventListener('mouseleave', function (event) {
        dragState.dragging = false;
        dragState.itemIndex = null;
        dragState.dragType = null;
    });

    // Prevent context menu on canvas (for right click/alt drag)
    img_canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    img_canvas.addEventListener('click', function (event) {
        // Only run click logic if not dragging
        if (dragState.dragging) return;
        if (hover_id != null) {
            let item = items[hover_id];
        }
    });
}

window.addEventListener('load', function () {
    items = ITEMS.boxes;
    // Ensure all items have x/y/rotation/active
    for (let item of items) {
        if (typeof item.x !== "number") item.x = 0;
        if (typeof item.y !== "number") item.y = 0;
        if (typeof item.rotation !== "number") item.rotation = 0;
        if (typeof item.active !== "boolean") item.active = false;
    }
    return new Promise((resolve) => {
        img.onload = () => {
            // Use the loaded image's dimensions instead of hardcoded values
            const imgWidth = img.width;
            const imgHeight = img.height;
            for (const canvas of [img_canvas, img_canvas]) {
                canvas.width = this.window.innerWidth;
                canvas.height = this.window.innerHeight;
                canvas.style.zIndex = 1;
                canvas.style.position = 'fixed';
                canvas.style.margin = '5vw';
            }
            resolve(); // Only resolve after image is loaded and drawn
        };
        img.src = ITEMS.key;
    })
    .then(() => {

        return new Promise((resolve) => {
            bb_img.onload = () => {
                resolve(); 
            };
            bb_img.src = 'boombox.png';
        })
    })
    .then(()=>{
        loadEvents();
        // Animation loop to redraw the canvas
        function animate() {
            drawImage();
            requestAnimationFrame(animate);
        }
        animate();
    })
})