import { useCallback, useRef } from "react";
import { ReactFlowProvider } from "reactflow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import WorkflowCanvas from "~/components/workflow-canvas";
import NodeConfigPanel from "~/components/node-config-panel";
import WorkflowTable from "~/components/workflow-table";
import { Button } from "~/components/ui/button";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "~/store/hooks";
import {
  setNodes,
  setEdges,
  setSelectedNode,
  setConfigPanelOpen,
} from "~/store/slices/workflowSlice";
import { showToast } from "~/store/slices/uiSlice";
import { exportWorkflow, importWorkflow } from "~/lib/utils/workflow-utils";

export default function WorkflowBuilder() {
  const dispatch = useAppDispatch();
  const { nodes, edges, selectedNodeId, isConfigPanelOpen } = useAppSelector(
    (state) => state.workflow
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId) || null
    : null;

  interface Node {
    id: string;
    data: any;
    position: { x: number; y: number };
    type: string;
  }

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      dispatch(setSelectedNode(node.id));
    },
    [dispatch]
  );

  const handlePaneClick = useCallback(() => {
    dispatch(setSelectedNode(null));
  }, [dispatch]);

  interface NodeData {
    [key: string]: any;
  }

  interface NodeUpdateData {
    nodeId: string;
    data: NodeData;
  }

  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    // This will be handled by the node config panel dispatching updateNode action
  }, []);

  const handleExport = useCallback(() => {
    const data = exportWorkflow(nodes, edges);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workflow.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    dispatch(
      showToast({
        message: "Your workflow has been exported as JSON",
        type: "success",
      })
    );
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: any) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const { nodes: importedNodes, edges: importedEdges } = importWorkflow(
            JSON.parse(content)
          );
          dispatch(setNodes(importedNodes));
          dispatch(setEdges(importedEdges));
          dispatch(
            showToast({
              message: "Your workflow has been imported successfully",
              type: "info",
            })
          );
        } catch (error) {
          dispatch(
            showToast({
              message: "Failed to import workflow. Invalid format.",
              type: "error",
            })
          );
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    },
    [dispatch]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      <div
        id="workflow-controls"
        className="border-b p-4 flex justify-between items-center bg-background"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-1 h-9 text-xs"
          >
            <DownloadOutlined style={{ fontSize: 16 }} /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="flex items-center gap-1 h-9 text-xs"
          >
            <UploadOutlined style={{ fontSize: 16 }} /> Import
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      <Tabs
        defaultValue="canvas"
        className="flex-1 flex flex-col"
        id="workflow-tabs"
      >
        <div className="border-b bg-slate-50 dark:bg-slate-900/20">
          <div className="container">
            <TabsList className="mx-0 mt-0 bg-transparent h-12">
              <TabsTrigger
                value="canvas"
                className="data-[state=active]:bg-background rounded-t-lg rounded-b-none border-t border-l border-r data-[state=active]:border-border data-[state=active]:border-b-0 border-transparent data-[state=active]:shadow-none"
              >
                Canvas
              </TabsTrigger>
              <TabsTrigger
                value="table"
                className="data-[state=active]:bg-background rounded-t-lg rounded-b-none border-t border-l border-r data-[state=active]:border-border data-[state=active]:border-b-0 border-transparent data-[state=active]:shadow-none"
              >
                Table
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="canvas" className="flex-1 flex m-0 border-none p-0">
          <ReactFlowProvider>
            <div className="flex-1 relative" id="workflow-canvas">
              <WorkflowCanvas
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
              />
            </div>
          </ReactFlowProvider>
          {selectedNode && (
            <div id="node-config-panel">
              <NodeConfigPanel
                node={selectedNode}
                onUpdate={handleNodeUpdate}
                onClose={() => dispatch(setSelectedNode(null))}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent
          value="table"
          className="flex-1 p-6 overflow-auto m-0 border-none"
        >
          <WorkflowTable
            nodes={nodes as Node[]}
            onNodeUpdate={handleNodeUpdate}
            onNodeSelect={(node) => dispatch(setSelectedNode(node?.id || null))}
            onNodeDelete={(nodeId) => {
              // This will be handled by the table component dispatching deleteNode action
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
