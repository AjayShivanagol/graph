import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { ForkOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useAppDispatch } from "../../../store/hooks";
import { updateNode } from "../../../store/slices/workflowSlice";
import styles from "./ConditionNode.module.scss";

interface ConditionPath {
  id: string;
  condition: string;
  label?: string;
}

interface ConditionNodeProps {
  data: {
    label: string;
    conditionType?: string;
    paths?: ConditionPath[];
    elsePath?: boolean;
    elsePathLabel?: string;
    __editingLabel?: boolean;
  };
  selected: boolean;
  id: string;
}

export default function ConditionNode({
  data,
  selected,
  id,
}: ConditionNodeProps) {
  const dispatch = useAppDispatch();
  const [tempLabel, setTempLabel] = useState(data.label);

  // Initialize paths if not exists
  const paths = data.paths || [];

  const elsePath = data.elsePath ?? false;
  const elsePathLabel = data.elsePathLabel ?? "Else";

  const beginEdit = () => {
    dispatch(updateNode({ id, data: { ...data, __editingLabel: true } }));
  };

  const finishEdit = () => {
    dispatch(
      updateNode({
        id,
        data: { ...data, label: tempLabel, __editingLabel: false },
      })
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      finishEdit();
    }
  };

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ""}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.icon}>
          <ForkOutlined />
        </div>
        {data.__editingLabel ? (
          <Input
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            onBlur={finishEdit}
            onKeyPress={handleKeyPress}
            autoFocus
            className={styles.labelInput}
          />
        ) : (
          <span className={styles.label} onDoubleClick={beginEdit}>
            {data.label}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.conditionType}>
          <span>Condition type</span>
          <div className={styles.conditionTypeValue}>
            {data.conditionType || "Business logic"}
          </div>
        </div>

        <div className={styles.pathsSection}>
          <div className={styles.pathsList}>
            {paths.length === 0 ? (
              <div className={styles.noPathsMessage}>
                <span>No paths configured</span>
              </div>
            ) : (
              paths.map((path, index) => (
                <div key={path.id} className={styles.pathItem}>
                  <div className={styles.pathDisplay}>
                    <span className={styles.pathCondition}>
                      {path.condition || "No condition set"}
                    </span>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={path.id}
                    className={styles.handleSource}
                  />
                </div>
              ))
            )}

            {paths.length > 0 && elsePath && (
              <>
                <div className={styles.elsePathItem}>
                  <span>{elsePathLabel}</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="else-path"
                    className={styles.handleElse}
                  />
                </div>
                <div className={styles.divider}></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top handle (input) */}
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handleTarget}
      />
    </div>
  );
}
