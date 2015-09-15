import {
    data as testData
}
from "./data";

var ForceLayout = function(spec) {
    this.spec = spec;
    this.svg = d3.select(spec.selector).append("svg:svg")
        .attr('width', spec.width)
        .attr('height', spec.height)
        .style("fill", "#000");
    this.linkEls = this.svg.selectAll(".link");
    this.nodeEls = this.svg.selectAll(".node");
    this.insertData();
    this.force = d3.layout.force()
        .nodes(this.nodes)
        .links(this.links)
        .size([spec.width, spec.height])
        .charge(-100);
    this.angle = d3.scale.ordinal().domain(d3.range(4)).rangePoints([0, 2 * Math.PI]);
    this.radius = d3.scale.linear().range([this.spec.innerRadius, this.spec.outerRadius]);
    this.color = d3.scale.category10().domain(d3.range(20));
    if (!spec.hive) {
        this.forcify();
    } else {
        this.hivify();
    }
    this.start();
    return this;
}

ForceLayout.prototype.forcify = function() {
    this.svg.selectAll(".axis").remove();
    this.force.on("tick", this.tick.bind(this));
}

ForceLayout.prototype.hivify = function() {
    console.log("hivifying");
    this.force.stop();
    this.svg.selectAll(".axis")
        .data(d3.range(3))
        .enter()
        .append("line")
        .attr("class", "axis")
        .attr("transform", (d) => {
            return "rotate(" + degrees(this.angle(d)) + ")";
        })
        .attr("x1", this.radius.range()[0])
        .attr("x2", this.radius.range()[1]);
		//TODO factor out repeated code
    this.nodeEls.attr("transform", (d) => {
        return "rotate(" + degrees(this.angle(d.x)) + "), translate(" + d.y + ", 0)";
    });
}

ForceLayout.prototype.start = function() {
    this.linkEls = this.linkEls.data(this.force.links());
    this.linkEls.enter().insert("line", ".node").attr("class", "link");
    this.linkEls.exit().remove()

    this.linkEls.style("stroke", "black").style("stroke-width", 2);

    this.nodeEls = this.nodeEls.data(this.force.nodes());
    this.nodeEls.enter().append("g").attr("class", "node");
    this.nodeEls.exit().remove();

    this.nodeEls.attr("transform", (d) => {
        return "rotate(" + degrees(this.angle(d.x)) + "), translate(" + d.y + ", 0)";
    });
    this.nodeEls.append("circle").attr("r", 5).attr("fill", "red");
    if (!this.spec.hive) {
        this.force.start();
    }
}

ForceLayout.prototype.tick = function() {
    this.linkEls.attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        });
    this.nodeEls.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")"
    });
}

ForceLayout.prototype.insertData = function() {
    var data = parseData(this.spec.json);
    this.links = data.links;
    this.nodes = data.nodes;
}

var parseData = function(json) {
    var nodes = json.routines;
    var links = [];
    nodes.forEach(function(node) {
        node.size = 0;
        var newSize = 0;
        $.each(node.blocks, function(index, block) {
            newSize += block.instructions.length;
        });
        node.size += newSize;
        if (node.callees) node.children = node.callees;
        node.name = node.tag;


        delete node.tag;
        delete node.label;
        delete node.type;
        delete node.callees;
    });
    nodes.forEach(function(node) {
        if (node.children) {
            node.source = true;
            node.children.forEach(function(child) {
                nodes.forEach(function(nodi) {
                    if (nodi.name == child.tag) {
                        nodi.target = true;
                        links.push({
                            source: node,
                            target: nodi
                        });
                    }
                });
            });
        }
    });
    // Determine the type of each node, based on incoming and outgoing links.
    nodes.forEach(function(node) {
        if (node.source && node.target) {
            node.degree = "target-source";
        } else if (node.source) {
            node.degree = "source";
        } else if (node.target) {
            node.degree = "target";
        } else {
            node.connectors = [{
                node: node
            }];
            node.degree = "source";
        }
    });
    return {
        nodes, links
    }
}

var degrees = function(radians) {
    return radians / Math.PI * 180 - 90;
}

var mySpec = {
    selector: ".graph",
    height: 850,
    width: 960,
    innerRadius: 40,
    outerRadius: 640,
    majorAngle: 2 * Math.PI / 3,
    minorAngle: 1 * Math.PI / 12,
    json: testData,
    hive: true 

}
var myForce = new ForceLayout(mySpec);
