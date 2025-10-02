"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
}

export function InlineEdit({ value, onSave }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== "") {
      onSave(editValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 py-1"
        />
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="h-6 w-6"
          >
            <CheckOutlined style={{ fontSize: 16 }} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-6 w-6"
          >
            <CloseOutlined style={{ fontSize: 16 }} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:underline"
      onClick={() => setIsEditing(true)}
    >
      {value}
    </div>
  );
}
