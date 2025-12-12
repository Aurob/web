class Generator {

    sinMod = 1;
    constructor() {
        this.lineTimes = [];
    }

    draw() {
        ctx.strokeStyle = "#fff";
        for(let line = 0; line <= height/10; line++) {
            if(this.lineTimes.length < line+1) {
                this.lineTimes.push({
                    'speed': Math.random() / (Math.random() * 1000 + 100),
                    'time': 0,
                    'maxHeight': Math.random() * 25 + 1,
                });
            }
            ctx.beginPath();
            ctx.moveTo(0, line);
            for(let x = 0; x <= width; x+=10) {
                if(x > width/1.5 && x < width/1.47) this.sinMod = Math.random() * 5;
                else this.sinMod = 1;
                let y = line*10 + Math.sin(x) * noise.perlin3(x, line, this.lineTimes[line].time)*this.lineTimes[line].maxHeight; //this.sinMod;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            this.lineTimes[line].time += this.lineTimes[line].speed;
        }
    }
}