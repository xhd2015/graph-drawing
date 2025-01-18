import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

type NodeId = number;
export interface Node extends SimulationNodeDatum {
    id: NodeId;
    name: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    qps?: number;
    latency?: number;
    errorRate?: number;
}

export interface SubEdge {
    name: string
    value: number;
    errorRate: number;
    latency: number;
}

export interface Link extends SimulationLinkDatum<Node> {
    source: NodeId;
    target: NodeId;
    value: number;
    errorRate: number;
    latency: number;
    subEdges?: SubEdge[];
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
} 