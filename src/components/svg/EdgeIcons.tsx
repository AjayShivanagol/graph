import React from 'react';

export const ColorIcon = () => (
  <div className="color-icon" />
);

export const CurveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M2 8C4 4 12 12 14 8" 
      stroke="#6b7280" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const LabelIcon = () => (
  <div className="label-icon">A</div>
);

export const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M5.5 3V2.5C5.5 1.67 6.17 1 7 1h2c.83 0 1.5.67 1.5 1.5V3h3.5c.28 0 .5.22.5.5s-.22.5-.5.5H13v9c0 .83-.67 1.5-1.5 1.5h-7C3.67 14.5 3 13.83 3 13V4h-.5C2.22 4 2 3.78 2 3.5S2.22 3 2.5 3H5.5zM6.5 3h3V2.5c0-.28-.22-.5-.5-.5H7c-.28 0-.5.22-.5.5V3zM4 4v9c0 .28.22.5.5.5h7c.28 0 .5-.22.5-.5V4H4z" 
      fill="#6b7280"
    />
    <path 
      d="M6.5 6c.28 0 .5.22.5.5v5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5z" 
      fill="#6b7280"
    />
    <path 
      d="M9.5 6c.28 0 .5.22.5.5v5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5z" 
      fill="#6b7280"
    />
  </svg>
);
