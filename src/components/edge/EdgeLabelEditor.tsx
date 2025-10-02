import React, { useState } from 'react';
import './edge-styles.scss';

interface EdgeLabelEditorProps {
  currentLabel?: string;
  onLabelSave: (label: string) => void;
  onClose: () => void;
}

export default function EdgeLabelEditor({ currentLabel = '', onLabelSave, onClose }: EdgeLabelEditorProps) {
  const [label, setLabel] = useState(currentLabel);

  const handleSave = () => {
    onLabelSave(label);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="edge-label-editor">
      <div className="edge-label-editor__title">Edge Label</div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Enter label..."
        className="edge-label-editor__input"
        autoFocus
      />
      <div className="edge-label-editor__actions">
        <button
          onClick={handleSave}
          className="edge-label-editor__button edge-label-editor__button--primary"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="edge-label-editor__button edge-label-editor__button--secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
