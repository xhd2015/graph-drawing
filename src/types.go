package types

type NodeID int64

// GraphData represents the complete graph structure
type GraphData struct {
	Nodes []Node `json:"nodes"`
	Links []Link `json:"links"`
}

// Node represents a node in the graph with its metrics
type Node struct {
	ID        NodeID  `json:"id"`   // Unique numeric identifier
	Name      string  `json:"name"` // Display name, can be duplicated
	QPS       float64 `json:"qps,omitempty"`
	Latency   float64 `json:"latency,omitempty"`
	ErrorRate float64 `json:"errorRate,omitempty"`
}

// SubEdge represents a sub-connection between nodes with metrics
type SubEdge struct {
	Name      string  `json:"name"`
	Value     float64 `json:"value"`
	ErrorRate float64 `json:"errorRate"`
	Latency   float64 `json:"latency"`
}

// Link represents a connection between nodes with metrics and optional sub-edges
type Link struct {
	Source    NodeID    `json:"source"` // Reference to source node ID
	Target    NodeID    `json:"target"` // Reference to target node ID
	Value     float64   `json:"value"`
	ErrorRate float64   `json:"errorRate"`
	Latency   float64   `json:"latency"`
	SubEdges  []SubEdge `json:"subEdges,omitempty"`
}
