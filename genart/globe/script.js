
function run(paths) {

    var width = window.innerWidth, height = window.innerHeight;

    var projection = d3.geoOrthographic()
        .translate([width / 2, height / 2])
        .scale((width < height ? width : height) / 2 - 20)
        // .rotate([-10, -10]) // rotate the globe to focus on the node at [10,10]
        .rotate([0.4, 1])
        .clipAngle(90)
        .precision(.1);

    var path = d3.geoPath()
        .projection(projection);

    var graticule = d3.geoGraticule();

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)

    svg.append("defs").append("path")
        .datum({ type: "Sphere" })
        .attr("id", "sphere")
        .attr("d", path);

    svg.append("use")
        .attr("class", "glow")
        .attr("xlink:href", "#sphere");

    svg.append("filter")
        .attr("id", "glow")
        .append("feGaussianBlur")
        .attr("stdDeviation", "2.5")
        .attr("result", "coloredBlur");

    svg.selectAll(".glow")
        .style("filter", "url(#glow)");

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("use")
        .attr("xlink:href", "#sphere");


    // var links = {
    //     "Game": {"link": "/sdl2d", "point": {"lon": 0, "lat": -70}},
    //     "Art": {"link": "/art", "point": {"lon": 70, "lat": 0}},
    //     "API": {"link": "/api", "point": {"lon": -70, "lat": 0}},
    //     "Bookshelf": {"link": "/bookshelf", "point": {"lon": 0, "lat": 70}},
    // };

    var links = {};
    paths.forEach(path => {
        links[path] = {
            "link": path,
            "point": {
                "lon": Math.random() * 360 - 180,
                "lat": Math.random() * 180 - 90
            }
        };
    });


    var titles = Object.keys(links);
    // var points = d3.range(titles.length).map(function () { return { lon: Math.random() * 360 - 180, lat: Math.random() * 180 - 90 }; });
    var points = Object.values(links).map(function (d) { return d.point; });
    let drag_div = 5;

    // fetch('/api/word/words?n=100')
    //     .then(response => response.json())
    //     .then(data => {
    // let words = data.result
    var texts = svg.selectAll(".dot-text")
        .data(points)
        .enter()
        .append("text")
        .attr("class", "dot-text")
        .attr("fill", "red")
        .attr("font-size", "2vw")
        .html((d, i) => `<a href="${links[titles[i]].link}">${titles[i]}</a>`)
        // shift text half of the font size to the left
        // .attr("dx", function (d) { return -this.getBBox().width / 2; })
        .on("click", function (d, i) {
            console.log(d);
        });

    var drag = d3.drag()
        .on("start", function (event) {
            var proj = projection.rotate();
            var startPoint = {
                x: proj[0] - event.x / drag_div,
                y: proj[1] + event.y / drag_div
            }
            event.on("drag", function (event) {
                projection.rotate([startPoint.x + event.x / drag_div, startPoint.y - event.y / drag_div]);
                svg.selectAll("path").attr("d", path);
                svg.selectAll(".dot-text")
                    .attr("x", function (d) { return projection([d.lon, d.lat])[0]; })
                    .attr("y", function (d) { return projection([d.lon, d.lat])[1]; });

                update();
            });
        });
    svg.call(drag);

    var onresize = function () {
        width = window.innerWidth, height = window.innerHeight;
        svg.attr("width", width).attr("height", height);
        projection.translate([width / 2, height / 2]).scale((width < height ? width : height) / 2 - 20);
        svg.selectAll("path").attr("d", path);
        svg.selectAll(".dot-text")
            .attr("x", function (d) { return projection([d.lon, d.lat])[0]; })
            .attr("y", function (d) { return projection([d.lon, d.lat])[1]; });
        update();
    }

    function update() {
        texts.each(function (d) {
            var c = projection([d.lon, d.lat]);
            d3.select(this)
                .attr("x", c[0])
                .attr("y", c[1]);

            // hide if the point is on the back of the globe
            // first find the latitude at the center of the screen
            // if the point is more than 90 degrees away from the center latitude
            // then it is on the back side of the globe
            let center = projection.invert([width / 2, height / 2]);
            let pointVisible = d3.geoDistance([d.lon, d.lat], center) <= Math.PI / 2;

            d3.select(this).style("display", (pointVisible) ? "block" : "none");
            if (!pointVisible) {
            }
            else {

            }

        });
    }

    update();
    d3.select(window).on("resize", onresize);
    // })
    // .catch(error => console.error('Error:', error));

}


const paths = `404,automata,canvas,circles,clock,curves,design1,doodle1,dots,ellipse,figure,flow,flower,flowers,foreshorten,generative,genode,globe,grass,grav,home,hotel,laundry,layout,life,lines,lines2,mehretu,mosaic,mosaic2,motion,museum,museum2,music1,noise,onion,optical,orgm,p5js1,palette1,pixsym,poly,rain,rchords,scale,sdl,shaders,sounds,spin,strings,super,super2,sym,terra,tess,textured,tree,truchet1,truchet2,waves,weave,words,`
                .split(',')
window.addEventListener('load', function () {
    run(paths)
});