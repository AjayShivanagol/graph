import React from 'react';
import './edge-styles.scss';

interface EdgeColorPickerProps {
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

const predefinedColors = [
  '#94a3b8', // default gray
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export default function EdgeColorPicker({ onColorSelect, onClose }: EdgeColorPickerProps) {
  return (
    <div className="edge-color-picker">
      <div className="edge-color-picker__title">Select Color</div>
      <div className="edge-color-picker__grid">
        {predefinedColors.map((color) => (
          <button
            key={color}
            className="edge-color-picker__color-button"
            style={{ backgroundColor: color }}
            onClick={() => {
              onColorSelect(color);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );
}
