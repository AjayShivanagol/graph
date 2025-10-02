import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input, Space, Tooltip } from "antd";
import {
  AimOutlined,
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
} from "@ant-design/icons";
import { createPortal } from "react-dom";
import clsx from "clsx";
import type { InputRef } from "antd/es/input";
import { useAppSelector } from "../../store/hooks";
import styles from "./RichTextEditor.module.scss";

type FormatCommand = "bold" | "italic" | "underline" | "strikeThrough";

export interface RichTextEditorHandle {
  focus: () => void;
  applyFormat: (command: FormatCommand) => void;
}

const initialFormatState = () => ({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
});

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const markdownToHtml = (markdown: string) => {
  if (!markdown) return "";

  let html = escapeHtml(markdown).replace(/\r\n?/g, "\n");

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<u>$1</u>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(
    /&#123;([^#]+?)&#125;/g,
    (_match, name) =>
      `<span data-variable="true" data-name="${name}">{${name}}</span>`
  );

  html = html.replace(/\n/g, "<br/>");

  return html;
};

const htmlToMarkdown = (html: string) => {
  if (!html) return "";

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  const serializeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const element = node as HTMLElement;
    const tag = element.tagName;

    const serializeChildren = () => {
      let content = "";
      element.childNodes.forEach((child) => {
        content += serializeNode(child);
      });
      return content;
    };

    switch (tag) {
      case "BR":
        return "\n";
      case "P":
      case "DIV": {
        const content = serializeChildren();
        return content.length ? `${content}\n` : "\n";
      }
      case "STRONG":
      case "B":
        return `**${serializeChildren()}**`;
      case "EM":
      case "I":
        return `_${serializeChildren()}_`;
      case "U":
        return `__${serializeChildren()}__`;
      case "DEL":
      case "S":
      case "STRIKE":
        return `~~${serializeChildren()}~~`;
      case "A": {
        const href = element.getAttribute("href") || "";
        const label = serializeChildren();
        return href ? `[${label}](${href})` : label;
      }
      case "SPAN": {
        if (element.dataset.variable === "true") {
          const dataName = element.dataset.name;
          if (dataName) return `{${dataName}}`;
          const raw = serializeChildren();
          return raw.startsWith("{") && raw.endsWith("}") ? raw : `{${raw}}`;
        }

        const textDecoration = (
          element.style.textDecoration ||
          element.style.textDecorationLine ||
          ""
        ).toLowerCase();
        const fontWeight = element.style.fontWeight || "";
        const fontStyle = (element.style.fontStyle || "").toLowerCase();

        let content = serializeChildren();

        if (textDecoration.includes("underline")) {
          content = `__${content}__`;
        }
        if (textDecoration.includes("line-through")) {
          content = `~~${content}~~`;
        }
        if (fontWeight && fontWeight !== "normal") {
          content = `**${content}**`;
        }
        if (fontStyle === "italic") {
          content = `_${content}_`;
        }

        return content;
      }
      default:
        return serializeChildren();
    }
  };

  let markdown = "";
  wrapper.childNodes.forEach((child) => {
    markdown += serializeNode(child);
  });

  markdown = markdown.replace(/\u00A0/g, " ");
  markdown = markdown.replace(/\n{3,}/g, "\n\n");

  return markdown.trimEnd();
};

