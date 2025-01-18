import * as d3 from 'd3';
import { GraphData, Link, Node, SubEdge } from "./types";
import { installDrag } from './drag';
import { getIntersection } from './intersection';

// Color constants
const COLORS = {
    BORDER: "#666",
    EDGE_HEALTHY: "#90EE90",
    EDGE_SLOW: "#ff7f7f",
    NODE_NORMAL: "#f1f1f1", // light grey
    NODE_HEALTHY: "#90EE90",
    NODE_ERROR: "#ff7f7f",
    NODE_SLOW: "#ffd700",
} as const;

// Layout configuration
let verticalNodeSpacing = 80; // Minimum vertical space between nodes in pixels
let edgeLabelBackground = "white"; // Background color for edge labels

// Format latency for display (converts seconds to appropriate unit)
function formatLatency(latencyInSeconds: number): string {
    if (latencyInSeconds >= 1) {
        return `${latencyInSeconds}s`;
    }
    if (latencyInSeconds >= 0.001) {
        return `${(latencyInSeconds * 1000).toFixed(0)}ms`;
    }
    return `${(latencyInSeconds * 1000000).toFixed(0)}µs`;
}

function topologicalSort(nodes: Node[], links: Link[]): { levels: Map<number, number>, maxLevel: number } {
    // Create adjacency list
    const graph = new Map<number, number[]>();
    const inDegree = new Map<number, number>();

    // Initialize
    nodes.forEach(node => {
        graph.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    // Build graph
    links.forEach(link => {
        const source = typeof link.source === 'object' ? (link.source as Node).id : link.source;
        const target = typeof link.target === 'object' ? (link.target as Node).id : link.target;
        graph.get(source)?.push(target);
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
    });

    // Find nodes with no incoming edges
    const queue: number[] = [];
    nodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
            queue.push(node.id);
        }
    });

    // Process queue and assign levels
    const levels = new Map<number, number>();
    let maxLevel = 0;

    queue.forEach(id => levels.set(id, 0));

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentLevel = levels.get(current)!;
        maxLevel = Math.max(maxLevel, currentLevel);

        graph.get(current)?.forEach(neighbor => {
            levels.set(neighbor, Math.max((levels.get(neighbor) || 0), currentLevel + 1));
            inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        });
    }

    return { levels, maxLevel };
}

let disableSimulation = true;
let disableDrag = true;

