import React, { useState, useCallback, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  CreditCardOutlined,
  ExportOutlined,
  AimOutlined,
  PhoneOutlined,
  StopOutlined,
  BranchesOutlined,
  LinkOutlined,
  ToolOutlined,
  CodeOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useAppDispatch } from "../../../store/hooks";
import { updateNode } from "../../../store/slices/workflowSlice";
import { NodeHeader } from "./shared/NodeHeader";
import styles from "./CardNode.module.scss";

type ImageSourceType = "upload" | "link";

type ButtonActionType =
  | "go_to_block"
  | "go_to_intent"
  | "call_forward"
  | "end"
  | "set_variable"
  | "open_url"
  | "tool"
  | "code"
  | "component";

const ACTION_FALLBACK_LABELS: Record<ButtonActionType, string> = {
  go_to_block: "Go to Block",
  go_to_intent: "Go to Intent",
  call_forward: "Call forward",
  end: "End conversation",
  set_variable: "Set variable",
  open_url: "Open URL",
  tool: "Tool",
  code: "Javascript",
  component: "Component",
};

const ACTION_ICON_MAP: Record<ButtonActionType, React.ReactNode> = {
  go_to_block: <ExportOutlined />,
  go_to_intent: <AimOutlined />,
  call_forward: <PhoneOutlined />,
  end: <StopOutlined />,
  set_variable: <BranchesOutlined />,
  open_url: <LinkOutlined />,
  tool: <ToolOutlined />,
  code: <CodeOutlined />,
  component: <AppstoreOutlined />,
};

interface ButtonActionData {
  id: string;
  type: ButtonActionType;
  label?: string;
  data?: Record<string, any>;
}

interface CardButtonData {
  id: string;
  label: string;
  value?: string;
  actions?: ButtonActionData[];
}

interface CarouselCardData {
  id: string;
  title?: string;
  description?: string;
  imageSourceType?: ImageSourceType;
  imageUrl?: string;
  imageData?: string;
  imageFileName?: string;
  buttons?: (string | CardButtonData)[];
}

interface CardNodeData {
  label: string;
  title?: string;
  description?: string;
  imageSourceType?: ImageSourceType;
  imageUrl?: string;
  imageData?: string;
  imageFileName?: string;
  url?: string;
  buttons?: (string | CardButtonData)[];
  cards?: CarouselCardData[];
  cardType?: "card" | "carousel";
  __editingLabel?: boolean;
}

const normalizeButtonActions = (actions?: any[]): ButtonActionData[] => {
  if (!Array.isArray(actions)) return [];
  return actions.map((action, index) => {
    if (!action || typeof action === "string") {
      return {
        id: `action-${index}`,
        type: "go_to_block",
        label: typeof action === "string" ? action : "Go to Block",
      };
    }
    const type = (action.type || "go_to_block") as ButtonActionType;
    const fallbackLabel = ACTION_FALLBACK_LABELS[type] || "Action";
    const rawLabel = (action.label || action.name || "").trim();
    const normalizedLabel =
      type === "end" && rawLabel.toLowerCase() === "end"
        ? fallbackLabel
        : rawLabel || fallbackLabel;
    return {
      id: action.id || `action-${index}`,
      type,
      label: normalizedLabel,
      data: action.data || action.payload || {},
    };
  });
};

const normalizeButtonList = (
  buttons?: (string | CardButtonData)[]
): CardButtonData[] => {
  if (!Array.isArray(buttons)) return [];
  return buttons.map((button, index) => {
    if (!button) {
      return {
        id: `btn-${index}`,
        label: `Button ${index + 1}`,
        actions: [],
      };
    }
    if (typeof button === "string") {
      return { id: `btn-${index}`, label: button, actions: [] };
    }
    return {
      id: button.id || `btn-${index}`,
      label: button.label || (button as any).text || `Button ${index + 1}`,
      value: button.value,
      actions: normalizeButtonActions((button as any).actions),
    };
  });
};

