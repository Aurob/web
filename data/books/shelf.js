
const bks_canvas = document.getElementById('bookshelf');
const ans_canvas = document.getElementById('annotations');
const ctx = bks_canvas.getContext('2d');
const ctx2 = ans_canvas.getContext('2d');
const loader = document.querySelector('#bookmodal svg');

let hover_id = null;
var books = [];

function loadEvents() {
    ans_canvas.addEventListener('mousemove', function (event) {
        hover_id = null;
        ctx2.clearRect(0, 0, ans_canvas.width, ans_canvas.height);

        const rect = ans_canvas.getBoundingClientRect();
        const scaleX = ans_canvas.width / rect.width;
        const scaleY = ans_canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        for (let index = 0; index < books.length; index++) {
            let item = books[index];
            let points = item.points;

            ctx2.beginPath();
            ctx2.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx2.lineTo(points[i][0], points[i][1]);
            }
            ctx2.closePath();

            if (ctx2.isPointInPath(x, y)) {
                ctx2.lineWidth = 5;
                ctx2.strokeStyle = 'red';
                ctx2.stroke();
                ctx2.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx2.fill();

                hover_id = index;
            }
        }
    });

    ans_canvas.addEventListener('click', function () {

        let modal = document.getElementById("bookmodal");
        let a = document.querySelector("#bookmodal a");
        let img = document.querySelector("#bookmodal img");

        if (hover_id !== null) {
            let data = book_links[hover_id];

            if (!data.link) {
                data.link = {
                    link: "#",
                    cover_lg: "404cover.bmp"
                }
            }

            a.href = data.link.link;
            img.src = data.link.cover_lg

            const er = document.querySelector('.er');
            if (er) {
                er.style.border = '5px solid';
                er.style.borderImage = 'linear-gradient(to bottom, orange, yellow) 1';
                er.style.animation = 'pulsate 6s ease-in-out';
                er.style.animationIterationCount = '1';
            }

            // Add keyframes for pulsating effect
            const styleSheet = document.styleSheets[0];
            styleSheet.insertRule(`
                @keyframes pulsate {
                    0% { border-image-source: linear-gradient(to bottom, orange, yellow); }
                    50% { border-image-source: linear-gradient(to bottom, yellow, orange); }
                    100% { border-image-source: linear-gradient(to bottom, orange, yellow); }
                }
            `, styleSheet.cssRules.length);

            window.onclick = function (event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                    modal.style.zIndex = -1;
                    img.src = "";
                    hover_id = null;
                }
            }
            
            modal.style.display = "flex";
            modal.style.zIndex = 2;
        }
    });
}

window.addEventListener('load', function () {
    fetch('annotations.json')
    .then(response => response.json())
    .then(data => {
        books = data.boxes;
        console.log(window.innerWidth/2506);
        const img = new Image();
        img.onload = () => {
            console.log(window.innerWidth/2506);
            for (const canvas of [bks_canvas, ans_canvas]) {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.style.zoom = (((window.innerWidth + window.innerHeight) / 2) / ((2506 + 1774) / 2)) / 2;
                canvas.style.zIndex = 1;
                canvas.style.position = 'fixed';
                canvas.style.margin = '5vw';
            }

            


            ctx.drawImage(img, 0, 0);

            loadEvents();
            fetch('links.json')
            .then(response => response.json())
            .then(data => {
                book_links = data;
            });
        };
        img.src = 'bookshelf.png';

    });
});