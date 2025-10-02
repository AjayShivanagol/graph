import React, { useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { MessageOutlined } from "@ant-design/icons";
import { useAppDispatch } from "../../../store/hooks";
import { updateNode } from "../../../store/slices/workflowSlice";
import { NodeHeader } from "./shared/NodeHeader";
import styles from "./MessageNode.module.scss";

interface MessageNodeProps {
  id: string;
  data: {
    label: string;
    text?: string;
    delay?: number;
    __editingLabel?: boolean;
  };
  selected: boolean;
}

// Convert markdown to HTML for display in the node
const markdownToHtml = (text: string) => {
  if (!text) return '';
  
  return text
    // Process in order: bold -> italic -> underline -> strikethrough
    // Bold: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* -> <em>text</em>  
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Underline: __text__ -> <u>text</u>
    .replace(/__(.*?)__/g, '<u>$1</u>')
    // Strikethrough: ~~text~~ -> <del>text</del>
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Links: [text](url) -> <a href="url">text</a>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Variables: {variable} -> <span class="variable">{variable}</span>
    .replace(/\{([^}]+)\}/g, '<span class="variable">{$1}</span>')
    // Line breaks
    .replace(/\n/g, '<br>');
};export default function MessageNode({ id, data, selected }: MessageNodeProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || "");

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);

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
    setLabel(data.label || "");
  }, [data.label]);

  // Minimal style object
  const nodeStyle: React.CSSProperties = {
    cursor: "pointer",
  };

  return (
    <div
      className={`${styles.node} ${selected ? styles.selected : ""}`}
      style={nodeStyle}
    >
      <NodeHeader
        icon={<MessageOutlined style={{ color: "white", fontSize: "12px" }} />}
        label={data.label || "Message"}
        color="#3b82f6"
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
          className={styles.node__text}
          dangerouslySetInnerHTML={{
            __html: markdownToHtml(data.text || "Enter your message..."),
          }}
        />
        {data.delay && data.delay > 0 && (
          <div className={styles.node__delay}>Delay: {data.delay}ms</div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className={`${styles.handle} ${styles["handle--top"]}`}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        className={`${styles.handle} ${styles["handle--bottom"]}`}
      />
    </div>
  );
}
