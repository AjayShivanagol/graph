import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Input,
  Button,
  Form,
  Select,
  Slider,
  Typography,
  Space,
  Divider,
  message,
  Popover,
} from "antd";
import {
  CloseOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  CrownOutlined,
  StarOutlined,
  BulbOutlined,
  SearchOutlined,
  GlobalOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  MessageOutlined,
  HolderOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { addPrompt, updatePrompt } from "../../store/slices/promptsSlice";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PromptEditorProps {
  visible: boolean;
  onClose: () => void;
  editingPrompt?: any;
  onSave?: (promptName: string) => void;
}

interface PromptSettings {
  model: string;
  temperature: number;
  maxTokens: number;
}

const AI_MODELS = [
  {
    value: "claude-4-sonnet",
    label: "Claude 4 - Sonnet",
    icon: <CrownOutlined style={{ color: "#ff6b35" }} />,
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    icon: <ThunderboltOutlined style={{ color: "#10b981" }} />,
  },
  {
    value: "gpt-4-turbo",
    label: "GPT-4 Turbo",
    icon: <RocketOutlined style={{ color: "#3b82f6" }} />,
  },
  {
    value: "claude-3-opus",
    label: "Claude 3 - Opus",
    icon: <StarOutlined style={{ color: "#8b5cf6" }} />,
  },
  {
    value: "claude-3-sonnet",
    label: "Claude 3 - Sonnet",
    icon: <StarOutlined style={{ color: "#06b6d4" }} />,
  },
];

const STARTER_TEMPLATES = [
  {
    name: "Generate answer",
    icon: <BulbOutlined style={{ color: "#ef4444" }} />,
    prompt:
      "Generate a comprehensive answer based on the given context and question.",
  },
  {
    name: "Optimize query",
    icon: <SearchOutlined style={{ color: "#f59e0b" }} />,
    prompt: "Optimize and improve the search query for better results.",
  },
  {
    name: "Detect language",
    icon: <GlobalOutlined style={{ color: "#3b82f6" }} />,
    prompt: "Detect and identify the language of the given text.",
  },
  {
    name: "Determine sentiment",
    icon: <HeartOutlined style={{ color: "#ec4899" }} />,
    prompt: "Analyze and determine the sentiment of the given text.",
  },
  {
    name: "Clarification check",
    icon: <CheckCircleOutlined style={{ color: "#10b981" }} />,
    prompt:
      "Check if the response needs clarification and suggest improvements.",
  },
];

export default function PromptEditor({
  visible,
  onClose,
  editingPrompt,
  onSave,
}: PromptEditorProps) {
  const dispatch = useAppDispatch();
  const prompts = useAppSelector((state) => state.prompts.prompts);

  const [form] = Form.useForm();
  const [promptName, setPromptName] = useState("Untitled prompt");
  const [promptContent, setPromptContent] = useState("{{ to add variables }}");
  const [settings, setSettings] = useState<PromptSettings>({
    model: "claude-4-sonnet",
    temperature: 0.3,
    maxTokens: 5000,
  });
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addButtonRef, setAddButtonRef] = useState<HTMLElement | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(
    null
  );
  const [autoScrollInterval, setAutoScrollInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [messages, setMessages] = useState([
    { id: 1, type: "system", content: "", collapsed: true, optional: true },
    {
      id: 2,
      type: "user",
      content: "Enter instructions or prompt",
      collapsed: false,
    },
  ]);

  // Ref for the scrollable container
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingPrompt) {
      setPromptName(editingPrompt.name);
      setPromptContent(editingPrompt.content);
      // Load settings if they exist
      if (editingPrompt.settings) {
        setSettings(editingPrompt.settings);
      }
    } else {
      // Reset for new prompt
      setPromptName("Untitled prompt");
      setPromptContent("{{ to add variables }}");
      setSettings({
        model: "claude-4-sonnet",
        temperature: 0.3,
        maxTokens: 5000,
      });
    }
  }, [editingPrompt, visible]);

  // Initialize with basic message structure when creating new prompt
  useEffect(() => {
    if (visible && !editingPrompt) {
      // Only add essential system and user messages - no conversation history by default
      setMessages([
        { id: 1, type: "system", content: "", collapsed: true, optional: true },
        {
          id: 2,
          type: "user",
          content: "Enter instructions or prompt",
          collapsed: false,
        },
      ]);
    }
  }, [visible, editingPrompt]);

  // Cleanup auto-scroll interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollInterval]);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      // Simulate AI call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setOutput(`• Write a prompt in the left column, and run it using ⌘ Enter to see it appear here
