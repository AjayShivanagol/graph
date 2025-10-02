import React from 'react';
import { 
  getBezierPath, 
  getStraightPath,
  getSmoothStepPath,
  EdgeProps, 
  EdgeLabelRenderer,
  BaseEdge 
} from 'reactflow';
import { useAppDispatch } from '../../store/hooks';
import { updateEdge } from '../../store/slices/workflowSlice';
import InlineEditableLabel from './InlineEditableLabel';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  label,
  labelStyle,
  markerEnd,
}: EdgeProps) {
  const dispatch = useAppDispatch();

  // Determine the curve type from data or default to smooth bezier
  const curveType = data?.curveType || 'default';
  
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  // Use different path functions based on curve type
  switch (curveType) {
    case 'straight':
      [edgePath, labelX, labelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      break;
    case 'step':
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0, // Sharp corners for step
      });
      break;
    case 'smoothstep':
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      break;
    case 'default':
    case 'smooth':
    default:
      [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      break;
  }

  const handleLabelChange = (newLabel: string) => {
    dispatch(updateEdge({
      id,
      updates: { 
        label: newLabel,
        labelStyle: { 
          fill: '#666', 
          fontWeight: 500, 
          fontSize: 12,
          background: 'white',
          padding: '2px 4px',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }
      }
    }));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <InlineEditableLabel
            label={label as string}
            onLabelChange={handleLabelChange}
            edgeId={id}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
