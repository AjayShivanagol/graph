import React, { useState, useCallback } from "react";
import { Select, Button, Space, Modal, Form, Input, message } from "antd";
import { PlusOutlined, EditOutlined, DownOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { addPrompt, updatePrompt } from "../../store/slices/promptsSlice";
import PromptEditor from "./PromptEditor";

interface PromptPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  allowCreate?: boolean;
  size?: "small" | "middle" | "large";
  createMode?: "inline" | "modal";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  searchValue?: string;
  createLabelFormat?: (search: string) => string;
  bordered?: boolean;
}

// Reusable prompt selector with modal-based creation and editing
export default function PromptPicker({
  value,
  onChange,
  placeholder = "Select prompt",
  style,
  allowCreate = true,
  size = "middle",
  createMode = "modal",
  open,
  onOpenChange,
  searchValue,
  createLabelFormat,
  bordered = true,
}: PromptPickerProps) {
  const dispatch = useAppDispatch();
  const prompts = useAppSelector((state) => state.prompts.prompts);

  const [promptEditorOpen, setPromptEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  const handleCreate = useCallback(
    (search: string) => {
      if (createMode === "modal") {
        openPromptEditor();
      } else {
        // Handle inline creation
        const newPromptName = search.trim();
        if (newPromptName) {
          dispatch(
            addPrompt({
              name: newPromptName,
              content: "{{ to add variables }}",
              type: "text",
              settings: {
                model: "claude-4-sonnet",
                temperature: 0.3,
                maxTokens: 5000,
              },
            })
          );
          onChange?.(newPromptName);
        }
      }
    },
    [createMode, dispatch, onChange]
  );

  const openPromptEditor = (prompt?: any) => {
    setEditingPrompt(prompt || null);
    setPromptEditorOpen(true);
    // Close the dropdown only, keep popover open
    onOpenChange?.(false);
  };

  const handlePromptSave = (promptName: string) => {
    onChange?.(promptName);
  };

  const handleEdit = (promptId: string) => {
    const prompt = prompts.find((p) => p.id === promptId);
    if (prompt) {
      openPromptEditor(prompt);
    }
  };

  const options = (prompts || []).map((prompt) => ({
    value: prompt.name,
    label: prompt.name, // Use simple label for Select display
    key: prompt.id,
    option: (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>{prompt.name}</div>
          {prompt.description && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
              {prompt.description}
            </div>
          )}
        </div>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(prompt.id);
          }}
          style={{ marginLeft: 8, flexShrink: 0 }}
        />
      </div>
    ),
  }));

  const effectiveSearch = searchValue?.trim() || "";
  const hasPrompts = prompts && prompts.length > 0;

  return (
    <>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={style}
        size={size}
        variant={bordered ? "outlined" : "borderless"}
        open={open}
        onOpenChange={onOpenChange}
        showSearch
        allowClear
        suffixIcon={
          <span style={{ color: "#1677ff" }}>
            <DownOutlined />
          </span>
        }
        filterOption={(input, option) =>
          (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
        }
        searchValue={searchValue}
        getPopupContainer={(triggerNode) =>
          triggerNode.parentElement || document.body
        }
        styles={{
          popup: {
            root: { zIndex: 10001 },
          },
        }}
        optionRender={(option) => {
          const optionData = options.find((opt) => opt.value === option.value);
          return optionData?.option || option.label;
        }}
        notFoundContent={
          <div style={{ padding: "12px", textAlign: "center" }}>
            <div
              style={{ marginBottom: "8px", color: "#999", fontSize: "14px" }}
            >
              {hasPrompts ? "No prompts found" : "No prompts available"}
            </div>
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={() => openPromptEditor()}
              size="small"
              style={{ color: "#1677ff" }}
            >
              Create prompt
            </Button>
          </div>
        }
        popupRender={(menu) => (
          <div>
            {menu}
            {allowCreate && (
              <>
                <div
                  style={{ padding: "2px 0", borderTop: "1px solid #f0f0f0" }}
                />
                <div style={{ padding: "4px 8px" }}>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => openPromptEditor()}
                    size="small"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      color: "#1677ff",
                      fontWeight: 500,
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    Create prompt
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        options={options}
      />

      <PromptEditor
        visible={promptEditorOpen}
        onClose={() => {
          setPromptEditorOpen(false);
          setEditingPrompt(null);
        }}
        editingPrompt={editingPrompt}
        onSave={handlePromptSave}
      />
    </>
  );
}
