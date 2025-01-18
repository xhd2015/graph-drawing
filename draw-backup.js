export function drawGraph(graphData) {
    const nodes = graphData.nodes;
    const links = graphData.links;
    let activeSubEdges = [];

    // Create SVG
    const width = 800;
    const height = 400;
    const svg = d3.select("body").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("max-width", "100%")
        .style("margin", "20px");

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-1000))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1));

    function getColorForLink(d) {
        if (d.errorRate > 0.01) return "red";
        if (d.latency > 100) return "orange";
        return "green";
    }

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px");

    // Create link groups
    const linkGroup = svg.append("g")
        .selectAll(".link-group")
        .data(links)
        .join("g")
        .attr("class", "link-group");

    // Add paths
    const link = linkGroup
        .append("path")
        .attr("stroke", d => getColorForLink(d.data || d))
        .attr("stroke-width", d => Math.sqrt((d.data || d).value))
        .attr("fill", "none")
        .attr("class", "main-edge")
        .on("click", (event, d) => {
            const data = d.data || d;
            // ... click handler code ...
        })
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            const data = d.data || d;
            tooltip.html(`${data.source.id || data.source} → ${data.target.id || data.target}<br/>` +
                `Latency: ${data.latency}ms<br/>` +
                `Error Rate: ${(data.errorRate * 100).toFixed(2)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add link labels
    const linkLabel = linkGroup
        .append("g")
        .attr("class", "link-label");

    linkLabel.append("rect")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "white")
        .attr("stroke", "#666")
        .attr("stroke-width", 1);

    linkLabel.append("text")
        .text(d => {
            const data = d.data || d;
            return `${data.latency}ms (${(data.errorRate * 100).toFixed(1)}%)`;
        })
        .attr("font-size", "10px")
        .attr("text-anchor", "middle");

    // Calculate and set rectangle sizes for link labels
    linkLabel.selectAll("text").each(function (d) {
        const bbox = this.getBBox();
        const padding = 4;
        d3.select(this.parentNode)
            .select("rect")
            .attr("width", bbox.width + padding * 2)
            .attr("height", bbox.height + padding * 2)
            .attr("x", -bbox.width / 2 - padding)
            .attr("y", -bbox.height / 2 - padding);
    });

    // Create nodes
    const node = svg.append("g")
        .selectAll(".node")
        .data(nodes)
        .join("g")
        .attr("class", "node")
        .call(drag(simulation));

    // Add background rectangles for text (adjust position since there's no circle)
    node.append("rect")
        .attr("class", "label-background")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "white")
        .attr("stroke", "#666")
        .attr("stroke-width", 1);

    // Add text (adjust position since there's no circle)
    node.append("text")
        .text(d => d.id)
        .attr("x", 4)  // Adjusted from 14
        .attr("y", 4)
        .style("font-size", "12px");

    // Calculate and set rectangle sizes
    node.selectAll("text").each(function (d) {
        const bbox = this.getBBox();
        const padding = 4;
        d3.select(this.parentNode)
            .select("rect")
            .attr("width", bbox.width + padding * 2)
            .attr("height", bbox.height + padding * 2)
            .attr("x", -padding)  // Center the rectangle on text
            .attr("y", -bbox.height / 2 - padding / 2);  // Center vertically
    });

    // Drag function
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    // Update positions on tick
    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);

            const nodeRadius = 0;  // Changed from 6 since we removed circles
            const arrowLength = 6;
            const arrowWidth = 4;

            const endX = d.target.x - (dx * nodeRadius) / dr;
            const endY = d.target.y - (dy * nodeRadius) / dr;

            const startX = d.source.x;
            const startY = d.source.y;

            const angle = Math.atan2(dy, dx);
            const arrowStartX = endX - arrowLength * Math.cos(angle);
            const arrowStartY = endY - arrowLength * Math.sin(angle);
            const arrowLeftX = arrowStartX - arrowWidth * Math.sin(angle);
            const arrowLeftY = arrowStartY + arrowWidth * Math.cos(angle);
            const arrowRightX = arrowStartX + arrowWidth * Math.sin(angle);
            const arrowRightY = arrowStartY - arrowWidth * Math.cos(angle);

            return `M ${startX} ${startY}
                    L ${arrowStartX} ${arrowStartY}
                    L ${arrowLeftX} ${arrowLeftY}
                    L ${endX} ${endY}
                    L ${arrowRightX} ${arrowRightY}
                    L ${arrowStartX} ${arrowStartY}`;
        });

        linkLabel
            .attr("transform", d => {
                const midX = (d.source.x + d.target.x) / 2;
                const midY = (d.source.y + d.target.y) / 2;
                return `translate(${midX},${midY})`;
            });

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .sub-edge {
            pointer-events: none;
            opacity: 0.7;
        }
        .sub-node {
            pointer-events: none;
        }
        .main-edge {
            cursor: pointer;
        }
        .node text {
            font: 12px sans-serif;
        }
        .label-background {
            fill: white;
            opacity: 0.8;
        }
        .link-label rect {
            fill: white;
            opacity: 0.8;
        }
        .link-label text {
            font: 10px sans-serif;
        }
    `;
    document.head.appendChild(style);
}