import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./nodes/nodes.css";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Controls,
  Background,
  Connection,
  NodeTypes,
  BackgroundVariant,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  setNodes,
  setEdges,
  addNode,
  addEdge as addEdgeAction,
  setSelectedNode,
  deleteNode,
  deleteEdge,
  updateNode,
  updateEdge,
  onNodesChange as onNodesChangeAction,
  onEdgesChange as onEdgesChangeAction,
} from "../../store/slices/workflowSlice";
import type { WorkflowNode } from "../../store/slices/workflowSlice";
import { Menu, MenuProps } from "antd";
import EdgeColorPicker from "../edge/EdgeColorPicker";
import EdgeCurveOptions from "../edge/EdgeCurveOptions";
import EdgeLabelEditor from "../edge/EdgeLabelEditor";
import CustomEdge from "../edge/CustomEdge";
import "../edge/edge-styles.scss";

// Import all node components
import StartNode from "./nodes/StartNode";
import MessageNode from "./nodes/MessageNode";
import ConditionNode from "./nodes/ConditionNode";
import ActionNode from "./nodes/ActionNode";
import DatabaseNode from "./nodes/DatabaseNode";
import KbSearchNode from "./nodes/KbSearchNode";
import EmailNode from "./nodes/EmailNode";
import DocumentNode from "./nodes/DocumentNode";
import EndNode from "./nodes/EndNode";
import ButtonsNode from "./nodes/ButtonsNode";
import ChoiceNode from "./nodes/ChoiceNode";
import CaptureNode from "./nodes/CaptureNode";
import PromptNode from "./nodes/PromptNode";
import CardNode from "./nodes/CardNode";
import SetNode from "./nodes/SetNode";
import ApiNode from "./nodes/ApiNode";
import FunctionNode from "./nodes/FunctionNode";

// Define node types
const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  condition: ConditionNode,
  action: ActionNode,
  database: DatabaseNode,
  "kb-search": KbSearchNode,
  email: EmailNode,
  document: DocumentNode,
  end: EndNode,
  buttons: ButtonsNode,
  choice: ChoiceNode,
  capture: CaptureNode,
  prompt: PromptNode,
  card: CardNode,
  image: CardNode, // Image nodes use Card component
  carousel: CardNode, // Carousel nodes use Card component
  set: SetNode,
  api: ApiNode,
  function: FunctionNode,
};

const edgeTypes = {
  default: CustomEdge,
  custom: CustomEdge,
};

