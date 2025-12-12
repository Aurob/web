// Set up the D3.js force layout
// var width = window.innerWidth;
// var height = window.innerHeight;

var temp_nodes = [];
var child_nodes = [
];

var root = null;
var nodes = []
var links = [];
var selectedNode = null;
var simulation = null;
var node, link, content;
var width, height;
var noLink = false;

function ticked() {
    const _link = d3.selectAll('.linkroot').selectAll('.link');
    link._groups = [Array.from(_link._groups[0])]
    const _node = d3.selectAll('.noderootmain').selectAll('.noderoot');
    _node._groups = [Array.from(_node._groups[0])]

    if (!_node.node() || !_node.node().getBBox) return;

    _node_bbox = _node.node().getBBox();

    _link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    _node.selectAll('rect')
        .attr("x", d => d.x - _node_bbox.width / 2)
        .attr("y", d => d.y - _node_bbox.height / 2)

    _node.selectAll('circle')
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)

    _node.selectAll('text')
        .attr("x", d => d.x)
        .attr("y", d => d.y);

    _node.selectAll('foreignObject')
        .attr("x", d => d.x - _node_bbox.width / 2)
        .attr("y", d => d.y - _node_bbox.height / 2);
}

// Define the zoomed function to update the transform attribute of the container element
function zoomed(event) {
    if (event.sourceEvent && ["mousemove"].includes(event.sourceEvent.type)) {
        return;
    }
    const { x, y, k } = event.transform;
    const newViewBox = [
        -width / 2 / k + -x,
        -height / 2 / k + -y,
        width / k,
        height / k
    ];
    content.attr("viewBox", newViewBox);
}

function zoomed(event) {
    content.attr("transform", event.transform);
}


function newId() {
    return Math.random().toString(36).substr(2, 9);
}

