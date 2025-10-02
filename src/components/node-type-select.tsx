"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  CheckSquareOutlined,
  ForkOutlined,
  BellOutlined,
  CloseOutlined,
  Calendar,
  FileTextOutlined,
  DatabaseOutlined,
  MailOutlined,
} from "@ant-design/icons";

interface NodeTypeSelectProps {
  onSelect: (type: string) => void;
  onCancel: () => void;
}

export function NodeTypeSelect({ onSelect, onCancel }: NodeTypeSelectProps) {
  const nodeTypes = [
    {
      type: "task",
      title: "Task",
      description: "A task to be completed by an assignee",
      icon: <CheckSquareOutlined style={{ fontSize: 16 }} />,
      color: "bg-rose-50 border-rose-200 text-rose-700",
    },
    {
      type: "condition",
      title: "Condition",
      description: "A conditional branch in the workflow",
      icon: <ForkOutlined style={{ fontSize: 16 }} />,
      color: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      type: "notification",
      title: "Notification",
      description: "Send a notification to recipients",
      icon: <BellOutlined style={{ fontSize: 16 }} />,
      color: "bg-amber-50 border-amber-200 text-amber-700",
    },
    {
      type: "document",
      title: "Document",
      description: "Generate or process documents",
      icon: <FileTextOutlined style={{ fontSize: 16 }} />,
      color: "bg-purple-50 border-purple-200 text-purple-700",
    },
    {
      type: "database",
      title: "Database",
      description: "Query or update database records",
      icon: <DatabaseOutlined style={{ fontSize: 16 }} />,
      color: "bg-slate-50 border-slate-200 text-slate-700",
    },
    {
      type: "email",
      title: "Email",
      description: "Send emails to recipients",
      icon: <MailOutlined style={{ fontSize: 16 }} />,
      color: "bg-cyan-50 border-cyan-200 text-cyan-700",
    },
  ];

  return (
    <Card className="w-[350px] shadow-lg border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Add Node</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-6 w-6"
          >
            <CloseOutlined style={{ fontSize: 16 }} />
          </Button>
        </div>
        <CardDescription>
          Select a node type to add to your workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
        {nodeTypes.map((nodeType) => (
          <Button
            key={nodeType.type}
            variant="outline"
            className={`justify-start h-auto py-3 px-4 hover:${nodeType.color} transition-colors border`}
            onClick={() => onSelect(nodeType.type)}
          >
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 p-2 rounded-md ${nodeType.color}`}>
                {nodeType.icon}
              </div>
              <div className="text-left">
                <div className="font-medium">{nodeType.title}</div>
                <div className="text-xs text-muted-foreground">
                  {nodeType.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
