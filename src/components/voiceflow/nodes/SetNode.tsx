import React, { useState, useCallback, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { CalculatorOutlined } from "@ant-design/icons";
import { useAppDispatch } from "../../../store/hooks";
import { updateNode } from "../../../store/slices/workflowSlice";
import { NodeHeader } from "./shared/NodeHeader";
import styles from "./SetNode.module.scss";

interface VariableAssignment {
  id: string;
  variable: string;
  valueType: "value" | "expression";
  value: string;
  expression: string;
}

interface SetNodeData {
  label: string;
  variables?: VariableAssignment[];
  parallelExecution?: boolean;
  __editingLabel?: boolean;
}

export default function SetNode({
  data,
  selected,
  id,
}: NodeProps<SetNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || "Set variable");

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
            label: trimmed || "Set variable",
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
    setLabel(data.label || "Set variable");
  }, [data.label]);

  // Get variables from data or default to empty array
  const variables = data.variables || [];

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ""}`}>
      <NodeHeader
        icon={
          <CalculatorOutlined style={{ color: "white", fontSize: "12px" }} />
        }
        label={data.label || "Set variable"}
        color="#8b5cf6"
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

      <div className={styles.content}>
        {variables.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>No variables to set</span>
          </div>
        ) : (
          <div className={styles.variableList}>
            {variables.map((variable) => (
              <div key={variable.id} className={styles.variableItem}>
                <span className={styles.variableCode}>
                  {variable.valueType === "value" ? "{}" : "{x}"}
                </span>
                <span className={styles.variableName}>{variable.variable}</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.variableValue}>
                  {variable.valueType === "expression"
                    ? variable.expression || "expression"
                    : variable.value || "value"}
                </span>
              </div>
            ))}
            {data.parallelExecution && variables.length > 0 && (
              <div className={styles.parallelIndicator}>
                Parallel execution enabled
              </div>
            )}
          </div>
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
