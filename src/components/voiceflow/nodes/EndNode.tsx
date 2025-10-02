import React, { useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StopOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './EndNode.module.scss';

interface EndNodeData {
  label: string;
  message?: string;
  __editingLabel?: boolean;
}

export default function EndNode({ id, data, selected }: NodeProps<EndNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || 'End');

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);

  const commitLabel = useCallback((next: string) => {
    const trimmed = (next || '').trim();
    dispatch(updateNode({ id, data: { ...data, label: trimmed || data.label, __editingLabel: false } }));
    setEditing(false);
  }, [dispatch, id, data]);

  const beginEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label || 'End');
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <NodeHeader
        icon={<StopOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'End'}
        color="#ef4444"
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
        <div>End of the conversation</div>
      </div>
      <Handle 
        type="target" 
        position={Position.Bottom} 
        className={styles.handle}
      />
    </div>
  );
}
