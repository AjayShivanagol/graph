import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ForkOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './ChoiceNode.module.scss';

export default function ChoiceNode({ id, data, selected }: NodeProps<any>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || '');

  const normalizedChoices = useMemo(() => {
    const fallback = [
      { id: 'choice-0', label: 'Trigger' },
      { id: 'choice-1', label: 'Trigger' },
    ];

    if (!Array.isArray(data.choices)) {
      return fallback;
    }

    const mapped = data.choices.map((choice: any, index: number) => {
      if (typeof choice === 'string') {
        const trimmed = choice.trim();
        return {
          id: `choice-${index}`,
          label: trimmed.length > 0 ? trimmed : 'Trigger',
        };
      }

      if (choice && typeof choice === 'object') {
        const choiceId =
          typeof choice.id === 'string' ? choice.id : `choice-${index}`;
        const rawLabel =
          typeof choice.label === 'string'
            ? choice.label
            : typeof choice.text === 'string'
            ? choice.text
            : '';
        const rawIntent =
          typeof choice.intent === 'string'
            ? choice.intent
            : typeof choice.intentName === 'string'
            ? choice.intentName
            : '';
        const trimmedLabel = (rawLabel || '').trim();
        const trimmedIntent = (rawIntent || '').trim();
        const display = trimmedLabel || trimmedIntent;
        return {
          id: choiceId,
          label: display.length > 0 ? display : 'Trigger',
        };
      }

      return { id: `choice-${index}`, label: 'Trigger' };
    });

    if (mapped.length === 0) {
      return fallback;
    }

    return mapped;
  }, [data.choices]);

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);

  const commitLabel = useCallback((next: string) => {
    const trimmed = (next || '').trim();
    dispatch(updateNode({ 
      id, 
      data: { 
        ...data,
        label: trimmed || 'Choice',
        __editingLabel: false 
      } 
    }));
    setEditing(false);
  }, [dispatch, id, data]);

  const beginEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label || '');
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <NodeHeader
        icon={<ForkOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'Choice'}
        color="#8b5cf6"
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
        {data.question && (
          <div className={styles.question}>
            {data.question}
          </div>
        )}
          <div>
            {normalizedChoices.slice(0, 3).map((choice, index: number) => (
              <div key={index} className={styles.choiceItem}>
                <div className={styles.choiceDot}></div>
                <div className={styles.choiceText}>
                  {choice.label || 'Trigger'}
                </div>
              </div>
            ))}
          {normalizedChoices.length > 3 && (
            <div className={styles.moreChoices}>
              +{normalizedChoices.length - 3} more choices
            </div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className={`${styles.handle} ${styles['handle--top']}`}
      />
      {normalizedChoices.map((choice, index: number) => (
        <Handle
          key={choice.id || index}
          type="source"
          position={Position.Right}
          id={choice.id || `choice-${index}`}
          className={`${styles.handle} ${styles['handle--right']}`}
          style={{
            top: `${30 + (index * 40)}%`,
          }}
        />
      ))}
    </div>
  );
}
