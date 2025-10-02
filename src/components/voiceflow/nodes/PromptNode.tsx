import React, { useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AimOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './PromptNode.module.scss';

interface PromptNodeData {
  label: string;
  suggestions?: string[];
  text?: string;
  variable?: string;
  promptId?: string; // Added promptId property
  description?: string; // Added description property
  __editingLabel?: boolean;
}

export default function PromptNode({ id, data, selected }: NodeProps<PromptNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || '');

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);

  const commitLabel = useCallback((next: string) => {
    const trimmed = (next || '').trim();
    dispatch(updateNode({ 
      id, 
      data: { 
        ...data,
        label: trimmed || data.label,
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
        icon={<AimOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'Prompt'}
        color="#ec4899"
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
      <div className={styles.node__content}>
        {data.promptId && (
          <div className={styles.node__selectedPrompt}>
            <div className={styles.node__selectedPrompt__value}>{data.promptId}</div>
          </div>
        )}
        {data.description && (
          <div className={styles.node__description}>
            <div className={styles.node__description__value}>{data.description}</div>
          </div>
        )}
      </div>
      {data.variable && (
        <div className={styles.node__variable}>
          <div className={styles.node__variable__label}>Store in:</div>
          <div className={styles.node__variable__value}>{data.variable}</div>
        </div>
      )}
      {/* Top handle (input) */}
      <Handle
        type="target"
        position={Position.Top}
        className={`${styles.handle} ${styles['handle--top']}`}
      />
      {/* Bottom handle (output) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`${styles.handle} ${styles['handle--bottom']}`}
      />
    </div>
  );
}
