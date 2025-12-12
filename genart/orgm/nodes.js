

function interpolateQuad(p0, p1, p2, t) {
    const x = (1 - t) * ((1 - t) * p0.x + t * p1.x) + t * ((1 - t) * p1.x + t * p2.x);
    const y = (1 - t) * ((1 - t) * p0.y + t * p1.y) + t * ((1 - t) * p1.y + t * p2.y);
    return { x, y };
}

function generateDetailedPolygon(polygon, scale) {
    const detailedPoints = [];
    const numPoints = polygon.points.length * scale;

    for (let i = 0; i < polygon.points.length; i++) {
        const p0 = (i > 0) ? polygon.points[i - 1] : polygon.points[polygon.points.length - 1];
        const p1 = polygon.points[i];
        const p2 = polygon.points[(i + 1) % polygon.points.length];

        const midPoint1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        const midPoint2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        const segmentPoints = Math.ceil(scale * (i + 1) / polygon.points.length) - detailedPoints.length;
        for (let j = 0; j < segmentPoints; j++) {
            const t = j / (segmentPoints - (i === polygon.points.length - 1 ? 0 : 1));
            const qPoint = interpolateQuad(midPoint1, p1, midPoint2, t);
            detailedPoints.push(qPoint);
        }
    }

    return detailedPoints;
}


class node {
    polygons = [];
    constructor(x, y, sides, radius) {
        this.#init(x, y, sides, radius);
    }

    

    #init(startx, starty, sides, radius) {
        // const sides = Math.floor(Math.random() * 5) + 3;
        if(sides in [undefined]) sides = Math.floor(Math.random() * 10) + 3;

        const points = [];

        const default_rotation = Math.random() * 360;
        for (let a = 0; a < sides; a++) {

            // const angle = a * Math.PI / 180 + default_rotation; // Add rotation to each point
            const angle = a * Math.PI * 2 / sides + default_rotation; // Add rotation to each point
            const x = Math.cos(angle) * radius + startx;
            const y = Math.sin(angle) * radius + starty;
            points.push({
                radius: Math.random() * 25,
                startx: x,
                starty: y,
                x: x,
                y: y,
                dx: Math.random() * 2,
                dy: Math.random() * 2
            });
        }

        // Generate a color
        const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        const polygon = {
            points: points,
            color: color,
            detailedPoints: generateDetailedPolygon({ points: points }, 10)
        };

        this.polygons.push(polygon);
    }

    draw() {
        this.polygons.forEach(polygon => {
            const context = document.querySelector('canvas').getContext('2d');

            context.beginPath();
            context.moveTo(polygon.points[0].x, polygon.points[0].y);

            let offset = 0;// noise.simplex2(polygon.points[0].x, polygon.points[0].y) * 1;
            for (let i = 0; i < polygon.points.length; i++) {
                
                const p0 = (i > 0) ? polygon.points[i - 1] : polygon.points[polygon.points.length - 1];
                const p1 = polygon.points[i];
                let midPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
                context.quadraticCurveTo(p0.x, p0.y, midPoint.x, midPoint.y);
            }

            // Close the curve with the last point and the first point and a midpoint
            let p0 = polygon.points[polygon.points.length - 1];
            let p1 = polygon.points[0];
            let midPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
            context.quadraticCurveTo(p0.x, p0.y, midPoint.x, midPoint.y);
            context.closePath();

            context.fillStyle = polygon.color; // Set the color of the polygon
            context.fill(); // Fill the polygon with the color

            // Add a border around each polygon
            context.strokeStyle = 'black'; // Set the color of the border
            context.lineWidth = 1; // Set the width of the border
            context.stroke(); // Draw the border

            // //--

            // // Draw same path but points only at each corner
            // context.beginPath();
            // context.moveTo(polygon.points[0].x, polygon.points[0].y);
            // for (let i = 1; i < polygon.points.length; i++) {
            //     context.lineTo(polygon.points[i].x, polygon.points[i].y);
            // }
            // context.closePath();
            // context.lineWidth = 1;
            // context.stroke();

            // //--

            // // Draw the detailed polygon
            context.beginPath();
            context.moveTo(polygon.detailedPoints[0].x, polygon.detailedPoints[0].y);
            for (let i = 1; i < polygon.detailedPoints.length; i++) {
                // context.lineTo(polygon.detailedPoints[i].x, polygon.detailedPoints[i].y);
                let p0 = (i > 0) ? polygon.detailedPoints[i - 1] : polygon.detailedPoints[polygon.detailedPoints.length - 1];
                let p1 = polygon.detailedPoints[i];
                let midPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };

                // add some noise
                midPoint.x += noise.perlin3(midPoint.x, midPoint.y, Date.now() / 1000) * 10;

                context.quadraticCurveTo(p0.x, p0.y, midPoint.x, midPoint.y);
            }

            // Close the curve with the last point and the first point and a midpoint
            p0 = polygon.detailedPoints[polygon.detailedPoints.length - 1];
            p1 = polygon.detailedPoints[0];
            midPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
            midPoint.x += noise.perlin3(midPoint.x, midPoint.y, Date.now() / 1000) * 10;
            context.quadraticCurveTo(p0.x, p0.y, midPoint.x, midPoint.y);


            context.closePath();
            context.strokeStyle = 'black';
            context.lineWidth = 1;
            context.stroke();

            // let points = polygon.detailedPoints;
            // let isDetailed = true;

            // context.beginPath();
            // context.moveTo(points[0].x, points[0].y);
            // points.forEach((point, i) => {
            //     let prev = (i > 0) ? points[i - 1] : points[points.length - 1];
            //     let midPoint = { x: (prev.x + point.x) / 2, y: (prev.y + point.y) / 2 };
            //     context.quadraticCurveTo(prev.x, prev.y, midPoint.x, midPoint.y);
            // });
            // let prev = points[points.length - 1];
            // let first = points[0];
            // let midPoint = { x: (prev.x + first.x) / 2, y: (prev.y + first.y) / 2 };
            // context.quadraticCurveTo(prev.x, prev.y, midPoint.x, midPoint.y);
            // context.closePath();
            // isDetailed || context.stroke();
            // context.fillStyle = polygon.color;
            // context.fill();
            // isDetailed && context.stroke();
        });
    }
}
