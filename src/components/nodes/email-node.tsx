import { memo } from "react";
import { Handle, Position } from "reactflow";
import { FileTextOutlined, MailOutlined } from "@ant-design/icons";
import { cn } from "~/lib/utils";

function EmailNode({
  data,
  selected,
}: {
  data: { name: string; content: string };
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3 shadow-md rounded-md bg-white border-2 w-[250px] transition-all",
        selected
          ? "bg-cyan-50 border-cyan-200 text-cyan-700"
          : "border-cyan-200"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-blue-50">
          <MailOutlined style={{ fontSize: 16 }} />
        </div>
        <div className="font-medium text-sm">{data.name}</div>
      </div>

      {data.content && (
        <div className="mt-3 text-xs bg-slate-50 p-2 rounded border border-slate-100">
          <code>{data.content}</code>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(EmailNode);
