import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ApiOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './ApiNode.module.scss';

interface ApiNodeData {
  label: string;
  // New unified request object for API node
  request?: {
    method?: string;
    url?: string;
    params?: { key: string; value: string }[];
    headers?: { key: string; value: string }[];
    bodyMode?: 'none' | 'json' | 'raw' | 'formdata';
    bodyJson?: string;
    bodyRaw?: string;
    formData?: { key: string; value: string }[];
    auth?: {
      type?: 'none' | 'bearer' | 'basic' | 'apikey';
      bearer?: string;
      basic?: { user?: string; pass?: string };
      apiKey?: { in?: 'header' | 'query'; name?: string; key?: string };
    };
    capture?: { object?: string; variable?: string };
    failureLabel?: string;
    enableFailure?: boolean;
  };
  __editingLabel?: boolean;
}

export default function ApiNode({ id, data, selected }: NodeProps<ApiNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || 'API Call');

  useEffect(() => {
    setEditing(!!data.__editingLabel);
  }, [data.__editingLabel]);
  const method = data.request?.method || 'GET';
  const url = data.request?.url || 'https://api.example.com';

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return '#10b981';    // green
      case 'POST': return '#3b82f6';   // blue
      case 'PUT': return '#f59e0b';    // yellow
      case 'PATCH': return '#8b5cf6';  // purple
      case 'DELETE': return '#ef4444'; // red
      default: return '#6b7280';       // gray
    }
  };

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
    setLabel(data.label || 'API Call');
  }, [data.label]);

  const methodColor = getMethodColor(method);

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <NodeHeader
        icon={<ApiOutlined style={{ color: 'white', fontSize: '12px' }} />}
        label={data.label || 'API Call'}
        color={methodColor}
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
        <div className={styles.node__contentRow}>
          <span 
            className={styles.methodTag}
            style={{ backgroundColor: methodColor }}
          >
            {method}
          </span>
          <span className={styles.url} title={url}>{url}</span>
        </div>
      </div>

      {/* Top handle (input) */}
      <Handle 
        type="target" 
        position={Position.Top}
        className={`${styles.handle} ${styles['handle--top']}`}
      />
      
      {/* Success handle (left side) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className={`${styles.handle} ${styles['handle--success']}`}
        style={{
          left: data.request?.enableFailure === true ? '25%' : '50%',
        }}
      />
      {/* Success label */}
      <div
        className={`${styles.pathLabel} ${styles['pathLabel--success']}`}
        style={{
          left: data.request?.enableFailure === true ? '25%' : '50%',
        }}
      >
        Success
      </div>
      
      {/* Failure handle (right side) - Only show if enabled */}
      {data.request?.enableFailure === true && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="error"
            className={`${styles.handle} ${styles['handle--failure']}`}
            style={{
              left: '75%',
            }}
          />
          <div
            className={`${styles.pathLabel} ${styles['pathLabel--failure']}`}
            style={{
              left: '75%',
            }}
          >
            {data.request?.failureLabel || 'Failure'}
          </div>
        </>
      )}
    </div>
  );
}
