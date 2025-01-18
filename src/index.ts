
import { Graph } from "./Graph";
import { CallGraph } from "./CallGraph";

import React from 'react';
import ReactDOM from 'react-dom/client';

export { Graph, CallGraph };

// el: e.g. document.getElementById('root')
export function renderComponent(el: HTMLElement, component: React.FC) {
    const root = ReactDOM.createRoot(el);
    root.render(React.createElement(component));
}