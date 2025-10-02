import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';
import { createPortal } from 'react-dom';
import { useAppSelector } from '../../store/hooks';

interface VariantTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
}

const VariantTextEditor: React.FC<VariantTextEditorProps> = ({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Enter variant text...',
  rows = 4
}) => {
  const variables = useAppSelector((s) => s.variables?.list || []);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [variableSearch, setVariableSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const textAreaRef = useRef<any>(null);

  // Update dropdown position when it becomes visible
  useEffect(() => {
    if (showVariableDropdown && textAreaRef.current) {
      const rect = textAreaRef.current.resizableTextArea?.textArea?.getBoundingClientRect();
      if (rect) {
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 2,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }
  }, [showVariableDropdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange?.(newValue);
    setCursorPosition(cursorPos);

    // Check if user just typed '{' 
    if (newValue[cursorPos - 1] === '{') {
      setShowVariableDropdown(true);
      setVariableSearch('');
    } else if (showVariableDropdown) {
      // Extract variable name being typed after '{'
      const beforeCursor = newValue.substring(0, cursorPos);
      const lastOpenBrace = beforeCursor.lastIndexOf('{');
      
      if (lastOpenBrace >= 0) {
        const searchTerm = beforeCursor.substring(lastOpenBrace + 1);
        // Close dropdown if '}' is found or space is typed
        if (searchTerm.includes('}') || searchTerm.includes(' ')) {
          setShowVariableDropdown(false);
        } else {
          setVariableSearch(searchTerm);
        }
      } else {
        setShowVariableDropdown(false);
      }
    }
  };

  const handleVariableSelect = (variableName: string) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const lastOpenBrace = beforeCursor.lastIndexOf('{');
    
    if (lastOpenBrace >= 0) {
      const newValue = 
        value.substring(0, lastOpenBrace + 1) + 
        variableName + 
        '}' + 
        afterCursor;
      
      onChange?.(newValue);
      setShowVariableDropdown(false);
      
      // Focus back to input and set cursor after the variable
      setTimeout(() => {
        if (textAreaRef.current?.resizableTextArea?.textArea) {
          textAreaRef.current.focus();
          const newCursorPos = lastOpenBrace + variableName.length + 2;
          textAreaRef.current.resizableTextArea.textArea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowVariableDropdown(false);
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow for variable selection
    setTimeout(() => {
      setShowVariableDropdown(false);
      onBlur?.();
    }, 200);
  };

  // Filter variables based on search term
  const filteredVariables = variables.filter(variable => 
    variable.toLowerCase().includes(variableSearch.toLowerCase())
  );

  // Render dropdown as portal
  const renderDropdown = () => {
    if (!showVariableDropdown || filteredVariables.length === 0) return null;

    return createPortal(
      <div
        style={{
          position: 'absolute',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 2147483647, // Maximum z-index to appear above everything
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}
      >
        {filteredVariables.map(variable => (
          <div
            key={variable}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              borderBottom: filteredVariables.indexOf(variable) === filteredVariables.length - 1 ? 'none' : '1px solid #f0f0f0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur
              handleVariableSelect(variable);
            }}
          >
            {variable}
          </div>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <Input.TextArea
        ref={textAreaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        style={{ width: '100%' }}
      />
      {renderDropdown()}
    </div>
  );
};

export default VariantTextEditor;