export default function CardNode({
  data,
  selected,
  id,
}: NodeProps<CardNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || "Card");

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);

  const variant: "card" | "carousel" =
    data.cardType ||
    (Array.isArray(data.cards) && data.cards.length > 0 ? "carousel" : "card");

  const normalizedCards =
    variant === "carousel"
      ? (data.cards || []).map((card, index) => ({
          id: card?.id || `card-${index}`,
          title: card?.title || `Card ${index + 1}`,
          description: card?.description || "",
          imageSourceType: card?.imageSourceType,
          imageUrl: card?.imageUrl,
          imageData: card?.imageData,
          imageFileName: card?.imageFileName,
          buttons: normalizeButtonList(card?.buttons),
        }))
      : [
          {
            id: `card-${id}`,
            title: data.title || "Card Title",
            description: data.description || "Card description...",
            imageSourceType: data.imageSourceType,
            imageUrl: data.imageUrl || data.url,
            imageData: data.imageData,
            imageFileName: data.imageFileName,
            buttons: normalizeButtonList(data.buttons),
          },
        ];

  const cardsToRender =
    variant === "carousel" ? normalizedCards.slice(0, 2) : normalizedCards;
  const remainingCards =
    variant === "carousel" && normalizedCards.length > 2
      ? normalizedCards.length - 2
      : 0;

  const headerColor = variant === "carousel" ? "#0ea5e9" : "#ec4899";

  const commitLabel = useCallback(
    (next: string) => {
      const trimmed = (next || "").trim();
      dispatch(
        updateNode({
          id,
          data: {
            ...data,
            label: trimmed || data.label,
            __editingLabel: false,
          },
        })
      );
      setEditing(false);
    },
    [dispatch, id, data]
  );

  const beginEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label || "Card");
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ""}`}>
      <NodeHeader
        icon={
          <CreditCardOutlined style={{ color: "white", fontSize: "12px" }} />
        }
        label={data.label || "Card"}
        color={headerColor}
        isEditing={editing}
        editValue={label}
        onLabelChange={(e) => setLabel(e.target.value)}
        onLabelBlur={() => commitLabel(label)}
        onLabelKeyDown={(e) => {
          if (e.key === "Enter") {
            commitLabel(label);
          } else if (e.key === "Escape") {
            setEditing(false);
          }
        }}
        onDoubleClick={beginEdit}
      />

      <div className={styles.node__content}>
        <div
          className={
            variant === "carousel" ? styles.node__carouselGroup : undefined
          }
        >
          {cardsToRender.map((card, index) => {
            const imageSrc = card.imageData || card.imageUrl;
            return (
              <div key={card.id || index} className={styles.node__card}>
                <div className={styles.node__image}>
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={card.title || "Card image"}
                      className={styles.node__imagePreview}
                    />
                  ) : (
                    <CreditCardOutlined />
                  )}
                </div>
                <div className={styles.node__title}>
                  {card.title || `Card ${index + 1}`}
                </div>
                <div className={styles.node__description}>
                  {card.description || "Card description..."}
                </div>
                <div className={styles.node__buttons}>
                  {(card.buttons || []).map((button, buttonIndex) => {
                    const actions = button.actions || [];
                    return (
                      <div key={button.id || buttonIndex} className={styles.node__buttonRow}>
                        <div className={styles.node__buttonPreview}>
                          {button.label || `Button ${buttonIndex + 1}`}
                        </div>
                        {index === 0 && (
                          <div className={styles.node__buttonHandle}>
                            <div
                              className={`${styles.handle} ${styles["handle--button"]}`}
                            >
                              <Handle
                                type="source"
                                position={Position.Right}
                                id={`button-${buttonIndex}`}
                                className={styles.handleInner}
                              />
                            </div>
                          </div>
                        )}
                        <div className={styles.node__buttonActionsRail}>
                          {actions.length === 0 ? (
                            <span className={styles.node__actionPlaceholder}>
                              No actions
                            </span>
                          ) : (
                            <>
                              <span className={styles.node__actionConnector}>
                                <ArrowRightOutlined />
                              </span>
                              {actions.map((action, actionIndex) => {
                                const actionType = action.type as ButtonActionType;
                                const icon = ACTION_ICON_MAP[actionType];
                                const fallbackLabel =
                                  ACTION_FALLBACK_LABELS[actionType];
                                const displayLabel =
                                  (action.label || "").trim() ||
                                  fallbackLabel ||
                                  "Action";

                                const isLast = actionIndex === actions.length - 1;

                                return (
                                  <React.Fragment key={action.id}>
                                    <div className={styles.node__actionChip}>
                                      {icon && (
                                        <span className={styles.node__actionIcon}>
                                          {icon}
                                        </span>
                                      )}
                                      <span className={styles.node__actionLabel}>
                                        {displayLabel}
                                      </span>
                                    </div>
                                    {!isLast && (
                                      <span className={styles.node__actionConnector}>
                                        <ArrowRightOutlined />
                                      </span>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {remainingCards > 0 && (
            <div className={styles.node__moreCards}>+{remainingCards} more</div>
          )}
        </div>
      </div>

      {/* Top handle (input) */}
      <div className={`${styles.handle} ${styles["handle--top"]}`}>
        <Handle
          type="target"
          position={Position.Top}
          className={styles.handleInner}
        />
      </div>

    </div>
  );
}
