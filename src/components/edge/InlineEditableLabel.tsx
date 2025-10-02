import React, { useState, useRef, useEffect } from 'react';
import './edge-styles.scss';

interface InlineEditableLabelProps {
  label?: string;
  onLabelChange: (label: string) => void;
  edgeId: string;
}

export default function InlineEditableLabel({ 
  label = '', 
  onLabelChange, 
  edgeId 
}: InlineEditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentLabel, setCurrentLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentLabel(label);
  }, [label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onLabelChange(currentLabel);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentLabel(label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    handleSave();
  };

  if (!label && !isEditing) {
    return null;
  }

  return (
    <div 
      className={`edge-inline-label ${isEditing ? 'edge-inline-label--editing' : ''}`}
      onClick={handleClick}
      data-edge-id={edgeId}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={currentLabel}
          onChange={(e) => setCurrentLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="edge-inline-label__input"
          size={Math.max(currentLabel.length, 3)}
        />
      ) : (
        <span>{label || 'Click to edit'}</span>
      )}
    </div>
  );
}
