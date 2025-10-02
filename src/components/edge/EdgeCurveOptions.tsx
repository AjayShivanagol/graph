import React from 'react';
import './edge-styles.scss';

interface EdgeCurveOptionsProps {
  onCurveSelect: (curveType: string) => void;
  onClose: () => void;
}

const curveOptions = [
  {
    type: 'default',
    label: 'Default',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path 
          d="M2 8C4 4 12 12 14 8" 
          stroke="#3b82f6" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  },
  {
    type: 'straight',
    label: 'Straight',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path 
          d="M2 8L14 8" 
          stroke="#10b981" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
      </svg>
    )
  },
  {
    type: 'smoothstep',
    label: 'Smooth',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path 
          d="M2 8L6 8C6.5 8 7 7.5 7 7L7 5C7 4.5 7.5 4 8 4L8 4C8.5 4 9 4.5 9 5L9 11C9 11.5 9.5 12 10 12L14 12" 
          stroke="#f59e0b" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    type: 'step',
    label: 'Step',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path 
          d="M2 8L6 8L6 5L10 5L10 11L14 11" 
          stroke="#ef4444" 
          strokeWidth="1.5" 
          strokeLinecap="square" 
          strokeLinejoin="miter"
        />
      </svg>
    )
  }
];

export default function EdgeCurveOptions({ onCurveSelect, onClose }: EdgeCurveOptionsProps) {
  return (
    <div className="edge-curve-options">
      <div className="edge-curve-options__title">Select Curve</div>
      <div className="edge-curve-options__list">
        {curveOptions.map((option) => (
          <button
            key={option.type}
            className="edge-curve-options__option"
            onClick={() => {
              onCurveSelect(option.type);
              onClose();
            }}
          >
            <div className="edge-curve-options__option-icon">
              {option.icon}
            </div>
            <span className="edge-curve-options__option-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
