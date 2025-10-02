import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Track all user interactions and workflow steps
export interface UserAction {
  id: string;
  type:
    | "node_add"
    | "node_delete"
    | "node_update"
    | "edge_add"
    | "edge_delete"
    | "canvas_zoom"
    | "canvas_pan"
    | "sidebar_hover"
    | "search"
    | "block_drag"
    | "node_select";
  timestamp: number;
  data: Record<string, any>;
  nodeId?: string;
  position?: { x: number; y: number };
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface SidebarState {
  hoveredCategory: string | null;
  activeTab: "blocks" | "layers";
  searchQuery: string;
  isOpen: boolean;
}

export interface UserInteractionState {
  // Action History - Complete audit trail
  actionHistory: UserAction[];
  undoStack: UserAction[];
  redoStack: UserAction[];

  // Canvas State
  canvasViewport: CanvasViewport;
  canvasMode: "select" | "drag" | "connect" | "zoom";

  // Sidebar State
  sidebar: SidebarState;

  // Node Interaction State
  draggedNodeType: string | null;
  draggedNodeData: Record<string, any> | null;
  hoveredNodeId: string | null;

  // User Preferences
  preferences: {
    autoSave: boolean;
    gridSnap: boolean;
    showMinimap: boolean;
    theme: "light" | "dark" | "system";
  };

  // Session Data
  session: {
    startTime: number;
    lastActivity: number;
    totalActions: number;
    workflowsCreated: number;
  };

