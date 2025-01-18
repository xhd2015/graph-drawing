import { GraphData } from './types';

const graphData: GraphData = {
    nodes: [
        { id: 1, name: "Frontend", qps: 100, latency: 50, errorRate: 0.001 },
        { id: 2, name: "Auth", qps: 80, latency: 30, errorRate: 0.005 },
        { id: 3, name: "Users", qps: 60, latency: 120, errorRate: 0.002 },
        { id: 4, name: "Orders", qps: 40, latency: 80, errorRate: 0.015 },
        { id: 5, name: "Products", qps: 90, latency: 40, errorRate: 0.001 },
        { id: 6, name: "Database", qps: 200, latency: 20, errorRate: 0.0005 }
    ],
    links: [
        {
            source: 1,
            target: 2,
            value: 5,
            errorRate: 0.002,
            latency: 45,
            subEdges: [
                { name: "Auth-Load-Balancer", value: 2, errorRate: 0.001, latency: 15 },
                { name: "Auth-Load-Balancer", value: 2, errorRate: 0.002, latency: 20 },
                { name: "Auth-Service1", value: 1, errorRate: 0.0005, latency: 5 },
                { name: "Auth-Service2", value: 1, errorRate: 0.0005, latency: 5 }
            ]
        },
        {
            source: 1,
            target: 5,
            value: 8,
            errorRate: 0.001,
            latency: 60,
            subEdges: [
                { name: "Products-API", value: 3, errorRate: 0.0005, latency: 10 },
                { name: "Products-API", value: 2, errorRate: 0.001, latency: 30 },
                { name: "Products-Cache", value: 1, errorRate: 0.0005, latency: 20 }
            ]
        },
        {
            source: 2,
            target: 3,
            value: 3,
            errorRate: 0.02,
            latency: 150,
            subEdges: [
                { name: "Users-Gateway", value: 2, errorRate: 0.015, latency: 70 },
                { name: "Users-Service", value: 2, errorRate: 0.005, latency: 60 }
            ]
        },
        { source: 3, target: 6, value: 4, errorRate: 0.001, latency: 30 },
        { source: 5, target: 6, value: 6, errorRate: 0.001, latency: 25 },
        { source: 1, target: 4, value: 4, errorRate: 0.005, latency: 90 },
        { source: 4, target: 6, value: 3, errorRate: 0.012, latency: 110 }
    ]
};

export default graphData; 