export default function Canvas() {
  const dispatch = useAppDispatch();
  const {
    nodes: reduxNodes,
    edges: reduxEdges,
    selectedNodeId,
  } = useAppSelector((state) => state.workflow);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  type NodeData = WorkflowNode["data"];
  const instanceRef = useRef<ReactFlowInstance<NodeData, Edge> | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "node" | "edge";
    id: string;
  } | null>(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCurveOptions, setShowCurveOptions] = useState(false);
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [edgeLabel, setEdgeLabel] = useState("");

  const onNodesChange = (changes: NodeChange[]) =>
    dispatch(onNodesChangeAction(changes));
  const onEdgesChange = (changes: EdgeChange[]) =>
    dispatch(onEdgesChangeAction(changes));

  const handleConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
      };

      dispatch(addEdgeAction(newEdge));
    },
    [dispatch]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      dispatch(setSelectedNode(node.id));
    },
    [dispatch]
  );

  const handlePaneClick = useCallback(() => {
    dispatch(setSelectedNode(null));
  }, [dispatch]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const blockName = event.dataTransfer.getData("block-name");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const client = { x: event.clientX, y: event.clientY };
      const rf = instanceRef.current;
      const projected = rf?.screenToFlowPosition(client) || { x: 0, y: 0 };

      const uniqueId = () => Math.random().toString(36).slice(2, 10);
      const createButton = (label: string) => ({
        id: `btn-${uniqueId()}`,
        label,
        value: "",
        actions: [],
      });
      const createCard = (index: number) => ({
        id: `card-${uniqueId()}`,
        title: `Card ${index + 1}`,
        description: "Card description",
        imageSourceType: "upload" as const,
        imageUrl: "",
        imageData: "",
        imageFileName: "",
        buttons: [createButton("Select")],
      });
      const createChoice = (label: string) => ({
        id: `choice-${uniqueId()}`,
        label,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: projected,
        data: {
          label: blockName || type,
          // Default data based on block type
          ...(type === "message" && { text: "Hello! How can I help you?" }),
          ...(type === "buttons" && { options: ["Option 1", "Option 2"] }),
          ...(type === "choice" && {
            choices: [createChoice("Choice A"), createChoice("Choice B")],
          }),
          ...(type === "capture" && {
            captureMode: "entities",
            entities: [],
            variable: "",
            listenForOtherTriggers: false,
            noReply: { enabled: false, timeout: 10, prompt: "" },
            autoReprompt: {
              enabled: false,
              temperature: 0.7,
              maxTokens: 256,
              systemPrompt: "",
            },
            rules: [],
            exitScenarios: [],
            exitPathEnabled: false,
          }),
          ...(type === "condition" && {
            condition: 'variable == "value"',
            elsePath: false,
          }),
          ...(type === "set" && {
            variable: "my_variable",
            value: "default_value",
          }),
          ...(type === "api" && { url: "", method: "GET" }),
          ...(type === "prompt" && { suggestions: ["Yes", "No", "Maybe"] }),
          ...(type === "card" && {
            cardType: "card",
            title: "Card Title",
            description: "Card description",
            imageSourceType: "upload" as const,
            imageUrl: "",
            imageData: "",
            imageFileName: "",
            url: "",
            buttons: [createButton("Primary"), createButton("Secondary")],
          }),
          ...(type === "carousel" && {
            cardType: "carousel",
            cards: [createCard(0), createCard(1)],
          }),
          ...(type === "image" && {
            imageSourceType: "upload",
            imageUrl: "",
            imageData: "",
            imageFileName: "",
            url: "",
            alt: "Image description",
          }),
        },
      };

      dispatch(addNode(newNode));
    },
    [dispatch]
  );

  const handleNodeDragStart = useCallback(
    (_: React.MouseEvent, _node: Node) => {
      // Do not change selection on drag start to avoid opening properties while dragging
      // Intentionally left blank
    },
    []
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      // Show context menu without changing selection to avoid opening properties
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        id: node.id,
      });
    },
    [dispatch]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "edge",
        id: edge.id,
      });
      // Get current edge label if exists
      const currentEdge = reduxEdges.find((ed) => ed.id === edge.id);
      setEdgeLabel(String(currentEdge?.label || ""));
    },
    [reduxEdges]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setShowColorPicker(false);
    setShowCurveOptions(false);
    setShowLabelEditor(false);
  }, []);

  // Edge handlers
  const handleEdgeColorChange = useCallback(
    (color: string) => {
      if (!contextMenu || contextMenu.type !== "edge") return;

      // Update in Redux
      dispatch(
        updateEdge({
          id: contextMenu.id,
          updates: { style: { stroke: color, strokeWidth: 2 } },
        })
      );
      setShowColorPicker(false);
    },
    [contextMenu, dispatch]
  );

  const handleEdgeCurveChange = useCallback(
    (curveType: string) => {
      if (!contextMenu || contextMenu.type !== "edge") return;

      let edgeType: string;
      let edgePathOptions: any = {};

      switch (curveType) {
        case "straight":
          edgeType = "straight";
          break;
        case "smoothstep":
        case "smooth":
          edgeType = "smoothstep";
          break;
        case "step":
          edgeType = "step";
          break;
        default:
          edgeType = "default";
      }

      // Update in Redux
      dispatch(
        updateEdge({
          id: contextMenu.id,
          updates: { type: edgeType, ...edgePathOptions },
        })
      );

      setShowCurveOptions(false);
      closeContextMenu();
    },
    [contextMenu, dispatch, closeContextMenu]
  );

  const menuItems: MenuProps["items"] = useMemo(() => {
    if (!contextMenu) return [];

    if (contextMenu.type === "node") {
      return [
        {
          key: "rename",
          label: (
            <div className="menu-item">
              <div className="menu-item__icon">
                <img
                  src="/src/components/svg/rename.svg"
                  alt="Rename"
                  width="16"
                  height="16"
                />
              </div>
              <span className="menu-item__label">Rename</span>
            </div>
          ),
          onClick: () => {
            // Mark node for inline editing by updating Redux store
            const targetId = contextMenu.id;

            // First clear editing flag from all nodes
            reduxNodes.forEach((node) => {
              if (node.data.__editingLabel) {
                dispatch(
                  updateNode({
                    id: node.id,
                    data: { ...node.data, __editingLabel: false },
                  })
                );
              }
            });

            // Then set editing flag on target node
            dispatch(
              updateNode({ id: targetId, data: { __editingLabel: true } })
            );
            closeContextMenu();
          },
        },
        {
          key: "duplicate",
          label: (
            <div className="menu-item">
              <div className="menu-item__icon">
                <img
                  src="/src/components/svg/duplicate.svg"
                  alt="Duplicate"
                  width="16"
                  height="16"
                />
              </div>
              <span className="menu-item__label">Duplicate</span>
            </div>
          ),
          onClick: () => {
            const orig = reduxNodes.find((n) => n.id === contextMenu.id);
            if (!orig) return;
            const newId = `${orig.type}-${Date.now()}`;

            // Create a completely independent copy
            const dup = {
              id: newId,
              type: orig.type,
              position: { x: orig.position.x + 48, y: orig.position.y + 48 },
              data: { ...orig.data },
              selected: false,
              dragging: false,
            } as Node;

            // Clear all selections first
            dispatch(setSelectedNode(null));

            // Add the new node
            dispatch(addNode(dup as any));

            // Select only the new node after a brief delay
            setTimeout(() => {
              dispatch(setSelectedNode(newId));
            }, 50);

            closeContextMenu();
          },
        },
        {
          key: "delete",
          label: (
            <div className="menu-item">
              <div className="menu-item__icon">
                <img
                  src="/src/components/svg/delete.svg"
                  alt="Delete"
                  width="16"
                  height="16"
                />
              </div>
              <span className="menu-item__label">Delete</span>
            </div>
          ),
          onClick: () => {
            dispatch(deleteNode(contextMenu.id));
            closeContextMenu();
          },
        },
      ];
    } else if (contextMenu.type === "edge") {
      return [
        {
          key: "color",
          label: (
            <div className="menu-item">
              <div className="menu-item__icon">
                <img
                  src="/src/components/svg/color.svg"
                  alt="Color"
                  width="16"
                  height="16"
                />
              </div>
              <span className="menu-item__label">Color</span>
            </div>
          ),
          onClick: () => {
            setShowColorPicker(true);
          },
        },
        {
          key: "curve",
          label: (
            <div className="menu-item">
              <div className="menu-item__icon">
                <img
                  src="/src/components/svg/curve.svg"
                  alt="Curve"
                  width="16"
                  height="16"
                />
              </div>
              <span className="menu-item__label">Curve</span>
            </div>
          ),
          onClick: () => {
            setShowCurveOptions(true);
          },
        },
        {
          key: "label",
          label: (
            <div className="menu-item">
              <div className="menu-item__icon">
                <img
                  src="/src/components/svg/label.svg"
                  alt="Label"
                  width="16"
                  height="16"
                />
              </div>
              <span className="menu-item__label">Label</span>
            </div>
          ),
          onClick: () => {
            setShowLabelEditor(true);
          },
        },
        {
          key: "delete",
          label: (
            <div className="menu-item">
              <div className="menu-item__icon">
                <img
                  src="/src/components/svg/delete.svg"
                  alt="Delete"
                  width="16"
                  height="16"
                />
              </div>
              <span className="menu-item__label">Delete</span>
            </div>
          ),
          onClick: () => {
            dispatch(deleteEdge(contextMenu.id));
            closeContextMenu();
          },
        },
      ];
    }

    return [];
  }, [contextMenu, reduxNodes, dispatch, closeContextMenu]);

  return (
    <div
      className="vf-canvas"
      ref={reactFlowWrapper}
      onClick={closeContextMenu}
    >
      <ReactFlow
        nodes={reduxNodes}
        edges={reduxEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onNodeDragStart={handleNodeDragStart}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectNodesOnDrag={false}
        onInit={(inst) => {
          instanceRef.current = inst;
        }}
        fitView
        attributionPosition="bottom-left"
        nodeOrigin={[0.5, 0.5]}
        zoomOnDoubleClick={false}
        panOnDrag={true}
        minZoom={0.5}
        maxZoom={2}
      >
        <Controls className="vf-controls" />
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.5 as unknown as number}
          color="#dbe1e8"
        />
      </ReactFlow>
      {contextMenu &&
        !showColorPicker &&
        !showCurveOptions &&
        !showLabelEditor && (
          <div
            className="edge-context-menu"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edge-context-menu__container">
              <Menu items={menuItems} />
            </div>
          </div>
        )}

      {/* Color Picker */}
      {showColorPicker && contextMenu && (
        <div
          className="edge-context-menu__submenu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
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
            left: contextMenu.x,
            top: contextMenu.y,
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
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <EdgeLabelEditor
            currentLabel={edgeLabel}
            onLabelSave={(label) => {
              dispatch(
                updateEdge({
                  id: contextMenu.id,
                  updates: {
                    label,
                    labelStyle: {
                      fill: "#666",
                      fontWeight: 500,
                      fontSize: 12,
                      background: "white",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      border: "1px solid #e0e0e0",
                    },
                  },
                })
              );
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
