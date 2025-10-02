"use client";

import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { InlineEdit } from "~/components/inline-edit";
import { toast } from "sonner";

interface WorkflowTableProps {
  nodes: Array<{
    id: string;
    type: string;
    data: { name: string; status: string };
  }>;
  onNodeUpdate: (id: string, data: any) => void;
  onNodeSelect: (node: any) => void;
  onNodeDelete: (id: string) => void;
}

export default function WorkflowTable({
  nodes,
  onNodeUpdate,
  onNodeSelect,
  onNodeDelete,
}: WorkflowTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      {
        accessorKey: "type",
        header: ({ column }: { column: any }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent"
            >
              Type
              <SyncOutlined style={{ fontSize: 16 }} />
            </Button>
          );
        },
        cell: ({ row }: { row: any }) => {
          const type = row.getValue("type");
          return (
            <Badge
              variant="outline"
              className={
                type === "task"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : type === "condition"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-yellow-200 bg-yellow-50 text-yellow-700"
              }
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "name",
        header: ({ column }: { column: any }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent"
            >
              Name
              <SyncOutlined style={{ fontSize: 16 }} />
            </Button>
          );
        },
        cell: ({ row }: { row: any }) => {
          const nodeId = row.original.id;
          const name = row.getValue("name");
          return (
            <InlineEdit
              value={name}
              onSave={(value) => {
                onNodeUpdate(nodeId, { ...row.original.data, name: value });
                toast.info("Node name has been updated");
              }}
            />
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }: { column: any }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent"
            >
              Status
              <SyncOutlined style={{ fontSize: 16 }} />
            </Button>
          );
        },
        cell: ({ row }: { row: any }) => {
          const nodeId = row.original.id;
          const type = row.getValue("type");
          const status = row.getValue("status");

          if (type !== "task") return null;

          const statusColors = {
            pending: "bg-yellow-500",
            inProgress: "bg-blue-500",
            completed: "bg-green-500",
            cancelled: "bg-red-500",
          };

          return (
            <Select
              value={status}
              onValueChange={(value) => {
                onNodeUpdate(nodeId, { ...row.original.data, status: value });
              }}
            >
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue>
                  {status && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          statusColors[status as keyof typeof statusColors] ||
                          "bg-gray-500"
                        }`}
                      />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }: { row: any }) => {
          const node = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNodeSelect(node)}
                className="h-8 w-8"
              >
                <EditOutlined style={{ fontSize: 16 }} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onNodeDelete(node.id);
                  toast.info("Node has been removed from the workflow");
                }}
                className="h-8 w-8 text-destructive"
              >
                <DeleteOutlined style={{ fontSize: 16 }} />
              </Button>
            </div>
          );
        },
      },
    ],
    [onNodeUpdate, onNodeSelect, onNodeDelete]
  );

  const data = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: node.type,
        name: node.data.name,
        status: node.data.status,
        data: node.data,
      })),
    [nodes]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchOutlined style={{ fontSize: 16 }} />
          <Input
            placeholder="Search nodes..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-[250px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No nodes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
