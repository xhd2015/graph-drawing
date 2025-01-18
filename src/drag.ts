import * as d3 from 'd3';
import { Node } from "./types";

export function installDrag(node: any, simulation: d3.Simulation<Node, undefined>) {
    const fn = drag(simulation)
    fn(node)
}

// Drag functionality
export function drag(simulation: d3.Simulation<Node, undefined>): (selection: d3.Selection<any, any, any, any>, ...args: any[]) => void {
    function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}