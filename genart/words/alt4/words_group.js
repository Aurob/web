const namespace = "http://www.w3.org/2000/svg";

const svgw = 200;
const svgh = 200;

const maxZ = 100;
const minZ = 0;

// Create the shorthand attr() for the setAttribute method
Element.prototype.attr = function (name, value) {
    if (value) {
        this.setAttribute(name, value);
        return this;
    } else {
        return this.getAttribute(name);
    }
};

function load_words(count = 1) {
    return fetch(`https://api.rau.lol/words/get_random_word?n=${count}`)
        .then(response => response.json())
        .then(data => { return data.result })
        .catch(error => {
            return new Array(count).fill("Error");
        });
}

function randomColor() {
    return `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
}

function newSVG(w, h) {
    const svg = document.createElementNS(namespace, "svg")
        .attr("width", w)
        .attr("height", h);

    document.querySelector("g").appendChild(svg);
    return svg;
}

function addSVG(word, x, y) {

    // Create an SVG element
    const svg = newSVG(svgw, svgh);
    svg
        .attr("transform", `translate(${x}, ${y})`)

    // Create a text element inside the SVG
    const text = document.createElementNS(namespace, "text")
    text.textContent = word;

    // Append the text to the SVG element
    svg.appendChild(text);
    svg.style.backgroundColor = randomColor();

    svg.addEventListener("click", function () {
        const speak = new SpeechSynthesisUtterance(word);
        window.speechSynthesis.speak(speak);
    });

    return text;

}

function loadObserver() {

    // Create a new MutationObserver instance
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes') {
                if (mutation.attributeName === "z") {
                    const text = mutation.target;
                    let z = parseFloat(text.attr("z"));
                    text.removeAttribute("z");

                    if (z > maxZ) {
                        z = maxZ;
                    } else if (z < minZ) {
                        z = minZ;
                    }

                    text.attr("font-size", z);
                    const text_size = text.getBBox();
                    const w = text_size.width;
                    const h = text_size.height;
                    text
                        .attr("x", "0")
                        .attr("y", parseFloat(h / 1.25));

                    text.parentElement
                        .attr("width", parseFloat(w))
                        .attr("height", parseFloat(h));

                }
            }
        });
    });

    // Configure the observer to watch for attribute changes
    const observerConfig = {
        attributes: true, // Watch for attribute changes
        attributeFilter: ['x', 'y', 'z', 'width', 'height', 'font-size'] // Specify the attributes you want to observe
    };

    return [observer, observerConfig]
}

var testsvg;
window.addEventListener("load", () => {

    const [observer, observerConfig] = loadObserver();
    load_words(100).then(words => {
            let texts = [];
            words.forEach(word => {
                let x = Math.random() * window.innerWidth / 2 - window.innerWidth / 3;
                let y = Math.random() * window.innerHeight / 2 - window.innerHeight / 4;
                let z = Math.random() * maxZ;
                let textSVG = addSVG(word, x, y);
                observer.observe(textSVG, observerConfig);

                textSVG.attr("z", z);
                texts.push(textSVG);

            });


            function animate() {
                texts.forEach(text => {
                    let z = Math.cos(Date.now() * 0.001) * 50 + 50;
                    text.attr("z", z);
                });

                requestAnimationFrame(animate);
            }

            // animate();
        });
});