• Press the settings button in the top right ot modify the model and parameters
• Use '{{ to add [variables] to your prompt'
• Add message pairs to simulate a conversation`);
      message.success("Prompt executed successfully");
    } catch (error) {
      message.error("Failed to run prompt");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSavePrompt = async () => {
    try {
      const promptData = {
        name: promptName,
        content: promptContent,
        description: "Custom prompt",
        type: "text" as const,
        settings: settings,
      };

      if (editingPrompt) {
        dispatch(
          updatePrompt({
            id: editingPrompt.id,
            updates: promptData,
          })
        );
        message.success("Prompt updated successfully");
      } else {
        dispatch(addPrompt(promptData));
        message.success("Prompt created successfully");
      }

      onSave?.(promptName);
      onClose();
    } catch (error) {
      message.error("Failed to save prompt");
    }
  };

  const handleModelChange = (value: string) => {
    setSettings((prev) => ({ ...prev, model: value }));
  };

  const handleTemperatureChange = (value: number) => {
    setSettings((prev) => ({ ...prev, temperature: value }));
  };

  const handleMaxTokensChange = (value: number) => {
    setSettings((prev) => ({ ...prev, maxTokens: value }));
  };

  const handleAddConversationHistory = () => {
    // Check if conversation history already exists
    const hasConversationHistory = messages.some(
      (msg) => msg.type === "conversation_history"
    );
    if (hasConversationHistory) {
      message.warning("Only one conversation history is allowed");
      setShowAddMenu(false);
      return;
    }

    const newMessage = {
      id: Date.now(),
      type: "conversation_history",
      content: "{ vf_memory }",
      collapsed: false,
    };
    setMessages((prev) => [...prev.slice(0, 1), newMessage, ...prev.slice(1)]);
    setShowAddMenu(false);
  };

  // Helper function to check if conversation history exists
  const hasConversationHistory = () => {
    return messages.some((msg) => msg.type === "conversation_history");
  };

  const handleAddMessagePair = () => {
    const userId = Date.now();
    const agentId = userId + 1;
    const newMessages = [
      {
        id: userId,
        type: "user",
        content: "",
        collapsed: false,
        pairId: `pair-${userId}`,
      },
      {
        id: agentId,
        type: "agent",
        content: "",
        collapsed: false,
        pairId: `pair-${userId}`,
      },
    ];
    setMessages((prev) => [...prev, ...newMessages]);
    setShowAddMenu(false);
  };

  const deleteMessagePair = (pairId: string) => {
    setMessages((prev) =>
      prev.filter(
        (msg) => !(msg as any).pairId || (msg as any).pairId !== pairId
      )
    );
  };

  const deleteMessage = (id: number) => {
    if (id === 1) return; // Cannot delete system message
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const toggleMessageCollapse = (id: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, collapsed: !msg.collapsed } : msg
      )
    );
  };

  const updateMessageContent = (id: number, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content } : msg))
    );
  };

  const handleDragStart = (e: React.DragEvent, msg: any, index: number) => {
    // Only allow conversation history to be dragged
    if (msg.type !== "conversation_history") {
      e.preventDefault();
      return;
    }

    setDraggedItem({ msg, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ""); // Required for Firefox

    // Set up scroll container reference - find the scrollable container
    const container = containerRef.current;
    if (container) {
      setScrollContainer(container);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.msg.type !== "conversation_history") {
      return;
    }

    setDragOverIndex(index);
    e.dataTransfer.dropEffect = "move";

    // Auto-scroll functionality
    if (scrollContainer) {
      const rect = scrollContainer.getBoundingClientRect();
      const scrollThreshold = 80; // Increased threshold
      const scrollSpeed = 8;
      const mouseY = e.clientY;

      // Clear any existing auto-scroll
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        setAutoScrollInterval(null);
      }

      // Check if near top of scroll container
      if (
        mouseY - rect.top < scrollThreshold &&
        scrollContainer.scrollTop > 0
      ) {
        const interval = setInterval(() => {
          if (scrollContainer.scrollTop > 0) {
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop - scrollSpeed
            );
          } else {
            clearInterval(interval);
            setAutoScrollInterval(null);
          }
        }, 16);
        setAutoScrollInterval(interval);
      }
      // Check if near bottom of scroll container
      else if (rect.bottom - mouseY < scrollThreshold) {
        const maxScroll =
          scrollContainer.scrollHeight - scrollContainer.clientHeight;
        if (scrollContainer.scrollTop < maxScroll) {
          const interval = setInterval(() => {
            const currentMax =
              scrollContainer.scrollHeight - scrollContainer.clientHeight;
            if (scrollContainer.scrollTop < currentMax) {
              scrollContainer.scrollTop = Math.min(
                currentMax,
                scrollContainer.scrollTop + scrollSpeed
              );
            } else {
              clearInterval(interval);
              setAutoScrollInterval(null);
            }
          }, 16);
          setAutoScrollInterval(interval);
        }
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if actually leaving the container, not just moving between children
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(-1);
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        setAutoScrollInterval(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear auto-scroll
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }

    if (!draggedItem || draggedItem.msg.type !== "conversation_history") {
      setDraggedItem(null);
      setDragOverIndex(-1);
      return;
    }

    const sourceIndex = draggedItem.index;

    // Don't do anything if dropping on the same position
    if (sourceIndex === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(-1);
      return;
    }

    const newMessages = [...messages];
    const draggedMessage = newMessages.splice(sourceIndex, 1)[0];

    // Adjust drop index if dragging from above
    const adjustedDropIndex =
      sourceIndex < dropIndex ? dropIndex - 1 : dropIndex;

    newMessages.splice(adjustedDropIndex, 0, draggedMessage);

    setMessages(newMessages);
    setDraggedItem(null);
    setDragOverIndex(-1);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(-1);
    setScrollContainer(null);
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  };

  return (
    <>
      <style>{`
        .conversation-history-item:hover .drag-handle {
          opacity: 1 !important;
        }
        .drag-handle:active {
          cursor: grabbing !important;
        }
        .conversation-history-item.dragging {
          opacity: 0.5 !important;
          transform: rotate(2deg) !important;
        }
      `}</style>
      <Modal
        open={visible}
        onCancel={onClose}
        width="90vw"
        style={{
          top: 20,
          paddingBottom: 0,
          maxHeight: "calc(100vh - 40px)",
        }}
        footer={null}
        closable={false}
        className="prompt-editor-modal"
        zIndex={99999}
        styles={{
          body: {
            padding: 0,
            height: "80vh",
            maxHeight: "calc(100vh - 80px)",
            overflow: "hidden",
          },
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              borderBottom: "1px solid #f0f0f0",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Input
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                variant="borderless"
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  padding: 0,
                  width: "auto",
                  minWidth: "200px",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                icon={<span>⚙️</span>}
                onClick={() => setShowSettings(!showSettings)}
                type={showSettings ? "primary" : "default"}
              >
                Model
              </Button>
              <Button icon={<span>🧪</span>} type="default">
                Variables
              </Button>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleRun}
                loading={isRunning}
              >
                Run
              </Button>
            </div>

            <Button
              icon={<CloseOutlined />}
              onClick={onClose}
              type="text"
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 1,
              }}
            />
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            {/* Left Panel - Prompt Input */}
            <div
              style={{
                flex: 1,
                padding: "0",
                borderRight: "1px solid #f0f0f0",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Messages Container */}
              <div
                ref={containerRef}
                data-scroll-container
                style={{
                  flex: 1,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  overflowY: "auto",
                  minHeight: 0,
                }}
              >
                {messages.map((msg, index) => (
                  <div key={msg.id}>
                    {/* Drop zone above each item (for conversation history reordering) */}
                    {draggedItem &&
                      draggedItem.msg.type === "conversation_history" &&
                      draggedItem.index !== index && (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDragOver(e, index);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            handleDragLeave(e);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDrop(e, index);
                          }}
                          style={{
                            height: dragOverIndex === index ? "12px" : "6px",
                            backgroundColor:
                              dragOverIndex === index
                                ? "#e0f2fe"
                                : "transparent",
                            margin: "4px 0",
                            borderRadius: "4px",
                            transition: "all 0.2s ease",
                            border:
                              dragOverIndex === index
                                ? "2px dashed #0ea5e9"
                                : "2px dashed transparent",
                            position: "relative",
                            cursor: "default",
                          }}
                        >
                          {dragOverIndex === index && (
                            <div
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "11px",
                                color: "#0ea5e9",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Drop here
                            </div>
                          )}
                        </div>
                      )}

                    {msg.type === "system" && (
                      <div
                        style={{
                          backgroundColor: "white",
                          border: "1px solid #e8e8e8",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            backgroundColor: "#f8f9fa",
                            borderBottom: msg.collapsed
                              ? "none"
                              : "1px solid #e8e8e8",
                          }}
                          onClick={() => toggleMessageCollapse(msg.id)}
                        >
                          <span style={{ fontWeight: 500, color: "#6b7280" }}>
                            System
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {msg.collapsed && (
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: "#9ca3af",
                                  fontStyle: "italic",
                                }}
                              >
                                {msg.content.trim()
                                  ? msg.content.substring(0, 30) +
                                    (msg.content.length > 30 ? "..." : "")
                                  : "Empty"}
                              </span>
                            )}
                            <span
                              style={{ fontSize: "12px", color: "#9ca3af" }}
                            >
                              {msg.collapsed ? (
                                <UpOutlined />
                              ) : (
                                <DownOutlined />
                              )}
                            </span>
                          </div>
                        </div>
                        {!msg.collapsed && (
                          <div style={{ padding: "16px" }}>
                            <Input.TextArea
                              value={msg.content}
                              onChange={(e) =>
                                updateMessageContent(msg.id, e.target.value)
                              }
                              placeholder="Set a system prompt (optional)"
                              style={{
                                border: "none",
                                boxShadow: "none",
                                padding: 0,
                                resize: "none",
                                fontSize: "14px",
                                lineHeight: "1.5",
                              }}
                              autoSize={{ minRows: 2, maxRows: 8 }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {msg.type === "conversation_history" && (
                      <div
                        style={{
                          backgroundColor: "#f3f4f6",
                          border:
                            dragOverIndex === index
                              ? "2px dashed #3b82f6"
                              : "1px solid #e8e8e8",
                          borderRadius: "8px",
                          padding: "12px 16px",
                          position: "relative",
                          cursor: "default",
                          transition: "all 0.2s ease",
                          opacity: draggedItem?.msg.id === msg.id ? 0.5 : 1,
                          transform:
                            draggedItem?.msg.id === msg.id
                              ? "rotate(2deg)"
                              : "none",
                        }}
                        className="conversation-history-item"
                      >
                        {/* Drag Handle - 6 dots */}
                        <div
                          draggable={true}
                          onDragStart={(e) => {
                            handleDragStart(e, msg, index);
                          }}
                          onDragEnd={handleDragEnd}
                          style={{
                            position: "absolute",
                            left: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            opacity: 0, // Hide by default
                            transition: "opacity 0.2s ease",
                            cursor: "grab",
                            zIndex: 5,
                            padding: "4px",
                            borderRadius: "4px",
                          }}
                          className="drag-handle"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <HolderOutlined
                            style={{
                              color: "#9ca3af",
                              fontSize: "14px",
                            }}
                          />
                        </div>

                        <Button
                          icon={<CloseOutlined />}
                          size="small"
                          type="text"
                          onClick={() => deleteMessage(msg.id)}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            zIndex: 10,
                            color: "#9ca3af",
                            fontSize: "12px",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "8px",
                            gap: "8px",
                            marginLeft: "20px", // Add left margin for drag handle space
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#f59e0b",
                            }}
                          />
                          <span style={{ fontWeight: 500, color: "#6b7280" }}>
                            Conversation history
                          </span>
                        </div>
                        <div
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            fontSize: "13px",
                            color: "#374151",
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #e8e8e8",
                            marginLeft: "20px", // Add left margin for drag handle space
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    )}

                    {(msg.type === "user" || msg.type === "agent") && (
                      <div
                        style={{
                          backgroundColor: "white",
                          border: "1px solid #e8e8e8",
                          borderRadius: "8px",
                          overflow: "hidden",
                          position: "relative",
                          cursor: "default",
                        }}
                      >
                        {(msg as any).pairId && msg.type === "user" && (
                          <Button
                            icon={<CloseOutlined />}
                            size="small"
                            type="text"
                            onClick={() =>
                              deleteMessagePair((msg as any).pairId)
                            }
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              zIndex: 10,
                              color: "#9ca3af",
                              fontSize: "12px",
                            }}
                          />
                        )}
                        <div
                          style={{
                            padding: "12px 16px",
                            backgroundColor:
                              msg.type === "user" ? "#f9fafb" : "#f3f4f6",
                            fontWeight: 500,
                            color: "#374151",
                            textTransform: "capitalize",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor:
                                msg.type === "user" ? "#3b82f6" : "#10b981",
                            }}
                          />
                          {msg.type}
                        </div>
                        <div style={{ padding: "16px" }}>
                          <Input.TextArea
                            value={msg.content}
                            onChange={(e) =>
                              updateMessageContent(msg.id, e.target.value)
                            }
                            placeholder={
                              msg.type === "user"
                                ? "Enter instructions or prompt"
                                : "Enter agent response"
                            }
                            style={{
                              border: "none",
                              boxShadow: "none",
                              padding: 0,
                              resize: "none",
                              fontSize: "14px",
                              lineHeight: "1.5",
                            }}
                            autoSize={{ minRows: 3, maxRows: 12 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Final drop zone at the end */}
                {draggedItem &&
                  draggedItem.msg.type === "conversation_history" && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragOver(e, messages.length);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        handleDragLeave(e);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDrop(e, messages.length);
                      }}
                      style={{
                        height:
                          dragOverIndex === messages.length ? "12px" : "6px",
                        backgroundColor:
                          dragOverIndex === messages.length
                            ? "#e0f2fe"
                            : "transparent",
                        margin: "4px 0",
                        borderRadius: "4px",
                        transition: "all 0.2s ease",
                        border:
                          dragOverIndex === messages.length
                            ? "2px dashed #0ea5e9"
                            : "2px dashed transparent",
                        position: "relative",
                        cursor: "default",
                      }}
                    >
                      {dragOverIndex === messages.length && (
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "11px",
                            color: "#0ea5e9",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Drop at end
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Add Button */}
              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid #f0f0f0",
                  flexShrink: 0,
                  marginTop: "auto",
                }}
              >
                <Popover
                  content={
                    <div style={{ width: 250 }}>
                      <div
                        style={{
                          padding: "12px 16px",
                          cursor: hasConversationHistory()
                            ? "not-allowed"
                            : "pointer",
                          borderRadius: "6px",
                          transition: "background-color 0.2s",
                          opacity: hasConversationHistory() ? 0.5 : 1,
                          backgroundColor: hasConversationHistory()
                            ? "#f5f5f5"
                            : "transparent",
                        }}
                        onClick={
                          hasConversationHistory()
                            ? undefined
                            : handleAddConversationHistory
                        }
                        onMouseEnter={(e) => {
                          if (!hasConversationHistory()) {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!hasConversationHistory()) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <HistoryOutlined
                            style={{
                              marginRight: "8px",
                              color: hasConversationHistory()
                                ? "#d1d5db"
                                : "#6366f1",
                            }}
                          />
                          <span
                            style={{
                              fontWeight: 500,
                              color: hasConversationHistory()
                                ? "#9ca3af"
                                : "#111827",
                            }}
                          >
                            Add conversation history
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: hasConversationHistory()
                              ? "#d1d5db"
                              : "#6b7280",
                            marginLeft: "24px",
                          }}
                        >
                          Inject the conversation history into the prompt using{" "}
                          {"{vf_memory}"}.
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderRadius: "6px",
                          transition: "background-color 0.2s",
                        }}
                        onClick={handleAddMessagePair}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f3f4f6")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <MessageOutlined
                            style={{ marginRight: "8px", color: "#10b981" }}
                          />
                          <span style={{ fontWeight: 500 }}>
                            Add message pair
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginLeft: "24px",
                          }}
                        >
                          Add user and agent messages to simulate a
                          conversation.
                        </div>
                      </div>
                    </div>
                  }
                  trigger="click"
                  open={showAddMenu}
                  onOpenChange={setShowAddMenu}
                  placement="topLeft"
                >
                  <Button
                    type="default"
                    block
                    style={{
                      height: "40px",
                      borderStyle: "dashed",
                      borderColor: "#d1d5db",
                    }}
                  >
                    Add
                  </Button>
                </Popover>
              </div>
            </div>

            {/* Right Panel - Output */}
            <div
              style={{
                flex: 1,
                padding: "24px",
                backgroundColor: "#fafafa",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                Output
              </Title>

              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e8e8e8",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-line",
                }}
              >
                {output ||
                  "Output will appear here after running the prompt..."}
              </div>

              <div style={{ marginTop: "16px" }}>
                <Button type="link" size="small">
                  Learn more
                </Button>
              </div>
            </div>
          </div>

          {/* Starter Templates Section - Bottom */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #f0f0f0",
              backgroundColor: "#fafafa",
              flexShrink: 0,
            }}
          >
            <Text strong style={{ display: "block", marginBottom: "12px" }}>
              Starter templates
            </Text>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
              }}
            >
              {STARTER_TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderRadius: "6px",
                    backgroundColor: "white",
                    border: "1px solid #e8e8e8",
                    transition: "all 0.2s",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setPromptContent(template.prompt)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f9ff";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.borderColor = "#e8e8e8";
                  }}
                >
                  <span style={{ marginRight: "6px", fontSize: "14px" }}>
                    {template.icon}
                  </span>
                  <span style={{ color: "#374151" }}>{template.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div
              style={{
                position: "absolute",
                top: "64px",
                right: "24px",
                width: "400px",
                backgroundColor: "white",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                zIndex: 1000,
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  Prompt settings
                </Title>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => setShowSettings(false)}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Overrides
                </Text>
                <Title level={5} style={{ margin: "8px 0" }}>
                  AI model
                </Title>
                <Select
                  value={settings.model}
                  onChange={handleModelChange}
                  style={{ width: "100%" }}
                  optionLabelProp="label"
                >
                  {AI_MODELS.map((model) => (
                    <Select.Option
                      key={model.value}
                      value={model.value}
                      label={model.label}
                    >
                      <Space>
                        <span>{model.icon}</span>
                        <span>{model.label}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <Text strong>Temperature</Text>
                  <Text>{settings.temperature}</Text>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.temperature}
                  onChange={handleTemperatureChange}
                  style={{ margin: "16px 0" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  <span>Deterministic</span>
                  <span>Random</span>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <Text strong>Max tokens</Text>
                  <Text>{settings.maxTokens}</Text>
                </div>
                <Slider
                  min={10}
                  max={24000}
                  step={100}
                  value={settings.maxTokens}
                  onChange={handleMaxTokensChange}
                  style={{ margin: "16px 0" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  <span>10</span>
                  <span>24000</span>
                </div>
              </div>

              <Button
                type="primary"
                block
                icon={<PlayCircleOutlined />}
                onClick={handleRun}
                loading={isRunning}
              >
                Run
              </Button>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              flexShrink: 0, // Prevent footer from shrinking
              backgroundColor: "white", // Ensure footer has a background
            }}
          >
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleSavePrompt}>
              Save Prompt
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
