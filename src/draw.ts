import * as d3 from 'd3';
import { GraphData, Link, Node, SubEdge } from "./types";
import { installDrag } from './drag';
import { getIntersection } from './intersection';

// Color constants
const COLORS = {
    BORDER: "#666",
    EDGE_HEALTHY: "#90EE90",
    EDGE_SLOW: "#ff7f7f",
    NODE_HEALTHY: "#90EE90",
    NODE_ERROR: "#ff7f7f",
    NODE_SLOW: "#ffd700",
} as const;

// Format latency for display (converts seconds to appropriate unit)
function formatLatency(latencyInSeconds: number): string {
    if (latencyInSeconds >= 1) {
        return `${latencyInSeconds}s`;
    }
    return `${(latencyInSeconds * 1000).toFixed(0)}ms`;
}

export function drawGraph(rootSelector: string, graphData: GraphData): void {
    const width = 800;
    const height = 400;
    const root = d3.select(rootSelector);

    // Create SVG
    const svg = root.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("max-width", "100%")
        .style("margin", "20px");

    // Create tooltip div
    const tooltip = root.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #666")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "auto");

    let tooltipTimer: number | null = null;  // Add timer variable

    // Add zoom controls
    const zoomG = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .filter(event => {
            // Only allow zoom with Ctrl/Cmd + wheel, but allow panning with drag
            return (!event.ctrlKey && !event.metaKey && event.type === 'mousedown') || // Allow panning
                ((event.ctrlKey || event.metaKey) && event.type === 'wheel');      // Allow zooming with Ctrl/Cmd
        })
        .on("zoom", (event) => {
            zoomG.attr("transform", event.transform);
        });
    svg.call(zoom);

    // Add zoom buttons
    root.insert("div", "svg")
        .style("position", "absolute")
        .style("left", "10px")
        .style("top", "10px")
        .selectAll("button")
        .data([
            { text: "Zoom In", scale: 1.2 },
            { text: "Zoom Out", scale: 0.8 },
            { text: "Reset", scale: 1 }
        ])
        .join("button")
        .text(d => d.text)
        .style("margin-right", "5px")
        .on("click", (event, d) => {
            if (d.text === "Reset") {
                svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
            } else {
                svg.transition().duration(750).call(
                    zoom.scaleBy, d.scale
                );
            }
        });

    // Create simulation
    const simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links)
            .id(d => (d as any).id)
            .distance(d => {
                // Calculate minimum distance needed based on latency text
                const textLength = `${d.latency}ms`.length * 8; // Approximate width per character
                const minDistance = textLength + 40; // Add padding
                return Math.max(100, minDistance); // Use at least 100px or text length + padding
            }))
        .force("charge", d3.forceManyBody().strength(-1000))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Define arrow marker
    const defs = svg.append("defs");

    defs.append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0,-5 L 10,0 L 0,5 Z")
        .attr("fill", COLORS.BORDER);

    // Draw links with arrows
    const link = zoomG.append("g")
        .selectAll("path")
        .data(graphData.links)
        .join("path")
        .attr("stroke", d => d.latency > 0.1 ? COLORS.EDGE_SLOW : COLORS.EDGE_HEALTHY)
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrow)")
        .style("pointer-events", "all")
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add edge labels for latency
    const linkLabels = zoomG.append("g")
        .selectAll("g")
        .data(graphData.links)
        .join("g")
        .attr("class", "edge-label")
        .style("pointer-events", "all")
        .on("mouseover", (event, d) => {
            if (tooltipTimer) {
                clearTimeout(tooltipTimer);
            }
            tooltipTimer = window.setTimeout(() => {
                showEdgeTooltip(tooltip, d.subEdges, event.pageX, event.pageY);
                tooltipTimer = null;
            }, 500);
        })
        .on("mouseout", (event) => {
            if (tooltipTimer) {
                clearTimeout(tooltipTimer);
                tooltipTimer = null;
            }
            // Only hide tooltip if not hovering over the tooltip itself
            const e = event.toElement || event.relatedTarget;
            if (!tooltip.node()?.contains?.(e)) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            }
        });

    // Add background rectangle for better readability
    linkLabels.append("rect")
        .attr("fill", "white")
        .attr("rx", 3)
        .attr("ry", 3);

    // Add text
    const linkTexts = linkLabels.append("text")
        .text(d => formatLatency(d.latency))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", "10px");

    // Size the rectangles based on text
    linkTexts.each(function () {
        let textElement: SVGTextElement = this;
        const bbox = textElement.getBBox();
        const parent = textElement.parentElement;
        if (parent) {
            const rect = parent.querySelector('rect');
            if (rect) {
                const padding = 2;
                rect.setAttribute('width', (bbox.width + padding * 2).toString());
                rect.setAttribute('height', (bbox.height + padding * 2).toString());
                rect.setAttribute('x', (-bbox.width / 2 - padding).toString());
                rect.setAttribute('y', (-bbox.height / 2 - padding).toString());
            }
        }
    });

    // Draw nodes
    const node = zoomG.append("g")
        .selectAll("g")
        .data(graphData.nodes)
        .join("g")
        .attr("class", "node");
    // install drag handler
    installDrag(node, simulation);

    // Add background rectangles
    node.append("rect")
        .attr("class", "node-background")
        .attr("rx", 4)
        .attr("ry", 4)
        .style("fill", d => {
            if (d.errorRate && d.errorRate > 0.01) return COLORS.NODE_ERROR;  // Red for high error
            if (d.latency && d.latency > 0.1) return COLORS.NODE_SLOW;     // Yellow for high latency
            return COLORS.NODE_HEALTHY;                          // Green for healthy
        });

    // Add text labels
    const labels = node.append("text")
        .text(d => d.name)
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central");

    // Size the rectangles based on text
    labels.each(function () {
        let textElement: SVGTextElement = this;
        const bbox = textElement.getBBox();
        const parent = textElement.parentElement;
        if (parent) {
            const rect = parent.querySelector('rect');
            if (rect) {
                const padding = 8;
                const width = bbox.width + padding * 2;
                const height = bbox.height + padding * 2;
                rect.setAttribute('width', width.toString());
                rect.setAttribute('height', height.toString());
                rect.setAttribute('x', (-bbox.width / 2 - padding).toString());
                rect.setAttribute('y', (-bbox.height / 2 - padding).toString());
                parent.setAttribute('data-width', width.toString());
                parent.setAttribute('data-height', height.toString());
            }
        }
    });

    // Update tick function
    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = (d.target as any).x - (d.source as any).x;
            const dy = (d.target as any).y - (d.source as any).y;
            const angle = Math.atan2(dy, dx);

            // Get source node dimensions
            const sourceNode = node.filter(n => n.id === (d.source as any).id).node() as Element;
            const sourceWidth = parseFloat(sourceNode?.getAttribute('data-width') || '0') / 2;
            const sourceHeight = parseFloat(sourceNode?.getAttribute('data-height') || '0') / 2;

            // Get target node dimensions
            const targetNode = node.filter(n => n.id === (d.target as any).id).node() as Element;
            const targetWidth = parseFloat(targetNode?.getAttribute('data-width') || '0') / 2;
            const targetHeight = parseFloat(targetNode?.getAttribute('data-height') || '0') / 2;

            // Calculate intersection points with rectangles
            const sourceIntersect = getIntersection(angle, sourceWidth, sourceHeight);
            const targetIntersect = getIntersection(angle + Math.PI, targetWidth, targetHeight);

            const startX = (d.source as any).x + sourceIntersect.x;
            const startY = (d.source as any).y + sourceIntersect.y;
            const endX = (d.target as any).x + targetIntersect.x;
            const endY = (d.target as any).y + targetIntersect.y;

            return `M${startX},${startY}L${endX},${endY}`;
        });

        // Position edge labels at midpoint
        linkLabels.attr("transform", (d: Link) => {
            const midX = ((d.source as any).x + (d.target as any).x) / 2;
            const midY = ((d.source as any).y + (d.target as any).y) / 2;
            return `translate(${midX},${midY})`;
        });

        node.attr("transform", d => `translate(${d.x!},${d.y!})`);
    });

    // Update styles
    const style = document.createElement('style');
    style.textContent = `
    .edge-label {
        cursor: default;
    }
    .node-background {
        fill: white;
        stroke: ${COLORS.BORDER};
        stroke-width: 1px;
    }
    .node-label {
        font: 12px sans-serif;
        fill: black;
        user-select: none;
    }
    .node {
        cursor: default;
    }
    `;
    document.head.appendChild(style);
}
function showEdgeTooltip(tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, subEdges: SubEdge[] | undefined, x: number, y: number) {
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);

    // Add mouseout handler to tooltip itself
    tooltip.on("mouseout", (event) => {
        const e = event.toElement || event.relatedTarget;
        const tooltipNode = tooltip.node();
        if (!tooltipNode?.contains(e) && e !== tooltipNode) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        }
    });

    let tableHTML = `
        <table style="border-collapse: collapse;">
            <tr>
                <th style="padding: 5px; border: 1px solid ${COLORS.BORDER}">Name</th>
                <th style="padding: 5px; border: 1px solid ${COLORS.BORDER}">Latency</th>
                <th style="padding: 5px; border: 1px solid ${COLORS.BORDER}">Error Rate</th>
            </tr>`;

    if (subEdges?.length) {
        subEdges.forEach(edge => {
            tableHTML += `
                <tr>
                    <td style="padding: 5px; border: 1px solid ${COLORS.BORDER}">${edge.name}</td>
                    <td style="padding: 5px; border: 1px solid ${COLORS.BORDER}">${formatLatency(edge.latency)}</td>
                    <td style="padding: 5px; border: 1px solid ${COLORS.BORDER}">${(edge.errorRate * 100).toFixed(3)}%</td>
                </tr>`;
        });
    } else {
        tableHTML += `
            <tr>
                <td colspan="4" style="padding: 5px; border: 1px solid ${COLORS.BORDER};font-style:italic;">No sub-edges available</td>
            </tr>`;
    }

    tableHTML += `</table>`;

    tooltip.html(tableHTML)
        .style("left", (x + 10) + "px")
        .style("top", (y - 28) + "px");
}