# D3 Network Graph Visualization

A TypeScript project that visualizes network dependencies and their metrics using D3.js force-directed graph layout.

## Features

- Interactive force-directed graph layout
- Node color coding based on health metrics:
  - Red: High error rate (>1%)
  - Yellow: High latency (>100ms)
  - Green: Healthy service
- Zoom controls with buttons
- Draggable nodes
- Precise edge connections to node boundaries
- Service metrics display (latency, error rates)

# Developement
```sh
npm run dev
```