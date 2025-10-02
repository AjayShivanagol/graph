import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Input } from "antd";
import { createPortal } from "react-dom";
import { useAppSelector } from "../../store/hooks";

export interface ValueInputHandle {
  focus: () => void;
  getSelection: () => { start: number; end: number };
  setSelection: (start: number, end: number) => void;
  wrapSelection: (
    prefix: string,
    suffix: string,
    options?: { placeholder?: string }
  ) => void;
}

interface ValueInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: "small" | "middle" | "large";
  className?: string;
  onBlur?: (value: string) => void;
  onPressEnter?: (value: string) => void;
  onVariableSelected?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  textarea?: boolean;
  autoSize?: { minRows?: number; maxRows?: number };
}

const ValueInput = forwardRef<ValueInputHandle, ValueInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "value or {var}",
      size = "small",
      className,
      onBlur,
      onPressEnter,
      onVariableSelected,
      disabled = false,
      readOnly = false,
      textarea = false,
      autoSize,
    },
    ref
  ) => {
    const variables = useAppSelector((s) => s.variables?.list || []);
    const [showVariableDropdown, setShowVariableDropdown] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [variableSearch, setVariableSearch] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });
    const inputRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    const getInputElement = () => {
      if (!inputRef.current) return null;
      if ("input" in inputRef.current && inputRef.current.input) {
        return inputRef.current.input as HTMLInputElement;
      }
      if (inputRef.current?.resizableTextArea?.textArea) {
        return inputRef.current.resizableTextArea
          .textArea as HTMLTextAreaElement;
      }
      return inputRef.current as HTMLInputElement;
    };

    const getCurrentValue = () => {
      const el = getInputElement();
      return el?.value ?? value;
    };

    useEffect(() => {
      if (showVariableDropdown) {
        const el = getInputElement();
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 2,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, [showVariableDropdown]);

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      if (disabled || readOnly) {
        return;
      }

      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart || 0;

      onChange?.(newValue);
      setCursorPosition(cursorPos);

      if (newValue[cursorPos - 1] === "{") {
        setShowVariableDropdown(true);
        setVariableSearch("");
      } else if (showVariableDropdown) {
        const beforeCursor = newValue.substring(0, cursorPos);
        const lastOpenBrace = beforeCursor.lastIndexOf("{");

        if (lastOpenBrace >= 0) {
          const searchTerm = beforeCursor.substring(lastOpenBrace + 1);
          if (searchTerm.includes("}") || searchTerm.includes(" ")) {
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
      const currentValue = getCurrentValue();
      const beforeCursor = currentValue.substring(0, cursorPosition);
      const afterCursor = currentValue.substring(cursorPosition);
      const lastOpenBrace = beforeCursor.lastIndexOf("{");

      if (lastOpenBrace >= 0) {
        const newValue =
          currentValue.substring(0, lastOpenBrace + 1) +
          variableName +
          "}" +
          afterCursor;

        onChange?.(newValue);
        onVariableSelected?.(newValue);
        setShowVariableDropdown(false);

        setTimeout(() => {
          const el = getInputElement();
          if (!el) return;
          el.focus();
          const newCursorPos = lastOpenBrace + variableName.length + 2;
          el.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPosition(newCursorPos);
        }, 0);
      }
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      if (e.key === "Escape") {
        setShowVariableDropdown(false);
      }
    };

    const handleBlur = () => {
      const currentValue = getCurrentValue();
      onBlur?.(currentValue);
      setTimeout(() => {
        setShowVariableDropdown(false);
      }, 200);
    };

    const handlePressEnter = (
      e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const currentValue = getCurrentValue();
      onPressEnter?.(currentValue);
    };

    const filteredVariables = variables.filter((variable) =>
      variable.toLowerCase().includes(variableSearch.toLowerCase())
    );

    const renderDropdown = () => {
      if (!showVariableDropdown || filteredVariables.length === 0) return null;

      return createPortal(
        <div
          style={{
            position: "absolute",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 2147483647,
            backgroundColor: "white",
            border: "1px solid #d9d9d9",
            borderRadius: "6px",
            boxShadow:
              "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {filteredVariables.map((variable) => (
            <div
              key={variable}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "14px",
                borderBottom:
                  filteredVariables.indexOf(variable) ===
                  filteredVariables.length - 1
                    ? "none"
                    : "1px solid #f0f0f0",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => handleVariableSelect(variable)}
            >
              {variable}
            </div>
          ))}
        </div>,
        document.body
      );
    };

    useImperativeHandle(ref, () => ({
      focus: () => {
        const el = getInputElement();
        el?.focus();
      },
      getSelection: () => {
        const el = getInputElement();
        if (!el) return { start: 0, end: 0 };
        return {
          start: el.selectionStart ?? 0,
          end: el.selectionEnd ?? 0,
        };
      },
      setSelection: (start: number, end: number) => {
        const el = getInputElement();
        if (!el) return;
        el.focus();
        el.setSelectionRange(start, end);
        setCursorPosition(end);
      },
      wrapSelection: (prefix: string, suffix: string, options) => {
        const el = getInputElement();
        if (!el) return;
        const currentValue = getCurrentValue();
        const selectionStart = el.selectionStart ?? currentValue.length;
        const selectionEnd = el.selectionEnd ?? currentValue.length;
        const selectedText = currentValue.slice(selectionStart, selectionEnd);
        const placeholder = options?.placeholder ?? "";
        const content = selectedText || placeholder;
        const nextValue =
          currentValue.slice(0, selectionStart) +
          prefix +
          content +
          suffix +
          currentValue.slice(selectionEnd);

        onChangeRef.current?.(nextValue);

        const cursorStart = selectionStart + prefix.length;
        const cursorEnd = cursorStart + content.length;

        requestAnimationFrame(() => {
          const node = getInputElement();
          if (!node) return;
          node.focus();
          node.setSelectionRange(cursorStart, cursorEnd);
          setCursorPosition(cursorEnd);
        });
      },
    }));

    const handleKeyDownWrapper = (
      e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      handleKeyDown(e);
      if (e.key === "Enter" && !textarea) {
        handlePressEnter(e);
      }
    };

    const inputNode = textarea ? (
      <Input.TextArea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownWrapper}
        autoSize={autoSize || { minRows: 3, maxRows: 6 }}
        disabled={disabled}
        readOnly={readOnly}
      />
    ) : (
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        size={size}
        className={className}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownWrapper}
        onPressEnter={handlePressEnter}
        disabled={disabled}
        readOnly={readOnly}
      />
    );

    return (
      <>
        {inputNode}
        {renderDropdown()}
      </>
    );
  }
);

ValueInput.displayName = "ValueInput";

export default ValueInput;
