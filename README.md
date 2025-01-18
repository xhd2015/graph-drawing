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

# Publish
Update version in package.json, then:

```sh
npm run build-for-publish

( cd publish && npm publish )
```

reference:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graph-drawing@1.0.1/style.css">
<script type="module">
  import { renderComponent, Graph } from 'https://cdn.jsdelivr.net/npm/graph-drawing@1.0.1/index.js';
  renderComponent(document.getElementById('root'), Graph);
</script>
```

Verify at local:
```sh
npx http-server -p 3000 -c-1 -o

# replace ref in demo-publish.html

# visit http://127.0.0.1:3000/demo-publish.html
```