var t = 3;
function addNodes(nodeData) {

    if(nodeData == undefined && temp_nodes.length > 0) 
        nodeData = temp_nodes;
    else
        temp_nodes = nodeData;

    width = document.getElementById("main").offsetWidth;
    height = document.getElementById("main").offsetHeight;
    
    content = d3.select("#content").append("svg")
    .attr("viewBox", [0, -height*1.8, width, height*4.8])
    
    link = content.append("g")
        .attr("class", "linkroot")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")

    node = content.append("g")
        .attr("class", "noderootmain")
        .attr("fill", "transparent")
        .attr("stroke", "none")
        // .attr("stroke-width", 1.5)
        .selectAll("circle")

    content.attr("width", width);
    content.attr("height", height);


    nodes = [];
    links = [];

    for (let i = 0; i < nodeData.length; i++) {
        nodes.push({ id: i, data: nodeData[i] });
    }

    for (let i = 0; i < nodeData.length; i++) {
        links.push({ source: nodes[i], target: nodes[(i + 1) % nodeData.length] });
    
        // if (nodeData[i].children) {
        //     for (let j = 0; j < nodeData[i].children.length; j++) {
        //         links.push({ source: nodes[i], target: nodes[i] });
        //         t++;
        //     }
        // }
    }

    let t = 0;
    let long_links = [];
    for (let i = 0; i < nodeData.length; i++) {
        if (nodeData[i].children) {
            // nodes.push({ id: nodes.length-1, data: nodeData[i].children[0] });
            // links.push({ source: nodes[i], target: nodes[nodes.length-1] });

            // long_links.push(nodes.length-1);
            for (let j = 0; j < nodeData[i].children.length; j++) {
                nodes.push({ id: nodes.length, data: nodeData[i].children[j] });
                links.push({ source: nodes[i], target: nodes[nodes.length-1] });
                t++;
            }
        }
    }
    // let centerNode = { id: nodeData.length, data: { name: 'center', html: 'center' } };
    // nodes.push(centerNode);

    // for (let i = 0; i < nodeData.length; i++) {
    //     links.push({ source: centerNode, target: nodes[i] });
    // }


    // Update the simulation with the new nodes and links
    // simulation.nodes(nodes);
    // simulation.force("link").links(links);

    // // Restart the simulation
    // simulation.alpha(1).restart();

    // Update the links
    link = link.data(links, d => d.id);
    link.exit().remove();

    link = link.enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", 4)
        .merge(link);

    // Update the nodes
    nodeGroup = node.data(nodes, d => d.id);
    nodeGroup.exit().remove();

    let minX = 0;
    let maxX = width;
    let minY = 0;
    let maxY = height;
    simulation = d3.forceSimulation(nodes);
    // make the link longer if the node has a parent
    simulation
    .force("center", d3.forceCenter(width/2, height/2))
    // .force("link", d3.forceLink(links).id((d) => d.id).distance(100).strength(1))
    
    .force("charge", d3.forceManyBody().strength(-1000))
    .force("x", d3.forceX().strength(.05).x(function(d) {
        return Math.max(minX, Math.min(maxX, d.x));
      }))
      .force("y", d3.forceY().strength(.05).y(function(d) {
        return Math.max(minY, Math.min(maxY, d.y));
      }))
      .force("collide", d3.forceCollide().radius(500))
    
    const newNodeGroup = nodeGroup.enter().append("g")
        .attr("class", "noderoot")
        .on("mousedown", mousedown)
        .call(drag(simulation))
        .merge(node)
        // .on("click", function (event, d) {
        // })
        // .on("mousemove", (event, d) => {
        //     d3.select(d).enter().select("foreignObject").select("div").html("hello")
        // });

    newNodeGroup.append("rect")
        .attr("class", "node")
        // .attr("stroke", d => '#000')
        // .attr("x", width)
        // .attr("y", height)
        .attr("width", 100)
        .attr("height", 100)
        .classed(d => d.data.class);

    newNodeGroup.append("title")
        .text(d => d.data.name);

    nodeGroup = newNodeGroup.merge(nodeGroup);


    // Add HTML for any nodes that have it
    newNodeGroup.filter(d => d.data.html).each(function (d) {
        addHTML(d3.select(this), d.data.html);
        // adjust the size of the rectangle to fit the HTML
        // const bbox = d3.select(this).node().getBBox();
    });

    // newNodeGroup.each(d=> {
    //     if(!d.data.html) {
            
    //     }
    // });

    



    // Move the root node to x, y
    simulation.on("tick", ticked);
    // simulation
    //     .alphaTarget(0.08)
    //     .alphaDecay(0.9)
    //     .velocityDecay(0.09)

    return nodes;
}

function addHTML(node, html) {
    const bbox = node.node().getBBox();
    const nodeHTML = node.append("foreignObject")
        // .style("pointer-events", "none")
        .attr("width", bbox.width)
        .attr("height", bbox.height)

    const nodeDiv = nodeHTML
        .append("xhtml:div")
        .attr("class", "node-html")
        // .style("font", "10px 'Calibri'")
        // .style("display", "flex")
        // .style("align-items", "center")
        // .style("justify-content", "center")
        .style("position", "absolute")
        .style("margin", "1em")
        .html(html)

    let divStyle = getComputedStyle(nodeDiv.node());
    let width = parseFloat(divStyle.width) + parseFloat(divStyle.marginLeft) + parseFloat(divStyle.marginRight);
    let height = parseFloat(divStyle.height) + parseFloat(divStyle.marginTop) + parseFloat(divStyle.marginBottom);

    nodeHTML
        .attr("width", width)
        .attr("height", height)

    node.select('rect')
        .attr("width", width)
        .attr("height", height);

    return nodeHTML;
}

const mousedown = (event, d) => {
    // Select nodes when the ctrl key is pressed
    if (event.ctrlKey) {
        if (selectedNode === d)
            selectedNode = null;
        else
            selectedNode = d;
        return;
    }
};

const drag = simulation => {
    const dragstarted = (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    };

    const dragged = (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
    };

    const dragended = (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;

        simulation
        // .alphaTarget(0.8)
        // .alphaDecay(0.9)
        // .velocityDecay(0.09)
    };

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
};

window.addEventListener("resize", () => {
    document.getElementById("content").innerHTML = '';
    addNodes();
});


function randrgb() {
    return Math.floor(Math.random() * 255)
}