
var colors = {
    "#ff0000": "white",
    "#00ff00": "black",
    "#0000ff": "white",
    "#ff7f00": "black",
    "#ffff00": "black",
    "#00ffff": "black",
    "#ff00ff": "white",
    "#800080": "white",
    "#008000": "white",
    "#008080": "white"
};

const style = `
    padding:1em; 
    border-radius:1em; 
    background-color: ~~bgcolor~~; 
    font-size: 5.5em;
    color: ~~fontcolor~~;
`
const node_template = `
    <div id="~~name~~" class="node-div">
        <div>
        <a href="~~link~~" target="_blank">
            <div style="${style}">
                ~~content~~
            </div>
        </a>
        </div>
        <div>
            <!--<canvas></canvas>-->
            <iframe></iframe>
        </div>
    </div>
`;

var temp_colors = {};

function randomHex() {


    // Generate a random index within the range of available colors
    const randomIndex = Math.floor(Math.random() * Object.keys(colors).length);
    let color = Object.keys(colors)[randomIndex];
    // Return the randomly selected color
    
    temp_colors[color] = colors[color];
    delete colors[color];

    if(Object.keys(colors).length == 0) {
        colors = temp_colors;
        temp_colors = {};
    }


    return color;
}

function randomName() {
    return 'n'+Math.random().toString(36).substr(2, 9);
}

function make_node(data, node_data, is_child = false) {
    
    let color = randomHex();
    let name = randomName()
    
    node_html = node_template;

    node_html = node_html.replace('~~name~~', name);
    node_html = node_html.replace('~~content~~', node_data.content);
    node_html = node_html.replace('~~bgcolor~~', color);
    node_html = node_html.replace('~~fontcolor~~', temp_colors[color]);
    
    if('link' in node_data)
        node_html = node_html.replace('~~link~~', node_data.link);
    else
        node_html = node_html.replace('~~link~~', '#');

    data.html = node_html;  

    // document.querySelectorAll('#nav')[0].innerHTML += `<a href="${node_data.link}">${node_data.content}</a>`;

    return name;
}
