import React, { useCallback, useRef, useState, useMemo, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "~/components/ui/button";
import { PlusOutlined } from "@ant-design/icons";
import { NodeTypeSelect } from "~/components/node-type-select";
import TaskNode from "~/components/nodes/task-node";
import ConditionNode from "~/components/nodes/condition-node";
import NotificationNode from "~/components/nodes/notification-node";
import documentNode from "~/components/nodes/document-node";
import EmailNode from "~/components/nodes/email-node";
import databaseNode from "~/components/nodes/database-node";
import KbSearchNode from "~/components/voiceflow/nodes/KbSearchNode";
import { useAppSelector, useAppDispatch } from "~/store/hooks";
import {
  setNodes,
  setEdges,
  addNode,
  deleteNode,
  addEdge as addEdgeAction,
  deleteEdge,
  updateEdge,
  setSelectedNode,
  setConfigPanelOpen,
} from "~/store/slices/workflowSlice";
import { showToast } from "~/store/slices/uiSlice";
import EdgeColorPicker from "./edge/EdgeColorPicker";
import EdgeCurveOptions from "./edge/EdgeCurveOptions";
import EdgeLabelEditor from "./edge/EdgeLabelEditor";
import CustomEdge from "./edge/CustomEdge";
import "./edge/edge-styles.scss";

const nodeTypes = {
  task: TaskNode,
  condition: ConditionNode,
  notification: NotificationNode,
  document: documentNode,
  email: EmailNode,
  database: databaseNode,
  'kb-search': KbSearchNode,
};

const edgeTypes = {
  default: CustomEdge,
  custom: CustomEdge,
};

interface WorkflowCanvasProps {
  onNodeClick: (event: React.MouseEvent, node: any) => void;
  onPaneClick: () => void;
}

export default function WorkflowCanvas({
  onNodeClick,
  onPaneClick,
}: WorkflowCanvasProps) {
  const dispatch = useAppDispatch();
  const { nodes, edges } = useAppSelector((state) => state.workflow);
  const reactFlowInstance = useReactFlow();
  const [isAddingNode, setIsAddingNode] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);

  // Local ReactFlow state
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState(edges);

  // Context menu state: which node/edge and graph-space position
  const [contextMenu, setContextMenu] = useState<{ 
    type: 'node' | 'edge'; 
    id: string;
    position?: { x: number; y: number };
  } | null>(null);
  const [menuGraphPos, setMenuGraphPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeSubMenu, setActiveSubMenu] = useState<'color' | 'curve' | 'label' | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCurveOptions, setShowCurveOptions] = useState(false);
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [labelText, setLabelText] = useState("");
  // Add state for submenu positioning
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  const [edgeLabel, setEdgeLabel] = useState("");

  // Calculate submenu position to avoid screen boundaries
  const calculateSubmenuPosition = useCallback(() => {
    const menuWidth = 140; // Main menu width
    const submenuWidth = 200; // Estimated submenu width
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let x = menuGraphPos.x + menuWidth + 8; // Default: to the right
    let y = menuGraphPos.y;
    
    // Check if submenu would go off the right edge
    if (x + submenuWidth > screenWidth) {
      x = menuGraphPos.x - submenuWidth - 8; // Position to the left
    }
    
    // Check if submenu would go off the bottom
    if (y + 200 > screenHeight) { // Estimated submenu height
      y = screenHeight - 200 - 16; // Position higher
    }
    
    // Ensure minimum padding from screen edges
    x = Math.max(16, Math.min(x, screenWidth - submenuWidth - 16));
    y = Math.max(16, y);
    
    setSubmenuPosition({ x, y });
  }, [menuGraphPos]);

  // Update submenu position when menu position changes
  useEffect(() => {
    if (contextMenu && (showColorPicker || showCurveOptions || showLabelEditor)) {
      calculateSubmenuPosition();
    }
  }, [contextMenu, showColorPicker, showCurveOptions, showLabelEditor, calculateSubmenuPosition]);

  // Sync local state with Redux
  useEffect(() => setLocalNodes(nodes), [nodes]);
  useEffect(() => setLocalEdges(edges), [edges]);

  // Debounced update back to Redux
  useEffect(() => {
    const validNodes = localNodes.filter(node => node.type !== undefined) as any;
    const id = setTimeout(() => dispatch(setNodes(validNodes)), 100);
    return () => clearTimeout(id);
  }, [localNodes, dispatch]);
  useEffect(() => {
    const id = setTimeout(() => dispatch(setEdges(localEdges)), 100);
    return () => clearTimeout(id);
  }, [localEdges, dispatch]);

  /**
   * Compute graph-space menu position:
   *  - For nodes: Find the clicked node's graph coordinates via node.position.
   *  - For edges: Use the click position directly for better positioning near the edge.
   */
  const updateMenuGraphPos = useCallback(() => {
    if (!contextMenu) return;
    
    if (contextMenu.type === 'node') {
      const nodeData = nodes.find((n) => n.id === contextMenu.id);
      const nodeEl = document.querySelector(
        `[data-id="${contextMenu.id}"]`
      ) as HTMLElement | null;

      if (nodeData && nodeEl) {
        const rect = nodeEl.getBoundingClientRect();
        const zoom = reactFlowInstance.getViewport().zoom ?? 1;
        const unscaledWidth = rect.width / zoom;
        const margin = 16 / zoom; // 16 px margin converted to graph units
        setMenuGraphPos({
          x: nodeData.position.x + unscaledWidth + margin,
          y: nodeData.position.y,
        });
      }
    } else if (contextMenu.type === 'edge' && contextMenu.position) {
      // For edges, convert screen coordinates to ReactFlow coordinates
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      if (rect) {
        // Use the stored click position directly as screen coordinates
        setMenuGraphPos({
          x: contextMenu.position.x + 20, // Offset to the right
          y: contextMenu.position.y - 10, // Slight upward offset
        });
      }
    }
  }, [contextMenu, nodes, reactFlowInstance]);  // Recompute when menu opens or nodes move
  useEffect(() => {
    updateMenuGraphPos();
  }, [contextMenu, localNodes, updateMenuGraphPos]);

  // Recompute on pan/zoom (viewport changes)
  const handleMove = useCallback(() => {
    updateMenuGraphPos();
  }, [updateMenuGraphPos]);

  // Right-click handler for nodes
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: any) => {
      e.preventDefault();
      setContextMenu({ type: 'node', id: node.id });
    },
    []
  );

  // Right-click handler for edges
  const onEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: any) => {
      e.preventDefault();
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      if (rect) {
        // Use mouse position directly for better UX
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        setContextMenu({ 
          type: 'edge', 
          id: edge.id, 
          position 
        });
        // Get current edge label if exists
        const currentEdge = localEdges.find(ed => ed.id === edge.id);
        setEdgeLabel(String(currentEdge?.label || ""));
      }
    },
    [localEdges]
  );

  // Close menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setShowColorPicker(false);
    setShowCurveOptions(false);
    setShowLabelEditor(false);
  }, []);

  // Edge color handler
  const handleEdgeColorChange = useCallback((color: string) => {
    if (!contextMenu || contextMenu.type !== 'edge') return;
    
    // Update the edge in local state immediately
    setLocalEdges((edges) => 
      edges.map((edge) => 
        edge.id === contextMenu.id 
          ? { ...edge, style: { ...edge.style, stroke: color, strokeWidth: 2 } }
          : edge
      )
    );
    
    // Update in Redux
    dispatch(updateEdge({
      id: contextMenu.id,
      updates: { style: { stroke: color, strokeWidth: 2 } }
    }));
    
    setShowColorPicker(false);
    closeContextMenu();
  }, [contextMenu, dispatch, setLocalEdges, closeContextMenu]);

  // Edge curve handler
  const handleEdgeCurveChange = useCallback((curveType: string) => {
    if (!contextMenu || contextMenu.type !== 'edge') return;
    
    let edgeType: string;
    
    // Find the current edge to check if it has a label
    const currentEdge = localEdges.find(edge => edge.id === contextMenu.id);
    const hasLabel = currentEdge?.data?.label || currentEdge?.label;
    
    // If edge has a label, keep using custom edge, otherwise use ReactFlow built-in
    switch (curveType) {
      case 'default':
        edgeType = hasLabel ? 'custom' : 'default';
        break;
      case 'straight':
        edgeType = hasLabel ? 'custom' : 'straight';
        break;
      case 'smoothstep':
      case 'smooth':
        edgeType = hasLabel ? 'custom' : 'smoothstep'; 
        break;
      case 'step':
        edgeType = hasLabel ? 'custom' : 'step';
        break;
      default:
        edgeType = hasLabel ? 'custom' : 'default';
    }
    
    // Store the curve preference for custom edges
    const curveData = hasLabel ? { curveType } : {};
    
    // Update the edge in local state immediately
    setLocalEdges((edges) => 
      edges.map((edge) => 
        edge.id === contextMenu.id 
          ? { 
              ...edge, 
              type: edgeType,
              data: { ...edge.data, ...curveData }
            }
          : edge
      )
    );
    
    // Update in Redux
    dispatch(updateEdge({
      id: contextMenu.id,
      updates: { 
        type: edgeType,
        data: { ...currentEdge?.data, ...curveData }
      }
    }));
    
    setShowCurveOptions(false);
    closeContextMenu();
  }, [contextMenu, dispatch, setLocalEdges, localEdges, closeContextMenu]);

  // Edge label handler
  const handleEdgeLabelSave = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'edge') return;
    
    dispatch(updateEdge({
      id: contextMenu.id,
      updates: { 
        label: edgeLabel,
        labelStyle: { 
          fill: '#666', 
          fontWeight: 500, 
          fontSize: 12,
          background: 'white',
          padding: '2px 4px',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }
      }
    }));
    setShowLabelEditor(false);
    closeContextMenu();
  }, [contextMenu, edgeLabel, dispatch, closeContextMenu]);

  // Menu actions
  const handleColorClick = useCallback(() => {
    setShowColorPicker(true);
  }, []);

  const handleCurveClick = useCallback(() => {
    setShowCurveOptions(true);
  }, []);

  const handleLabelClick = useCallback(() => {
    setShowLabelEditor(true);
  }, []);

  const handleDeleteClick = useCallback(() => {
    if (contextMenu && contextMenu.type === 'edge') {
      dispatch(deleteEdge(contextMenu.id));
      closeContextMenu();
    }
  }, [contextMenu, dispatch, closeContextMenu]);

  // Add node handler
  const handleAddNode = useCallback(
    (type: any) => {
      const position = reactFlowInstance.project({
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
      });
      dispatch(
        addNode({
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          position,
          data: getDefaultNodeData(type),
        })
      );
      setIsAddingNode(false);
      dispatch(
        showToast({
          message: `Added a new ${type} node to the workflow`,
          type: "success",
        })
      );
    },
    [reactFlowInstance, dispatch]
  );

  // Keyboard delete handler
  const handleDeleteElements = useCallback(
    (event: any) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);
        selectedNodes.forEach((node) => dispatch(deleteNode(node.id)));
        selectedEdges.forEach((edge) => dispatch(deleteEdge(edge.id)));
        if (selectedNodes.length || selectedEdges.length) {
          dispatch(
            showToast({
              message: `Deleted ${selectedNodes.length} nodes and ${selectedEdges.length} edges`,
              type: "success",
            })
          );
        }
      }
    },
    [nodes, edges, dispatch]
  );

  // Attach keyboard listener
  const onInit = useCallback(() => {
    window.addEventListener("keydown", handleDeleteElements);
    return () => window.removeEventListener("keydown", handleDeleteElements);
  }, [handleDeleteElements]);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper} onClick={closeContextMenu}>
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => {
          const newEdge = {
            ...params,
            id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "default",
            animated: false,
          };
          dispatch(addEdgeAction(newEdge));
          setLocalEdges((eds) => addEdge(newEdge, eds));
        }}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={(e) => {
          onPaneClick();
          if (contextMenu) closeContextMenu();
        }}
        onMove={handleMove}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        onInit={onInit}
        deleteKeyCode={null}
        className="bg-slate-50 dark:bg-slate-900/20"
      >
        <Background gap={12} size={1} color="white" />
        <Controls className="bg-white border rounded-md shadow-sm" />
        <MiniMap
          id="workflow-minimap"
          className="bg-background border rounded-md shadow-sm"
          nodeStrokeColor={(n) => {
            if (n.type === "task") return "#ff0072";
            if (n.type === "condition") return "#0041d0";
            if (n.type === "notification") return "#1a192b";
            return "#eee";
          }}
          nodeColor={(n) => {
            if (n.type === "task") return "#ff0072";
            if (n.type === "condition") return "#0041d0";
            if (n.type === "notification") return "#1a192b";
            return "#fff";
          }}
        />
        <Panel position="top-left">
          {isAddingNode ? (
            <div id="node-types">
              <NodeTypeSelect onSelect={handleAddNode} onCancel={() => setIsAddingNode(false)} />
            </div>
          ) : (
            <Button
              id="add-node-button"
              onClick={() => setIsAddingNode(true)}
              className="flex items-center gap-2 shadow-md bg-black hover:bg-black/90 text-white"
            >
              <PlusOutlined style={{ fontSize: 16 }} /> Add Node
            </Button>
          )}
        </Panel>
      </ReactFlow>

      {/* Context menu positioned in viewport */}
      {contextMenu && !showColorPicker && !showCurveOptions && !showLabelEditor && (
        <div
          className="edge-context-menu"
          style={{
            left: `${menuGraphPos.x}px`,
            top: `${menuGraphPos.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'edge' ? (
            <div className="edge-curve-options" style={{ backgroundColor: '#ff0000', border: '3px solid #00ff00' }}>
              <div className="edge-curve-options__list">
                <button
                  className="edge-curve-options__option"
                  onClick={handleColorClick}
                >
                  <div className="edge-curve-options__option-icon">
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #3b82f6 0%, #10b981 25%, #f59e0b 50%, #ef4444 75%, #8b5cf6 100%)',
                      border: '1px solid #d1d5db'
                    }}></div>
                  </div>
                  <span className="edge-curve-options__option-label">Color</span>
                </button>
                <button
                  className="edge-curve-options__option"
                  onClick={handleCurveClick}
                >
                  <div className="edge-curve-options__option-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path 
                        d="M2 8C4 4 12 12 14 8" 
                        stroke="#6b7280" 
                        strokeWidth="1.5" 
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <span className="edge-curve-options__option-label">Curve</span>
                </button>
                <button
                  className="edge-curve-options__option"
                  onClick={handleLabelClick}
                >
                  <div className="edge-curve-options__option-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="6" width="14" height="4" rx="2" fill="none" stroke="#6b7280" strokeWidth="1.5"/>
                      <text x="8" y="9" fontSize="7" fill="#6b7280" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="600">A</text>
                    </svg>
                  </div>
                  <span className="edge-curve-options__option-label">Label</span>
                </button>
                <button
                  className="edge-curve-options__option"
                  onClick={handleDeleteClick}
                >
                  <div className="edge-curve-options__option-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 2h4c.55 0 1 .45 1 1v1h2c.55 0 1 .45 1 1s-.45 1-1 1H3c-.55 0-1-.45-1-1s.45-1 1-1h2V3c0-.55.45-1 1-1zM4 7h8l-.5 7c-.05.55-.5 1-1.05 1H5.55c-.55 0-1-.45-1.05-1L4 7z" fill="#ef4444"/>
                    </svg>
                  </div>
                  <span className="edge-curve-options__option-label">Delete</span>
                </button>
              </div>
            </div>
          ) : contextMenu.type === 'node' ? (
            <div className="edge-context-menu__container">
              {/* Node context menu - keep original implementation */}
              <div className="edge-context-menu-options">
                <div className="edge-context-menu-options__list">
                  <button
                    className="edge-context-menu-options__option"
                    onClick={() => {
                      dispatch(setSelectedNode(contextMenu.id));
                      dispatch(setConfigPanelOpen(true));
                      closeContextMenu();
                    }}
                  >
                    <span className="edge-context-menu-options__option-label">Rename</span>
                  </button>
                  <button
                    className="edge-context-menu-options__option"
                    onClick={() => {
                      const original = nodes.find((n) => n.id === contextMenu.id);
                      if (!original) return;
                      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                      dispatch(
                        addNode({
                          ...original,
                          id: newId,
                          position: {
                            x: (original.position?.x ?? 0) + 20,
                            y: (original.position?.y ?? 0) + 20,
                          },
                          selected: false,
                        })
                      );
                      closeContextMenu();
                    }}
                  >
                    <span className="edge-context-menu-options__option-label">Duplicate</span>
                  </button>
                  <button
                    className="edge-context-menu-options__option"
                    onClick={() => {
                      dispatch(deleteNode(contextMenu.id));
                      closeContextMenu();
                    }}
                  >
                    <span className="edge-context-menu-options__option-label">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Color Picker */}
      {showColorPicker && contextMenu && (
        <div
          className="edge-context-menu__submenu"
          style={{
            left: `${submenuPosition.x}px`,
            top: `${submenuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <EdgeColorPicker 
            onColorSelect={handleEdgeColorChange}
            onClose={() => setShowColorPicker(false)}
          />
        </div>
      )}

      {/* Curve Options */}
      {showCurveOptions && contextMenu && (
        <div
          className="edge-context-menu__submenu"
          style={{
            left: `${submenuPosition.x}px`,
            top: `${submenuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <EdgeCurveOptions 
            onCurveSelect={handleEdgeCurveChange}
            onClose={() => setShowCurveOptions(false)}
          />
        </div>
      )}

      {/* Label Editor */}
      {showLabelEditor && contextMenu && (
        <div
          className="edge-context-menu__submenu"
          style={{
            left: `${submenuPosition.x}px`,
            top: `${submenuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <EdgeLabelEditor 
            currentLabel={edgeLabel}
            onLabelSave={(label) => {
              dispatch(updateEdge({
                id: contextMenu.id,
                updates: { 
                  label,
                  labelStyle: { 
                    fill: '#666', 
                    fontWeight: 500, 
                    fontSize: 12,
                    background: 'white',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }
                }
              }));
              setShowLabelEditor(false);
              closeContextMenu();
            }}
            onClose={() => setShowLabelEditor(false)}
          />
        </div>
      )}
    </div>
  );
}

function getDefaultNodeData(type: any) {
  switch (type) {
    case "task":
      return {
        label: "New Task",
        name: "New Task",
        assignee: "",
        dueDate: "",
        description: "",
        status: "pending",
      };
    case "condition":
      return {
        label: "New Condition",
        name: "New Condition",
        condition: "",
        description: "",
      };
    case "notification":
      return {
        label: "New Notification",
        name: "New Notification",
        recipients: "",
        message: "",
        channel: "email",
      };
    case "document":
      return {
        label: "New Document",
        name: "New Document",
        content: "",
        author: "",
        lastModified: new Date().toISOString(),
      };
    case "database":
      return {
        label: "New Database",
        name: "New Database",
        host: "",
        port: 5432,
        username: "",
        password: "",
      };
    case "email":
      return {
        label: "New Email",
        name: "New Email",
        to: "",
        subject: "",
        body: "",
        sent: false,
      };
    default:
      return { 
        label: "New Node",
        name: "New Node" 
      };
  }
}
