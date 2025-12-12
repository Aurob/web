window.addEventListener('load', function() {
    loadProjects();
});



function loadProjects() {
    let nodeData = [];
    let names = [];
    fetch('https://dev.rau.lol/cgi-bin/artlist.pl')
    .then(response => response.text())
    .then(data => {
        data.split('<br>').forEach((project, i) => {
            console.log(project == window.location.pathname.replaceAll('/',''));
            if(project && project != window.location.pathname.replaceAll('/','') ) {
                const node_data = { link: `/${project}`, content: project };          
                
                let data = { name: i, label: project };
                if('content' in node_data) {
                    let node_name = make_node(data, node_data);
                    names.push(node_name);
                }
                if('children' in node_data) {
                    data.children = [];
                    for(let j = 0; j < node_data.children.length; j++) {
                        let child_node = { name: j, child:true };
                        let node_name = make_node(child_node, node_data.children[j]);
                        names.push(node_name);
                        data.children.push(child_node);
                    }
                }

                nodeData.push(data);
            }
        });

        var newNodes = addNodes(nodeData);

        for(let i = 0; i < names.length; i++) {
            // let name = names[i];
            // // let node_canvas = document.querySelector(`#${name} canvas`);
            // let node_iframe = document.querySelector(`#${name} iframe`);
            
            // // let ctx = node_canvas.getContext('2d');
            // // ctx.fillStyle = temp_colors[Math.random() * Object.keys(temp_colors).length];
            // // ctx.fillRect(0, 0, node_canvas.width, node_canvas.height);
            // console.log(newNodes[i].label);
            // node_iframe.src = "/"+newNodes[i].data.label;
        }
        
    });
}
