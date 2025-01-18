import React, { useEffect, useRef } from "react";
import { GraphData } from "./types";
import { drawGraph } from "./draw";


export interface CallGraphProps {
    graphData: GraphData;
}

export function CallGraph(props: CallGraphProps) {
    const graphData = props.graphData;

    useEffect(() => {
        if (graphContainerRef.current) {
            graphContainerRef.current.innerHTML = '';
            drawGraph(graphContainerRef.current, graphData);
        }
    }, [graphData]);

    const graphContainerRef = useRef<HTMLDivElement>(null);
    return <div className='graph-container' ref={graphContainerRef} />
}