import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ForkOutlined } from "@ant-design/icons";
import { useAppDispatch } from "../../../store/hooks";
import { updateNode } from "../../../store/slices/workflowSlice";
import NodeHeader from "./shared/NodeHeader";
import styles from "./ChoiceNode.module.scss";

interface NormalizedChoice {
  id: string;
  label: string;
}

const ensureChoiceShape = (choice: any, index: number): NormalizedChoice => {
  const fallbackId = `choice-${index}`;

  if (typeof choice === "string") {
    const trimmed = choice.trim();
    return {
      id: fallbackId,
      label: trimmed,
    };
  }

  if (choice && typeof choice === "object") {
    const choiceId =
      typeof choice.id === "string" && choice.id.trim().length > 0
        ? choice.id
        : fallbackId;
    const rawLabel =
      typeof choice.label === "string"
        ? choice.label
        : typeof choice.text === "string"
        ? choice.text
        : "";
    const rawIntent =
      typeof choice.intent === "string"
        ? choice.intent
        : typeof choice.intentName === "string"
        ? choice.intentName
        : "";
    const trimmedLabel = rawLabel.trim();
    const trimmedIntent = rawIntent.trim();
    const display = trimmedLabel || trimmedIntent;

    return {
      id: choiceId,
      label: display,
    };
  }

  return {
    id: fallbackId,
    label: "",
  };
};

const normalizeChoices = (choices?: any[]): NormalizedChoice[] => {
  const defaultChoices: NormalizedChoice[] = [
    { id: "choice-0", label: "" },
    { id: "choice-1", label: "" },
  ];

  if (!Array.isArray(choices)) {
    return defaultChoices;
  }

  const mapped = choices.map((choice, index) => ensureChoiceShape(choice, index));

  if (mapped.length === 0) {
    return defaultChoices;
  }

  return mapped;
};

export default function ChoiceNode({ id, data, selected }: NodeProps<any>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || "Choice");

  const normalizedChoices = useMemo(
    () => normalizeChoices(data.choices),
    [data.choices]
  );

  const choicesToRender = normalizedChoices.slice(0, 4);
  const remainingChoices = normalizedChoices.length - choicesToRender.length;

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
            label: trimmed || data.label || "Choice",
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
    setLabel(data.label || "Choice");
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ""}`}>
      <NodeHeader
        icon={<ForkOutlined style={{ color: "white", fontSize: "12px" }} />}
        label={data.label || "Choice"}
        color="#8b5cf6"
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
        {data.question && (
          <div className={styles.node__prompt}>{data.question}</div>
        )}

        <div className={styles.node__choiceList}>
          {choicesToRender.length === 0 ? (
            <div className={styles.node__empty}>No triggers configured yet</div>
          ) : (
            choicesToRender.map((choice, index) => {
              const display = choice.label.trim();
              const hasDisplay = display.length > 0;
              return (
                <div
                  key={choice.id || index}
                  className={styles.node__choiceRow}
                >
                  <span
                    className={`${styles.node__choiceLabel} ${
                      hasDisplay ? "" : styles.node__choiceLabelPlaceholder
                    }`}
                  >
                    {hasDisplay ? display : "Select intent"}
                  </span>
                  <div className={styles.node__choiceHandle}>
                    <div
                      className={`${styles.handle} ${styles["handle--choice"]}`}
                    >
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={choice.id || `choice-${index}`}
                        className={styles.handleInner}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {remainingChoices > 0 && (
            <div className={styles.node__more}>+{remainingChoices} more</div>
          )}
        </div>
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
