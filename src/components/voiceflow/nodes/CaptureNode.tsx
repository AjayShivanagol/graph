import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { EditOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './CaptureNode.module.scss';

interface CaptureNodeData {
  label: string;
  variable?: string;
  prompt?: string;
  validation?: string;
  __editingLabel?: boolean;
}

export default function CaptureNode({ data, selected, id }: NodeProps<CaptureNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || 'Capture');

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
    setLabel(data.label || 'Capture');
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <NodeHeader
        icon={<EditOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'Capture'}
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
        {data.prompt && (
          <div className={styles.prompt}>
            {data.prompt}
          </div>
        )}
        <div className={styles.row}>
          <div className={styles.kvLabel}>Variable:</div>
          <div className={styles.badgeMono}>
            {data.variable || 'user_input'}
          </div>
        </div>
        {data.validation && (
          <div className={styles.validation}>
            Validation: {data.validation}
          </div>
        )}
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
