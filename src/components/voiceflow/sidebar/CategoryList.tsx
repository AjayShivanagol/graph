import React from "react";
import {
  MessageOutlined,
  AudioOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  RobotOutlined,
} from "@ant-design/icons";

export interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  blocks: Block[];
}

export interface Block {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export default function CategoryList({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryListProps) {
  return (
    <div className="w-16 border-r border-gray-200 flex flex-col bg-gray-50">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`flex flex-col items-center gap-1 p-3 text-xs transition-colors border-r-2 ${
              selectedCategory === category.id
                ? "bg-white text-blue-600 border-blue-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium text-[10px] leading-tight text-center">
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
