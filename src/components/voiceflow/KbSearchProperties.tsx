import React, { useState, useEffect, useRef, useMemo } from "react";
import { Typography, Input, Slider, Switch, Divider } from "antd";
import type { InputRef } from "antd";
import VariablePicker from "../common/VariablePicker";
import { useAppSelector } from "../../store/hooks";

// Custom hook to handle clicks outside an element
const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const path: Node[] = (event as any).composedPath ? (event as any).composedPath() : [];
      const pathHTMLEls: HTMLElement[] = (path as unknown as HTMLElement[]) || [];
      const hasMenuTag = pathHTMLEls.some(
        (el) => el && (el as HTMLElement).dataset && (el as HTMLElement).dataset.insideMenu === "true"
      );
      const pathHasAntSlider = pathHTMLEls.some((el) => {
        if (!el) return false;
        const cls = (el as HTMLElement).className;
        const classStr = typeof cls === "string" ? cls : (cls && (cls as any).baseVal) || ""; // handle SVGAnimatedString
        return classStr.split(/\s+/).some((c) => c.startsWith("ant-slider"));
      });
      // Geometric fallback: if click is within the menu bounding box, treat as inside
      let inMenuBox = false;
      if (ref.current && 'clientX' in event && 'clientY' in event) {
        const rect = ref.current.getBoundingClientRect();
        const x = (event as MouseEvent).clientX;
        const y = (event as MouseEvent).clientY;
        inMenuBox = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      }
      const clickedInside = !!ref.current && (
        hasMenuTag ||
        pathHasAntSlider ||
        inMenuBox ||
        ref.current.contains(target) ||
        (Array.isArray(path) && path.some((n) => n instanceof Node && ref.current!.contains(n as Node)))
      );
      if (!clickedInside) {
        callback();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [ref, callback]);
};

interface KbSearchPropertiesProps {
  selectedNode: any;
  handleUpdateNode: (field: string, value: any) => void;
}

interface LocalState {
  question: string;
  variable: string;
  chunkLimit: number;
  notFoundPath: {
    enabled: boolean;
    label: string;
    minScore: number;
  };
  showNotFoundMenu: boolean;
}

