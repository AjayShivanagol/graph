import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FileTextOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import styles from './DocumentNode.module.scss';
import handleStyles from './shared/handleStyles.module.scss';

interface DocumentNodeProps {
  data: {
    label: string;
    content?: string;
    template?: string;
    __editingLabel?: boolean;
  };
  selected: boolean;
  id: string;
}

export default function DocumentNode({ data, selected, id }: DocumentNodeProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<boolean>(!!data.__editingLabel);
  const [label, setLabel] = useState<string>(data.label || '');

  const commitLabel = (newLabel: string) => {
    const trimmed = (newLabel || '').trim();
    dispatch(updateNode({ id, data: { ...data, label: trimmed || data.label, __editingLabel: false } }));
    setEditing(false);
  };

  const beginEdit = () => {
    setEditing(true);
    setLabel(data.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitLabel(label);
    } else if (e.key === 'Escape') {
      setEditing(false);
      setLabel(data.label);
    }
  };

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <FileTextOutlined />
        </div>
        {editing ? (
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => commitLabel(label)}
            onKeyDown={handleKeyDown}
            className={styles.labelInput}
            autoFocus
          />
        ) : (
          <div className={styles.label} onDoubleClick={beginEdit}>
            {data.label}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.documentPreview}>
          {data.template || 'Document template...'}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className={`${handleStyles.handle} ${handleStyles['handle--top']}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`${handleStyles.handle} ${handleStyles['handle--bottom']}`}
      />
    </div>
  );
}
