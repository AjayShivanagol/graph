import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

export interface WorkflowNode extends Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config?: Record<string, any>;
    [key: string]: any;
  };
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  isConfigPanelOpen: boolean;
  workflowName: string;
  isDirty: boolean;

  // Enhanced tracking
  nodeHistory: {
    created: { nodeId: string; timestamp: number; type: string }[];
    updated: {
      nodeId: string;
      timestamp: number;
      changes: Record<string, any>;
    }[];
    deleted: { nodeId: string; timestamp: number; type: string }[];
  };

  edgeHistory: {
    created: {
      edgeId: string;
      timestamp: number;
      source: string;
      target: string;
    }[];
    deleted: {
      edgeId: string;
      timestamp: number;
      source: string;
      target: string;
    }[];
  };

  workflowMetadata: {
    createdAt: number;
    lastModified: number;
    version: number;
    totalNodes: number;
    totalEdges: number;
    executionCount: number;
  };

  validationErrors: {
    nodeId: string;
    type: "missing_connection" | "invalid_config" | "circular_dependency";
    message: string;
    timestamp: number;
  }[];
}

const initialState: WorkflowState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isConfigPanelOpen: false,
  workflowName: "Untitled Workflow",
  isDirty: false,

  nodeHistory: {
    created: [],
    updated: [],
    deleted: [],
  },

  edgeHistory: {
    created: [],
    deleted: [],
  },

  workflowMetadata: {
    createdAt: Date.now(),
    lastModified: Date.now(),
    version: 1,
    totalNodes: 0,
    totalEdges: 0,
    executionCount: 0,
  },

  validationErrors: [],
};

export const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<WorkflowNode[]>) => {
      state.nodes = action.payload;
      state.isDirty = true;
    },
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
      state.isDirty = true;
    },
    addNode: (state, action: PayloadAction<WorkflowNode>) => {
      const node = action.payload;
      state.nodes.push(node);
      state.isDirty = true;

      // Track node creation
      state.nodeHistory.created.push({
        nodeId: node.id,
        timestamp: Date.now(),
        type: node.type,
      });

      // Update metadata
      state.workflowMetadata.lastModified = Date.now();
      state.workflowMetadata.totalNodes = state.nodes.length;
      state.workflowMetadata.version += 1;
    },
    updateNode: (
      state,
      action: PayloadAction<{ id: string; data: Partial<WorkflowNode["data"]> }>
    ) => {
      const { id, data } = action.payload;
      const nodeIndex = state.nodes.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
        const oldData = { ...state.nodes[nodeIndex].data };
        const updatedNode = {
          ...state.nodes[nodeIndex],
          data: {
            ...state.nodes[nodeIndex].data,
            ...data,
          },
        };

        state.nodes = [
          ...state.nodes.slice(0, nodeIndex),
          updatedNode,
          ...state.nodes.slice(nodeIndex + 1),
        ];
        state.isDirty = true;

        // Track node update
        state.nodeHistory.updated.push({
          nodeId: id,
          timestamp: Date.now(),
          changes: { old: oldData, new: data },
        });

        // Update metadata
        state.workflowMetadata.lastModified = Date.now();
        state.workflowMetadata.version += 1;
      }
    },
    deleteNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      const nodeToDelete = state.nodes.find((node) => node.id === nodeId);

      state.nodes = state.nodes.filter((node) => node.id !== nodeId);
      const deletedEdges = state.edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );
      state.edges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );

      if (state.selectedNodeId === nodeId) {
        state.selectedNodeId = null;
        state.isConfigPanelOpen = false;
      }
      state.isDirty = true;

      // Track node deletion
      if (nodeToDelete) {
        state.nodeHistory.deleted.push({
          nodeId: nodeId,
          timestamp: Date.now(),
          type: nodeToDelete.type,
        });
      }

      // Track deleted edges
      deletedEdges.forEach((edge) => {
        state.edgeHistory.deleted.push({
          edgeId: edge.id,
          timestamp: Date.now(),
          source: edge.source,
          target: edge.target,
        });
      });

      // Update metadata
      state.workflowMetadata.lastModified = Date.now();
      state.workflowMetadata.totalNodes = state.nodes.length;
      state.workflowMetadata.totalEdges = state.edges.length;
      state.workflowMetadata.version += 1;
    },
    addEdge: (state, action: PayloadAction<Connection>) => {
      const connection = action.payload;
      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      };
      state.edges.push(newEdge);
      state.isDirty = true;

      // Track edge creation
      state.edgeHistory.created.push({
        edgeId: newEdge.id,
        timestamp: Date.now(),
        source: newEdge.source,
        target: newEdge.target,
      });

      // Update metadata
      state.workflowMetadata.lastModified = Date.now();
      state.workflowMetadata.totalEdges = state.edges.length;
      state.workflowMetadata.version += 1;
    },
    deleteEdge: (state, action: PayloadAction<string>) => {
      state.edges = state.edges.filter((edge) => edge.id !== action.payload);
      state.isDirty = true;
    },
    updateEdge: (state, action: PayloadAction<{ id: string; updates: Partial<Edge> }>) => {
      const { id, updates } = action.payload;
      const edgeIndex = state.edges.findIndex((edge) => edge.id === id);
      if (edgeIndex !== -1) {
        state.edges[edgeIndex] = { ...state.edges[edgeIndex], ...updates };
        state.isDirty = true;
        state.workflowMetadata.lastModified = Date.now();
        state.workflowMetadata.version += 1;
      }
    },
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
      state.isConfigPanelOpen = !!action.payload;
    },
    setConfigPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isConfigPanelOpen = action.payload;
      if (!action.payload) {
        state.selectedNodeId = null;
      }
    },
    setWorkflowName: (state, action: PayloadAction<string>) => {
      state.workflowName = action.payload;
      state.isDirty = true;
    },
    markAsSaved: (state) => {
      state.isDirty = false;
    },
    resetWorkflow: (state) => {
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
      state.isConfigPanelOpen = false;
      state.workflowName = "Untitled Workflow";
      state.isDirty = false;
    },
    onNodesChange: (state, action: PayloadAction<NodeChange[]>) => {
      state.nodes = applyNodeChanges(
        action.payload,
        state.nodes as Node[]
      ) as WorkflowNode[];
    },
    onEdgesChange: (state, action: PayloadAction<EdgeChange[]>) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
  },
});

export const {
  setNodes,
  setEdges,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  deleteEdge,
  updateEdge,
  setSelectedNode,
  setConfigPanelOpen,
  setWorkflowName,
  markAsSaved,
  resetWorkflow,
  onNodesChange,
  onEdgesChange,
} = workflowSlice.actions;

// Selector to get complete workflow data for publishing
export const getWorkflowForPublish = (state: { workflow: WorkflowState }) => {
  return {
    workflowName: state.workflow.workflowName,
    nodes: state.workflow.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        // Ensure condition paths are included with all their data
        ...(node.data.paths && {
          paths: node.data.paths.map((path: any) => ({
            id: path.id,
            condition: path.condition,
            type: path.type,
            rules: path.rules,
            matchType: path.matchType
          }))
        })
      }
    })),
    edges: state.workflow.edges,
    metadata: state.workflow.workflowMetadata,
    isDirty: state.workflow.isDirty
  };
};

export default workflowSlice.reducer;
