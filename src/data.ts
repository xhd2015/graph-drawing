import { GraphData } from './types';

const graphData: GraphData = {
    nodes: [
        { id: 1, name: "Frontend", qps: 100, latency: 0.05, errorRate: 0.001 },
        { id: 2, name: "Auth", qps: 80, latency: 0.03, errorRate: 0.005 },
        { id: 3, name: "Users", qps: 60, latency: 0.12, errorRate: 0.002 },
        { id: 4, name: "Orders", qps: 40, latency: 0.08, errorRate: 0.015 },
        { id: 5, name: "Products", qps: 90, latency: 0.04, errorRate: 0.001 },
        { id: 6, name: "Database", qps: 200, latency: 0.02, errorRate: 0.0005 }
    ],
    links: [
        {
            source: 1,
            target: 2,
            value: 5,
            errorRate: 0.002,
            latency: {
                baseValue: 0,
                value: 0.045,
                increase: 0,
                increasePercent: 0
            },
            subEdges: [
                { name: "Auth-Load-Balancer", value: 2, errorRate: 0.001, latency: 0.015 },
                { name: "Auth-Load-Balancer", value: 2, errorRate: 0.002, latency: 0.02 },
                { name: "Auth-Service1", value: 1, errorRate: 0.0005, latency: 0.005 },
                { name: "Auth-Service2", value: 1, errorRate: 0.0005, latency: 0.005 }
            ]
        },
        {
            source: 1,
            target: 5,
            value: 8,
            errorRate: 0.001,
            latency: {
                baseValue: 0,
                value: 0.06,
                increase: 0,
                increasePercent: 0
            },
            subEdges: [
                { name: "Products-API", value: 3, errorRate: 0.0005, latency: 0.01 },
                { name: "Products-API", value: 2, errorRate: 0.001, latency: 0.03 },
                { name: "Products-Cache", value: 1, errorRate: 0.0005, latency: 0.02 }
            ]
        },
        {
            source: 2,
            target: 3,
            value: 3,
            errorRate: 0.02,
            latency: {
                baseValue: 0,
                value: 0.15,
                increase: 0,
                increasePercent: 0
            },
            subEdges: [
                { name: "Users-Gateway", value: 2, errorRate: 0.015, latency: 0.07 },
                { name: "Users-Service", value: 2, errorRate: 0.005, latency: 0.06 }
            ]
        },
        {
            source: 3, target: 6, value: 4, errorRate: 0.001, latency: {
                baseValue: 0,
                value: 0.03,
                increase: 0,
                increasePercent: 0
            }
        },
        {
            source: 5, target: 6, value: 6, errorRate: 0.001, latency: {
                baseValue: 0,
                value: 0.025,
                increase: 0,
                increasePercent: 0
            }
        },
        {
            source: 1, target: 4, value: 4, errorRate: 0.005, latency: {
                baseValue: 0,
                value: 0.09,
                increase: 0,
                increasePercent: 0
            }
        },
        {
            source: 4, target: 6, value: 3, errorRate: 0.012, latency: {
                baseValue: 0,
                value: 0.11,
                increase: 0,
                increasePercent: 0
            }
        }
    ]
};

export default graphData; 