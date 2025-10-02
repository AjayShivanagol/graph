import type { Node, Edge } from "reactflow";

export function exportWorkflow(nodes: Node[], edges: Edge[]) {
  return {
    nodes,
    edges,
    metadata: {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    },
  };
}

export function importWorkflow(data: any) {
  // Validate the imported data
  if (!data || !data.nodes || !data.edges) {
    throw new Error("Invalid workflow data");
  }

  // Ensure all nodes have the required properties
  const nodes = data.nodes.map((node: any) => ({
    ...node,
    id:
      node.id ||
      `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: node.type || "default",
    position: node.position || { x: 0, y: 0 },
    data: node.data || {},
  }));

  // Ensure all edges have the required properties
  const edges = data.edges.map((edge: any) => ({
    ...edge,
    id:
      edge.id ||
      `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: edge.source,
    target: edge.target,
  }));

  return { nodes, edges };
}
