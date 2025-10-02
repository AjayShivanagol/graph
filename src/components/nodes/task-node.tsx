import { memo } from "react";
import { Handle, Position } from "reactflow";
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface TaskNodeData {
  name: string;
  assignee?: string;
  dueDate?: string;
  status?: "pending" | "inProgress" | "completed" | "cancelled";
}

interface TaskNodeProps {
  data: TaskNodeData;
  selected: boolean;
}

function TaskNode({ data, selected }: TaskNodeProps) {
  const statusColors = {
    pending: "bg-yellow-500",
    inProgress: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "px-4 py-3 shadow-md rounded-md bg-white border-2 w-[250px] transition-all",
        selected ? "border-primary ring-2 ring-primary/20" : "border-rose-200"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-rose-50">
          <CheckSquareOutlined style={{ fontSize: 16 }} />
        </div>
        <div className="font-medium text-sm">{data.name}</div>
      </div>

      <div className="mt-3 space-y-2">
        {data.assignee && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <UserOutlined style={{ fontSize: 16 }} />
            <span>{data.assignee}</span>
          </div>
        )}

        {data.dueDate && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ClockCircleOutlined style={{ fontSize: 16 }} />
            <span>{data.dueDate}</span>
          </div>
        )}
      </div>

      {data.status && (
        <div className="mt-3">
          <Badge
            className={cn(
              "text-white text-xs",
              statusColors[data.status] || "bg-gray-500"
            )}
          >
            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </Badge>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-rose-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-rose-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(TaskNode);
