//https://stackoverflow.com/questions/47441486/curve-intersecting-points-in-javascript

class Generator {
    flowers = [];
    constructor(flowerCount = 0, width, height, marginX, marginY) {
        let stepX = marginX + flowerCount / width;
        let stepY = marginY + flowerCount / height;
        for(let i = 0; i < flowerCount; i++) {
            let x = stepX; //Math.floor(Math.random() * width);
            let y = stepY; //Math.floor(Math.random() * height);
            let startAngle = Math.random() * 360;
            let petals = Math.floor(Math.random() * 25 + 10);
            this.flowers.push(this.createFlower(x, y, petals, startAngle));

            stepX += marginX;
            if(stepX >= width) {
                stepX = marginX;
                stepY += marginY;
            }

            //Only add flowers that fit within the canvas margins
            if(stepY >= height) break;
            
        }
    }

    draw(ctx, time) {
        //draw background
        ctx.fillStyle = '#609f60';
        ctx.fillRect(0, 0, width, height);
        for(let i = 0; i < this.flowers.length; i++) {
            let flower = this.flowers[i];
            this.drawFlower(ctx, flower);
        }
    }

    step() {
    }

    drawFlower(ctx, flower) {
        ctx.fillStyle = flower.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        for(let p = flower.startAngle; p < flower.startAngle + 360; p += 360 / flower.petals) {
            let x = 50 * Math.cos(p);
            let y = 50 * Math.sin(p);
            

            ctx.beginPath();
            ctx.moveTo(flower.x, flower.y);
            // ctx.quadraticCurveTo(flower.x - 5, flower.y + 5, flower.x + x, flower.y + y);
            ctx.bezierCurveTo(flower.x - 5, flower.y + 5, flower.x + x, flower.y + y, flower.x + x, flower.y + y);
            ctx.moveTo(flower.x, flower.y);
            ctx.bezierCurveTo(flower.x + 5, flower.y + 5, flower.x + x, flower.y + y, flower.x + x, flower.y + y);
            // ctx.quadraticCurveTo(flower.x + 5, flower.y + 5, flower.x + x, flower.y + y);
            // ctx.lineTo(flower.x + x, flower.y + y);
            ctx.fill();
            ctx.stroke();
        }

        ctx.circle(flower.x, flower.y, 5, '#000', true);
    }

    drawFlowerv2(ctx, flower) {
        //Create petals by drawing curves that orbit the center of the flower
        
    }

    createFlower(x, y, petals, startAngle) {
        let flower = {
            'x': x,
            'y': y,
            'petals': petals,
            'startAngle': startAngle,
            'color': '#' + Math.floor(Math.random() * 16777215).toString(16)
        }

        return flower;
    }
}