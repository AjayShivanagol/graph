import React from 'react';
import { Input } from 'antd';
import styles from './NodeHeader.module.scss';

interface NodeHeaderProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  isEditing: boolean;
  editValue: string;
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLabelBlur: () => void;
  onLabelKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDoubleClick: () => void;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  icon,
  label,
  color,
  isEditing,
  editValue,
  onLabelChange,
  onLabelBlur,
  onLabelKeyDown,
  onDoubleClick,
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.icon} style={{ backgroundColor: color }}>
        {icon}
      </div>
      {isEditing ? (
        <Input
          value={editValue}
          onChange={onLabelChange}
          onBlur={onLabelBlur}
          onKeyDown={onLabelKeyDown}
          className={styles.labelInput}
          autoFocus
        />
      ) : (
        <div className={styles.label} onDoubleClick={onDoubleClick}>
          {label || 'Untitled'}
        </div>
      )}
    </div>
  );
};

export default NodeHeader;
