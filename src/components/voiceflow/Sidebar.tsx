import React, { useState, useRef } from "react";
import { Input, Button, Tooltip, Card } from "antd";
import {
  SearchOutlined,
  MessageOutlined,
  AudioOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  RobotOutlined,
  PlusOutlined,
  AimOutlined,
  PlayCircleOutlined,
  AppstoreOutlined,
  ForkOutlined,
  EditOutlined,
  StopOutlined,
  PictureOutlined,
  IdcardOutlined,
  SlidersOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { useAppDispatch } from "../../store/hooks";
import { addNode } from "../../store/slices/workflowSlice";
import styles from "./Sidebar.module.scss";

// Helper function to get icon color based on block type
const getBlockIconColor = (blockId: string) => {
  const colorMap: Record<string, string> = {
    start: "blue",
    message: "blue",
    prompt: "blue",
    image: "blue",
    card: "blue",
    carousel: "blue",
    buttons: "green",
    choice: "green",
    capture: "green",
    condition: "orange",
    set: "orange",
    end: "red",
    api: "purple",
    function: "purple",
    "kb-search": "cyan",
  };
  return colorMap[blockId] || "blue";
};

const categories = [
  {
    id: "agent",
    name: "Agent",
    icon: RobotOutlined,
    blocks: [
      {
        id: "start",
        name: "Start",
        icon: PlayCircleOutlined,
        description: "Start the conversation",
      },
    ],
  },
  {
    id: "talk",
    name: "Talk",
    icon: MessageOutlined,
    blocks: [
      {
        id: "message",
        name: "Message",
        icon: MessageOutlined,
        description: "Display a text message",
      },
      {
        id: "prompt",
        name: "Prompt",
        icon: AimOutlined,
        description: "Prompt user for input",
      },
      {
        id: "image",
        name: "Image",
        icon: PictureOutlined,
        description: "Display an image",
      },
      {
        id: "card",
        name: "Card",
        icon: IdcardOutlined,
        description: "Show a rich card",
      },
      {
        id: "carousel",
        name: "Carousel",
        icon: SlidersOutlined,
        description: "Show multiple cards",
      },
    ],
  },
  {
    id: "listen",
    name: "Listen",
    icon: AudioOutlined,
    blocks: [
      {
        id: "buttons",
        name: "Buttons",
        icon: AppstoreOutlined,
        description: "Predefined button options",
      },
      {
        id: "choice",
        name: "Choice",
        icon: ForkOutlined,
        description: "Branch based on choices",
      },
      {
        id: "capture",
        name: "Capture",
        icon: EditOutlined,
        description: "Capture user input",
      },
    ],
  },
  {
    id: "logic",
    name: "Logic",
    icon: ThunderboltOutlined,
    blocks: [
      {
        id: "condition",
        name: "Condition",
        icon: ForkOutlined,
        description: "IF condition routing",
      },
      {
        id: "set",
        name: "Set",
        icon: EditOutlined,
        description: "Set variable value",
      },
      {
        id: "end",
        name: "End",
        icon: StopOutlined,
        description: "End the flow",
      },
    ],
  },
  {
    id: "dev",
    name: "Dev",
    icon: CodeOutlined,
    blocks: [
      {
        id: "api",
        name: "API",
        icon: ApiOutlined,
        description: "Call external API",
      },
      {
        id: "function",
        name: "Function",
        icon: CodeOutlined,
        description: "Custom JavaScript",
      },
      {
        id: "kb-search",
        name: "KB Search",
        icon: SearchOutlined,
        description: "Knowledge base search",
      },
    ],
  },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("blocks");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Show panel on category hover with a small delay
  const handleCategoryEnter = (categoryId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(categoryId);
    }, 150);
  };

  // Handle mouse leave from category button
  const handleCategoryLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (!isPanelHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredCategory(null);
      }, 200);
    }
  };

  // Handle mouse enter on panel
  const handlePanelEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsPanelHovered(true);
  };

  // Handle mouse leave from panel
  const handlePanelLeave = () => {
    setIsPanelHovered(false);
    if (hoveredCategory) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredCategory(null);
      }, 200);
    }
  };

  const handleDragStart = (
    event: React.DragEvent,
    blockType: string,
    blockName: string
  ) => {
    event.dataTransfer.setData("application/reactflow", blockType);
    event.dataTransfer.setData("block-name", blockName);
    event.dataTransfer.effectAllowed = "move";

    // Add dragging class to the block being dragged
    const target = event.currentTarget as HTMLElement;
    target.classList.add(styles.dragging);

    // Set a custom drag image for better visual feedback
    const dragImage = document.createElement("div");
    dragImage.style.position = "absolute";
    dragImage.style.padding = "8px 12px";
    dragImage.style.background = "white";
    dragImage.style.border = "1px solid #d9d9d9";
    dragImage.style.borderRadius = "4px";
    dragImage.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    dragImage.style.pointerEvents = "none";
    dragImage.style.zIndex = "9999";
    dragImage.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    dragImage.style.fontSize = "14px";
    dragImage.style.color = "#1f2328";
    dragImage.textContent = blockName;

    // Add to DOM and position off-screen
    document.body.appendChild(dragImage);
    dragImage.style.top = "-9999px";

    // Set the drag image
    event.dataTransfer.setDragImage(dragImage, 0, 0);

    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
      target.classList.remove(styles.dragging);
    }, 0);
  };

  const handleAddBlock = (blockType: string, blockName: string) => {
    const uniqueId = () => Math.random().toString(36).slice(2, 10);
    const createButton = (label: string) => ({
      id: `btn-${uniqueId()}`,
      label,
      value: "",
      actions: [],
    });
    const createCard = (index: number) => ({
      id: `card-${uniqueId()}`,
      title: `Card ${index + 1}`,
      description: "Card description",
      imageSourceType: "upload" as const,
      imageUrl: "",
      imageData: "",
      imageFileName: "",
      buttons: [createButton("Select")],
    });
    const createChoice = (label: string) => ({
      id: `choice-${uniqueId()}`,
      label,
      automaticallyReprompt: false,
    });

    const newNode = {
      id: `${blockType}-${Date.now()}`,
      type: blockType,
      position: { x: 250, y: 250 },
      data: {
        label: blockName,
        ...(blockType === "message" && { text: "" }),
        ...(blockType === "buttons" && { options: ["Option 1", "Option 2"] }),
        ...(blockType === "choice" && {
          choices: [createChoice("Choice A"), createChoice("Choice B")],
        }),
        ...(blockType === "capture" && { variable: "user_input" }),
        ...(blockType === "condition" && {
          condition: 'variable == "value"',
          paths: [],
          elsePath: true,
          elsePathLabel: "Else path",
        }),
        ...(blockType === "set" && {
          variable: "my_variable",
          value: "default_value",
        }),
        ...(blockType === "api" && { url: "", method: "GET" }),
        ...(blockType === "function" && {
          code: "function handler(input) {\n  // TODO: implement\n  return input;\n}",
        }),
        ...(blockType === "prompt" && { suggestions: ["Yes", "No", "Maybe"] }),
        ...(blockType === "card" && {
          cardType: "card",
          title: "Card Title",
          description: "Card description",
          imageSourceType: "upload" as const,
          imageUrl: "",
          imageData: "",
          imageFileName: "",
          url: "",
          buttons: [createButton("Primary"), createButton("Secondary")],
        }),
        ...(blockType === "carousel" && {
          cardType: "carousel",
          cards: [createCard(0), createCard(1)],
        }),
        ...(blockType === "image" && {
          imageSourceType: "upload",
          imageUrl: "",
          imageData: "",
          imageFileName: "",
          url: "",
          alt: "Image description",
        }),
      },
    };
    dispatch(addNode(newNode));
  };

  const hoveredCategoryData = categories.find(
    (cat) => cat.id === hoveredCategory
  );
  const filteredBlocks =
    hoveredCategoryData?.blocks.filter(
      (block) =>
        block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className={styles.sidebar}>
      {/* Categories - Vertical Icons */}
      <div className={styles.categories}>
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Tooltip key={category.id} title={category.name} placement="right">
              <Button
                type={hoveredCategory === category.id ? "primary" : "text"}
                onMouseEnter={() => handleCategoryEnter(category.id)}
                onMouseLeave={handleCategoryLeave}
                className={`${styles.categoryButton} ${
                  hoveredCategory === category.id ? styles.active : ""
                }`}
              >
                <Icon style={{ fontSize: 20 }} />
                <span className={styles.categoryName}>{category.name}</span>
              </Button>
            </Tooltip>
          );
        })}
      </div>

      {/* Flyout Blocks Panel - Using a div wrapper for better positioning */}
      <div
        ref={flyoutRef}
        className={styles.flyoutPanelWrapper}
        style={{
          display: hoveredCategory ? "block" : "none",
          left: "80px", // Match sidebar width
          top: "64px", // Match header height
        }}
      >
        <Card
          className={`${styles.flyoutPanel} ${
            hoveredCategory ? styles.visible : ""
          }`}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          {/* Search in flyout */}
          <div className={styles.searchContainer}>
            <Input
              placeholder="Search blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              size="small"
            />
          </div>

          {/* Blocks Grid */}
          <div className={styles.blocksGrid}>
            {filteredBlocks.length > 0 ? (
              filteredBlocks.map((block) => (
                <div
                  key={block.id}
                  className={styles.blockItem}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.id, block.name)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={() => handleAddBlock(block.id, block.name)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    className={`${styles.blockIcon} ${
                      styles[getBlockIconColor(block.id)]
                    }`}
                  >
                    <block.icon />
                  </div>
                  <div className={styles.blockInfo}>
                    <div className={styles.blockTitle}>{block.name}</div>
                    <div className={styles.blockDescription}>
                      {block.description}
                    </div>
                  </div>
                  <PlusOutlined style={{ color: "#8c8c8c" }} />
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <p>No blocks found</p>
                <p>Try adjusting your search</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {activeTab === "layers" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{ textAlign: "center", color: "#8c8c8c" }}>
            <AimOutlined
              style={{ fontSize: 32, opacity: 0.5, marginBottom: 8 }}
            />
            <p style={{ fontSize: 14, margin: 0 }}>No layers yet</p>
            <p
              style={{
                fontSize: 12,
                color: "#bfbfbf",
                marginTop: 4,
                margin: 0,
              }}
            >
              Layers will appear here when you create them
            </p>
          </div>
        </div>
      )}

      {/* Entity Button */}
      <div style={{ padding: 16, borderTop: "1px solid #f0f0f0" }}>
        <Button
          block
          icon={<PlusOutlined />}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          Entity
        </Button>
      </div>
    </div>
  );
}
