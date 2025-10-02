import { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { ForkOutlined, CodeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { cn } from "~/lib/utils";
import FullScreenCodeEditor from "../common/FullScreenCodeEditor";
import { useAppDispatch } from "../../store/hooks";
import { updateNode } from "../../store/slices/workflowSlice";

function ConditionNode({
  data,
  selected,
  id,
}: {
  data: { name: string; condition: string };
  selected: boolean;
  id: string;
}) {
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const dispatch = useAppDispatch();

  const openCodeEditor = () => {
    setShowCodeEditor(true);
  };

  const handleSaveCode = (code: string) => {
    dispatch(updateNode({
      id,
      data: {
        ...data,
        condition: code
      }
    }));
  };

  return (
    <div
      className={cn(
        "px-4 py-3 shadow-md rounded-md bg-white border-2 w-[250px] transition-all",
        selected ? "border-primary ring-2 ring-primary/20" : "border-blue-200"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-blue-50">
          <ForkOutlined style={{ fontSize: 16 }} />
        </div>
        <div className="font-medium text-sm">{data.name}</div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 text-xs bg-slate-50 p-2 rounded border border-slate-100">
          <code>{data.condition || "Click to add condition"}</code>
        </div>
        <Button 
          type="text" 
          size="small" 
          icon={<CodeOutlined />}
          onClick={openCodeEditor}
          title="Edit JavaScript condition"
        />
      </div>

      <div className="mt-3 flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>True</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>False</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        id="true"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-red-500 border-2 border-white"
        id="false"
        style={{ left: '80%' }}
      />

      <FullScreenCodeEditor
        visible={showCodeEditor}
        onClose={() => setShowCodeEditor(false)}
        onSave={handleSaveCode}
        initialCode={data.condition || "return true;"}
        title="JavaScript Condition Editor"
        language="javascript"
      />
    </div>
  );
}

export default memo(ConditionNode);
