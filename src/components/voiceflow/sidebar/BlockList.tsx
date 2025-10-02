import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Block } from "./CategoryList";

interface BlockListProps {
  blocks: Block[];
  searchQuery: string;
  onDragStart: (
    event: React.DragEvent,
    blockType: string,
    blockName: string
  ) => void;
  onAddBlock: (blockType: string, blockName: string) => void;
}

export default function BlockList({
  blocks,
  searchQuery,
  onDragStart,
  onAddBlock,
}: BlockListProps) {
  const filteredBlocks = blocks.filter(
    (block) =>
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white">
      <div className="p-3 space-y-1">
        {filteredBlocks.map((block) => (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => onDragStart(e, block.id, block.name)}
            onClick={() => onAddBlock(block.id, block.name)}
            className="group cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center text-sm">
                {block.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  {block.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {block.description}
                </div>
              </div>
              <PlusOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
        ))}
        {filteredBlocks.length === 0 && searchQuery && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No blocks found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
