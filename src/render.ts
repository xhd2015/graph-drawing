

import React from 'react';
import { renderToString } from 'react-dom/server';

export function renderReactComponentToHTML(component: React.ReactNode): string {
    return renderToString(component)
}