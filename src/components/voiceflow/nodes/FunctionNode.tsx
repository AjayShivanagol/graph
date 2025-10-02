import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CodeOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './FunctionNode.module.scss';

interface FunctionNodeData {
  label: string;
  code?: string;
  __editingLabel?: boolean;
}

export default function FunctionNode({ id, data, selected }: NodeProps<FunctionNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || 'Function');

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);
  
  const codePreview: string = (data.code ?? 'function handler(input) {\n  // TODO: implement\n  return input;\n}')
    .split('\n').slice(0, 4).join('\n');

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
    setLabel(data.label || 'Function');
  }, [data.label]);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <NodeHeader
        icon={<CodeOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'Function'}
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
        <div className={styles.codePreview}>
          {codePreview}
          {((data.code ?? '').split('\n').length > 4) && (
            <span className={styles.ellipsis}>\n…</span>
          )}
        </div>
      </div>

      {/* Top handle */}
      <Handle 
        type="target" 
        position={Position.Top}
        className={`${styles.handle} ${styles['handle--top']}`}
      />
      
      {/* Bottom handle */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        className={`${styles.handle} ${styles['handle--bottom']}`}
      />
    </div>
  );
}
