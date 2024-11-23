
window.addEventListener('load', function () {
    let canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    let ctx = canvas.getContext('2d');

    function drawClock() {

    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // clock circle
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 5, canvas.width / 5, 0, 0, 2 * Math.PI);
        ctx.stroke();
    
        // clock center dot
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 200, canvas.width / 200, 0, 0, 2 * Math.PI);
        ctx.fill();
    
        // clock numbers
        ctx.font = canvas.width / 40 + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 1; i <= 12; i++) {
            let angle = (2 * Math.PI / 12) * (i - 3)
            let x = canvas.width / 2 + canvas.width / 6 * Math.cos(angle);
            let y = canvas.height / 2 + canvas.width / 6 * Math.sin(angle);
            ctx.fillText(i, x, y);
        }

        // clock ticks
        for (let i = 0; i < 60; i++) {
            if(i%5 == 0) continue;

            let angle = (2 * Math.PI / 60) * (i - 15)
            let x = canvas.width / 2 + canvas.width / 5.9 * Math.cos(angle);
            let y = canvas.height / 2 + canvas.width / 5.9 * Math.sin(angle);
            // ctx.beginPath();
            // ctx.ellipse(x, y, canvas.width / 800, canvas.width / 800, 0, 0, 2 * Math.PI);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = canvas.width / 128 + 'px Arial';
            ctx.fillText(i, x, y);
            // ctx.fill();
        }


        let time = new Date();


        // hour hand
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + canvas.width / 8 * Math.cos((2 * Math.PI / 12) * (time.getHours() - 3)), canvas.height / 2 + canvas.width / 8 * Math.sin((2 * Math.PI / 12) * (time.getHours() - 3)));
        ctx.stroke();
        ctx.lineWidth = 1;

        // minute hand
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + canvas.width / 6 * Math.cos((2 * Math.PI / 60) * (time.getMinutes() - 15)), canvas.height / 2 + canvas.width / 6 * Math.sin((2 * Math.PI / 60) * (time.getMinutes() - 15)));
        ctx.stroke();

        // second hand
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + canvas.width / 5.5 * Math.cos((2 * Math.PI / 60) * (time.getSeconds() - 15)), canvas.height / 2 + canvas.width / 5.5 * Math.sin((2 * Math.PI / 60) * (time.getSeconds() - 15)));
        ctx.stroke();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;

    }

    drawClock();
    setInterval(drawClock, 1000)

});