const RichTextEditor = React.forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(({ value, onChange, placeholder, className, onBlur }, ref) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const skipSyncRef = useRef(false);
  const variableAnchorRef = useRef<Range | null>(null);
  const linkButtonRef = useRef<HTMLButtonElement | null>(null);
  const linkPopoverRef = useRef<HTMLDivElement | null>(null);
  const linkLabelInputRef = useRef<InputRef | null>(null);
  const linkUrlInputRef = useRef<InputRef | null>(null);

  const variables = useAppSelector((state) => state.variables?.list || []);

  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(() => !value);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const [variableSearch, setVariableSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 240,
  });
  const [formatState, setFormatState] = useState(initialFormatState);
  const [linkPopoverPosition, setLinkPopoverPosition] = useState(() => ({
    top: 0,
    left: 0,
  }));

  const linkPopoverWidth = 260;

  const syncEditorHtml = useCallback((markdown: string) => {
    if (!editorRef.current) return;
    const html = markdownToHtml(markdown);
    editorRef.current.innerHTML = html || "";
    setIsEmpty(!markdown || !markdown.trim());
  }, []);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      setIsEmpty(!value || !value.trim());
      return;
    }
    syncEditorHtml(value || "");
  }, [value, syncEditorHtml]);

  const queryCommandStateForRange = useCallback(
    (command: FormatCommand, range?: Range | null) => {
      if (typeof document === "undefined") return false;
      const selection = window.getSelection();
      if (!selection) return false;

      let previousRanges: Range[] | null = null;
      if (range) {
        previousRanges = [];
        for (let index = 0; index < selection.rangeCount; index += 1) {
          previousRanges.push(selection.getRangeAt(index).cloneRange());
        }
        selection.removeAllRanges();
        selection.addRange(range);
      }

      let result = false;
      try {
        result = document.queryCommandState(command) ?? false;
      } catch (error) {
        result = false;
      }

      if (previousRanges) {
        selection.removeAllRanges();
        previousRanges.forEach((prevRange) => selection.addRange(prevRange));
      }

      return result;
    },
    []
  );

  const updateFormatState = useCallback(
    (range?: Range | null) => {
      if (!editorRef.current) {
        setFormatState(initialFormatState());
        return;
      }

      const selection = window.getSelection();
      const liveRange =
        range ||
        (selection && selection.rangeCount > 0
          ? selection.getRangeAt(0)
          : null);

      if (!liveRange || !editorRef.current.contains(liveRange.commonAncestorContainer)) {
        if (selectionRef.current) {
          setFormatState({
            bold: queryCommandStateForRange("bold", selectionRef.current),
            italic: queryCommandStateForRange("italic", selectionRef.current),
            underline: queryCommandStateForRange("underline", selectionRef.current),
            strikeThrough: queryCommandStateForRange(
              "strikeThrough",
              selectionRef.current
            ),
          });
        } else {
          setFormatState(initialFormatState());
        }
        return;
      }

      setFormatState({
        bold: queryCommandStateForRange("bold"),
        italic: queryCommandStateForRange("italic"),
        underline: queryCommandStateForRange("underline"),
        strikeThrough: queryCommandStateForRange("strikeThrough"),
      });
    },
    [queryCommandStateForRange]
  );

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
    selectionRef.current = range.cloneRange();
    updateFormatState();
  }, [updateFormatState]);

  const restoreSelection = useCallback(() => {
    const range = selectionRef.current;
    const selection = window.getSelection();
    if (!range || !selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  useEffect(() => {
    const handler = () => saveSelection();
    document.addEventListener("selectionchange", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
    };
  }, [saveSelection]);

  const emitChange = useCallback(
    (markdown: string) => {
      skipSyncRef.current = true;
      setIsEmpty(!markdown || !markdown.trim());
      onChange(markdown);
    },
    [onChange]
  );

  const updateVariableDropdownPosition = useCallback(() => {
    if (!showVariableDropdown) return;
    const anchor = variableAnchorRef.current;
    const selection = window.getSelection();

    if (
      !editorRef.current ||
      !anchor ||
      !selection ||
      selection.rangeCount === 0
    ) {
      setShowVariableDropdown(false);
      return;
    }

    const caretRange = selection.getRangeAt(0).cloneRange();
    if (!editorRef.current.contains(caretRange.commonAncestorContainer)) {
      setShowVariableDropdown(false);
      return;
    }

    const searchRange = caretRange.cloneRange();
    try {
      searchRange.setStart(anchor.startContainer, anchor.startOffset + 1);
    } catch (error) {
      setShowVariableDropdown(false);
      return;
    }

    const typed = searchRange.toString();
    if (typed.includes(" ") || typed.includes("{") || typed.includes("}")) {
      setShowVariableDropdown(false);
      return;
    }

    setVariableSearch(typed);

    const rect = caretRange.getBoundingClientRect();
    const referenceRect =
      rect.width || rect.height
        ? rect
        : editorRef.current.getBoundingClientRect();

    setDropdownPosition({
      top: referenceRect.bottom + window.scrollY + 4,
      left: referenceRect.left + window.scrollX,
      width: referenceRect.width || editorRef.current.clientWidth,
    });
  }, [showVariableDropdown]);

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const nativeEvent = event.nativeEvent as InputEvent;
      const editor = editorRef.current;
      if (!editor) return;

      saveSelection();

      if (nativeEvent.inputType === "insertText" && nativeEvent.data === "{") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0).cloneRange();
          try {
            range.setStart(
              range.startContainer,
              Math.max(range.startOffset - 1, 0)
            );
            variableAnchorRef.current = range;
            setShowVariableDropdown(true);
            setVariableSearch("");
            const rect = range.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX,
              width: rect.width || editor.clientWidth,
            });
          } catch (error) {
            variableAnchorRef.current = null;
          }
        }
      }

      const html = editor.innerHTML;
      const markdown = htmlToMarkdown(html);
      emitChange(markdown);

      if (showVariableDropdown) {
        updateVariableDropdownPosition();
      }
      updateFormatState();
    },
    [
      emitChange,
      saveSelection,
      showVariableDropdown,
      updateVariableDropdownPosition,
      updateFormatState,
    ]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    saveSelection();
    updateFormatState();
  }, [saveSelection, updateFormatState]);

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      setIsFocused(false);
      setTimeout(() => {
        setShowVariableDropdown(false);
        variableAnchorRef.current = null;
      }, 150);
      setFormatState(initialFormatState());
      onBlur?.(event);
    },
    [onBlur]
  );

  const focusEditor = useCallback(() => {
    editorRef.current?.focus({ preventScroll: true });
    restoreSelection();
  }, [restoreSelection]);

  const applyCommand = useCallback(
    (command: FormatCommand) => {
      focusEditor();
      document.execCommand(command, false);
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        emitChange(htmlToMarkdown(html));
        saveSelection();
        updateFormatState();
      }
    },
    [focusEditor, emitChange, saveSelection, updateFormatState]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      focus: focusEditor,
      applyFormat: applyCommand,
    }),
    [focusEditor, applyCommand]
  );

  const filteredVariables = variables.filter((variable) =>
    variable.toLowerCase().includes(variableSearch.toLowerCase())
  );

  const handleVariableSelect = useCallback(
    (variableName: string) => {
      focusEditor();
      const selection = window.getSelection();
      const editor = editorRef.current;
      if (!selection || !editor) return;

      let range: Range | null = null;
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0).cloneRange();
      }
      const anchor = variableAnchorRef.current;

      if (anchor) {
        if (range) {
          try {
            anchor.setEnd(range.endContainer, range.endOffset);
          } catch (error) {
            anchor.collapse(true);
          }
        }
        range = anchor;
      }

      if (!range) return;

      range.deleteContents();
      const span = document.createElement("span");
      span.textContent = `{${variableName}}`;
      span.setAttribute("data-variable", "true");
      span.setAttribute("data-name", variableName);
      span.contentEditable = "false";
      span.classList.add(styles.variableTag);
      range.insertNode(span);

      const after = document.createRange();
      after.setStartAfter(span);
      after.collapse(true);

      const liveSelection = window.getSelection();
      if (liveSelection) {
        liveSelection.removeAllRanges();
        liveSelection.addRange(after);
      }
      saveSelection();

      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        emitChange(htmlToMarkdown(html));
      }

      setShowVariableDropdown(false);
      variableAnchorRef.current = null;
      updateFormatState();
    },
    [emitChange, focusEditor, saveSelection, updateFormatState]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && showVariableDropdown) {
        event.preventDefault();
        setShowVariableDropdown(false);
        variableAnchorRef.current = null;
      }
      saveSelection();
    },
    [saveSelection, showVariableDropdown]
  );

  const handleKeyUp = useCallback(() => {
    if (showVariableDropdown) {
      updateVariableDropdownPosition();
    }
    saveSelection();
  }, [saveSelection, showVariableDropdown, updateVariableDropdownPosition]);

  const handleMouseUp = useCallback(() => {
    saveSelection();
  }, [saveSelection]);

  const handleToolbarMouseDown = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      focusEditor();
      saveSelection();
    },
    [focusEditor, saveSelection]
  );

  const findAnchorInRange = useCallback(
    (range: Range | null) => {
      if (!range || !editorRef.current) return null;

      const findAncestor = (node: Node | null): HTMLAnchorElement | null => {
        let current: Node | null = node;
        while (current && current !== editorRef.current) {
          if (current instanceof HTMLAnchorElement) {
            return current;
          }
          current = current.parentNode;
        }
        return null;
      };

      return (
        findAncestor(range.commonAncestorContainer) ||
        findAncestor(range.startContainer) ||
        findAncestor(range.endContainer)
      );
    },
    []
  );

  const closeLinkPopover = useCallback(() => {
    setShowLinkPopover(false);
    setLinkLabel("");
    setLinkUrl("");
  }, []);

  const updateLinkPopoverPosition = useCallback(() => {
    if (typeof window === "undefined" || !linkButtonRef.current) return;

    const rect = linkButtonRef.current.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportRight = scrollX + window.innerWidth;
    const horizontalPadding = 12;
    const desiredLeft =
      rect.left + scrollX - (linkPopoverWidth - rect.width) / 2;
    const minLeft = scrollX + horizontalPadding;
    const maxLeft = Math.max(
      minLeft,
      viewportRight - horizontalPadding - linkPopoverWidth
    );
    const constrainedLeft = Math.min(
      Math.max(desiredLeft, minLeft),
      maxLeft
    );

    setLinkPopoverPosition({
      top: rect.bottom + scrollY + 8,
      left: constrainedLeft,
    });
  }, [linkPopoverWidth]);

  const openLinkPopover = useCallback(() => {
    if (showLinkPopover) {
      closeLinkPopover();
      return;
    }

    saveSelection();
    const range = selectionRef.current;
    const existingAnchor = findAnchorInRange(range);

    if (existingAnchor) {
      setLinkLabel(existingAnchor.textContent || "");
      setLinkUrl(existingAnchor.getAttribute("href") || "");
    } else if (range) {
      const selectedText = range.toString();
      setLinkLabel(selectedText || "");
      setLinkUrl("");
    } else {
      setLinkLabel("");
      setLinkUrl("");
    }

    updateLinkPopoverPosition();
    setShowLinkPopover(true);
  }, [
    closeLinkPopover,
    findAnchorInRange,
    saveSelection,
    showLinkPopover,
    updateLinkPopoverPosition,
  ]);

  const applyLink = useCallback(() => {
    const trimmedUrl = linkUrl.trim();
    const trimmedLabel = linkLabel.trim();
    if (!trimmedUrl || !trimmedLabel) return;

    focusEditor();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const workingRange = selection.getRangeAt(0).cloneRange();
    const anchor = findAnchorInRange(selectionRef.current || workingRange);

    if (anchor) {
      anchor.href = trimmedUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = trimmedLabel;

      const after = document.createRange();
      after.setStartAfter(anchor);
      after.collapse(true);
      selection.removeAllRanges();
      selection.addRange(after);
    } else {
      workingRange.deleteContents();
      const anchorElement = document.createElement("a");
      anchorElement.href = trimmedUrl;
      anchorElement.target = "_blank";
      anchorElement.rel = "noopener noreferrer";
      anchorElement.textContent = trimmedLabel;
      workingRange.insertNode(anchorElement);

      const after = document.createRange();
      after.setStartAfter(anchorElement);
      after.collapse(true);
      selection.removeAllRanges();
      selection.addRange(after);
    }

    saveSelection();

    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      emitChange(htmlToMarkdown(html));
    }

    updateFormatState(selectionRef.current);
    closeLinkPopover();
  }, [
    closeLinkPopover,
    emitChange,
    findAnchorInRange,
    focusEditor,
    linkLabel,
    linkUrl,
    saveSelection,
    updateFormatState,
  ]);

  useEffect(() => {
    if (!showLinkPopover) return;
    updateLinkPopoverPosition();
  }, [showLinkPopover, updateLinkPopoverPosition]);

  useEffect(() => {
    if (!showLinkPopover) return;

    const handleResize = () => updateLinkPopoverPosition();
    const handleScroll = () => updateLinkPopoverPosition();

    window.addEventListener("resize", handleResize);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [showLinkPopover, updateLinkPopoverPosition]);

  useEffect(() => {
    if (!showLinkPopover) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        linkPopoverRef.current?.contains(target) ||
        linkButtonRef.current?.contains(target)
      ) {
        return;
      }
      closeLinkPopover();
    };

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [showLinkPopover, closeLinkPopover]);

  useEffect(() => {
    if (!showLinkPopover) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLinkPopover();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLinkPopover, closeLinkPopover]);

  useEffect(() => {
    if (!showLinkPopover) return;

    const timer = window.setTimeout(() => {
      linkLabelInputRef.current?.focus();
      if (linkLabel) {
        linkLabelInputRef.current?.select();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [showLinkPopover, linkLabel]);

  const renderVariableDropdown = () => {
    if (!showVariableDropdown || filteredVariables.length === 0) return null;

    return createPortal(
      <div
        className={styles.variableDropdown}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        {filteredVariables.map((variable) => (
          <button
            type="button"
            key={variable}
            className={styles.variableDropdownItem}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              handleVariableSelect(variable);
            }}
          >
            {variable}
          </button>
        ))}
      </div>,
      document.body
    );
  };

  const renderLinkPopover = () => {
    if (!showLinkPopover) return null;

    return createPortal(
      <div
        ref={linkPopoverRef}
        className={styles.linkPopoverPanel}
        style={{
          top: linkPopoverPosition.top,
          left: linkPopoverPosition.left,
          width: linkPopoverWidth,
        }}
      >
        <div className={styles.linkPopoverContent}>
          <Input
            ref={linkLabelInputRef}
            placeholder="Link text"
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            onPressEnter={(event) => {
              event.preventDefault();
              linkUrlInputRef.current?.focus();
            }}
            style={{ marginBottom: 8, height: 38 }}
          />
          <Input
            ref={linkUrlInputRef}
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            status={
              !linkUrl || linkUrl.startsWith("https://") ? undefined : "error"
            }
            onPressEnter={(event) => {
              event.preventDefault();
              applyLink();
            }}
            style={{ marginBottom: 12, height: 38 }}
          />
          <Button
            type="primary"
            block
            onClick={applyLink}
            disabled={
              !linkLabel.trim() ||
              !linkUrl.trim() ||
              !linkUrl.trim().startsWith("https://")
            }
          >
            Insert link
          </Button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={clsx(styles.richTextEditor, className)}>
      <div className={styles.toolbar}>
        <Space size="small">
          <Tooltip title="Bold">
            <Button
              type="text"
              icon={<BoldOutlined />}
              onMouseDown={handleToolbarMouseDown}
              onClick={() => applyCommand("bold")}
              className={clsx(styles.toolbarButton, {
                [styles.toolbarButtonActive]: formatState.bold,
              })}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Italic">
            <Button
              type="text"
              icon={<ItalicOutlined />}
              onMouseDown={handleToolbarMouseDown}
              onClick={() => applyCommand("italic")}
              className={clsx(styles.toolbarButton, {
                [styles.toolbarButtonActive]: formatState.italic,
              })}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Underline">
            <Button
              type="text"
              icon={<UnderlineOutlined />}
              onMouseDown={handleToolbarMouseDown}
              onClick={() => applyCommand("underline")}
              className={clsx(styles.toolbarButton, {
                [styles.toolbarButtonActive]: formatState.underline,
              })}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Strikethrough">
            <Button
              type="text"
              icon={<StrikethroughOutlined />}
              onMouseDown={handleToolbarMouseDown}
              onClick={() => applyCommand("strikeThrough")}
              className={clsx(styles.toolbarButton, {
                [styles.toolbarButtonActive]: formatState.strikeThrough,
              })}
              size="small"
            />
          </Tooltip>

          <Tooltip title="Insert link">
            <Button
              ref={linkButtonRef}
              type="text"
              icon={<LinkOutlined />}
              onMouseDown={handleToolbarMouseDown}
              onClick={openLinkPopover}
              className={clsx(styles.toolbarButton, {
                [styles.toolbarButtonActive]: showLinkPopover,
              })}
              size="small"
            />
          </Tooltip>

          <Tooltip title="Insert variable">
            <Button
              type="text"
              icon={<AimOutlined />}
              onMouseDown={handleToolbarMouseDown}
              onClick={() => {
                setTimeout(() => {
                  focusEditor();
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return;
                  variableAnchorRef.current = selection
                    .getRangeAt(0)
                    .cloneRange();
                  setShowVariableDropdown(true);
                  setVariableSearch("");
                  const rect =
                    variableAnchorRef.current.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX,
                    width:
                      rect.width ||
                      editorRef.current?.clientWidth ||
                      dropdownPosition.width,
                  });
                });
              }}
              className={styles.toolbarButton}
              size="small"
            />
          </Tooltip>
        </Space>
      </div>

      <div
        className={styles.editorContainer}
        onClick={() => {
          focusEditor();
          saveSelection();
        }}
      >
        {placeholder && isEmpty && !isFocused && (
          <div className={styles.placeholder}>{placeholder}</div>
        )}
        <div
          ref={editorRef}
          className={styles.editor}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
        />
      </div>
      {renderLinkPopover()}
      {renderVariableDropdown()}
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;