  // Performance Tracking
  performance: {
    renderTime: number[];
    actionLatency: number[];
    memoryUsage: number[];
  };
}

const initialState: UserInteractionState = {
  actionHistory: [],
  undoStack: [],
  redoStack: [],

  canvasViewport: { x: 0, y: 0, zoom: 1 },
  canvasMode: "select",

  sidebar: {
    hoveredCategory: null,
    activeTab: "blocks",
    searchQuery: "",
    isOpen: true,
  },

  draggedNodeType: null,
  draggedNodeData: null,
  hoveredNodeId: null,

  preferences: {
    autoSave: true,
    gridSnap: true,
    showMinimap: false,
    theme: "system",
  },

  session: {
    startTime: Date.now(),
    lastActivity: Date.now(),
    totalActions: 0,
    workflowsCreated: 0,
  },

  performance: {
    renderTime: [],
    actionLatency: [],
    memoryUsage: [],
  },
};

export const userInteractionSlice = createSlice({
  name: "userInteraction",
  initialState,
  reducers: {
    // Action History Management
    recordAction: (
      state,
      action: PayloadAction<Omit<UserAction, "id" | "timestamp">>
    ) => {
      const newAction: UserAction = {
        ...action.payload,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      state.actionHistory.push(newAction);
      state.session.lastActivity = Date.now();
      state.session.totalActions += 1;

      // Keep only last 1000 actions for performance
      if (state.actionHistory.length > 1000) {
        state.actionHistory = state.actionHistory.slice(-1000);
      }
    },

    // Canvas Interactions
    updateCanvasViewport: (
      state,
      action: PayloadAction<Partial<CanvasViewport>>
    ) => {
      state.canvasViewport = { ...state.canvasViewport, ...action.payload };
      // Record canvas interaction
      userInteractionSlice.caseReducers.recordAction(state, {
        payload: {
          type: action.payload.zoom ? "canvas_zoom" : "canvas_pan",
          data: action.payload,
        },
        type: "userInteraction/recordAction",
      });
    },

    setCanvasMode: (
      state,
      action: PayloadAction<UserInteractionState["canvasMode"]>
    ) => {
      state.canvasMode = action.payload;
    },

    // Sidebar Interactions
    setSidebarHoveredCategory: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.sidebar.hoveredCategory = action.payload;
      if (action.payload) {
        userInteractionSlice.caseReducers.recordAction(state, {
          payload: {
            type: "sidebar_hover",
            data: { category: action.payload },
          },
          type: "userInteraction/recordAction",
        });
      }
    },

    setSidebarActiveTab: (
      state,
      action: PayloadAction<"blocks" | "layers">
    ) => {
      state.sidebar.activeTab = action.payload;
    },

    setSidebarSearchQuery: (state, action: PayloadAction<string>) => {
      state.sidebar.searchQuery = action.payload;
      userInteractionSlice.caseReducers.recordAction(state, {
        payload: {
          type: "search",
          data: { query: action.payload },
        },
        type: "userInteraction/recordAction",
      });
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.isOpen = action.payload;
    },

    // Node Drag Interactions
    startNodeDrag: (
      state,
      action: PayloadAction<{ nodeType: string; data: Record<string, any> }>
    ) => {
      state.draggedNodeType = action.payload.nodeType;
      state.draggedNodeData = action.payload.data;
      userInteractionSlice.caseReducers.recordAction(state, {
        payload: {
          type: "block_drag",
          data: { nodeType: action.payload.nodeType, started: true },
        },
        type: "userInteraction/recordAction",
      });
    },

    endNodeDrag: (state) => {
      state.draggedNodeType = null;
      state.draggedNodeData = null;
    },

    setHoveredNode: (state, action: PayloadAction<string | null>) => {
      state.hoveredNodeId = action.payload;
    },

    // User Preferences
    updatePreferences: (
      state,
      action: PayloadAction<Partial<UserInteractionState["preferences"]>>
    ) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    // Undo/Redo System
    addToUndoStack: (state, action: PayloadAction<UserAction>) => {
      state.undoStack.push(action.payload);
      state.redoStack = []; // Clear redo stack when new action is performed

      // Keep only last 50 undo actions
      if (state.undoStack.length > 50) {
        state.undoStack = state.undoStack.slice(-50);
      }
    },

    undo: (state) => {
      const lastAction = state.undoStack.pop();
      if (lastAction) {
        state.redoStack.push(lastAction);
      }
    },

    redo: (state) => {
      const lastUndone = state.redoStack.pop();
      if (lastUndone) {
        state.undoStack.push(lastUndone);
      }
    },

    // Performance Tracking
    recordPerformanceMetric: (
      state,
      action: PayloadAction<{
        type: "render" | "action" | "memory";
        value: number;
      }>
    ) => {
      const { type, value } = action.payload;

      switch (type) {
        case "render":
          state.performance.renderTime.push(value);
          if (state.performance.renderTime.length > 100) {
            state.performance.renderTime =
              state.performance.renderTime.slice(-100);
          }
          break;
        case "action":
          state.performance.actionLatency.push(value);
          if (state.performance.actionLatency.length > 100) {
            state.performance.actionLatency =
              state.performance.actionLatency.slice(-100);
          }
          break;
        case "memory":
          state.performance.memoryUsage.push(value);
          if (state.performance.memoryUsage.length > 100) {
            state.performance.memoryUsage =
              state.performance.memoryUsage.slice(-100);
          }
          break;
      }
    },

    // Session Management
    incrementWorkflowsCreated: (state) => {
      state.session.workflowsCreated += 1;
    },

    resetSession: (state) => {
      state.session = {
        startTime: Date.now(),
        lastActivity: Date.now(),
        totalActions: 0,
        workflowsCreated: 0,
      };
      state.actionHistory = [];
      state.undoStack = [];
      state.redoStack = [];
    },

    // Clear old data for performance
    clearOldData: (state) => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      state.actionHistory = state.actionHistory.filter(
        (action) => action.timestamp > oneHourAgo
      );
    },
  },
});

export const {
  recordAction,
  updateCanvasViewport,
  setCanvasMode,
  setSidebarHoveredCategory,
  setSidebarActiveTab,
  setSidebarSearchQuery,
  setSidebarOpen,
  startNodeDrag,
  endNodeDrag,
  setHoveredNode,
  updatePreferences,
  addToUndoStack,
  undo,
  redo,
  recordPerformanceMetric,
  incrementWorkflowsCreated,
  resetSession,
  clearOldData,
} = userInteractionSlice.actions;

export default userInteractionSlice.reducer;
