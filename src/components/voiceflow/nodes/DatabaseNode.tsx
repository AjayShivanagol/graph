import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DatabaseOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './DatabaseNode.module.scss';

interface DatabaseNodeProps {
  data: {
    label: string;
    query?: string;
    connection?: string;
    __editingLabel?: boolean;
  };
  selected: boolean;
  id: string;
}

export default function DatabaseNode({ id, data, selected }: DatabaseNodeProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || 'Database');

  const commitLabel = useCallback((next: string) => {
    const trimmed = (next || '').trim();
    dispatch(updateNode({ 
      id, 
      data: { 
        ...data,
        label: trimmed || 'Database',
        __editingLabel: false 
      } 
    }));
    setEditing(false);
  }, [dispatch, id, data]);

  const beginEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label || 'Database');
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <NodeHeader
        icon={<DatabaseOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'Database'}
        color="#3b82f6"
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
        <div className={styles.connection}>
          {data.connection || 'Configure connection...'}
        </div>
      </div>

      {/* Top handle */}
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ 
          top: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 10,
          height: 10,
          background: '#1677ff',
          borderRadius: 5,
          border: '2px solid white',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.2)'
        }}
      />
      
      {/* Bottom handle */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ 
          bottom: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 10,
          height: 10,
          background: '#1677ff',
          borderRadius: 5,
          border: '2px solid white',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.2)'
        }}
      />
    </div>
  );
}
