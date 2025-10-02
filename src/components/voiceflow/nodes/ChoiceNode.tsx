import React, { useCallback, useEffect, useState } from 'react';
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
  const choices = data.choices || ['Choice A', 'Choice B'];

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
          {choices.slice(0, 3).map((choice: string, index: number) => (
            <div key={index} className={styles.choiceItem}>
              <div className={styles.choiceDot}></div>
              <div className={styles.choiceText}>{choice}</div>
            </div>
          ))}
          {choices.length > 3 && (
            <div className={styles.moreChoices}>
              +{choices.length - 3} more choices
            </div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className={`${styles.handle} ${styles['handle--top']}`}
      />
      {choices.map((_choice: string, index: number) => (
        <Handle
          key={index}
          type="source"
          position={Position.Right}
          id={`choice-${index}`}
          className={`${styles.handle} ${styles['handle--right']}`}
          style={{
            top: `${30 + (index * 40)}%`,
          }}
        />
      ))}
    </div>
  );
}
