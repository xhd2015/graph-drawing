import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

type NodeId = number;

export interface Comparison {
    baseValue: number
    value: number
    increase: number
    increasePercent: number
}

export enum NodeMetricsType {
    CPU = "cpu",
    MEMORY = "memory",
    DISK = "disk",
    GOROUTINES = "goroutines",
    GC_DURATION_SECONDS = "gcDurationSeconds",
    MEM_ALLOC_BYTES = "memAllocBytes",
    THREADS = "threads",
    NETWORK_MYSQL_CONNECTION = "networkMysqlConnection",
    NETWORK_REDIS_CONNECTION = "networkRedisConnection",
    NETWORK_ETCD_CONNECTION = "networkEtcdConnection",
    POD_COUNT = "pod_count"
}

export interface NodeMetrics {
    metricsType: NodeMetricsType
    comparison: Comparison
}

export interface Node extends SimulationNodeDatum {
    id: NodeId;
    name: string;

    metrics?: NodeMetrics[]

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
    latency: Comparison;
    subEdges?: SubEdge[];
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
} 