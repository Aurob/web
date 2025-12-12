
console.log(oscillators);
for(oscillator of Object.values(oscillators)) {
}

function setup() {
    createCanvas(1000, 1000)
}

function draw() {
    background(255);
    let sinMod;
    
    for(let o = 0; o < Object.keys(oscillators).length; o++) {
        oscillator = oscillators[Object.keys(oscillators)[o]];
        if(oscillator.running) {
            fill(oscillator.color[0], oscillator.color[1], oscillator.color[2]);
            // stroke(oscillator.color[0], oscillator.color[1], oscillator.color[2]);
            let radius = map(oscillator.oscillator.frequency.value, 444, 1000, 0, width/4);
            let u = oscillator.step * Math.PI;
            let x = radius * Math.cos(u);
            let y = radius * Math.sin(u);

            // add perturb
            let perturb = oscillator.perturb;
            let perturbX = perturb * Math.cos(u);
            let perturbY = perturb * Math.sin(u);
            x += perturbX;
            y += perturbY;
            oscillator.step += oscillator.stepN;
            oscillator.points.push([x + width/2, y + height/2]);

            //calculate max ellipses at this radius and size
            let max = Math.floor(2 * Math.PI * oscillator.size);
            let n = oscillator.points.length;
            if(n > max) {
                oscillator.points.shift();
            }

            for(let i = 0; i < oscillator.points.length; i++) {
                let p = oscillator.points[i];
                ellipse(p[0], p[1], oscillator.size, oscillator.size);
            }
        }
        // //create a sine wave that oscillates to the frequency
        // let sin = Math.sin(oscillator.oscillator.frequency.value);
        // //create a cosine wave that oscillates to the frequency
        // let cos = Math.cos(oscillator.oscillator.frequency.value);

        // let size = map(oscillator.oscillator.frequency.value, 444, 1000, 0, width);
        
        // for(let angle = 0; angle < 360; angle++) {
        //     //get the x and y coordinates of the sine wave
        //     let x = sin * size;
        //     let y = cos * size;
        //     //draw the sine wave
        //     ellipse(x + width/2, y + height/2, 10, 10);
        //     //rotate the sine wave
        //     let random_offset = random(0, 1);
        //     rotate(angle + random_offset);
        // }
        
    }
}