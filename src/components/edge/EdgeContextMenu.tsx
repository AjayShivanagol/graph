import React from 'react';
import './edge-styles.scss';

interface EdgeContextMenuProps {
  onColorClick: () => void;
  onCurveClick: () => void;
  onLabelClick: () => void;
  onDeleteClick: () => void;
  onClose: () => void;
}

const menuOptions = [
  {
    key: 'color',
    label: 'Color',
    icon: (
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #3b82f6 0%, #10b981 25%, #f59e0b 50%, #ef4444 75%, #8b5cf6 100%)',
        border: '1px solid #d1d5db'
      }}></div>
    )
  },
  {
    key: 'curve',
    label: 'Curve',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path 
          d="M2 8C4 4 12 12 14 8" 
          stroke="#6b7280" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  },
  {
    key: 'label',
    label: 'Label',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="6" width="14" height="4" rx="2" fill="none" stroke="#6b7280" strokeWidth="1.5"/>
        <text x="8" y="9" fontSize="7" fill="#6b7280" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="600">A</text>
      </svg>
    )
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 2h4c.55 0 1 .45 1 1v1h2c.55 0 1 .45 1 1s-.45 1-1 1H3c-.55 0-1-.45-1-1s.45-1 1-1h2V3c0-.55.45-1 1-1zM4 7h8l-.5 7c-.05.55-.5 1-1.05 1H5.55c-.55 0-1-.45-1.05-1L4 7z" fill="#ef4444"/>
      </svg>
    )
  }
];

export default function EdgeContextMenu({ 
  onColorClick, 
  onCurveClick, 
  onLabelClick, 
  onDeleteClick, 
  onClose 
}: EdgeContextMenuProps) {
  console.log('EdgeContextMenu rendered'); // Debug log
  
  const handleOptionClick = (key: string) => {
    switch (key) {
      case 'color':
        onColorClick();
        break;
      case 'curve':
        onCurveClick();
        break;
      case 'label':
        onLabelClick();
        break;
      case 'delete':
        onDeleteClick();
        break;
    }
  };

  return (
    <div className="edge-context-menu-options">
      <div className="edge-context-menu-options__list">
        {menuOptions.map((option) => (
          <button
            key={option.key}
            className="edge-context-menu-options__option"
            onClick={() => handleOptionClick(option.key)}
          >
            <div className="edge-context-menu-options__option-icon">
              {option.icon}
            </div>
            <span className="edge-context-menu-options__option-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