export default function KbSearchProperties({
  selectedNode,
  handleUpdateNode,
}: KbSearchPropertiesProps) {
  const GRACE_MS = 2000;
  const menuRef = useRef<HTMLDivElement>(null);
  const suppressCloseRef = useRef(false);
  const interactingInsideRef = useRef(false);
  const ignoreUntilRef = useRef<number>(0);

  // Initialize state directly from Redux data
  const kbData = selectedNode.data.kbSearch || {};
  
  // Local state for controlled inputs to prevent focus loss
  const [localState, setLocalState] = useState<LocalState>(() => ({
    question: kbData.question || "",
    variable: kbData.variable || "",
    chunkLimit: kbData.chunkLimit || 3,
    notFoundPath: {
      enabled: kbData.notFoundPath?.enabled || false,
      label: kbData.notFoundPath?.label || "Not found",
      minScore: kbData.notFoundPath?.minScore || 80,
    },
    showNotFoundMenu: false,
  }));

  // Separate state for menu visibility to avoid interference
  // Always start closed; only open via user action (toggle ON or clicking label)
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  // Inline variable picker for Question
  const questionPickerRef = useRef<HTMLDivElement>(null);
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false);
  const questionInputRef = useRef<InputRef | null>(null);
  const questionCaretRef = useRef<number>(0);
  const [questionSearch, setQuestionSearch] = useState<string>('');

  // Note: we rely on antd Select's onOpenChange to close the Question variable picker

  // Helper functions for state management
  const updateLocal = (updates: Partial<LocalState>) => {
    setLocalState((prev) => ({ ...prev, ...updates }));
  };

  // Handle clicks outside menu
  useClickOutside(menuRef, () => {
    if (Date.now() < ignoreUntilRef.current) {
      // In the grace window after internal interaction
      return;
    }
    if (suppressCloseRef.current) {
      // Ignore the first outside click right after opening
      suppressCloseRef.current = false;
      return;
    }
    if (interactingInsideRef.current) {
      // Ignore closes while user is interacting (e.g., dragging slider)
      return;
    }
    if (localState.notFoundPath.enabled && menuVisible) {
      setMenuVisible(false);
    }
  });

  // Track global end of interactions to release the interacting flag
  useEffect(() => {
    const release = (event: MouseEvent | TouchEvent) => {
      const anyEvent = event as any;
      const path: HTMLElement[] = anyEvent.composedPath ? anyEvent.composedPath() : [];
      const inMenuOrSlider = path.some((el: any) => {
        if (!el) return false;
        const insideTag = el.dataset && el.dataset.insideMenu === 'true';
        const hasAntSlider = !!(el.classList && typeof el.classList.value === 'string' && el.classList.value.includes('ant-slider'));
        return insideTag || hasAntSlider;
      });
      if (inMenuOrSlider) {
        // Extend protection and keep interaction flag briefly
        suppressCloseRef.current = true;
        interactingInsideRef.current = true;
        ignoreUntilRef.current = Date.now() + GRACE_MS;
        setTimeout(() => {
          interactingInsideRef.current = false;
        }, 400);
      } else {
        // Ended outside; allow closes
        interactingInsideRef.current = false;
      }
    };
    document.addEventListener('mouseup', release, true);
    document.addEventListener('touchend', release, true);
    return () => {
      document.removeEventListener('mouseup', release, true);
      document.removeEventListener('touchend', release, true);
    };
  }, []);

  // Note: do not stopPropagation on menu container; allow slider to receive events.


  // Track node changes manually without useEffect
  const prevNodeId = useRef(selectedNode.id);
  if (prevNodeId.current !== selectedNode.id) {
    prevNodeId.current = selectedNode.id;
    const newKbData = selectedNode.data.kbSearch || {};
    // Reset state immediately when node changes
    setLocalState({
      question: newKbData.question || "",
      variable: newKbData.variable || "",
      chunkLimit: newKbData.chunkLimit || 3,
      notFoundPath: {
        enabled: newKbData.notFoundPath?.enabled || false,
        label: newKbData.notFoundPath?.label || "Not found",
        minScore: newKbData.notFoundPath?.minScore || 80,
      },
      showNotFoundMenu: false,
    });
    // Always start closed on node change
    setMenuVisible(false);
  }

  const syncToRedux = (updates: any) => {
    const kbSearchData = {
      ...selectedNode.data.kbSearch,
      ...updates,
    };
    handleUpdateNode("kbSearch", kbSearchData);
  };

  return (
    <div style={{ padding: "0" }}>
      {/* Divider after General section */}
      <Divider style={{ margin: "16px 0" }} />

      {/* Question */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Typography.Text
          style={{
            fontSize: 14,
            fontWeight: 500,
            display: "block",
            marginBottom: 8,
          }}
        >
          Question
        </Typography.Text>
        <Input
          ref={questionInputRef}
          value={localState.question}
          onChange={(e) => {
            const val = e.target.value;
            updateLocal({ question: val });
            // derive token after last '{' up to caret
            const el = e.currentTarget as HTMLInputElement;
            const pos = el.selectionStart ?? val.length;
            // keep caret cached for reliable insertion after dropdown clicks
            questionCaretRef.current = pos;
            const before = val.slice(0, pos);
            const lastBrace = before.lastIndexOf('{');
            if (lastBrace !== -1) {
              const tokenRaw = before.slice(lastBrace + 1);
              // If user already typed a closing brace before caret, do not open the picker
              if (tokenRaw.includes('}')) {
                setQuestionSearch('');
                setQuestionPickerOpen(false);
              } else {
                const token = tokenRaw.trim();
                setQuestionSearch(token);
                setQuestionPickerOpen(true);
              }
            } else {
              setQuestionSearch('');
              setQuestionPickerOpen(false);
            }
          }}
          onBlur={() => syncToRedux({ question: localState.question })}
          onClick={(e) => {
            const el = e.currentTarget;
            questionCaretRef.current = el.selectionStart || 0;
          }}
          onKeyDown={(e) => {
            const el = e.currentTarget;
            questionCaretRef.current = el.selectionStart || 0;
            if (e.key === '{') {
              setQuestionPickerOpen(true);
              setQuestionSearch('');
            } else if (e.key === '}') {
              // Close the picker when user types closing brace
              setQuestionPickerOpen(false);
              setQuestionSearch('');
            }
          }}
          placeholder="Type your question. Press '{' to insert a variable"
          style={{ width: "100%" }}
        />
        {questionPickerOpen && (
          <div ref={questionPickerRef} style={{ position: 'absolute', zIndex: 1000, top: 64, left: 0, right: 0 }}>
            <VariablePicker
              open={questionPickerOpen}
              onOpenChange={(o) => {
                setQuestionPickerOpen(o);
              }}
              searchValue={questionSearch}
              bordered={false}
              onChange={(name) => {
                // debug
                console.debug('[KB][Question] Variable selected:', name);
                const varName = (name || '').trim();
                if (!varName) return;
                const el = questionInputRef.current?.input || null;
                const pos = el ? (el.selectionStart ?? questionCaretRef.current) : questionCaretRef.current;
                const before = localState.question.slice(0, pos);
                const braceIndex = before.lastIndexOf('{');
                const start = braceIndex >= 0 ? braceIndex : pos;
                // Insert without spaces: {variable}
                const newVal = localState.question.slice(0, start) + `{${varName}}` + localState.question.slice(pos);
                console.debug('[KB][Question] Inserting at', { start, pos, before, newVal });
                updateLocal({ question: newVal });
                syncToRedux({ question: newVal });
                setQuestionPickerOpen(false);
                setQuestionSearch('');
                requestAnimationFrame(() => {
                  if (el) {
                    // caret after the inserted variable including braces
                    const newCaret = start + (`{${varName}}`).length;
                    el.focus();
                    el.setSelectionRange(newCaret, newCaret);
                  }
                });
              }}
              size="middle"
              allowCreate
              createMode="modal"
              createLabelFormat={(s) => (s?.trim() ? `Add '${s.trim()}'` : 'Add variable')}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Save chunks to variable */}
      <div style={{ marginBottom: 16 }}>
        <Typography.Text
          style={{
            fontSize: 14,
            fontWeight: 500,
            display: "block",
            marginBottom: 8,
          }}
        >
          Save chunks to variable
        </Typography.Text>
        <VariablePicker
          value={localState.variable}
          onChange={(value) => {
            updateLocal({ variable: value });
            syncToRedux({ variable: value });
          }}
          placeholder="Select variable"
          createMode="modal"
          style={{ width: "100%" }}
        />
      </div>

      {/* Chunk limit */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Typography.Text style={{ fontSize: 14, fontWeight: 500 }}>
            Chunk limit
          </Typography.Text>
          <Typography.Text
            style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}
          >
            {localState.chunkLimit}
          </Typography.Text>
        </div>
        <Slider
          min={1}
          max={10}
          step={1}
          value={localState.chunkLimit}
          onChange={(value) => {
            updateLocal({ chunkLimit: value });
            syncToRedux({ chunkLimit: value });
          }}
          marks={{
            1: "1",
            5: "5",
            10: "10",
          }}
          dots={true}
          // included={false}
          style={{ width: "100%", margin: "8px 0" }}
        />
      </div>

      {/* Divider before Not found path */}
      <Divider style={{ margin: "20px 0" }} />

      {/* Not found path */}
      <div style={{ marginTop: 16, position: "relative" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              position: "relative",
              zIndex: 1,
            }}
            onMouseDown={() => {
              // Prevent immediate close by outside handler for this interaction
              suppressCloseRef.current = true;
              ignoreUntilRef.current = Date.now() + GRACE_MS;
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (localState.notFoundPath.enabled) {
                setMenuVisible(true);
              }
            }}
          >
            <Typography.Text
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: localState.notFoundPath.enabled ? "#1677ff" : "inherit",
                userSelect: "none",
              }}
            >
              Not found path
            </Typography.Text>
          </div>

          <div
            onMouseDown={() => {
              // Prevent immediate close by outside handler for this interaction
              suppressCloseRef.current = true;
            }}
          >
            <Switch
              checked={localState.notFoundPath.enabled}
              onChange={(checked) => {
                const newNotFoundPath = {
                  ...localState.notFoundPath,
                  enabled: checked,
                };
                
                setLocalState(prev => ({
                  ...prev,
                  notFoundPath: newNotFoundPath,
                }));
                
                setMenuVisible(checked);
                syncToRedux({ notFoundPath: newNotFoundPath });
              }}
            />
          </div>
        </div>

        {localState.notFoundPath.enabled && menuVisible && (
          <div
            ref={menuRef}
            data-inside-menu="true"
            onMouseDownCapture={() => {
              suppressCloseRef.current = true;
              interactingInsideRef.current = true;
              ignoreUntilRef.current = Date.now() + GRACE_MS;
            }}
            onClickCapture={() => {
              suppressCloseRef.current = true;
              interactingInsideRef.current = true;
              ignoreUntilRef.current = Date.now() + GRACE_MS;
            }}
            onMouseUpCapture={() => {
              suppressCloseRef.current = true;
              interactingInsideRef.current = true;
              ignoreUntilRef.current = Date.now() + GRACE_MS;
            }}
            onTouchStartCapture={() => {
              suppressCloseRef.current = true;
              interactingInsideRef.current = true;
              ignoreUntilRef.current = Date.now() + GRACE_MS;
            }}
            onTouchEndCapture={() => {
              suppressCloseRef.current = true;
              interactingInsideRef.current = true;
              ignoreUntilRef.current = Date.now() + GRACE_MS;
            }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              borderRadius: 8,
              padding: 16,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
              border: "1px solid #e8e8e8",
              marginTop: 8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Path label */}
            <div style={{ marginBottom: 16 }}>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Path label
              </Typography.Text>
              <Input
                value={localState.notFoundPath.label}
                onChange={(e) => {
                  const newNotFoundPath = {
                    ...localState.notFoundPath,
                    label: e.target.value,
                  };
                  updateLocal({ notFoundPath: newNotFoundPath });
                }}
                onFocus={() => {
                  // Keep menu open while editing
                  setMenuVisible(true);
                  suppressCloseRef.current = true;
                  ignoreUntilRef.current = Date.now() + GRACE_MS;
                }}
                onBlur={() =>
                  syncToRedux({ notFoundPath: localState.notFoundPath })
                }
                placeholder="Not found"
                style={{
                  borderColor: "#1677ff",
                  borderWidth: 2,
                  borderRadius: 6,
                }}
              />
            </div>

            {/* Minimum chunk score */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Typography.Text style={{ fontSize: 14, fontWeight: 500 }}>
                  Minimum chunk score
                </Typography.Text>
                <Typography.Text
                  style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}
                >
                  {localState.notFoundPath.minScore}
                </Typography.Text>
              </div>
              <div
                data-inside-menu="true"
                style={{ padding: "0 8px 16px" }}
                onMouseDownCapture={() => {
                  suppressCloseRef.current = true;
                  interactingInsideRef.current = true;
                  ignoreUntilRef.current = Date.now() + GRACE_MS;
                }}
                onTouchStartCapture={() => {
                  suppressCloseRef.current = true;
                  interactingInsideRef.current = true;
                  ignoreUntilRef.current = Date.now() + GRACE_MS;
                }}
                onClickCapture={() => {
                  suppressCloseRef.current = true;
                  interactingInsideRef.current = true;
                  ignoreUntilRef.current = Date.now() + GRACE_MS;
                }}
                onMouseUpCapture={() => {
                  suppressCloseRef.current = true;
                  interactingInsideRef.current = true;
                  ignoreUntilRef.current = Date.now() + GRACE_MS;
                }}
                onTouchEndCapture={() => {
                  suppressCloseRef.current = true;
                  interactingInsideRef.current = true;
                  ignoreUntilRef.current = Date.now() + GRACE_MS;
                }}
              >
                <Slider
                  min={10}
                  max={100}
                  step={10}
                  dots
                  value={localState.notFoundPath.minScore}
                  tooltip={{
                    getPopupContainer: () => menuRef.current || document.body,
                  }}
                  onChange={(value) => {
                    // Keep menu open during change; update only local state
                    setMenuVisible(true);
                    suppressCloseRef.current = true;
                    ignoreUntilRef.current = Date.now() + GRACE_MS;
                    const newNotFoundPath = {
                      ...localState.notFoundPath,
                      minScore: value as number,
                    };
                    updateLocal({ notFoundPath: newNotFoundPath });
                  }}
                  onAfterChange={(value) => {
                    // Persist to Redux after user finishes
                    setMenuVisible(true);
                    suppressCloseRef.current = true;
                    ignoreUntilRef.current = Date.now() + GRACE_MS;
                    const finalNotFoundPath = {
                      ...localState.notFoundPath,
                      minScore: value as number,
                    };
                    updateLocal({ notFoundPath: finalNotFoundPath });
                    syncToRedux({ notFoundPath: finalNotFoundPath });
                  }}
                  marks={{
                    10: "10",
                    30: "",
                    50: "",
                    70: "",
                    90: "",
                    100: "100",
                  }}
                  style={{
                    width: "100%",
                    margin: 0,
                    pointerEvents: "auto",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
