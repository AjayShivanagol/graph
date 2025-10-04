import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { EditOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode } from '../../../store/slices/workflowSlice';
import { NodeHeader } from './shared/NodeHeader';
import styles from './CaptureNode.module.scss';

type CaptureMode = 'entities' | 'reply';

interface CaptureEntitySummary {
  id: string;
  entity: string;
  variable?: string;
  required: boolean;
}

interface CaptureNoReplySummary {
  enabled: boolean;
  timeout?: number;
  prompt?: string;
}

interface CaptureAutoRepromptSummary {
  enabled?: boolean;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface CaptureNodeData {
  label: string;
  variable?: string;
  prompt?: string;
  validation?: string;
  captureMode?: CaptureMode;
  entities?: CaptureEntitySummary[];
  listenForOtherTriggers?: boolean;
  noReply?: CaptureNoReplySummary;
  autoReprompt?: CaptureAutoRepromptSummary;
  exitPathEnabled?: boolean;
  __editingLabel?: boolean;
}

const normalizeCaptureEntities = (input: any): CaptureEntitySummary[] => {
  if (!Array.isArray(input)) return [];
  return input.map((entry, index) => {
    const fallbackId = `capture-entity-${index}`;
    if (!entry || typeof entry !== 'object') {
      return {
        id: fallbackId,
        entity: '',
        variable: undefined,
        required: true,
      };
    }

    const rawEntity =
      typeof entry.entity === 'string'
        ? entry.entity
        : typeof entry.name === 'string'
        ? entry.name
        : '';
    const rawVariable =
      typeof entry.variable === 'string'
        ? entry.variable
        : typeof entry.slot === 'string'
        ? entry.slot
        : '';

    return {
      id: typeof entry.id === 'string' ? entry.id : fallbackId,
      entity: rawEntity.trim(),
      variable: rawVariable.trim() || undefined,
      required: entry.required === false ? false : true,
    };
  });
};

export default function CaptureNode({ data, selected, id }: NodeProps<CaptureNodeData>) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(!!data.__editingLabel);
  const [label, setLabel] = useState(data.label || 'Capture');
  const captureMode: CaptureMode =
    data.captureMode === 'reply' ? 'reply' : 'entities';
  const entities = useMemo(() => normalizeCaptureEntities(data.entities), [
    data.entities,
  ]);

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
        {captureMode === 'entities' ? (
          <div className={styles.entityList}>
            {entities.length === 0 ? (
              <div className={styles.entityEmpty}>Configure entities to capture</div>
            ) : (
              entities.map((entity) => (
                <div key={entity.id} className={styles.entityRow}>
                  <div className={styles.entityName}>
                    {entity.entity || 'Select entity'}
                  </div>
                  <div className={styles.entityVariable}>
                    {entity.variable ? `{${entity.variable}}` : 'No variable'}
                  </div>
                  <div
                    className={
                      entity.required
                        ? styles.entityRequired
                        : styles.entityOptional
                    }
                  >
                    {entity.required ? 'Required' : 'Optional'}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.row}>
            <div className={styles.kvLabel}>Variable:</div>
            <div className={styles.badgeMono}>
              {data.variable || 'user_input'}
            </div>
          </div>
        )}
        {data.validation && (
          <div className={styles.validation}>
            Validation: {data.validation}
          </div>
        )}
        {(data.listenForOtherTriggers ||
          data.noReply?.enabled ||
          (captureMode === 'entities' && data.autoReprompt?.enabled) ||
          (captureMode === 'entities' && data.exitPathEnabled)) && (
          <div className={styles.metaRow}>
            {data.listenForOtherTriggers && (
              <span className={styles.metaBadge}>
                Listening for other triggers
              </span>
            )}
            {data.noReply?.enabled && (
              <span className={styles.metaBadge}>
                No reply{' '}
                {data.noReply?.timeout ? `(${data.noReply.timeout}s)` : ''}
              </span>
            )}
            {captureMode === 'entities' && data.autoReprompt?.enabled && (
              <span className={styles.metaBadge}>Auto reprompt</span>
            )}
            {captureMode === 'entities' && data.exitPathEnabled && (
              <span className={styles.metaBadge}>Exit path</span>
            )}
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
