//https://stackoverflow.com/questions/47441486/curve-intersecting-points-in-javascript

class Generator {
    flowers = [];
    mouse = {'x': width/2, 'y': height/2};
    timeAngle = 0;
    canvasRadius = (width * height) / 2;
    constructor(flowerCount = 0, width, height, flowerOffset, startColor) {
        let startSize = flowerOffset;
        let color = startColor;
        for(let i = 0; i < flowerCount; i++) {
            
            let flower = this.createFlower(width/2, height/2, startSize, startSize, Math.random() * 360);
            flower.ptd += startSize/1000000000;
            flower.color = '#'+startColor;
            this.flowers.push(flower);
            startSize += flowerOffset;
        }

        console.log(startSize);
    }

    draw(ctx, time) {
        for(let i = 0; i < this.flowers.length; i++) {
            let flower = this.flowers[i];

            flower.centerOffsetX = width/2 * Math.cos(this.timeAngle) + width/2;
            flower.centerOffsetY =  height/2 + Math.sin(this.timeAngle) * height/2;
            ctx.lineWidth = 1.199 * i - flower.size/69;
            this.lineOpacity = .2;
            this.drawFlower(ctx, flower);
        }
        this.timeAngle += .1;
        this.timeAngle %= Math.PI * 2;
    }

    step() {
    }

    drawFlower(ctx, flower) {
        ctx.strokeStyle = flower.color;
        for(let p = flower.startAngle; p < 360 + flower.startAngle; p+=flower.pt) {
            let x = flower.size * Math.cos(p);
            let y = flower.size * Math.sin(p);
            ctx.beginPath();
            ctx.moveTo(flower.x, flower.y);
            ctx.quadraticCurveTo(flower.x + x, flower.y + y,  flower.centerOffsetX, flower.centerOffsetY);
            ctx.stroke();
        }
        flower.pt += flower.ptd;
        if(flower.pt < 1 || flower.pt >= 2) flower.ptd *= -1;
        
        // flower.centerOffsetX += flower.codx;
        // if(flower.centerOffsetX < 0 || flower.centerOffsetY >= 100) flower.codx *= -1;
        // flower.centerOffsetY += flower.cody;
        // if(flower.centerOffsetY < 0 || flower.centerOffsetY >= 100) flower.cody *= -1;
    }

    drawFlowerv2(ctx, flower) {
        //Create petals by drawing curves that orbit the center of the flower
        
    }

    createFlower(x, y, size, petals, startAngle) {
        let flower = {
            'x': x,
            'y': y,
            'petals': petals,
            'startAngle': startAngle,
            'color': '#' + Math.floor(Math.random() * 16777215).toString(16),
            'pt': 1,
            'ptd': Math.random() * .00001,
            'centerOffsetX': 0,
            'centerOffsetY': 0,
            'codx': .1,
            'cody': .1,
            'size': size
        }

        return flower;
    }


}