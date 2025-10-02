import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AppstoreOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useAppDispatch } from "../../../store/hooks";
import { updateNode } from "../../../store/slices/workflowSlice";
import NodeHeader from "./shared/NodeHeader";
import styles from "./ButtonsNode.module.scss";

type ButtonMatchType = "exact" | "any";

interface ButtonsNodeButton {
  id: string;
  label: string;
  matchType: ButtonMatchType;
}

interface ButtonsFallbackConfig {
  enabled?: boolean;
  reprompts?: string[];
  inactivityTimeout?: number;
  followPath?: boolean;
}

interface ButtonsNodeData {
  label: string;
  text?: string;
  buttons?: (string | Partial<ButtonsNodeButton>)[];
  options?: string[];
  noMatch?: ButtonsFallbackConfig;
  noReply?: ButtonsFallbackConfig;
  listenForOtherTriggers?: boolean;
  __editingLabel?: boolean;
}

const ensureButtonShape = (button: any, index: number): ButtonsNodeButton => {
  if (!button || typeof button === "string") {
    const labelValue = typeof button === "string" ? button : "";
    return {
      id: `btn-${index}`,
      label: labelValue,
      matchType: "exact",
    };
  }

  const rawLabel =
    typeof button.label === "string"
      ? button.label
      : typeof button.text === "string"
      ? button.text
      : "";

  return {
    id: button.id || `btn-${index}`,
    label: rawLabel,
    matchType:
      button.matchType === "any" || button.matchType === "exact"
        ? (button.matchType as ButtonMatchType)
        : "exact",
  };
};

const normalizeButtons = (
  buttons?: (string | Partial<ButtonsNodeButton>)[],
  fallbackOptions?: string[]
): ButtonsNodeButton[] => {
  if (Array.isArray(buttons) && buttons.length > 0) {
    return buttons.map((button, index) => ensureButtonShape(button, index));
  }

  if (Array.isArray(fallbackOptions) && fallbackOptions.length > 0) {
    return fallbackOptions.map((label, index) =>
      ensureButtonShape(label, index)
    );
  }

  return [];
};

export default function ButtonsNode({
  id,
  data,
  selected,
}: NodeProps<ButtonsNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || "Buttons");

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);

  const normalizedButtons = useMemo(
    () => normalizeButtons(data.buttons, data.options),
    [data.buttons, data.options]
  );

  const buttonsToRender = normalizedButtons.slice(0, 4);
  const remainingButtons = normalizedButtons.length - buttonsToRender.length;

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
    setLabel(data.label || "Buttons");
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ""}`}>
      <NodeHeader
        icon={<AppstoreOutlined style={{ color: "white", fontSize: "12px" }} />}
        label={data.label || "Buttons"}
        color="#14b8a6"
        isEditing={editing}
        editValue={label}
        onLabelChange={(event) => setLabel(event.target.value)}
        onLabelBlur={() => commitLabel(label)}
        onLabelKeyDown={(event) => {
          if (event.key === "Enter") {
            commitLabel(label);
          } else if (event.key === "Escape") {
            setEditing(false);
          }
        }}
        onDoubleClick={beginEdit}
      />

      <div className={styles.node__content}>
        {data.text && <div className={styles.node__prompt}>{data.text}</div>}

        <div className={styles.node__buttonList}>
          {buttonsToRender.length === 0 ? (
            <div className={styles.node__empty}>No buttons configured yet</div>
          ) : (
            buttonsToRender.map((button, index) => (
              <div key={button.id || index} className={styles.node__buttonRow}>
                <div className={styles.node__buttonContent}>
                  <span className={styles.node__buttonLabel}>
                    {button.label || `Button ${index + 1}`}
                  </span>
                  <span
                    className={`${styles.node__matchTag} ${
                      button.matchType === "any"
                        ? styles.node__matchTagAny
                        : styles.node__matchTagExact
                    }`}
                  >
                    {button.matchType === "any" ? "Match any" : "Match exact"}
                  </span>
                </div>
                <span className={styles.node__connector}>
                  <ArrowRightOutlined />
                </span>
                <div className={styles.handleWrapper}>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`button-${button.id}`}
                    className={styles.handleInner}
                  />
                </div>
              </div>
            ))
          )}
          {remainingButtons > 0 && (
            <div className={styles.node__more}>+{remainingButtons} more</div>
          )}
        </div>

        {(data.noMatch?.enabled ||
          data.noReply?.enabled ||
          data.listenForOtherTriggers) && (
          <div className={styles.node__fallbacks}>
            {data.noMatch?.enabled && (
              <span className={styles.node__fallbackTag}>No match</span>
            )}
            {data.noReply?.enabled && (
              <span className={styles.node__fallbackTag}>No reply</span>
            )}
            {data.listenForOtherTriggers && (
              <span className={styles.node__fallbackTag}>Other triggers</span>
            )}
          </div>
        )}
      </div>

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
