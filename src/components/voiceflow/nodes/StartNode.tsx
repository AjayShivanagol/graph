import React, { useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useAppDispatch } from "../../../store/hooks";
import { updateNode } from "../../../store/slices/workflowSlice";
import { NodeHeader } from "./shared/NodeHeader";
import styles from "./StartNode.module.scss";

export default function StartNode({
  id,
  data,
  selected,
}: NodeProps<any>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);

  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]);

  const commitLabel = useCallback(
    (next: string) => {
      const trimmed = (next || "").trim();
      dispatch(
        updateNode({
          id,
          data: { label: trimmed || data.label, __editingLabel: false },
        })
      );
      setEditing(false);
    },
    [dispatch, id, data.label]
  );

  const beginEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label || "");
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ""}`}>
      <NodeHeader
        icon={<PlayCircleOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'Start'}
        color="#10b981"
        isEditing={editing}
        editValue={label}
        onLabelChange={(e) => setLabel(e.target.value)}
        onLabelBlur={() => commitLabel(label)}
        onLabelKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitLabel(label);
          } else if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        onDoubleClick={beginEdit}
      />
      <div className={styles.content}>
        <div>Start of the conversation</div>
      </div>
      
      {/* Bottom handle (output) */}
      <div style={{ position: 'relative', width: '100%', height: 0 }}>
        <div style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)' }}>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            className={styles.handle}
          />
        </div>
      </div>
    </div>
  );
}