export function drawGraph(rootSelector: string, graphData: GraphData): void {
    const width = 800;
    const height = 600; // Increased height for better vertical distribution
    const root = d3.select(rootSelector);

    // Get topological levels
    const { levels, maxLevel } = topologicalSort(graphData.nodes, graphData.links);

    // Group nodes by level and calculate parent-child relationships
    const nodesByLevel = new Map<number, Node[]>();
    const childrenByNode = new Map<number, Node[]>();

    // Initialize nodesByLevel and sort nodes by name within each level
    graphData.nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        if (!nodesByLevel.has(level)) {
            nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level)!.push(node);
        childrenByNode.set(node.id, []);
    });

    // Sort nodes by name within each level for stable positioning
    nodesByLevel.forEach((nodes, level) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Build parent-child relationships
    graphData.links.forEach(link => {
        const source = typeof link.source === 'object' ? (link.source as Node).id : link.source;
        const target = typeof link.target === 'object' ? (link.target as Node) : graphData.nodes.find(n => n.id === (link.target as number))!;
        childrenByNode.get(source)?.push(target);
    });

    // Sort children by name for stable positioning
    childrenByNode.forEach((children, nodeId) => {
        children.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Initialize simulation only if not disabled
    let simulation = null;

    if (disableSimulation) {
        // First pass: position nodes without parents (leaf nodes)
        graphData.nodes.forEach(node => {
            const level = levels.get(node.id) || 0;
            const levelWidth = width / (maxLevel + 1);
            const nodesInLevel = nodesByLevel.get(level)!;
            const nodeIndex = nodesInLevel.indexOf(node);
            const levelHeight = height * 0.8;

            // Increase horizontal spacing between levels
            const horizontalPadding = 150; // Minimum space between levels
            const xPos = levelWidth * level + levelWidth / 2 + horizontalPadding * level;

            // Calculate vertical spacing to ensure even distribution
            const totalNodesInLevel = nodesInLevel.length;
            // Use max of minimum spacing and available height divided by number of gaps
            const effectiveSpacing = Math.max(
                verticalNodeSpacing,
                levelHeight / (totalNodesInLevel + 1)
            );
            const totalHeight = effectiveSpacing * (totalNodesInLevel - 1);
            const verticalStart = (height - totalHeight) / 2;
            const yPos = verticalStart + (nodeIndex * effectiveSpacing);

            // Set initial positions
            node.x = xPos;
            node.y = yPos;
        });

        // Second pass: adjust parent positions based on children's positions
        for (let level = maxLevel - 1; level >= 0; level--) {
            const nodesInLevel = nodesByLevel.get(level) || [];

            // First calculate all parent positions based on children
            nodesInLevel.forEach(node => {
                const children = childrenByNode.get(node.id) || [];
                if (children.length > 0) {
                    // Keep x-position based on level for clarity
                    const levelWidth = width / (maxLevel + 1);
                    const horizontalPadding = 150;
                    node.x = levelWidth * level + levelWidth / 2 + horizontalPadding * level;

                    // Set y-position to center of children
                    let sumY = 0;
                    children.forEach(child => {
                        sumY += child.y!;
                    });
                    node.y = sumY / children.length;
                }
            });

            // Then ensure even spacing between nodes in the same level
            if (nodesInLevel.length > 1) {
                nodesInLevel.sort((a, b) => (a.y || 0) - (b.y || 0));
                const levelHeight = height * 0.8;
                const effectiveSpacing = Math.max(
                    verticalNodeSpacing,
                    levelHeight / (nodesInLevel.length + 1)
                );
                const totalHeight = effectiveSpacing * (nodesInLevel.length - 1);
                const verticalStart = (height - totalHeight) / 2;

                // Redistribute nodes evenly
                nodesInLevel.forEach((node, index) => {
                    node.y = verticalStart + (index * effectiveSpacing);
                });
            }
        }

        // Update link source and target positions
        graphData.links.forEach(link => {
            const source = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
            const target = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
            if (source) (link as any).source = source;
            if (target) (link as any).target = target;
        });
    } else {
        // Dynamic simulation setup
        simulation = d3.forceSimulation(graphData.nodes);
        simulation.force("link", d3.forceLink(graphData.links)
            .id(d => (d as any).id)
            .distance(d => {
                const textLength = `${formatLatency(d.latency)}`.length * 8;
                return Math.max(200, textLength + 120);
            }))
            .force("charge", d3.forceManyBody()
                .strength(-3000)
                .distanceMax(width * 0.7))
            .force("collide", d3.forceCollide()
                .radius(80)
                .strength(1))
            .force("x", d3.forceX(d => {
                const level = levels.get((d as Node).id) || 0;
                const levelWidth = width / (maxLevel + 1);
                return levelWidth * level + levelWidth / 2;
            }).strength(1.0))
            .force("y", d3.forceY(d => {
                const level = levels.get((d as Node).id) || 0;
                const nodesInLevel = nodesByLevel.get(level)!;
                const nodeIndex = nodesInLevel.indexOf(d as Node);
                const levelHeight = height * 0.8;

                const children = childrenByNode.get((d as Node).id) || [];
                if (children.length > 0) {
                    let totalChildPosition = 0;
                    let validChildCount = 0;

                    children.forEach(child => {
                        const childLevel = levels.get(child.id)!;
                        const nodesInChildLevel = nodesByLevel.get(childLevel)!;
                        const childIndex = nodesInChildLevel.indexOf(child);
                        if (childIndex !== -1) {
                            const childPosition = height * 0.1 + (levelHeight / (nodesInChildLevel.length + 1)) * (childIndex + 1);
                            totalChildPosition += childPosition;
                            validChildCount++;
                        }
                    });

                    if (validChildCount > 0) {
                        return totalChildPosition / validChildCount;
                    }
                }

                const verticalSpacing = levelHeight / (nodesInLevel.length + 1);
                return height * 0.1 + verticalSpacing * (nodeIndex + 1);
            }).strength(0.8))
            .alpha(1)
            .alphaDecay(0.01);
    }

    // Create SVG elements
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
                // Get the current zoom transform
                const transform = d3.zoomTransform(svg.node()!);
                // Get mouse position relative to the container
                const rect = (root.node() as Element).getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                showEdgeTooltip(tooltip, d.subEdges, mouseX - 60, mouseY);
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
                hideTooltip(tooltip);
            }
        });

    // Add background rectangle for better readability
    linkLabels.append("rect")
        .attr("fill", edgeLabelBackground)
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

    if (!disableDrag && simulation != null) {
        // install drag handler
        installDrag(node, simulation);
    }

    // Add background rectangles
    node.append("rect")
        .attr("class", "node-background")
        .attr("rx", 4)
        .attr("ry", 4)
        .style("fill", d => {
            if (d.errorRate && d.errorRate > 0.01) return COLORS.NODE_ERROR;  // Red for high error
            if (d.latency && d.latency > 0.1) return COLORS.NODE_SLOW;     // Yellow for high latency
            return COLORS.NODE_NORMAL;                          // Green for healthy
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

    // Update positions
    function updatePositions() {
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

            if (disableSimulation) {
                // In static mode, use curved paths between nodes
                const sourceLevel = levels.get((d.source as any).id) || 0;
                const targetLevel = levels.get((d.target as any).id) || 0;
                const levelDiff = targetLevel - sourceLevel;

                // Calculate intersection points with rectangles
                const sourceIntersect = getIntersection(0, sourceWidth, sourceHeight);
                const targetIntersect = getIntersection(Math.PI, targetWidth, targetHeight);

                const startX = (d.source as any).x + sourceIntersect.x;
                const startY = (d.source as any).y + sourceIntersect.y;
                const endX = (d.target as any).x + targetIntersect.x;
                const endY = (d.target as any).y + targetIntersect.y;

                // Calculate control points for the curve
                const dx = endX - startX;
                const dy = endY - startY;
                const midX = startX + dx * 0.5;

                // Calculate curve parameters based on the path characteristics
                const isGoingUp = endY < startY;
                const verticalDistance = Math.abs(dy);
                const horizontalDistance = Math.abs(dx);

                // Make the curve more pronounced based on the distance and level difference
                const curveStrength = Math.min(
                    Math.max(horizontalDistance * 0.3, verticalDistance * 0.5),
                    150 // Maximum curve offset
                );

                // Position control points at 1/3 and 2/3 of the path
                const cp1x = startX + dx * 0.33;
                const cp2x = startX + dx * 0.67;

                // Adjust control points vertically based on path direction
                const controlPointOffset = isGoingUp ? -curveStrength : curveStrength;
                const cp1y = startY + (isGoingUp ? -curveStrength / 2 : curveStrength / 2);
                const cp2y = endY + (isGoingUp ? -curveStrength / 2 : curveStrength / 2);

                // Use cubic Bézier curve for smoother paths
                return `M${startX},${startY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
            } else {
                // Dynamic mode - use intersection points based on actual angle
                const sourceIntersect = getIntersection(angle, sourceWidth, sourceHeight);
                const targetIntersect = getIntersection(angle + Math.PI, targetWidth, targetHeight);

                const startX = (d.source as any).x + sourceIntersect.x;
                const startY = (d.source as any).y + sourceIntersect.y;
                const endX = (d.target as any).x + targetIntersect.x;
                const endY = (d.target as any).y + targetIntersect.y;

                return `M${startX},${startY}L${endX},${endY}`;
            }
        });

        // Position edge labels at midpoint
        linkLabels.attr("transform", (d: Link) => {
            if (disableSimulation) {
                // In static mode, calculate the exact middle point of the curved path
                const sourceNode = node.filter(n => n.id === (d.source as any).id).node() as Element;
                const targetNode = node.filter(n => n.id === (d.target as any).id).node() as Element;
                const sourceWidth = parseFloat(sourceNode?.getAttribute('data-width') || '0') / 2;
                const targetWidth = parseFloat(targetNode?.getAttribute('data-width') || '0') / 2;
                const sourceHeight = parseFloat(sourceNode?.getAttribute('data-height') || '0') / 2;
                const targetHeight = parseFloat(targetNode?.getAttribute('data-height') || '0') / 2;

                // Calculate intersection points
                const sourceIntersect = getIntersection(0, sourceWidth, sourceHeight);
                const targetIntersect = getIntersection(Math.PI, targetWidth, targetHeight);

                const startX = (d.source as any).x + sourceIntersect.x;
                const startY = (d.source as any).y + sourceIntersect.y;
                const endX = (d.target as any).x + targetIntersect.x;
                const endY = (d.target as any).y + targetIntersect.y;

                // Use the same curve calculation as the edge path
                const dx = endX - startX;
                const dy = endY - startY;
                const verticalDistance = Math.abs(dy);
                const horizontalDistance = Math.abs(dx);
                const isGoingUp = endY < startY;

                // Calculate curve strength
                const curveStrength = Math.min(
                    Math.max(horizontalDistance * 0.3, verticalDistance * 0.5),
                    150
                );

                // Calculate control points
                const cp1x = startX + dx * 0.33;
                const cp2x = startX + dx * 0.67;
                const cp1y = startY + (isGoingUp ? -curveStrength / 2 : curveStrength / 2);
                const cp2y = endY + (isGoingUp ? -curveStrength / 2 : curveStrength / 2);

                // Calculate point at t=0.5 on the cubic Bezier curve
                const t = 0.5;
                const t2 = t * t;
                const t3 = t2 * t;
                const mt = 1 - t;
                const mt2 = mt * mt;
                const mt3 = mt2 * mt;

                const midX = mt3 * startX + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * endX;
                const midY = mt3 * startY + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * endY;

                return `translate(${midX},${midY})`;
            } else {
                // Dynamic mode - use node centers
                const midX = ((d.source as any).x + (d.target as any).x) / 2;
                const midY = ((d.source as any).y + (d.target as any).y) / 2;
                return `translate(${midX},${midY})`;
            }
        });

        node.attr("transform", d => `translate(${d.x!},${d.y!})`);
    }

    if (simulation) {
        simulation.on("tick", updatePositions);
    } else {
        // Call once for static layout
        updatePositions();
    }

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

function hideTooltip(tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>) {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0)
        .end()  // Wait for transition to complete
        .then(() => {
            tooltip.style("left", "-1000px"); // Move off-screen
        });
}

function showEdgeTooltip(tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, subEdges: SubEdge[] | undefined, x: number, y: number) {
    // Reset tooltip state
    tooltip.interrupt(); // Stop any ongoing transitions
    tooltip.style("opacity", 0); // Reset opacity

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

    // Position and show tooltip
    tooltip
        .html(tableHTML)
        .style("left", `${x}px`)
        .style("top", `${y + 5}px`)
        .transition()
        .duration(200)
        .style("opacity", 0.9);

    // Add mouseout handler to tooltip itself
    tooltip.on("mouseout", (event) => {
        const e = event.toElement || event.relatedTarget;
        const tooltipNode = tooltip.node();
        if (!tooltipNode?.contains(e) && e !== tooltipNode) {
            hideTooltip(tooltip);
        }
    });
}