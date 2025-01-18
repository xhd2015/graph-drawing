import React, { useState, useEffect, useRef } from 'react';
import { drawGraph } from './draw';
import defaultGraphData from './data';
import './Graph.css';
import { CallGraph } from './CallGraph';

export function Graph() {
    const [jsonInput, setJsonInput] = useState(JSON.stringify(defaultGraphData, null, 2));
    const [urlInput, setUrlInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [graphData, setGraphData] = useState(defaultGraphData);

    useEffect(() => {
        // Restore last used URL if exists
        const lastUrl = localStorage.getItem('lastUrl');
        if (lastUrl) {
            setUrlInput(lastUrl);
            loadFromUrl(lastUrl);
        }
    }, []);

    const validateGraphData = (data: any) => {
        // Basic structure validation
        if (!data.nodes || !Array.isArray(data.nodes) || !data.links || !Array.isArray(data.links)) {
            throw new Error('Data must contain "nodes" and "links" arrays');
        }

        // Validate nodes
        for (const node of data.nodes) {
            if (!node.id || !node.name) {
                throw new Error('Each node must have an "id" and "name"');
            }
        }

        // Validate links
        for (const link of data.links) {
            if (link.source === undefined || link.target === undefined || link.value === undefined) {
                throw new Error('Each link must have "source", "target", and "value"');
            }
        }
    };

    const loadFromUrl = async (url: string) => {
        if (!url) {
            setError('Please enter a URL');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            validateGraphData(data);
            setJsonInput(JSON.stringify(data, null, 2));

            setGraphData(data);

            localStorage.setItem('lastUrl', url);
        } catch (error) {
            setError(`Error loading from URL: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setJsonInput(JSON.stringify(defaultGraphData, null, 2));
        setUrlInput('');
        setError('');
        localStorage.removeItem('lastUrl');

        setGraphData(defaultGraphData);
    };

    const handleRender = () => {
        setError('');
        try {
            const graphData = JSON.parse(jsonInput);
            validateGraphData(graphData);

            setGraphData(graphData);
        } catch (error) {
            setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div className="container">
            <div className="input-panel">
                <h3>Input Graph Data (JSON format)</h3>
                <div className="url-input-group">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Enter JSON URL"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => loadFromUrl(urlInput)}
                        disabled={isLoading}
                        className={isLoading ? 'loading' : ''}
                    >
                        {isLoading ? 'Loading...' : 'Load URL'}
                    </button>
                </div>
                <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={20}
                    placeholder="Paste your graph data here..."
                />
                {error && <div className="error" style={{ display: 'block' }}>{error}</div>}
                <div className="button-group">
                    <button onClick={handleRender}>Render Graph</button>
                    <button onClick={handleReset}>Reset to Default</button>
                </div>
            </div>
            <CallGraph graphData={graphData} />
        </div>
    );
};