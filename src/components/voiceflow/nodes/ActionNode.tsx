import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './ActionNode.module.scss';

interface ActionNodeProps {
  data: {
    label: string;
    actionType?: string;
    script?: string;
    __editingLabel?: boolean;
  };
  selected: boolean;
  id: string;
}

export default function ActionNode({ data, selected, id }: ActionNodeProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || 'Action');

  const commitLabel = useCallback((next: string) => {
    const trimmed = (next || '').trim();
    dispatch(updateNode({ 
      id, 
      data: { 
        ...data,
        label: trimmed || 'Action',
        __editingLabel: false 
      } 
    }));
    setEditing(false);
  }, [dispatch, id, data]);

  const beginEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label || 'Action');
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <NodeHeader
        icon={<ThunderboltOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'Action'}
        color="#ff6b35"
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
        <div className={styles.actionText}>
          Type: {data.actionType || 'Custom'}
        </div>
      </div>

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
