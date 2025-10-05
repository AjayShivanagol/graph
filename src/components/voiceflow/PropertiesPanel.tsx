import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  SettingOutlined,
  DeleteOutlined,
  PlusOutlined,
  ForkOutlined,
  CodeOutlined,
  SaveOutlined,
  CloseOutlined,
  FullscreenOutlined,
  UpOutlined,
  DownOutlined,
  RightOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  EditOutlined,
  MinusOutlined,
  LeftOutlined,
  ExportOutlined,
  AimOutlined,
  PhoneOutlined,
  StopOutlined,
  BranchesOutlined,
  ToolOutlined,
  AppstoreOutlined,
  MinusCircleOutlined,
  InboxOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  Typography,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Drawer,
  Dropdown,
  Collapse,
  Switch,
  Popover,
  Divider,
  Space,
  Tooltip,
  Modal,
  Slider,
  Radio,
} from "antd";
const { TextArea } = Input;
import type { MenuProps } from "antd";
import Editor from "@monaco-editor/react";
import { nanoid } from "nanoid";
import VariablePicker from "../common/VariablePicker";
import IntentPicker from "../common/IntentPicker";
import EntityPicker from "../common/EntityPicker";
import PromptPicker from "../common/PromptPicker";
import PromptEditor from "../common/PromptEditor";
import ValueInput, { ValueInputHandle } from "../common/ValueInput";
import RichTextEditor, { RichTextEditorHandle } from "../common/RichTextEditor";
import FullScreenCodeEditor from "../common/FullScreenCodeEditor";
import ApiProperties from "./ApiProperties";
import KbSearchProperties from "./KbSearchProperties";
import ConditionBuilder from "./ConditionBuilder";
import { CONDITION_OPERATORS, ConditionOperatorValue } from "./conditionOperators";
import styles from "./PropertiesPanel.module.scss";

const CONDITION_OPERATOR_SELECT_OPTIONS = CONDITION_OPERATORS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const PROMPT_VARIANT_POPOVER_Z_INDEX = 65000;
const PROMPT_VARIANT_OPERATOR_DROPDOWN_Z_INDEX = 2147483647;
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  updateNode,
  deleteNode,
  setSelectedNode,
  addNode,
} from "../../store/slices/workflowSlice";
import { showToast } from "../../store/slices/uiSlice";
import { addEntity, addEntityDetailed } from "../../store/slices/entitiesSlice";
import type { ConditionRule } from "../../store/slices/conditionBuilderSlice";

// AI Models configuration
const AI_MODELS = [
  {
    value: "claude-4-sonnet",
    label: "Claude 4 - Sonnet",
    icon: <CrownOutlined style={{ color: "#ff6b35" }} />,
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    icon: <ThunderboltOutlined style={{ color: "#10b981" }} />,
  },
  {
    value: "gpt-4-turbo",
    label: "GPT-4 Turbo",
    icon: <RocketOutlined style={{ color: "#3b82f6" }} />,
  },
  {
    value: "claude-3-opus",
    label: "Claude 3 - Opus",
    icon: <StarOutlined style={{ color: "#8b5cf6" }} />,
  },
  {
    value: "claude-3-sonnet",
    label: "Claude 3 - Sonnet",
    icon: <StarOutlined style={{ color: "#06b6d4" }} />,
  },
];

type ImageSourceType = "upload" | "link";

interface ImageSelectorValue {
  sourceType?: ImageSourceType;
  url?: string;
  data?: string;
  fileName?: string;
}

interface ImageSelectorProps {
  value: ImageSelectorValue;
  onChange: (value: Required<ImageSelectorValue>) => void;
  onError?: (message: string) => void;
  helpHref?: string;
  helpLabel?: string;
  hideHelpLink?: boolean;
}

interface CardButton {
  id: string;
  label: string;
  value?: string;
  actions?: ButtonAction[];
}

type ButtonMatchType = "exact" | "any";

interface ButtonsNodeButton {
  id: string;
  label: string;
  matchType: ButtonMatchType;
}

interface ChoiceOption {
  id: string;
  label: string;
  intent?: string;
  buttonLabel?: string;
}

type CaptureMode = "entities" | "reply";

interface CaptureEntityConfig {
  id: string;
  entity: string;
  variable: string;
  required: boolean;
}

interface CaptureNoReplyConfig {
  enabled: boolean;
  timeout: number;
  reprompts: string[];
  followPath?: boolean;
  pathLabel?: string;
}

interface CaptureAutoRepromptConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const generateCaptureEntityId = () =>
  `capture-entity-${Math.random()
    .toString(36)
    .slice(2, 8)}-${Date.now().toString(36)}`;

const ensureCaptureEntity = (
  entry: any,
  index: number
): CaptureEntityConfig => {
  const fallbackId = `capture-entity-${index}`;
  if (!entry || typeof entry !== "object") {
    return {
      id: fallbackId,
      entity: "",
      variable: "",
      required: true,
    };
  }

  const rawEntity =
    typeof entry.entity === "string"
      ? entry.entity
      : typeof entry.name === "string"
      ? entry.name
      : "";
  const rawVariable =
    typeof entry.variable === "string"
      ? entry.variable
      : typeof entry.slot === "string"
      ? entry.slot
      : "";

  return {
    id: typeof entry.id === "string" ? entry.id : fallbackId,
    entity: rawEntity.trim(),
    variable: rawVariable.trim(),
    required: entry.required === false ? false : true,
  };
};

const normalizeCaptureEntities = (input: any): CaptureEntityConfig[] => {
  if (!Array.isArray(input)) return [];
  return input.map((entry, index) => ensureCaptureEntity(entry, index));
};

const ensureNoReplyConfig = (input: any): CaptureNoReplyConfig => {
  const timeout = Number.isFinite(input?.timeout) ? Number(input.timeout) : 10;
  return {
    enabled: !!input?.enabled,
    timeout: timeout > 0 ? timeout : 10,
    reprompts: Array.isArray(input?.reprompts) ? input.reprompts : [""],
    followPath:
      typeof input?.followPath === "boolean" ? input.followPath : false,
    pathLabel: typeof input?.pathLabel === "string" ? input.pathLabel : "",
  };
};

const ensureAutoRepromptConfig = (input: any): CaptureAutoRepromptConfig => {
  const temperature = Number.isFinite(input?.temperature)
    ? Number(input.temperature)
    : 0.7;
  const maxTokens = Number.isFinite(input?.maxTokens)
    ? Number(input.maxTokens)
    : 256;

  return {
    enabled: !!input?.enabled,
    model: typeof input?.model === "string" ? input.model : "claude-4-sonnet",
    temperature: Math.min(Math.max(temperature, 0), 2),
    maxTokens: Math.max(Math.floor(maxTokens), 1),
    systemPrompt:
      typeof input?.systemPrompt === "string" ? input.systemPrompt : "",
  };
};

const serializeCaptureEntities = (
  entries: CaptureEntityConfig[]
): CaptureEntityConfig[] =>
  entries.map((entry, index) => ({
    id: entry.id || `capture-entity-${index}`,
    entity: entry.entity.trim(),
    variable: entry.variable.trim(),
    required: entry.required !== false,
  }));

const serializeNoReplyConfig = (config: CaptureNoReplyConfig) => ({
  enabled: !!config.enabled,
  timeout: Math.max(Math.floor(config.timeout) || 1, 1),
  reprompts: config.reprompts,
  followPath: config.followPath,
  pathLabel: config.pathLabel,
});

const serializeAutoRepromptConfig = (config: CaptureAutoRepromptConfig) => ({
  enabled: !!config.enabled,
  model: config.model,
  temperature: Number(config.temperature.toFixed(2)),
  maxTokens: Math.max(Math.floor(config.maxTokens) || 1, 1),
  systemPrompt: config.systemPrompt,
});

const captureNoReplyEqual = (
  a: CaptureNoReplyConfig,
  b: CaptureNoReplyConfig
) =>
  a.enabled === b.enabled &&
  a.timeout === b.timeout &&
  JSON.stringify(a.reprompts) === JSON.stringify(b.reprompts) &&
  a.followPath === b.followPath &&
  a.pathLabel === b.pathLabel;

const captureAutoRepromptEqual = (
  a: CaptureAutoRepromptConfig,
  b: CaptureAutoRepromptConfig
) =>
  a.enabled === b.enabled &&
  a.model === b.model &&
  Number(a.temperature.toFixed(2)) === Number(b.temperature.toFixed(2)) &&
  a.maxTokens === b.maxTokens &&
  a.systemPrompt === b.systemPrompt;

const normalizeStringList = (value: any): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => `${entry ?? ""}`);
};

const serializeStringList = (values: string[]) =>
  values.map((entry) => `${entry ?? ""}`.trim());

interface FallbackSettingsProps {
  selectedNode: any;
  selectedNodeId: string;
  handleUpdateNodeBatch: (fields: Record<string, any>) => void;
}

const generateChoiceId = () =>
  `choice-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const ensureChoiceOption = (choice: any, index: number): ChoiceOption => {
  const fallbackId = `choice-${index}`;
  if (!choice) {
    return {
      id: fallbackId,
      label: "",
    };
  }

  if (typeof choice === "string") {
    return {
      id: fallbackId,
      label: choice,
    };
  }

  const rawLabel =
    typeof choice.label === "string"
      ? choice.label
      : typeof choice.text === "string"
      ? choice.text
      : undefined;
  const rawIntent =
    typeof choice.intent === "string"
      ? choice.intent
      : typeof choice.intentName === "string"
      ? choice.intentName
      : undefined;
  const rawButtonLabel =
    typeof choice.buttonLabel === "string"
      ? choice.buttonLabel
      : typeof choice.button === "string"
      ? choice.button
      : undefined;
  return {
    id: typeof choice.id === "string" ? choice.id : fallbackId,
    label: typeof rawLabel === "string" ? rawLabel : "",
    intent: typeof rawIntent === "string" ? rawIntent : undefined,
    buttonLabel:
      typeof rawButtonLabel === "string" ? rawButtonLabel : undefined,
  };
};

const normalizeChoiceOptions = (choices: any[]): ChoiceOption[] => {
  if (!Array.isArray(choices)) return [];
  return choices.map((choice, index) => {
    const ensured = ensureChoiceOption(choice, index);
    const rawLabel = typeof ensured.label === "string" ? ensured.label : "";
    const trimmedLabel = rawLabel.trim();
    const rawIntent = typeof ensured.intent === "string" ? ensured.intent : "";
    const trimmedIntent = rawIntent.trim();
    const rawButtonLabel =
      typeof ensured.buttonLabel === "string" ? ensured.buttonLabel : "";
    return {
      id: ensured.id,
      label:
        trimmedLabel.length > 0
          ? trimmedLabel
          : trimmedIntent.length > 0
          ? trimmedIntent
          : "",
      intent: trimmedIntent || undefined,
      buttonLabel: rawButtonLabel.trim() || undefined,
    };
  });
};

const choicesEqual = (
  left: ChoiceOption[] = [],
  right: ChoiceOption[] = []
): boolean => {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    const a = left[i];
    const b = right[i];
    if (!b) return false;
    if (a.id !== b.id) return false;
    if ((a.label || "") !== (b.label || "")) return false;
    if ((a.intent || "") !== (b.intent || "")) return false;
    if ((a.buttonLabel || "") !== (b.buttonLabel || "")) return false;
  }
  return true;
};

const createDefaultChoiceList = (): ChoiceOption[] => [
  {
    id: generateChoiceId(),
    label: "",
  },
  {
    id: generateChoiceId(),
    label: "",
  },
];

const buttonsEqual = (a: ButtonsNodeButton[], b: ButtonsNodeButton[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const btnA = a[i];
    const btnB = b[i];
    if (
      btnA.id !== btnB.id ||
      btnA.label !== btnB.label ||
      btnA.matchType !== btnB.matchType
    ) {
      return false;
    }
  }
  return true;
};

interface ButtonsFallbackConfig {
  enabled: boolean;
  reprompts: string[];
  inactivityTimeout?: number;
  followPath?: boolean;
  pathLabel?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderFormattedReprompt = (value: string) => {
  if (!value) return "";
  let html = escapeHtml(value);
  html = html.replace(/\r?\n/g, "<br/>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, '<span class="underline">$1</span>');
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  html = html.replace(/~~([^~]+)~~/g, '<span class="strike">$1</span>');
  return html;
};

const ensureFallbackReprompts = (
  config: ButtonsFallbackConfig
): ButtonsFallbackConfig => {
  const reprompts =
    Array.isArray(config.reprompts) && config.reprompts.length
      ? config.reprompts.map((item) => `${item ?? ""}`)
      : [""];

  return {
    ...config,
    reprompts,
    pathLabel: typeof config.pathLabel === "string" ? config.pathLabel : "",
  };
};

const fallbackConfigsEqual = (
  a: ButtonsFallbackConfig,
  b: ButtonsFallbackConfig
) => {
  if (a.enabled !== b.enabled) return false;
  const timeoutA =
    typeof a.inactivityTimeout === "number" ? a.inactivityTimeout : null;
  const timeoutB =
    typeof b.inactivityTimeout === "number" ? b.inactivityTimeout : null;
  if (timeoutA !== timeoutB) return false;
  if (!!a.followPath !== !!b.followPath) return false;
  const pathLabelA = `${a.pathLabel ?? ""}`.trim();
  const pathLabelB = `${b.pathLabel ?? ""}`.trim();
  if (pathLabelA !== pathLabelB) return false;

  const repromptsA = ensureFallbackReprompts(a).reprompts;
  const repromptsB = ensureFallbackReprompts(b).reprompts;

  if (repromptsA.length !== repromptsB.length) return false;
  for (let i = 0; i < repromptsA.length; i += 1) {
    if (repromptsA[i] !== repromptsB[i]) return false;
  }

  return true;
};

const FallbackSettings: React.FC<FallbackSettingsProps> = ({
  selectedNode,
  selectedNodeId,
  handleUpdateNodeBatch,
}) => {
  const rawNoMatch = selectedNode.data?.noMatch as
    | ButtonsFallbackConfig
    | undefined;
  const rawNoReply = selectedNode.data?.noReply as
    | ButtonsFallbackConfig
    | undefined;
  const listenForOtherTriggers = !!selectedNode.data?.listenForOtherTriggers;

  const [noMatchConfig, setNoMatchConfig] = useState<ButtonsFallbackConfig>(
    ensureFallbackReprompts(normalizeFallbackConfig(rawNoMatch))
  );
  const [noReplyConfig, setNoReplyConfig] = useState<ButtonsFallbackConfig>(
    ensureFallbackReprompts(
      normalizeFallbackConfig(rawNoReply, { inactivityTimeout: 10 })
    )
  );
  const [fallbackPopover, setFallbackPopover] = useState<
    "noMatch" | "noReply" | null
  >(null);
  const [draftNoMatch, setDraftNoMatch] = useState<ButtonsFallbackConfig>(
    ensureFallbackReprompts(normalizeFallbackConfig(rawNoMatch))
  );
  const [draftNoReply, setDraftNoReply] = useState<ButtonsFallbackConfig>(
    ensureFallbackReprompts(
      normalizeFallbackConfig(rawNoReply, { inactivityTimeout: 10 })
    )
  );
  const repromptRefs = useRef<Record<number, RichTextEditorHandle | null>>({});
  const [editingRepromptIndex, setEditingRepromptIndex] = useState<
    number | null
  >(null);
  const [pathLabelPopover, setPathLabelPopover] = useState<
    "noMatch" | "noReply" | null
  >(null);

  useEffect(() => {
    setNoMatchConfig(
      ensureFallbackReprompts(normalizeFallbackConfig(rawNoMatch))
    );
  }, [rawNoMatch, selectedNodeId]);

  useEffect(() => {
    setNoReplyConfig(
      ensureFallbackReprompts(
        normalizeFallbackConfig(rawNoReply, { inactivityTimeout: 10 })
      )
    );
  }, [rawNoReply, selectedNodeId]);

  useEffect(() => {
    if (fallbackPopover !== "noMatch") {
      setDraftNoMatch(ensureFallbackReprompts(noMatchConfig));
    }
  }, [noMatchConfig, fallbackPopover]);

  useEffect(() => {
    if (fallbackPopover !== "noReply") {
      setDraftNoReply(ensureFallbackReprompts(noReplyConfig));
    }
  }, [noReplyConfig, fallbackPopover]);

  useEffect(() => {
    if (editingRepromptIndex === null) return;
    const focusLater = () => {
      const ref = repromptRefs.current[editingRepromptIndex];
      ref?.focus?.();
    };
    const id = window.setTimeout(focusLater, 0);
    return () => window.clearTimeout(id);
  }, [editingRepromptIndex, fallbackPopover]);

  useEffect(() => {
    setFallbackPopover(null);
  }, [selectedNodeId]);

  useEffect(() => {
    if (!fallbackPopover) {
      setPathLabelPopover(null);
    }
  }, [fallbackPopover]);

  const commitNoMatch = (next: ButtonsFallbackConfig) => {
    setNoMatchConfig(next);
    handleUpdateNodeBatch({ noMatch: next });
  };

  const commitNoReply = (next: ButtonsFallbackConfig) => {
    setNoReplyConfig(next);
    handleUpdateNodeBatch({ noReply: next });
  };

  const toggleNoMatch = (enabled: boolean) => {
    const nextConfig: ButtonsFallbackConfig = {
      ...noMatchConfig,
      enabled,
      reprompts:
        enabled && noMatchConfig.reprompts.length === 0
          ? [""]
          : noMatchConfig.reprompts,
    };
    commitNoMatch(nextConfig);
    setFallbackPopover((prev) =>
      enabled ? "noMatch" : prev === "noMatch" ? null : prev
    );
    setDraftNoMatch(ensureFallbackReprompts(nextConfig));
  };

  const toggleNoReply = (enabled: boolean) => {
    const nextConfig: ButtonsFallbackConfig = {
      ...noReplyConfig,
      enabled,
      reprompts:
        enabled && noReplyConfig.reprompts.length === 0
          ? [""]
          : noReplyConfig.reprompts,
      inactivityTimeout:
        typeof noReplyConfig.inactivityTimeout === "number"
          ? noReplyConfig.inactivityTimeout
          : 10,
    };
    commitNoReply(nextConfig);
    setFallbackPopover((prev) =>
      enabled ? "noReply" : prev === "noReply" ? null : prev
    );
    setDraftNoReply(ensureFallbackReprompts(nextConfig));
  };

  const renderRepromptEditor = (
    draft: ButtonsFallbackConfig,
    setDraft: React.Dispatch<React.SetStateAction<ButtonsFallbackConfig>>,
    options: {
      showInactivity?: boolean;
      followPathLabel?: string;
      context: "noMatch" | "noReply";
    }
  ) => {
    const safeDraft = ensureFallbackReprompts(draft);

    const updateDraft = (
      updater: (current: ButtonsFallbackConfig) => ButtonsFallbackConfig
    ) => {
      setDraft((current) => {
        const ensuredCurrent = ensureFallbackReprompts(current);
        const next = ensureFallbackReprompts(updater(ensuredCurrent));
        return next;
      });
    };

    const handleAddReprompt = () => {
      updateDraft((current) => ({
        ...current,
        reprompts: [...current.reprompts, ""],
      }));
    };

    const handleGenerateReprompts = (count: number) => {
      if (!Number.isFinite(count) || count <= 0) return;
      updateDraft((current) => {
        const ensuredCurrent = ensureFallbackReprompts(current);
        let nextReprompts = ensuredCurrent.reprompts.slice(0, count);
        if (nextReprompts.length < count) {
          nextReprompts = [
            ...nextReprompts,
            ...Array(count - nextReprompts.length).fill(""),
          ];
        }
        return {
          ...ensuredCurrent,
          reprompts: nextReprompts,
        };
      });
      setEditingRepromptIndex(count - 1);
    };

    const handleRemoveReprompt = (index: number) => {
      updateDraft((current) => {
        const nextPrompts = current.reprompts.filter((_, idx) => idx !== index);
        return {
          ...current,
          reprompts: nextPrompts.length ? nextPrompts : [""],
        };
      });
      setEditingRepromptIndex((current) => {
        if (current === null) return current;
        if (current === index) return null;
        if (current > index) return current - 1;
        return current;
      });
      delete repromptRefs.current[index];
    };

    return (
      <div className={styles.buttonsFallbackCard}>
        {options?.showInactivity && (
          <div className={styles.buttonsFallbackFieldRow}>
            <div className={styles.buttonsFallbackFieldLabel}>
              Inactivity time (sec)
            </div>
            <InputNumber
              min={1}
              value={safeDraft.inactivityTimeout || 10}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  inactivityTimeout:
                    typeof value === "number"
                      ? value
                      : current.inactivityTimeout,
                }))
              }
            />
          </div>
        )}
        <Typography.Text className={styles.buttonsFallbackCardTitle}>
          Reprompts
        </Typography.Text>
        <div className={styles.buttonsRepromptList}>
          {safeDraft.reprompts.map((reprompt, index) => {
            const isEditing = editingRepromptIndex === index;

            return (
              <div key={index} className={styles.buttonsRepromptRow}>
                <div className={styles.buttonsRepromptEditor}>
                  {isEditing ? (
                    <RichTextEditor
                      ref={(instance) => {
                        if (instance) {
                          repromptRefs.current[index] = instance;
                        } else {
                          delete repromptRefs.current[index];
                        }
                      }}
                      value={reprompt}
                      onChange={(value) =>
                        updateDraft((current) => {
                          const nextPrompts = [...current.reprompts];
                          nextPrompts[index] = value;
                          return {
                            ...current,
                            reprompts: nextPrompts,
                          };
                        })
                      }
                      placeholder={`Enter reprompt ${index + 1}`}
                      className={styles.buttonsRichEditor}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setEditingRepromptIndex((current) =>
                            current === index ? null : current
                          );
                        }, 150);
                      }}
                    />
                  ) : (
                    <div
                      className={styles.buttonsRepromptPreview}
                      onClick={() => {
                        setEditingRepromptIndex(index);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setEditingRepromptIndex(index);
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: reprompt.trim().length
                          ? renderFormattedReprompt(reprompt)
                          : `<span class="placeholder">Enter reprompt ${
                              index + 1
                            }</span>`,
                      }}
                    />
                  )}
                </div>
                <Button
                  type="text"
                  icon={<MinusOutlined />}
                  className={styles.buttonsRepromptRemove}
                  onClick={() => handleRemoveReprompt(index)}
                  disabled={safeDraft.reprompts.length <= 1}
                />
              </div>
            );
          })}
        </div>
        <div className={styles.buttonsRepromptActions}>
          <Dropdown
            trigger={["click"]}
            overlayClassName={styles.buttonsRepromptGenerateMenu}
            menu={{
              items: [
                { key: "1", label: "Generate 1 variant" },
                { key: "3", label: "Generate 3 variants" },
                { key: "5", label: "Generate 5 variants" },
              ],
              onClick: ({ key }) => {
                const parsed = Number.parseInt(key, 10);
                handleGenerateReprompts(Number.isNaN(parsed) ? 0 : parsed);
              },
            }}
          >
            <Button className={styles.buttonsRepromptGenerate}>
              <span className={styles.buttonsRepromptGenerateIcon}>✨</span>
              Generate
              <DownOutlined className={styles.buttonsRepromptGenerateCaret} />
            </Button>
          </Dropdown>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddReprompt}
            className={styles.buttonsRepromptAdd}
          >
            Add reprompt
          </Button>
        </div>
        <div className={styles.buttonsFollowPathRow}>
          <span className={styles.buttonsFollowPathLabel}>
            Follow path after reprompts?
          </span>
          <Switch
            checked={!!safeDraft.followPath}
            onChange={(checked) => {
              updateDraft((current) => {
                const ensuredCurrent = ensureFallbackReprompts(current);
                return {
                  ...ensuredCurrent,
                  followPath: checked,
                  pathLabel: checked
                    ? ensuredCurrent.pathLabel?.trim()
                      ? ensuredCurrent.pathLabel
                      : options.followPathLabel || ""
                    : ensuredCurrent.pathLabel,
                };
              });
              setPathLabelPopover((current) => {
                if (checked) {
                  return options.context;
                }
                return current === options.context ? null : current;
              });
            }}
          />
        </div>
        {safeDraft.followPath && (
          <Popover
            trigger={["click"]}
            destroyTooltipOnHide
            placement="left"
            overlayClassName={styles.buttonsPathLabelPopover}
            open={pathLabelPopover === options.context}
            onOpenChange={(open) => {
              setPathLabelPopover((current) => {
                if (open) {
                  return options.context;
                }
                return current === options.context ? null : current;
              });
            }}
            content={
              <div className={styles.buttonsPathLabelPopoverContent}>
                <Typography.Text
                  className={styles.buttonsPathLabelPopoverTitle}
                >
                  Path label
                </Typography.Text>
                <Input
                  autoFocus
                  value={safeDraft.pathLabel || ""}
                  onChange={(event) => {
                    const { value } = event.target;
                    updateDraft((current) => ({
                      ...ensureFallbackReprompts(current),
                      pathLabel: value,
                    }));
                  }}
                  placeholder={
                    options.followPathLabel ||
                    `Enter ${
                      options.context === "noMatch" ? "no match" : "no reply"
                    } label`
                  }
                  className={styles.buttonsPathLabelInput}
                  onPressEnter={() =>
                    setPathLabelPopover((current) =>
                      current === options.context ? null : current
                    )
                  }
                />
                <Button
                  type="primary"
                  className={styles.buttonsPathLabelDone}
                  onClick={() =>
                    setPathLabelPopover((current) =>
                      current === options.context ? null : current
                    )
                  }
                >
                  Done
                </Button>
              </div>
            }
          >
            <button type="button" className={styles.buttonsPathLabelTrigger}>
              <span className={styles.buttonsPathLabelTriggerTitle}>
                Path label
              </span>
              <span className={styles.buttonsPathLabelTriggerValue}>
                {safeDraft.pathLabel?.trim() ||
                  options.followPathLabel ||
                  `Enter ${
                    options.context === "noMatch" ? "no match" : "no reply"
                  } label`}
              </span>
            </button>
          </Popover>
        )}
      </div>
    );
  };

  const handleFallbackOpenChange =
    (key: "noMatch" | "noReply") => (visible: boolean) => {
      setFallbackPopover((prev) => {
        if (visible) {
          if (prev && prev !== key) {
            commitDraftConfig(prev);
          }
          if (key === "noMatch") {
            setDraftNoMatch(ensureFallbackReprompts(noMatchConfig));
          } else {
            setDraftNoReply(ensureFallbackReprompts(noReplyConfig));
          }
          setPathLabelPopover(null);
          return key;
        }
        commitDraftConfig(key);
        setPathLabelPopover((current) => (current === key ? null : current));
        return prev === key ? null : prev;
      });
    };

  const setListenForOtherTriggers = (checked: boolean) => {
    handleUpdateNodeBatch({ listenForOtherTriggers: checked });
  };

  const commitDraftConfig = useCallback(
    (key: "noMatch" | "noReply") => {
      if (key === "noMatch") {
        const ensured = ensureFallbackReprompts(draftNoMatch);
        if (!fallbackConfigsEqual(ensured, noMatchConfig)) {
          commitNoMatch(ensured);
        }
        setDraftNoMatch(ensured);
      } else {
        const ensured = ensureFallbackReprompts(draftNoReply);
        if (!fallbackConfigsEqual(ensured, noReplyConfig)) {
          commitNoReply(ensured);
        }
        setDraftNoReply(ensured);
      }
      setEditingRepromptIndex(null);
    },
    [
      draftNoMatch,
      draftNoReply,
      noMatchConfig,
      noReplyConfig,
      commitNoMatch,
      commitNoReply,
    ]
  );

  return (
    <div className={styles.fallbackSection}>
      <Typography.Text className={styles.sectionHeading}>
        Fallbacks
      </Typography.Text>
      <div className={styles.buttonsFallbackList}>
        <Popover
          trigger={["click"]}
          destroyOnHidden
          placement="left"
          overlayClassName={styles.buttonsFallbackPopover}
          open={fallbackPopover === "noMatch"}
          onOpenChange={handleFallbackOpenChange("noMatch")}
          content={renderRepromptEditor(draftNoMatch, setDraftNoMatch, {
            context: "noMatch",
            followPathLabel: "No match",
          })}
        >
          <div
            className={`${styles.buttonsFallbackItem} ${
              fallbackPopover === "noMatch"
                ? styles.buttonsFallbackItemActive
                : ""
            } ${
              !noMatchConfig.enabled && fallbackPopover !== "noMatch"
                ? styles.buttonsFallbackItemInactive
                : ""
            }`}
          >
            <span className={styles.buttonsFallbackItemLabel}>No match</span>
            <span
              className={styles.buttonsFallbackSwitch}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <Switch
                checked={!!noMatchConfig.enabled}
                onChange={toggleNoMatch}
              />
            </span>
          </div>
        </Popover>

        <Popover
          trigger={["click"]}
          destroyOnHidden
          placement="left"
          overlayClassName={styles.buttonsFallbackPopover}
          open={fallbackPopover === "noReply"}
          onOpenChange={handleFallbackOpenChange("noReply")}
          content={renderRepromptEditor(draftNoReply, setDraftNoReply, {
            showInactivity: true,
            context: "noReply",
            followPathLabel: "No reply",
          })}
        >
          <div
            className={`${styles.buttonsFallbackItem} ${
              fallbackPopover === "noReply"
                ? styles.buttonsFallbackItemActive
                : ""
            } ${
              !noReplyConfig.enabled && fallbackPopover !== "noReply"
                ? styles.buttonsFallbackItemInactive
                : ""
            }`}
          >
            <span className={styles.buttonsFallbackItemLabel}>No reply</span>
            <span
              className={styles.buttonsFallbackSwitch}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <Switch
                checked={!!noReplyConfig.enabled}
                onChange={toggleNoReply}
              />
            </span>
          </div>
        </Popover>

        <div
          className={`${styles.buttonsFallbackItem} ${
            !listenForOtherTriggers ? styles.buttonsFallbackItemInactive : ""
          } ${styles.buttonsFallbackItemStatic}`}
        >
          <span className={styles.buttonsFallbackItemLabel}>
            Listen for other triggers
          </span>
          <span
            className={styles.buttonsFallbackSwitch}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Switch
              checked={listenForOtherTriggers}
              onChange={setListenForOtherTriggers}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

interface CaptureFallbackSettingsProps {
  noReply: CaptureNoReplyConfig;
  onChangeNoReply: (next: CaptureNoReplyConfig) => void;
  autoReprompt: CaptureAutoRepromptConfig;
  onChangeAutoReprompt: (next: CaptureAutoRepromptConfig) => void;
  listenForOtherTriggers: boolean;
  onListenForOtherTriggersChange: (checked: boolean) => void;
  showAutoReprompt: boolean;
}

const CaptureFallbackSettings: React.FC<CaptureFallbackSettingsProps> = ({
  noReply,
  onChangeNoReply,
  autoReprompt,
  onChangeAutoReprompt,
  listenForOtherTriggers,
  onListenForOtherTriggersChange,
  showAutoReprompt,
}) => {
  const [activePopover, setActivePopover] = useState<
    "noReply" | "autoReprompt" | null
  >(null);
  const [draftNoReply, setDraftNoReply] = useState<CaptureNoReplyConfig>(
    ensureNoReplyConfig(noReply)
  );
  const [draftAutoReprompt, setDraftAutoReprompt] =
    useState<CaptureAutoRepromptConfig>(ensureAutoRepromptConfig(autoReprompt));
  const [editingRepromptIndex, setEditingRepromptIndex] = useState<
    number | null
  >(null);
  const repromptRefs = useRef<Record<number, RichTextEditorHandle | null>>({});
  const [pathLabelPopover, setPathLabelPopover] = useState<
    "noReply" | "autoReprompt" | null
  >(null);

  useEffect(() => {
    if (activePopover !== "noReply") {
      setDraftNoReply(ensureNoReplyConfig(noReply));
    }
  }, [noReply, activePopover]);

  useEffect(() => {
    if (activePopover !== "autoReprompt") {
      setDraftAutoReprompt(ensureAutoRepromptConfig(autoReprompt));
    }
  }, [autoReprompt, activePopover]);

  useEffect(() => {
    if (!showAutoReprompt && activePopover === "autoReprompt") {
      setActivePopover(null);
    }
  }, [showAutoReprompt, activePopover]);

  useEffect(() => {
    if (editingRepromptIndex === null) return;
    window.setTimeout(() => {
      const ref = repromptRefs.current[editingRepromptIndex];
      if (ref) ref.focus();
    }, 100);
  }, [editingRepromptIndex, activePopover]);

  const commitDraft = useCallback(
    (key: "noReply" | "autoReprompt") => {
      if (key === "noReply") {
        const ensured = ensureNoReplyConfig({
          ...draftNoReply,
          enabled: ensureNoReplyConfig(noReply).enabled,
        });
        if (!captureNoReplyEqual(ensured, ensureNoReplyConfig(noReply))) {
          onChangeNoReply(ensured);
        }
        setDraftNoReply(ensured);
      } else {
        const ensured = ensureAutoRepromptConfig({
          ...draftAutoReprompt,
          enabled: ensureAutoRepromptConfig(autoReprompt).enabled,
        });
        if (
          !captureAutoRepromptEqual(
            ensured,
            ensureAutoRepromptConfig(autoReprompt)
          )
        ) {
          onChangeAutoReprompt(ensured);
        }
        setDraftAutoReprompt(ensured);
      }
    },
    [
      autoReprompt,
      draftAutoReprompt,
      draftNoReply,
      noReply,
      onChangeAutoReprompt,
      onChangeNoReply,
    ]
  );

  const handleOpenChange = useCallback(
    (key: "noReply" | "autoReprompt") => (open: boolean) => {
      setActivePopover((current) => {
        if (open) {
          if (current && current !== key) {
            commitDraft(current);
          }
          if (key === "noReply") {
            setDraftNoReply(ensureNoReplyConfig(noReply));
          } else {
            setDraftAutoReprompt(ensureAutoRepromptConfig(autoReprompt));
          }
          return key;
        }
        commitDraft(key);
        setEditingRepromptIndex(null);
        setPathLabelPopover((current) => (current === key ? null : current));
        return current === key ? null : current;
      });
    },
    [autoReprompt, commitDraft, noReply]
  );

  const toggleNoReply = (checked: boolean) => {
    const ensured = ensureNoReplyConfig({ ...noReply, enabled: checked });
    if (!captureNoReplyEqual(ensured, ensureNoReplyConfig(noReply))) {
      onChangeNoReply(ensured);
    }
    setDraftNoReply(ensured);
    setActivePopover((current) => {
      if (checked) {
        return "noReply";
      }
      return current === "noReply" ? null : current;
    });
  };

  const toggleAutoReprompt = (checked: boolean) => {
    const ensured = ensureAutoRepromptConfig({
      ...autoReprompt,
      enabled: checked,
    });
    if (
      !captureAutoRepromptEqual(ensured, ensureAutoRepromptConfig(autoReprompt))
    ) {
      onChangeAutoReprompt(ensured);
    }
    setDraftAutoReprompt(ensured);
    setActivePopover((current) => {
      if (checked) {
        return "autoReprompt";
      }
      return current === "autoReprompt" ? null : current;
    });
  };

  return (
    <div className={styles.fallbackSection}>
      <Typography.Text className={styles.sectionHeading}>
        Fallbacks
      </Typography.Text>
      <div className={styles.buttonsFallbackList}>
        <Popover
          trigger={["click"]}
          destroyOnHidden
          placement="left"
          overlayClassName={styles.buttonsFallbackPopover}
          open={activePopover === "noReply"}
          onOpenChange={handleOpenChange("noReply")}
          content={
            <div className={styles.buttonsFallbackCard}>
              <div className={styles.buttonsFallbackFieldRow}>
                <div className={styles.buttonsFallbackFieldLabel}>
                  Inactivity time (sec)
                </div>
                <InputNumber
                  min={1}
                  max={120}
                  value={draftNoReply.timeout}
                  onChange={(value) => {
                    setDraftNoReply((current) => ({
                      ...current,
                      timeout:
                        typeof value === "number"
                          ? Math.max(Math.floor(value), 1)
                          : current.timeout,
                    }));
                  }}
                />
              </div>
              <Typography.Text className={styles.buttonsFallbackCardTitle}>
                Reprompts
              </Typography.Text>
              <div className={styles.buttonsRepromptList}>
                {draftNoReply.reprompts.map((reprompt, index) => {
                  const isEditing = editingRepromptIndex === index;

                  return (
                    <div key={index} className={styles.buttonsRepromptRow}>
                      <div className={styles.buttonsRepromptEditor}>
                        {isEditing ? (
                          <RichTextEditor
                            ref={(instance) => {
                              if (instance) {
                                repromptRefs.current[index] = instance;
                              } else {
                                delete repromptRefs.current[index];
                              }
                            }}
                            value={reprompt}
                            onChange={(value) => {
                              setDraftNoReply((current) => {
                                const nextReprompts = [...current.reprompts];
                                nextReprompts[index] = value;
                                return {
                                  ...current,
                                  reprompts: nextReprompts,
                                };
                              });
                            }}
                            placeholder={`Enter reprompt ${index + 1}`}
                            className={styles.buttonsRichEditor}
                            onBlur={() => {
                              window.setTimeout(() => {
                                setEditingRepromptIndex((current) =>
                                  current === index ? null : current
                                );
                              }, 150);
                            }}
                          />
                        ) : (
                          <div
                            className={styles.buttonsRepromptPreview}
                            onClick={() => {
                              setEditingRepromptIndex(index);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setEditingRepromptIndex(index);
                              }
                            }}
                            dangerouslySetInnerHTML={{
                              __html: reprompt.trim().length
                                ? renderFormattedReprompt(reprompt)
                                : `<span class="placeholder">Enter reprompt ${
                                    index + 1
                                  }</span>`,
                            }}
                          />
                        )}
                      </div>
                      <Button
                        type="text"
                        icon={<MinusOutlined />}
                        className={styles.buttonsRepromptRemove}
                        onClick={() => {
                          setDraftNoReply((current) => {
                            const nextReprompts = current.reprompts.filter(
                              (_, idx) => idx !== index
                            );
                            return {
                              ...current,
                              reprompts: nextReprompts.length
                                ? nextReprompts
                                : [""],
                            };
                          });
                          setEditingRepromptIndex((current) => {
                            if (current === null) return current;
                            if (current === index) return null;
                            if (current > index) return current - 1;
                            return current;
                          });
                          delete repromptRefs.current[index];
                        }}
                        disabled={draftNoReply.reprompts.length <= 1}
                      />
                    </div>
                  );
                })}
              </div>
              <div className={styles.buttonsRepromptActions}>
                <Dropdown
                  trigger={["click"]}
                  overlayClassName={styles.buttonsRepromptGenerateMenu}
                  menu={{
                    items: [
                      { key: "1", label: "Generate 1 variant" },
                      { key: "3", label: "Generate 3 variants" },
                      { key: "5", label: "Generate 5 variants" },
                    ],
                    onClick: ({ key }) => {
                      const count = Number.parseInt(key, 10);
                      if (!Number.isFinite(count) || count <= 0) return;
                      setDraftNoReply((current) => {
                        let nextReprompts = current.reprompts.slice(0, count);
                        if (nextReprompts.length < count) {
                          nextReprompts = [
                            ...nextReprompts,
                            ...Array(count - nextReprompts.length).fill(""),
                          ];
                        }
                        return {
                          ...current,
                          reprompts: nextReprompts,
                        };
                      });
                      setEditingRepromptIndex(count - 1);
                    },
                  }}
                >
                  <Button className={styles.buttonsRepromptGenerate}>
                    <span className={styles.buttonsRepromptGenerateIcon}>
                      ✨
                    </span>
                    Generate
                    <DownOutlined
                      className={styles.buttonsRepromptGenerateCaret}
                    />
                  </Button>
                </Dropdown>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setDraftNoReply((current) => {
                      const newIndex = current.reprompts.length;
                      setEditingRepromptIndex(newIndex);
                      return {
                        ...current,
                        reprompts: [...current.reprompts, ""],
                      };
                    });
                  }}
                  className={styles.buttonsRepromptAdd}
                >
                  Add reprompt
                </Button>
              </div>
              <div className={styles.buttonsFollowPathRow}>
                <span className={styles.buttonsFollowPathLabel}>
                  Follow path after reprompts?
                </span>
                <Switch
                  checked={!!draftNoReply.followPath}
                  onChange={(checked) => {
                    setDraftNoReply((current) => ({
                      ...current,
                      followPath: checked,
                      pathLabel: checked
                        ? current.pathLabel?.trim()
                          ? current.pathLabel
                          : "No reply"
                        : current.pathLabel,
                    }));
                    setPathLabelPopover((current) => {
                      if (checked) {
                        return "noReply";
                      }
                      return current === "noReply" ? null : current;
                    });
                  }}
                />
              </div>
              {draftNoReply.followPath && (
                <Popover
                  trigger={["click"]}
                  destroyTooltipOnHide
                  placement="left"
                  overlayClassName={styles.buttonsPathLabelPopover}
                  open={pathLabelPopover === "noReply"}
                  onOpenChange={(open) => {
                    setPathLabelPopover((current) => {
                      if (open) {
                        return "noReply";
                      }
                      return current === "noReply" ? null : current;
                    });
                  }}
                  content={
                    <div className={styles.buttonsPathLabelPopoverContent}>
                      <Typography.Text
                        className={styles.buttonsPathLabelPopoverTitle}
                      >
                        Path label
                      </Typography.Text>
                      <Input
                        autoFocus
                        value={draftNoReply.pathLabel || ""}
                        onChange={(event) => {
                          const { value } = event.target;
                          setDraftNoReply((current) => ({
                            ...current,
                            pathLabel: value,
                          }));
                        }}
                        placeholder="Enter no reply label"
                        className={styles.buttonsPathLabelInput}
                        onPressEnter={() =>
                          setPathLabelPopover((current) =>
                            current === "noReply" ? null : current
                          )
                        }
                      />
                      <Button
                        type="primary"
                        className={styles.buttonsPathLabelDone}
                        onClick={() =>
                          setPathLabelPopover((current) =>
                            current === "noReply" ? null : current
                          )
                        }
                      >
                        Done
                      </Button>
                    </div>
                  }
                >
                  <button
                    type="button"
                    className={styles.buttonsPathLabelTrigger}
                  >
                    <span className={styles.buttonsPathLabelTriggerTitle}>
                      Path label
                    </span>
                    <span className={styles.buttonsPathLabelTriggerValue}>
                      {draftNoReply.pathLabel?.trim() || "No reply"}
                    </span>
                  </button>
                </Popover>
              )}
            </div>
          }
        >
          <div
            className={`${styles.buttonsFallbackItem} ${
              activePopover === "noReply"
                ? styles.buttonsFallbackItemActive
                : ""
            } ${
              !noReply.enabled && activePopover !== "noReply"
                ? styles.buttonsFallbackItemInactive
                : ""
            }`}
          >
            <span className={styles.buttonsFallbackItemLabel}>No reply</span>
            <span
              className={styles.buttonsFallbackSwitch}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <Switch checked={!!noReply.enabled} onChange={toggleNoReply} />
            </span>
          </div>
        </Popover>

        {showAutoReprompt && (
          <Popover
            trigger={["click"]}
            destroyOnHidden
            placement="left"
            overlayClassName={styles.buttonsFallbackPopover}
            open={activePopover === "autoReprompt"}
            onOpenChange={handleOpenChange("autoReprompt")}
            content={
              <div className={styles.buttonsFallbackCard}>
                <Typography.Text
                  strong
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Overrides
                </Typography.Text>

                <div style={{ marginBottom: "24px" }}>
                  <Typography.Title level={5} style={{ margin: "8px 0" }}>
                    AI model
                  </Typography.Title>
                  <Select
                    value={draftAutoReprompt.model}
                    onChange={(value) => {
                      setDraftAutoReprompt((current) => ({
                        ...current,
                        model: value,
                      }));
                    }}
                    style={{ width: "100%" }}
                    optionLabelProp="label"
                  >
                    {AI_MODELS.map((model) => (
                      <Select.Option
                        key={model.value}
                        value={model.value}
                        label={model.label}
                      >
                        <Space>
                          <span>{model.icon}</span>
                          <span>{model.label}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <Typography.Text strong>Temperature</Typography.Text>
                    <Typography.Text>
                      {draftAutoReprompt.temperature}
                    </Typography.Text>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={draftAutoReprompt.temperature}
                    onChange={(value) => {
                      setDraftAutoReprompt((current) => ({
                        ...current,
                        temperature: value,
                      }));
                    }}
                    style={{ margin: "16px 0" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    <span>Deterministic</span>
                    <span>Random</span>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <Typography.Text strong>Max tokens</Typography.Text>
                    <Typography.Text>
                      {draftAutoReprompt.maxTokens}
                    </Typography.Text>
                  </div>
                  <Slider
                    min={10}
                    max={24000}
                    step={100}
                    value={draftAutoReprompt.maxTokens}
                    onChange={(value) => {
                      setDraftAutoReprompt((current) => ({
                        ...current,
                        maxTokens: value,
                      }));
                    }}
                    style={{ margin: "16px 0" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    <span>10</span>
                    <span>24000</span>
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <Typography.Title level={5} style={{ margin: "8px 0" }}>
                    System
                  </Typography.Title>
                  <Input.TextArea
                    value={draftAutoReprompt.systemPrompt}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="You are a helpful assistant collecting data from the user."
                    onChange={(event) => {
                      const { value } = event.target;
                      setDraftAutoReprompt((current) => ({
                        ...current,
                        systemPrompt: value,
                      }));
                    }}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #d9d9d9",
                      padding: "8px 12px",
                    }}
                  />
                </div>
              </div>
            }
          >
            <div
              className={`${styles.buttonsFallbackItem} ${
                activePopover === "autoReprompt"
                  ? styles.buttonsFallbackItemActive
                  : ""
              } ${
                !autoReprompt.enabled && activePopover !== "autoReprompt"
                  ? styles.buttonsFallbackItemInactive
                  : ""
              }`}
            >
              <span className={styles.buttonsFallbackItemLabel}>
                Automatically reprompt
              </span>
              <span
                className={styles.buttonsFallbackSwitch}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <Switch
                  checked={!!autoReprompt.enabled}
                  onChange={toggleAutoReprompt}
                />
              </span>
            </div>
          </Popover>
        )}

        <div
          className={`${styles.buttonsFallbackItem} ${
            !listenForOtherTriggers ? styles.buttonsFallbackItemInactive : ""
          } ${styles.buttonsFallbackItemStatic}`}
        >
          <span className={styles.buttonsFallbackItemLabel}>
            Listen for other triggers
          </span>
          <span
            className={styles.buttonsFallbackSwitch}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Switch
              checked={listenForOtherTriggers}
              onChange={onListenForOtherTriggersChange}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

interface CarouselCard {
  id: string;
  title: string;
  description?: string;
  imageSourceType?: ImageSourceType;
  imageUrl?: string;
  imageData?: string;
  imageFileName?: string;
  url?: string;
  buttons?: CardButton[];
}

type ButtonActionType =
  | "go_to_block"
  | "go_to_intent"
  | "call_forward"
  | "end"
  | "set_variable"
  | "open_url"
  | "tool"
  | "code"
  | "component";

interface ButtonAction {
  id: string;
  type: ButtonActionType;
  label?: string;
  data?: Record<string, any>;
}

const ACTION_LABELS: Record<ButtonActionType, string> = {
  go_to_block: "Go to Block",
  go_to_intent: "Go to Intent",
  call_forward: "Call forward",
  end: "End conversation",
  set_variable: "Set variable",
  open_url: "Open URL",
  tool: "Tool",
  code: "Javascript",
  component: "Component",
};

const PRIMARY_ACTION_TYPES: ButtonActionType[] = [
  "go_to_block",
  "go_to_intent",
  "call_forward",
  "end",
];

const isPrimaryActionType = (type: ButtonActionType) =>
  PRIMARY_ACTION_TYPES.includes(type);

const generateButtonId = () =>
  `btn-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const generateCardId = () =>
  `card-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const generateActionId = () =>
  `action-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const HTTPS_URL_REGEX = /^https:\/\//i;

const normalizeButtonActions = (actions?: any[]): ButtonAction[] => {
  if (!Array.isArray(actions)) return [];
  return actions.map((action, index) => {
    if (!action || typeof action === "string") {
      return {
        id: `action-${index}`,
        type: "go_to_block",
        label:
          typeof action === "string" ? action : ACTION_LABELS["go_to_block"],
      };
    }
    const type = (action.type || "go_to_block") as ButtonActionType;
    const fallbackLabel = ACTION_LABELS[type] || "Action";
    const rawLabel = (action.label || "").trim();
    const normalizedLabel =
      type === "end" && rawLabel.toLowerCase() === "end"
        ? fallbackLabel
        : rawLabel || fallbackLabel;
    return {
      id: action.id || `action-${index}`,
      type,
      label: normalizedLabel,
      data: action.data || action.payload || {},
    };
  });
};

const actionsEqual = (
  left: ButtonAction[] = [],
  right: ButtonAction[] = []
): boolean => {
  if (left === right) return true;
  if (left.length !== right.length) return false;

  return left.every((action, index) => {
    const other = right[index];
    if (!other) return false;
    if (action.id !== other.id) return false;
    if (action.type !== other.type) return false;
    if ((action.label || "") !== (other.label || "")) return false;

    const leftData = action.data || {};
    const rightData = other.data || {};
    const leftKeys = Object.keys(leftData);
    const rightKeys = Object.keys(rightData);
    if (leftKeys.length !== rightKeys.length) return false;

    return leftKeys.every((key) => Object.is(leftData[key], rightData[key]));
  });
};

const buttonsEqual1 = (
  left: CardButton | null,
  right: CardButton | null
): boolean => {
  if (left === right) return true;
  if (!left || !right) return false;
  if (left.id !== right.id) return false;
  if ((left.label || "") !== (right.label || "")) return false;
  if ((left.value || "") !== (right.value || "")) return false;

  return actionsEqual(left.actions || [], right.actions || []);
};

const ensureButtonShape = (button: any, index: number): CardButton => {
  if (!button) {
    return {
      id: `btn-${index}`,
      label: `Button ${index + 1}`,
      value: "",
      actions: [],
    };
  }
  if (typeof button === "string") {
    return {
      id: `btn-${index}`,
      label: button,
      value: "",
      actions: [],
    };
  }
  return {
    id: button.id || `btn-${index}`,
    label: button.label || button.text || `Button ${index + 1}`,
    value: button.value || button.payload || "",
    actions: normalizeButtonActions(button.actions || []),
  };
};

const normalizeButtons = (buttons: any[]): CardButton[] => {
  if (!Array.isArray(buttons)) return [];
  return buttons.map((button, index) => ensureButtonShape(button, index));
};

const ensureButtonsNodeButton = (
  button: any,
  index: number
): ButtonsNodeButton => {
  if (!button || typeof button === "string") {
    const label = typeof button === "string" ? button : "";
    return {
      id: `btn-${index}`,
      label,
      matchType: "exact",
    };
  }
  return {
    id: button.id || `btn-${index}`,
    label: button.label || button.text || "",
    matchType:
      button.matchType === "any" || button.matchType === "exact"
        ? (button.matchType as ButtonMatchType)
        : "exact",
  };
};

const normalizeButtonsNodeButtons = (buttons: any[]): ButtonsNodeButton[] => {
  if (!Array.isArray(buttons)) return [];
  return buttons.map((button, index) => ensureButtonsNodeButton(button, index));
};

const normalizeFallbackConfig = (
  fallback?: any,
  defaults?: Partial<ButtonsFallbackConfig>
): ButtonsFallbackConfig => {
  return {
    enabled: !!fallback?.enabled,
    reprompts: Array.isArray(fallback?.reprompts)
      ? fallback.reprompts.map((item: any) => `${item || ""}`)
      : [],
    inactivityTimeout:
      typeof fallback?.inactivityTimeout === "number"
        ? fallback.inactivityTimeout
        : defaults?.inactivityTimeout,
    followPath:
      typeof fallback?.followPath === "boolean"
        ? fallback.followPath
        : defaults?.followPath,
    pathLabel:
      typeof fallback?.pathLabel === "string"
        ? fallback.pathLabel
        : typeof defaults?.pathLabel === "string"
        ? defaults.pathLabel
        : undefined,
  };
};

const ensureCardShape = (card: any, index: number): CarouselCard => {
  if (!card || typeof card !== "object") {
    return {
      id: `card-${index}`,
      title: `Card ${index + 1}`,
      description: "",
      imageSourceType: "upload",
      imageUrl: "",
      imageData: "",
      imageFileName: "",
      buttons: [],
    };
  }

  return {
    id: card.id || `card-${index}`,
    title: card.title || `Card ${index + 1}`,
    description: card.description || card.subtitle || "",
    imageSourceType:
      (card.imageSourceType as ImageSourceType) ||
      (card.imageUrl ? "link" : "upload"),
    imageUrl: card.imageUrl || "",
    imageData: card.imageData || "",
    imageFileName: card.imageFileName || "",
    url: card.url || "",
    buttons: normalizeButtons(card.buttons || []),
  };
};

const normalizeCards = (cards: any[]): CarouselCard[] => {
  if (!Array.isArray(cards) || cards.length === 0) return [];
  return cards.map((card, index) => ensureCardShape(card, index));
};

const ImageSelector: React.FC<ImageSelectorProps> = ({
  value,
  onChange,
  onError,
  helpHref = "https://docs.voiceflow.com/docs/images",
  helpLabel = "How it works?",
  hideHelpLink = false,
}) => {
  const [activeTab, setActiveTab] = useState<ImageSourceType>(
    value.sourceType === "link" ? "link" : "upload"
  );
  const [linkValue, setLinkValue] = useState<string>(value.url || "");
  const [fileName, setFileName] = useState<string>(value.fileName || "");
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPreviewActions, setShowPreviewActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setActiveTab(value.sourceType === "link" ? "link" : "upload");
    setLinkValue(value.url || "");
    setFileName(value.fileName || "");
  }, [value.sourceType, value.url, value.fileName]);

  const commitChange = (next: Required<ImageSelectorValue>) => {
    onChange(next);
  };

  const changeTab = (tab: ImageSourceType) => {
    setActiveTab(tab);
    setUploadError(null);
    if (tab === "upload") {
      commitChange({
        sourceType: "upload",
        url: value.data || value.url || "",
        data: value.data || value.url || "",
        fileName: value.fileName || fileName || "",
      });
    } else {
      const trimmed = (value.url || linkValue).trim();
      setLinkValue(trimmed);
      commitChange({
        sourceType: "link",
        url: trimmed,
        data: "",
        fileName: "",
      });
    }
  };

  const handleFileSelection = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    const mime = file.type || "";
    const isImage =
      mime.startsWith("image/") || file.name.toLowerCase().endsWith(".gif");

    if (!isImage) {
      const message = "Please choose an image or GIF file.";
      setUploadError(message);
      onError?.(message);
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const next = {
          sourceType: "upload" as ImageSourceType,
          url: reader.result,
          data: reader.result,
          fileName: file.name,
        };
        commitChange(next);
        setFileName(file.name);
        setActiveTab("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const commitLink = (raw?: string) => {
    const nextValue = (raw ?? linkValue).trim();
    setLinkValue(nextValue);
    commitChange({
      sourceType: "link",
      url: nextValue,
      data: "",
      fileName: "",
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handleFileSelection(event.dataTransfer?.files || null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const hasPreview =
    (value.data && value.sourceType === "upload") ||
    (value.url && value.sourceType === "link");
  return (
    <div className={styles.imageProperties}>
      <div className={styles.imageTabs}>
        <button
          type="button"
          className={`${styles.imageTab} ${
            activeTab === "upload" ? styles.imageTabActive : ""
          }`}
          onClick={() => changeTab("upload")}
        >
          Upload
        </button>
        <button
          type="button"
          className={`${styles.imageTab} ${
            activeTab === "link" ? styles.imageTabActive : ""
          }`}
          onClick={() => changeTab("link")}
        >
          Link
        </button>
      </div>
      <div className={styles.imageTabContent}>
        {hasPreview ? (
          <div
            className={styles.imagePreviewContainer}
            onMouseEnter={() => setShowPreviewActions(true)}
            onMouseLeave={() => setShowPreviewActions(false)}
          >
            <img
              src={value.sourceType === "upload" ? value.data : value.url}
              alt="Preview"
              className={styles.imagePreview}
            />
            {showPreviewActions && (
              <div className={styles.imagePreviewActions}>
                <button
                  type="button"
                  className={styles.browseButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => {
                    setFileName("");
                    setLinkValue("");
                    setUploadError(null);
                    commitChange({
                      sourceType: "upload",
                      url: "",
                      data: "",
                      fileName: "",
                    });
                  }}
                >
                  <DeleteOutlined />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.gif"
              style={{ display: "none" }}
              onChange={(event) => {
                handleFileSelection(event.target.files);
                event.target.value = "";
              }}
            />
          </div>
        ) : activeTab === "upload" ? (
          <>
            <div
              className={`${styles.uploadDropZone} ${
                dragActive ? styles.uploadDropZoneActive : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              // Removed file input trigger from drop zone to prevent double dialog
              role="presentation"
              tabIndex={-1}
            >
              <div className={styles.uploadPrompt}>
                <div className={styles.uploadText}>
                  Drag & drop image/GIF here. Or,
                </div>
                <button
                  type="button"
                  className={styles.browseButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse
                </button>
              </div>
              {(fileName || value.fileName) && (
                <div className={styles.uploadMeta}>
                  Selected: {fileName || value.fileName}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.gif"
              style={{ display: "none" }}
              onChange={(event) => {
                handleFileSelection(event.target.files);
                event.target.value = "";
              }}
            />
            {uploadError && (
              <Typography.Text type="danger" className={styles.uploadError}>
                {uploadError}
              </Typography.Text>
            )}
          </>
        ) : (
          <ValueInput
            value={linkValue}
            onChange={setLinkValue}
            onBlur={commitLink}
            onPressEnter={commitLink}
            onVariableSelected={(val) => {
              setLinkValue(val);
              commitLink(val);
            }}
            placeholder="Enter file URL or {variable}"
            className={styles.linkInput}
            size="middle"
          />
        )}
      </div>
      {!hideHelpLink && (
        <a
          className={styles.imageHelp}
          href={helpHref}
          target="_blank"
          rel="noreferrer"
        >
          {helpLabel}
        </a>
      )}
    </div>
  );
};

interface SetVariableActionEditorProps {
  action: ButtonAction;
  onChange: (action: ButtonAction) => void;
}

const SetVariableActionEditor: React.FC<SetVariableActionEditorProps> = ({
  action,
  onChange,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [setType, setSetType] = useState<"value" | "expression">(
    action.data?.setType || "value"
  );
  const [selectedVariable, setSelectedVariable] = useState(
    action.data?.selectedVariable || ""
  );
  const [value, setValue] = useState(action.data?.value || "");
  const [expression, setExpression] = useState(action.data?.expression || "");
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // Get available variables from Redux store
  const variables = useAppSelector((state) => state.variables?.list || []);

  const handleSave = () => {
    const updatedAction: ButtonAction = {
      ...action,
      data: {
        ...action.data,
        setType,
        selectedVariable,
        value: setType === "value" ? value : "",
        expression: setType === "expression" ? expression : "",
      },
    };
    onChange(updatedAction);
    setShowPopover(false);
  };

  const handleCodeSave = (code: string) => {
    setExpression(code);
    setShowCodeEditor(false);
  };

  const hasConfiguration = action.data?.selectedVariable;

  return (
    <>
      <Popover
        content={
          <div className={styles.setVariablePopover}>
            <div className={styles.setVariableHeader}>
              <Typography.Text strong>Set variable</Typography.Text>
            </div>

            {/* Variable Selection */}
            <div className={styles.setVariableSection}>
              <Typography.Text className={styles.setVariableLabel}>
                Variable
              </Typography.Text>
              <VariablePicker
                value={selectedVariable}
                onChange={(val) => setSelectedVariable(val || "")}
                placeholder="→ Select variable to set"
                allowCreate={true}
                createMode="modal"
                size="middle"
                style={{ width: "100%" }}
              />
            </div>

            {/* Set To Section */}
            <div className={styles.setVariableSection}>
              <Typography.Text className={styles.setVariableLabel}>
                Set to
              </Typography.Text>
              <Radio.Group
                value={setType}
                onChange={(e) => setSetType(e.target.value)}
                className={styles.setVariableRadioGroup}
              >
                <Radio value="value">Value</Radio>
                <Radio value="expression">Expression</Radio>
              </Radio.Group>
            </div>

            {/* Value Input */}
            {setType === "value" && (
              <div className={styles.setVariableSection}>
                <ValueInput
                  value={value}
                  onChange={(val) => setValue(val)}
                  placeholder="Enter value or {var}"
                  size="middle"
                  className={styles.setVariableInput}
                />
              </div>
            )}

            {/* Expression Input */}
            {setType === "expression" && (
              <div className={styles.setVariableSection}>
                <div
                  className={styles.expressionContainer}
                  onClick={() => setShowCodeEditor(true)}
                >
                  <div className={styles.expressionEditor}>
                    <span className={styles.lineNumber}>1</span>
                    <ValueInput
                      value={expression}
                      onChange={(val) => setExpression(val)}
                      placeholder="Enter Javascript"
                      size="middle"
                      className={styles.expressionInput}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save/Cancel Buttons */}
            <div className={styles.setVariableActions}>
              <Button size="small" onClick={() => setShowPopover(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={handleSave}
                disabled={
                  !selectedVariable ||
                  (setType === "value" ? !value : !expression)
                }
              >
                Save
              </Button>
            </div>
          </div>
        }
        trigger="click"
        open={showPopover}
        onOpenChange={setShowPopover}
        placement="right"
        overlayStyle={{ zIndex: 50000 }}
        getPopupContainer={() => document.body}
      >
        <Button
          type="link"
          size="small"
          className={styles.buttonActionEdit}
          onClick={() => setShowPopover(true)}
        >
          {hasConfiguration ? "Edit variable" : "Configure variable"}
        </Button>
      </Popover>

      {/* Full Screen Code Editor for Expression */}
      <FullScreenCodeEditor
        visible={showCodeEditor}
        onClose={() => setShowCodeEditor(false)}
        onSave={handleCodeSave}
        initialCode={expression}
        title="JavaScript Expression Editor"
        language="javascript"
        startFullscreen
      />
    </>
  );
};

interface OpenUrlActionEditorProps {
  action: ButtonAction;
  onChange: (action: ButtonAction) => void;
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
  onCommit?: (action: ButtonAction) => void;
}

const OpenUrlActionEditor: React.FC<OpenUrlActionEditorProps> = ({
  action,
  onChange,
  autoOpen = false,
  onAutoOpenHandled,
  onCommit,
}) => {
  const [visible, setVisible] = useState(false);
  const actionUrl = useMemo(() => {
    if (typeof action.data?.url === "string") {
      return action.data.url;
    }
    if (typeof action.data?.href === "string") {
      return action.data.href;
    }
    return "";
  }, [action.data?.url, action.data?.href]);
  const [urlValue, setUrlValue] = useState(actionUrl);
  const [touched, setTouched] = useState(false);

  const trimmedUrl = useMemo(() => urlValue.trim(), [urlValue]);
  const isValid = useMemo(() => HTTPS_URL_REGEX.test(trimmedUrl), [trimmedUrl]);
  const shouldShowError = touched && !isValid;

  const syncFromAction = useCallback(() => {
    setUrlValue(actionUrl);
    setTouched(false);
  }, [actionUrl]);

  useEffect(() => {
    if (!visible) {
      setUrlValue(actionUrl);
      setTouched(false);
    }
  }, [actionUrl, visible]);

  useEffect(() => {
    if (autoOpen) {
      setVisible(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpen, onAutoOpenHandled]);

  useEffect(() => {
    if (visible) {
      syncFromAction();
    }
  }, [visible, syncFromAction]);

  const closePopover = useCallback(() => {
    setVisible(false);
    setTouched(false);
    syncFromAction();
  }, [syncFromAction]);

  const handleSave = () => {
    setTouched(true);
    if (!isValid) return;

    const updated: ButtonAction = {
      ...action,
      data: {
        ...action.data,
        url: trimmedUrl,
      },
    };
    onChange(updated);
    onCommit?.(updated);
    setVisible(false);
    setTouched(false);
    setUrlValue(trimmedUrl);
  };

  const content = (
    <div className={styles.openUrlPopoverContent}>
      <Typography.Text className={styles.openUrlLabel}>URL</Typography.Text>
      <Input
        value={urlValue}
        onChange={(event) => setUrlValue(event.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Enter URL"
        size="large"
        className={styles.openUrlInput}
        status={shouldShowError ? "error" : undefined}
      />
      {shouldShowError && (
        <Typography.Text type="danger" className={styles.openUrlError}>
          URL must start with https://
        </Typography.Text>
      )}
      <a
        className={styles.imageHelp}
        href="https://docs.voiceflow.com/docs/actions"
        target="_blank"
        rel="noreferrer"
      >
        How it works?
      </a>
      <div className={styles.openUrlFooter}>
        <Button onClick={closePopover}>Cancel</Button>
        <Button type="primary" onClick={handleSave} disabled={!isValid}>
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      trigger="click"
      open={visible}
      onOpenChange={(nextVisible) => {
        if (nextVisible) {
          setVisible(true);
        } else {
          closePopover();
        }
      }}
      placement="right"
      overlayClassName={styles.openUrlPopover}
      content={content}
    >
      <Button type="link" size="small" className={styles.buttonActionEdit}>
        {(action.data?.url as string)?.length ? "Edit URL" : "Configure URL"}
      </Button>
    </Popover>
  );
};

interface ButtonListEditorProps {
  buttons: CardButton[];
  onChange: (buttons: CardButton[]) => void;
  maxButtons?: number;
  emptyHint?: string;
  addLabel?: string;
}

const ButtonListEditor: React.FC<ButtonListEditorProps> = ({
  buttons,
  onChange,
  maxButtons = 5,
  emptyHint = "No buttons configured yet.",
  addLabel = "Add button",
}) => {
  const safeButtons = useMemo(() => normalizeButtons(buttons || []), [buttons]);
  const canAdd = safeButtons.length < maxButtons;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerButton, setDrawerButton] = useState<CardButton | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editingAction, setEditingAction] = useState<ButtonAction | null>(null);
  const [drawerDirty, setDrawerDirty] = useState(false);
  const [drawerLabel, setDrawerLabel] = useState("");
  const [drawerActions, setDrawerActions] = useState<ButtonAction[]>([]);
  const [pendingOpenUrlActionId, setPendingOpenUrlActionId] = useState<
    string | null
  >(null);

  const pushButtonsToParent = useCallback(
    (next: CardButton[]) => {
      onChange(next);
    },
    [onChange]
  );

  const commitDrawerChanges = useCallback(() => {
    if (!drawerVisible || activeIndex === null || !drawerButton) return;
    const sanitized: CardButton = {
      ...drawerButton,
      label: drawerLabel,
      actions: normalizeButtonActions(drawerActions || []),
    };
    const next = safeButtons.map((btn, idx) =>
      idx === activeIndex ? sanitized : btn
    );
    pushButtonsToParent(next);
    setDrawerDirty(false);
  }, [
    drawerVisible,
    activeIndex,
    drawerButton,
    drawerLabel,
    drawerActions,
    safeButtons,
    pushButtonsToParent,
  ]);

  const commitActiveButtonToParent = useCallback(
    (nextButton: CardButton) => {
      if (activeIndex === null) return;
      const sanitized: CardButton = {
        ...nextButton,
        label: nextButton.label || "",
        actions: normalizeButtonActions(nextButton.actions || []),
      };
      const next = safeButtons.map((btn, idx) =>
        idx === activeIndex ? sanitized : btn
      );
      pushButtonsToParent(next);
    },
    [activeIndex, safeButtons, pushButtonsToParent]
  );

  useEffect(() => {
    if (!drawerVisible || activeIndex === null) {
      const shouldReset =
        drawerButton !== null ||
        drawerLabel !== "" ||
        drawerActions.length > 0 ||
        drawerDirty;

      if (shouldReset) {
        if (drawerButton !== null) {
          setDrawerButton(null);
        }
        if (drawerLabel !== "") {
          setDrawerLabel("");
        }
        if (drawerActions.length > 0) {
          setDrawerActions([]);
        }
        if (drawerDirty) {
          setDrawerDirty(false);
        }
      }
      return;
    }

    const target = safeButtons[activeIndex];
    if (!target) return;

    const normalizedTarget: CardButton = {
      ...target,
      label: target.label || "",
      actions: normalizeButtonActions(target.actions || []),
    };

    if (
      drawerDirty &&
      drawerButton &&
      drawerButton.id === normalizedTarget.id
    ) {
      return;
    }

    if (!buttonsEqual(drawerButton, normalizedTarget)) {
      setDrawerButton(normalizedTarget);
    }

    if (drawerLabel !== normalizedTarget.label) {
      setDrawerLabel(normalizedTarget.label);
    }

    if (!actionsEqual(drawerActions, normalizedTarget.actions || [])) {
      setDrawerActions(normalizedTarget.actions || []);
    }

    if (drawerDirty) {
      setDrawerDirty(false);
    }
  }, [
    drawerVisible,
    activeIndex,
    safeButtons,
    drawerDirty,
    drawerButton,
    drawerLabel,
    drawerActions,
  ]);

  const openDrawerForIndex = useCallback(
    (index: number) => {
      if (drawerVisible) {
        commitDrawerChanges();
      }
      const target = safeButtons[index];
      setActiveIndex(index);
      setDrawerVisible(true);
      if (target) {
        const normalizedTarget: CardButton = {
          ...target,
          actions: normalizeButtonActions(target.actions || []),
          label: target.label || "",
        };
        setDrawerButton(normalizedTarget);
        setDrawerActions(normalizedTarget.actions || []);
        setDrawerLabel(normalizedTarget.label);
      } else {
        setDrawerButton(null);
        setDrawerActions([]);
        setDrawerLabel("");
      }
      setDrawerDirty(false);
    },
    [commitDrawerChanges, drawerVisible, safeButtons]
  );

  const updateDrawerButton = useCallback(
    (updater: (current: CardButton) => CardButton) => {
      setDrawerButton((current) => {
        const base = current || {
          id: generateButtonId(),
          label: "",
          value: "",
          actions: [],
        };
        const next = updater(base);
        const normalized: CardButton = {
          ...next,
          label: next.label || "",
          actions: normalizeButtonActions(next.actions || []),
        };
        setDrawerLabel(normalized.label || "");
        setDrawerActions(normalized.actions || []);
        return normalized;
      });
      setDrawerDirty(true);
    },
    []
  );

  const addButton = () => {
    if (!canAdd) return;
    if (drawerVisible) {
      commitDrawerChanges();
    }
    const newButton: CardButton = {
      id: generateButtonId(),
      label: `Button ${safeButtons.length + 1}`,
      value: "",
      actions: [],
    };
    pushButtonsToParent([...safeButtons, newButton]);
    setActiveIndex(safeButtons.length);
    setDrawerVisible(true);
    setDrawerButton({ ...newButton });
    setDrawerLabel(newButton.label);
    setDrawerActions([]);
    setDrawerDirty(true);
  };

  const removeButton = (index: number) => {
    const next = safeButtons.filter((_, idx) => idx !== index);
    pushButtonsToParent(next);
    if (activeIndex !== null) {
      if (index === activeIndex) {
        setDrawerVisible(false);
        setActiveIndex(null);
        setDrawerDirty(false);
      } else if (index < activeIndex) {
        setActiveIndex(activeIndex - 1);
      }
    }
  };

  const closeDrawer = () => {
    commitDrawerChanges();
    setDrawerVisible(false);
    setActiveIndex(null);
    setDrawerButton(null);
    setDrawerLabel("");
    setDrawerActions([]);
    setDrawerDirty(false);
    setEditingAction(null);
    setShowCodeEditor(false);
    setPendingOpenUrlActionId(null);
  };

  const ACTION_OPTIONS: Array<{
    type: ButtonActionType;
    label: string;
    icon: React.ReactNode;
  }> = useMemo(
    () => [
      {
        type: "go_to_block",
        label: ACTION_LABELS.go_to_block,
        icon: <ExportOutlined />,
      },
      {
        type: "go_to_intent",
        label: ACTION_LABELS.go_to_intent,
        icon: <AimOutlined />,
      },
      {
        type: "call_forward",
        label: ACTION_LABELS.call_forward,
        icon: <PhoneOutlined />,
      },
      { type: "end", label: ACTION_LABELS.end, icon: <StopOutlined /> },
      {
        type: "set_variable",
        label: ACTION_LABELS.set_variable,
        icon: <BranchesOutlined />,
      },
      {
        type: "open_url",
        label: ACTION_LABELS.open_url,
        icon: <LinkOutlined />,
      },
      { type: "tool", label: ACTION_LABELS.tool, icon: <ToolOutlined /> },
      { type: "code", label: ACTION_LABELS.code, icon: <CodeOutlined /> },
      {
        type: "component",
        label: ACTION_LABELS.component,
        icon: <AppstoreOutlined />,
      },
    ],
    []
  );

  const actionMenuItems = useMemo<MenuProps["items"]>(() => {
    const items: MenuProps["items"] = [];
    const hasPrimaryAction = (drawerActions || []).some((action) =>
      isPrimaryActionType(action.type)
    );

    if (!hasPrimaryAction) {
      const primaryItems = ACTION_OPTIONS.filter((option) =>
        isPrimaryActionType(option.type)
      ).map((option) => ({
        key: option.type,
        label: (
          <div className={styles.buttonActionMenuItem}>
            <span className={styles.buttonActionMenuIcon}>{option.icon}</span>
            <span className={styles.buttonActionMenuLabel}>{option.label}</span>
          </div>
        ),
      }));

      items.push(...primaryItems);

      if (primaryItems.length > 0) {
        items.push({ type: "divider", key: "actions-divider" });
      }
    }

    const secondaryItems = ACTION_OPTIONS.filter(
      (option) => !isPrimaryActionType(option.type)
    ).map((option) => ({
      key: option.type,
      label: (
        <div className={styles.buttonActionMenuItem}>
          <span className={styles.buttonActionMenuIcon}>{option.icon}</span>
          <span className={styles.buttonActionMenuLabel}>{option.label}</span>
        </div>
      ),
    }));

    items.push(...secondaryItems);

    return items;
  }, [ACTION_OPTIONS, drawerActions]);

  const handleActionMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (!drawerButton) return;
    const type = key as ButtonActionType;
    if (type === "code") {
      setEditingAction(null);
      setShowCodeEditor(true);
      return;
    }
    const newActionId = generateActionId();
    const newAction: ButtonAction = {
      id: newActionId,
      type,
      label: ACTION_LABELS[type],
      data: type === "open_url" ? { url: "" } : {},
    };
    updateDrawerButton((current) => ({
      ...current,
      actions: [...(current.actions || []), newAction],
    }));
    if (type === "open_url") {
      setPendingOpenUrlActionId(newActionId);
    }
  };

  const handleRemoveAction = (actionId: string) => {
    updateDrawerButton((current) => ({
      ...current,
      actions: (current.actions || []).filter(
        (action) => action.id !== actionId
      ),
    }));
    if (pendingOpenUrlActionId === actionId) {
      setPendingOpenUrlActionId(null);
    }
  };

  const openCodeEditorForAction = (action: ButtonAction | null) => {
    setEditingAction(action);
    setShowCodeEditor(true);
  };

  const handleCodeSave = (code: string) => {
    if (!drawerButton) return;
    updateDrawerButton((current) => {
      const updated = editingAction
        ? (current.actions || []).map((action) =>
            action.id === editingAction.id
              ? {
                  ...action,
                  label: ACTION_LABELS.code,
                  type: "code",
                  data: { ...action.data, code },
                }
              : action
          )
        : [
            ...(current.actions || []),
            {
              id: generateActionId(),
              type: "code",
              label: ACTION_LABELS.code,
              data: { code },
            },
          ];
      return {
        ...current,
        actions: normalizeButtonActions(updated),
      };
    });
    setShowCodeEditor(false);
    setEditingAction(null);
  };

  const displayButtons = safeButtons.map((btn, idx) => {
    if (drawerVisible && idx === activeIndex && drawerButton) {
      return {
        ...drawerButton,
        label: drawerLabel,
        actions: drawerActions,
      };
    }
    return btn;
  });

  return (
    <>
      <div className={styles.buttonListEditor}>
        {safeButtons.length === 0 && (
          <Typography.Text type="secondary" className={styles.buttonListEmpty}>
            {emptyHint}
          </Typography.Text>
        )}

        {displayButtons.map((button, index) => (
          <div key={button.id} className={styles.buttonListItem}>
            <div
              className={styles.buttonListInfo}
              onClick={() => openDrawerForIndex(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDrawerForIndex(index);
                }
              }}
            >
              <span className={styles.buttonListLabel}>
                {button.label || `Button ${index + 1}`}
              </span>
              <span className={styles.buttonListMeta}>
                {(button.actions || []).length > 0
                  ? `${(button.actions || []).length} action${
                      (button.actions || []).length > 1 ? "s" : ""
                    }`
                  : "No actions"}
              </span>
            </div>
            <div className={styles.buttonListControls}>
              <Button type="text" onClick={() => openDrawerForIndex(index)}>
                Edit
              </Button>
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={() => removeButton(index)}
              />
            </div>
          </div>
        ))}

        {canAdd && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addButton}
            className={styles.buttonAdd}
          >
            {addLabel}
          </Button>
        )}
      </div>

      <Drawer
        open={drawerVisible}
        onClose={closeDrawer}
        width={420}
        closable={false}
        destroyOnHidden
        className={styles.buttonDrawer}
        title={
          <div className={styles.buttonDrawerTitle}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={closeDrawer}
              className={styles.buttonDrawerBack}
            />
            <span>Card</span>
          </div>
        }
      >
        {drawerButton && (
          <div className={styles.buttonDrawerBody}>
            <ValueInput
              value={drawerLabel}
              onChange={(value) => {
                setDrawerLabel(value);
                setDrawerDirty(true);
                setDrawerButton((current) =>
                  current ? { ...current, label: value } : current
                );
              }}
              placeholder="Enter button label, { to add variable"
              size="large"
              className={styles.cardTextInput}
            />

            <div className={styles.buttonActionsSection}>
              <div className={styles.buttonActionsHeader}>
                <Typography.Text className={styles.buttonActionsTitle}>
                  Actions
                </Typography.Text>
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: actionMenuItems,
                    onClick: handleActionMenuClick,
                  }}
                  placement="bottomRight"
                  overlayClassName={styles.buttonActionsDropdown}
                >
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    className={styles.buttonActionsAdd}
                  />
                </Dropdown>
              </div>

              {(drawerButton.actions || []).length === 0 ? (
                <Typography.Text type="secondary">
                  No actions added yet.
                </Typography.Text>
              ) : (
                <div className={styles.buttonActionsList}>
                  {(drawerButton.actions || []).map((action) => {
                    const option = ACTION_OPTIONS.find(
                      (opt) => opt.type === action.type
                    );
                    const actionItemClass = [
                      styles.buttonActionItem,
                      isPrimaryActionType(action.type)
                        ? styles.buttonActionItemPrimary
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <div key={action.id} className={actionItemClass}>
                        <div className={styles.buttonActionMain}>
                          <div className={styles.buttonActionIcon}>
                            {option?.icon || <CodeOutlined />}
                          </div>
                          <div className={styles.buttonActionFields}>
                            <ValueInput
                              value={action.label || ""}
                              onChange={(value) => {
                                if (action.type === "open_url") {
                                  return;
                                }
                                const updated = (
                                  drawerButton.actions || []
                                ).map((a) =>
                                  a.id === action.id
                                    ? { ...a, label: value }
                                    : a
                                );
                                updateDrawerButton((current) => ({
                                  ...current,
                                  actions: normalizeButtonActions(updated),
                                }));
                              }}
                              placeholder="Enter action name, { to add variable"
                              size="middle"
                              className={styles.buttonActionInput}
                              readOnly={action.type === "open_url"}
                            />
                            {action.type === "code" && (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => openCodeEditorForAction(action)}
                                className={styles.buttonActionEdit}
                              >
                                Edit code
                              </Button>
                            )}
                            {action.type === "set_variable" && (
                              <SetVariableActionEditor
                                action={action}
                                onChange={(updatedAction: ButtonAction) => {
                                  const updated = (
                                    drawerButton.actions || []
                                  ).map((a) =>
                                    a.id === action.id ? updatedAction : a
                                  );
                                  updateDrawerButton((current) => ({
                                    ...current,
                                    actions: normalizeButtonActions(updated),
                                  }));
                                }}
                              />
                            )}
                            {action.type === "go_to_intent" && (
                              <IntentPicker
                                value={(action.data?.intent as string) || ""}
                                onChange={(nextIntent) => {
                                  const trimmed = (nextIntent || "").trim();
                                  const updated = (
                                    drawerButton.actions || []
                                  ).map((a) => {
                                    if (a.id !== action.id) return a;
                                    const nextData = { ...(a.data || {}) };
                                    if (trimmed) {
                                      nextData.intent = trimmed;
                                    } else {
                                      delete nextData.intent;
                                    }
                                    return {
                                      ...a,
                                      data: nextData,
                                    };
                                  });
                                  updateDrawerButton((current) => ({
                                    ...current,
                                    actions: normalizeButtonActions(updated),
                                  }));
                                }}
                                placeholder="Select or create intent"
                                allowCreate
                                allowClear
                                createMode="modal"
                                size="middle"
                              />
                            )}
                            {action.type === "open_url" && (
                              <OpenUrlActionEditor
                                action={action}
                                autoOpen={pendingOpenUrlActionId === action.id}
                                onAutoOpenHandled={() =>
                                  setPendingOpenUrlActionId(null)
                                }
                                onChange={(updatedAction: ButtonAction) => {
                                  const updated = (
                                    drawerButton.actions || []
                                  ).map((a) =>
                                    a.id === action.id ? updatedAction : a
                                  );
                                  updateDrawerButton((current) => ({
                                    ...current,
                                    actions: normalizeButtonActions(updated),
                                  }));
                                }}
                                onCommit={(updatedAction: ButtonAction) => {
                                  const updated = (
                                    drawerButton.actions || []
                                  ).map((a) =>
                                    a.id === action.id ? updatedAction : a
                                  );
                                  if (!drawerButton) {
                                    return;
                                  }
                                  const normalized =
                                    normalizeButtonActions(updated);
                                  const baseButton = drawerButton;
                                  const nextButton: CardButton = {
                                    ...baseButton,
                                    label: drawerLabel,
                                    actions: normalized,
                                  };
                                  commitActiveButtonToParent(nextButton);
                                  setDrawerDirty(false);
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <Button
                          type="text"
                          icon={<MinusOutlined />}
                          className={styles.buttonActionRemove}
                          onClick={() => handleRemoveAction(action.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <FullScreenCodeEditor
        visible={showCodeEditor}
        onClose={() => {
          setShowCodeEditor(false);
          setEditingAction(null);
        }}
        onSave={handleCodeSave}
        initialCode={editingAction?.data?.code || ""}
        title="Javascript"
        language="javascript"
        startFullscreen
      />
    </>
  );
};

interface PropertiesPanelProps {
  isOpen: boolean;
  selectedNodeId: string | null;
}

// Properties drawer shown when a node is selected. Keep this component small and declarative.
export default function PropertiesPanel({
  isOpen,
  selectedNodeId,
}: PropertiesPanelProps) {
  const dispatch = useAppDispatch();
  const { nodes } = useAppSelector((state) => state.workflow);

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId)
    : null;

  // Preserve scroll position while syncing to Redux to avoid jump-to-top behavior
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    dispatch(setSelectedNode(null));
  };

  // Generic node data update helper (type-safe enough for dynamic schemas)
  const handleUpdateNode = (field: string, value: any) => {
    if (selectedNodeId) {
      const st = contentRef.current?.scrollTop ?? null;
      dispatch(
        updateNode({
          id: selectedNodeId,
          data: { [field]: value },
        })
      );
      if (st !== null) {
        // Restore after React updates the DOM
        requestAnimationFrame(() => {
          if (contentRef.current) contentRef.current.scrollTop = st;
        });
      }
    }
  };

  const handleUpdateNodeBatch = (fields: Record<string, any>) => {
    if (!selectedNodeId) return;
    const st = contentRef.current?.scrollTop ?? null;
    dispatch(
      updateNode({
        id: selectedNodeId,
        data: fields,
      })
    );
    if (st !== null) {
      requestAnimationFrame(() => {
        if (contentRef.current) contentRef.current.scrollTop = st;
      });
    }
  };

  // Delete node and close the panel
  const handleDeleteNode = () => {
    if (selectedNodeId) {
      dispatch(deleteNode(selectedNodeId));
      dispatch(showToast({ message: "Block deleted", type: "success" }));
      handleClose();
    }
  };

  // Duplicate currently selected node with a slight offset
  const handleDuplicateNode = () => {
    if (!selectedNode) return;
    const orig = selectedNode;
    const newId = `${orig.type}-${Date.now()}`;
    const dup: any = {
      id: newId,
      type: orig.type,
      position: {
        x: (orig.position?.x ?? 0) + 48,
        y: (orig.position?.y ?? 0) + 48,
      },
      data: { ...orig.data, __editingLabel: false },
      selected: false,
      dragging: false,
    };
    dispatch(addNode(dup));
    setTimeout(() => {
      dispatch(setSelectedNode(newId));
    }, 50);
  };

  const [localDescription, setLocalDescription] = useState<string>(
    selectedNode?.data.description || ""
  );

  useEffect(() => {
    setLocalDescription(selectedNode?.data.description || "");
  }, [selectedNodeId]);

  const commitDescription = () => {
    if ((selectedNode?.data.description || "") !== localDescription) {
      handleUpdateNode("description", localDescription);
    }
  };

  const [showDescription, setShowDescription] = useState(false);

  if (!isOpen || !selectedNode) return null;

  // --------- Node-specific properties sections (split into small components) ---------
  const StartProperties = () => (
    <Form layout="vertical">
      <Form.Item label="Trigger Type">
        <Select
          value={selectedNode.data.trigger || "manual"}
          onChange={(val) => handleUpdateNode("trigger", val)}
          options={[
            { label: "Manual", value: "manual" },
            { label: "Webhook", value: "webhook" },
            { label: "Schedule", value: "schedule" },
          ]}
        />
      </Form.Item>
    </Form>
  );

  const CaptureProperties = () => {
    const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
    const [entitySearch, setEntitySearch] = useState("");
    const [entityCreationModalOpen, setEntityCreationModalOpen] =
      useState(false);
    const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
    const [bulkImportText, setBulkImportText] = useState("");
    const [isDragActive, setIsDragActive] = useState(false);
    const [newEntityName, setNewEntityName] = useState("");
    const [entityDataType, setEntityDataType] = useState("custom");
    const [entityValues, setEntityValues] = useState<string[]>([""]);
    const [showAllValues, setShowAllValues] = useState(false);
    const entities = useAppSelector((s) => s.entities?.list || []);
    const entityDataTypes = useAppSelector((s) => s.entities?.dataTypes || []);
    const [captureMode, setCaptureMode] = useState<CaptureMode>(
      selectedNode.data.captureMode === "reply" ? "reply" : "entities"
    );
    const [entityRows, setEntityRows] = useState<CaptureEntityConfig[]>(
      normalizeCaptureEntities(selectedNode.data.entities)
    );
    // Removed promptValue and validationValue
    const [replyVariable, setReplyVariable] = useState<string>(
      selectedNode.data.variable || ""
    );
    const [listenForOtherTriggersState, setListenForOtherTriggersState] =
      useState<boolean>(!!selectedNode.data.listenForOtherTriggers);
    const [noReplyState, setNoReplyState] = useState<CaptureNoReplyConfig>(
      ensureNoReplyConfig(selectedNode.data.noReply)
    );
    const [autoRepromptState, setAutoRepromptState] =
      useState<CaptureAutoRepromptConfig>(
        ensureAutoRepromptConfig(selectedNode.data.autoReprompt)
      );
    const [rules, setRules] = useState<string[]>(
      normalizeStringList(selectedNode.data.rules)
    );
    const [exitScenarios, setExitScenarios] = useState<string[]>(
      normalizeStringList(selectedNode.data.exitScenarios)
    );
    const [exitPathEnabled, setExitPathEnabled] = useState<boolean>(
      !!selectedNode.data.exitPathEnabled
    );
    const [exitPathLabel, setExitPathLabel] = useState<string>(
      selectedNode.data.exitPathLabel || "Exit scenario"
    );
    const [exitPathPopoverOpen, setExitPathPopoverOpen] =
      useState<boolean>(false);

    // Local state for editing - prevents focus loss on typing
    const [localRules, setLocalRules] = useState<string[]>(
      normalizeStringList(selectedNode.data.rules)
    );
    const [localExitScenarios, setLocalExitScenarios] = useState<string[]>(
      normalizeStringList(selectedNode.data.exitScenarios)
    );

    useEffect(() => {
      setCaptureMode(
        selectedNode.data.captureMode === "reply" ? "reply" : "entities"
      );
      setEntityRows(normalizeCaptureEntities(selectedNode.data.entities));
      // Removed prompt and validation from effect
      setReplyVariable(selectedNode.data.variable || "");
      setListenForOtherTriggersState(
        !!selectedNode.data.listenForOtherTriggers
      );
      setNoReplyState(ensureNoReplyConfig(selectedNode.data.noReply));
      setAutoRepromptState(
        ensureAutoRepromptConfig(selectedNode.data.autoReprompt)
      );
      setRules(normalizeStringList(selectedNode.data.rules));
      setExitScenarios(normalizeStringList(selectedNode.data.exitScenarios));
      setExitPathEnabled(!!selectedNode.data.exitPathEnabled);
      setExitPathLabel(selectedNode.data.exitPathLabel || "Exit scenario");
      // Sync local state with main state
      setLocalRules(normalizeStringList(selectedNode.data.rules));
      setLocalExitScenarios(
        normalizeStringList(selectedNode.data.exitScenarios)
      );
    }, [
      selectedNodeId,
      selectedNode.data.captureMode,
      selectedNode.data.entities,
      selectedNode.data.prompt,
      selectedNode.data.validation,
      selectedNode.data.variable,
      selectedNode.data.listenForOtherTriggers,
      selectedNode.data.noReply,
      selectedNode.data.autoReprompt,
      selectedNode.data.rules,
      selectedNode.data.exitScenarios,
      selectedNode.data.exitPathEnabled,
      selectedNode.data.exitPathLabel,
    ]);

    const commitPrompt = () => {
      // Removed commitPrompt
    };

    const commitValidation = () => {
      // Removed commitValidation
    };

    const updateEntities = (
      producer: (current: CaptureEntityConfig[]) => CaptureEntityConfig[]
    ) => {
      setEntityRows((current) => {
        const next = producer(current);
        handleUpdateNodeBatch({
          entities: serializeCaptureEntities(next),
        });
        return next;
      });
    };

    const addEntityRow = (entityName?: string) => {
      const nameToAdd = entityName !== undefined ? entityName : entitySearch;
      if (!nameToAdd) return;
      updateEntities((current) => [
        ...current,
        {
          id: generateCaptureEntityId(),
          entity: nameToAdd,
          variable: "",
          required: true,
        },
      ]);
      setEntityPopoverOpen(false);
      setEntitySearch("");
    };

    const handleCreateNewEntity = () => {
      const trimmed = newEntityName.trim();
      if (!trimmed) return;

      // Parse entity values
      const normalizedValues = entityValues
        .map((entry) =>
          entry
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        )
        .filter((parts) => parts.length > 0)
        .map((parts) => ({
          value: parts[0],
          synonyms: parts.slice(1).length > 0 ? parts.slice(1) : undefined,
        }));

      // Create entity with details
      dispatch(
        addEntityDetailed({
          name: trimmed,
          dataType: entityDataType,
          values: normalizedValues.length ? normalizedValues : undefined,
        })
      );

      // Add to current capture entity list
      addEntityRow(trimmed);

      // Reset modal state
      setNewEntityName("");
      setEntityDataType("custom");
      setEntityValues([""]);
      setShowAllValues(false);
      setEntityCreationModalOpen(false);
      setEntityPopoverOpen(false);
    };

    const addEntityValueRow = () => {
      setEntityValues((current) => [...current, ""]);
      // Reset to collapsed view when adding new values if we're above the limit
      if (entityValues.length >= 8) {
        setShowAllValues(false);
      }
    };

    const removeEntityValueRow = (index: number) => {
      setEntityValues((current) => {
        const next = current.filter((_, i) => i !== index);
        return next.length > 0 ? next : [""];
      });
    };

    const handleEntityValueChange = (index: number, value: string) => {
      setEntityValues((current) => {
        const updated = [...current];
        updated[index] = value;
        return updated;
      });
    };

    const handleBulkImport = () => {
      const entries = bulkImportText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      setEntityValues(entries.length > 0 ? entries : [""]);
      setShowAllValues(false); // Reset to collapsed view after bulk import
      setBulkImportModalOpen(false);
      setBulkImportText("");
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set to false if we're leaving the textarea entirely
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];

      // Check if it's a CSV file or text file
      if (
        file.type === "text/csv" ||
        file.type === "text/plain" ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".txt")
      ) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            setBulkImportText(content);
            dispatch(
              showToast({
                message: `Successfully loaded ${file.name}`,
                type: "success",
              })
            );
          }
        };
        reader.readAsText(file);
      } else {
        // Show error for unsupported file types
        dispatch(
          showToast({
            message: "Please drop a CSV or text file",
            type: "error",
          })
        );
      }
    };

    const removeEntityRow = (rowId: string) => {
      updateEntities((current) => current.filter((row) => row.id !== rowId));
    };

    const setEntityRowValue = (
      rowId: string,
      patch: Partial<CaptureEntityConfig>
    ) => {
      updateEntities((current) =>
        current.map((row) =>
          row.id === rowId
            ? {
                ...row,
                ...patch,
                entity: patch.entity !== undefined ? patch.entity : row.entity,
                variable:
                  patch.variable !== undefined ? patch.variable : row.variable,
                required:
                  patch.required !== undefined ? patch.required : row.required,
              }
            : row
        )
      );
    };

    const commitCaptureMode = (nextMode: CaptureMode) => {
      setCaptureMode(nextMode);
      if (nextMode === "reply") {
        const normalized = replyVariable.trim() || "user_input";
        setReplyVariable(normalized);
        handleUpdateNodeBatch({ captureMode: nextMode, variable: normalized });
      } else {
        handleUpdateNodeBatch({ captureMode: nextMode });
      }
    };

    const toggleListenForOtherTriggers = (checked: boolean) => {
      setListenForOtherTriggersState(checked);
      handleUpdateNodeBatch({ listenForOtherTriggers: checked });
    };

    const commitNoReplyConfig = useCallback(
      (next: CaptureNoReplyConfig) => {
        const ensured = ensureNoReplyConfig(next);
        setNoReplyState((current) => {
          if (!captureNoReplyEqual(current, ensured)) {
            handleUpdateNodeBatch({
              noReply: serializeNoReplyConfig(ensured),
            });
          }
          return ensured;
        });
      },
      [handleUpdateNodeBatch]
    );

    const commitAutoRepromptConfig = useCallback(
      (next: CaptureAutoRepromptConfig) => {
        const ensured = ensureAutoRepromptConfig(next);
        setAutoRepromptState((current) => {
          if (!captureAutoRepromptEqual(current, ensured)) {
            handleUpdateNodeBatch({
              autoReprompt: serializeAutoRepromptConfig(ensured),
            });
          }
          return ensured;
        });
      },
      [handleUpdateNodeBatch]
    );

    const addRule = () => {
      const newRules = [...localRules, ""];
      setLocalRules(newRules);
      setRules(newRules);
      handleUpdateNodeBatch({ rules: serializeStringList(newRules) });
    };

    const updateRuleLocal = (index: number, value: string) => {
      setLocalRules((current) => {
        const next = [...current];
        next[index] = value;
        return next;
      });
    };

    const commitRule = (index: number) => {
      const updatedRules = [...localRules];
      setRules(updatedRules);
      handleUpdateNodeBatch({ rules: serializeStringList(updatedRules) });
    };

    const removeRule = (index: number) => {
      const newRules = localRules.filter((_, idx) => idx !== index);
      setLocalRules(newRules);
      setRules(newRules);
      handleUpdateNodeBatch({ rules: serializeStringList(newRules) });
    };

    const addExitScenario = () => {
      const newScenarios = [...localExitScenarios, ""];
      setLocalExitScenarios(newScenarios);
      setExitScenarios(newScenarios);
      handleUpdateNodeBatch({
        exitScenarios: serializeStringList(newScenarios),
      });
    };

    const updateExitScenarioLocal = (index: number, value: string) => {
      setLocalExitScenarios((current) => {
        const next = [...current];
        next[index] = value;
        return next;
      });
    };

    const commitExitScenario = (index: number) => {
      const updatedScenarios = [...localExitScenarios];
      setExitScenarios(updatedScenarios);
      handleUpdateNodeBatch({
        exitScenarios: serializeStringList(updatedScenarios),
      });
    };

    const removeExitScenario = (index: number) => {
      const newScenarios = localExitScenarios.filter((_, idx) => idx !== index);
      setLocalExitScenarios(newScenarios);
      setExitScenarios(newScenarios);
      handleUpdateNodeBatch({
        exitScenarios: serializeStringList(newScenarios),
      });
    };

    const toggleExitPath = (checked: boolean) => {
      setExitPathEnabled(checked);
      handleUpdateNodeBatch({
        exitPathEnabled: checked,
        exitPathLabel: checked ? exitPathLabel : undefined,
      });
    };

    return (
      <div className={styles.choiceProperties}>
        <Form layout="vertical">
          <Form.Item label="Capture">
            <Select
              value={captureMode}
              onChange={(value) => commitCaptureMode(value as CaptureMode)}
              options={[
                { label: "Entities", value: "entities" },
                { label: "Entire user reply", value: "reply" },
              ]}
              className={styles.captureModeSelect}
            />
          </Form.Item>
          {captureMode === "reply" && (
            <Form.Item label="Save reply to variable">
              <VariablePicker
                value={replyVariable}
                onChange={(value) => {
                  const nextValue = value || "";
                  setReplyVariable(nextValue);
                  handleUpdateNode("variable", nextValue);
                }}
                placeholder="Select variable"
                allowCreate
                createMode="modal"
              />
            </Form.Item>
          )}
        </Form>

        {captureMode === "entities" && (
          <>
            <div className={styles.choiceHeaderRow}>
              <Typography.Text className={styles.sectionHeading}>
                Entities
              </Typography.Text>
              <Popover
                trigger="click"
                open={entityPopoverOpen}
                onOpenChange={setEntityPopoverOpen}
                placement="bottomRight"
                content={
                  <div className={styles.entityPopoverContainer}>
                    <div className={styles.entityPopoverSearchContainer}>
                      <div className={styles.entityPopoverSearchRow}>
                        <span className={styles.entityPopoverSearchIcon}>
                          <svg width="18" height="18" fill="none">
                            <path
                              d="M8.5 15.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5.5-1-3-3"
                              stroke="#94a3b8"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        <input
                          className={styles.entityPopoverSearchInput}
                          placeholder="Search"
                          value={entitySearch}
                          onChange={(e) => setEntitySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className={styles.entityPopoverDivider} />
                    <div className={styles.entityPopoverList}>
                      {entities
                        .filter(
                          (e) =>
                            !entitySearch ||
                            e.toLowerCase().includes(entitySearch.toLowerCase())
                        )
                        .filter(
                          (e) => !entityRows.some((row) => row.entity === e)
                        )
                        .map((e) => (
                          <div
                            key={e}
                            className={styles.entityPopoverItem}
                            onClick={() => addEntityRow(e)}
                          >
                            {e}
                          </div>
                        ))}
                    </div>
                    <div className={styles.entityPopoverDivider} />
                    <div className={styles.entityPopoverCreateAction}>
                      <span
                        className={styles.entityPopoverCreateButton}
                        onClick={() => setEntityCreationModalOpen(true)}
                      >
                        Create entity
                      </span>
                    </div>
                  </div>
                }
              >
                <Button
                  icon={<PlusOutlined />}
                  type="text"
                  className={styles.choiceAddButton}
                />
              </Popover>
            </div>
            <div className={styles.choiceList}>
              <div className={styles.captureEntitiesList}>
                {entityRows.map((row) => (
                  <div key={row.id} className={styles.captureEntityRow}>
                    <div className={styles.captureEntityColumn}>
                      <span className={styles.captureEntityText}>
                        {row.entity}
                      </span>
                    </div>
                    <div className={styles.captureEntityActions}>
                      <Button
                        type="text"
                        icon={<MinusOutlined />}
                        onClick={() => removeEntityRow(row.id)}
                        className={styles.choiceRemoveButton}
                        aria-label="Remove entity"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Divider className={styles.choiceDivider} />
          </>
        )}

        <CaptureFallbackSettings
          noReply={noReplyState}
          onChangeNoReply={commitNoReplyConfig}
          autoReprompt={autoRepromptState}
          onChangeAutoReprompt={commitAutoRepromptConfig}
          listenForOtherTriggers={listenForOtherTriggersState}
          onListenForOtherTriggersChange={toggleListenForOtherTriggers}
          showAutoReprompt={captureMode === "entities"}
        />

        {captureMode === "entities" && (
          <>
            <div className={styles.choiceHeaderRow}>
              <Typography.Text className={styles.sectionHeading}>
                Rules
              </Typography.Text>
              <Button
                icon={<PlusOutlined />}
                type="text"
                onClick={addRule}
                className={styles.choiceAddButton}
              />
            </div>
            <div className={styles.choiceList}>
              {localRules.length === 0 ? (
                <div className={styles.captureEmptyState}>
                  Add natural language guidance for the AI to validate captured
                  entities.
                </div>
              ) : (
                <div className={styles.rulesContainer}>
                  {localRules.map((rule, index) => (
                    <div key={`rule-${index}`} className={styles.ruleItem}>
                      <Input.TextArea
                        value={rule}
                        onChange={(event) =>
                          updateRuleLocal(index, event.target.value)
                        }
                        onBlur={() => commitRule(index)}
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        placeholder={`Enter rule ${index + 1}...`}
                        className={styles.ruleTextarea}
                      />
                      <Button
                        type="text"
                        icon={<MinusOutlined />}
                        onClick={() => removeRule(index)}
                        className={styles.ruleRemoveButton}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Divider className={styles.rulesSectionDivider} />

            <div className={styles.choiceHeaderRow}>
              <Typography.Text className={styles.sectionHeading}>
                Exit scenarios
              </Typography.Text>
              <Button
                icon={<PlusOutlined />}
                type="text"
                onClick={addExitScenario}
                className={styles.choiceAddButton}
              />
            </div>
            <div className={styles.choiceList}>
              {localExitScenarios.length === 0 ? (
                <div className={styles.captureEmptyState}>
                  Document when the assistant should stop collecting entities.
                </div>
              ) : (
                <div className={styles.rulesContainer}>
                  {localExitScenarios.map((scenario, index) => (
                    <div
                      key={`exit-scenario-${index}`}
                      className={styles.ruleItem}
                    >
                      <Input.TextArea
                        value={scenario}
                        onChange={(event) =>
                          updateExitScenarioLocal(index, event.target.value)
                        }
                        onBlur={() => commitExitScenario(index)}
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        placeholder={`Exit if...`}
                        className={styles.ruleTextarea}
                      />
                      <Button
                        type="text"
                        icon={<MinusOutlined />}
                        onClick={() => removeExitScenario(index)}
                        className={styles.ruleRemoveButton}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.captureToggleCard}>
              <div className={styles.captureToggleHeader}>
                <div>
                  <Popover
                    trigger={["click"]}
                    destroyTooltipOnHide
                    placement="left"
                    open={exitPathPopoverOpen}
                    onOpenChange={(open) => {
                      setExitPathPopoverOpen(open);
                    }}
                    content={
                      <div style={{ width: "200px", padding: "4px" }}>
                        <Typography.Text
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginBottom: "8px",
                            display: "block",
                          }}
                        >
                          Path label
                        </Typography.Text>
                        <Input
                          autoFocus
                          value={exitPathLabel}
                          onChange={(event) => {
                            const { value } = event.target;
                            setExitPathLabel(value);
                          }}
                          onBlur={() => {
                            handleUpdateNodeBatch({ exitPathLabel });
                          }}
                          placeholder="Enter exit path label"
                          onPressEnter={() => {
                            setExitPathPopoverOpen(false);
                            handleUpdateNodeBatch({ exitPathLabel });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setExitPathPopoverOpen(false);
                            }
                          }}
                        />
                      </div>
                    }
                  >
                    <Typography.Text
                      className={styles.sectionHeading}
                      style={{ cursor: "pointer", userSelect: "none" }}
                      onClick={() => setExitPathPopoverOpen(true)}
                    >
                      Exit scenario path
                    </Typography.Text>
                  </Popover>
                </div>
                <Switch checked={exitPathEnabled} onChange={toggleExitPath} />
              </div>
            </div>
          </>
        )}

        {/* Entity Creation Modal */}
        <Modal
          title="Create entity"
          open={entityCreationModalOpen}
          onCancel={() => {
            setEntityCreationModalOpen(false);
            setNewEntityName("");
            setEntityDataType("custom");
            setEntityValues([""]);
            setShowAllValues(false);
          }}
          onOk={handleCreateNewEntity}
          okText="Create entity"
          cancelText="Cancel"
          okButtonProps={{
            disabled:
              !newEntityName.trim() ||
              (entityDataType === "custom" &&
                entityValues.every((v) => !v.trim())),
          }}
          destroyOnHidden
          width={520}
        >
          <Form layout="vertical">
            <Form.Item label="Name" required>
              <Input
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="Enter entity name"
                onPressEnter={handleCreateNewEntity}
                autoFocus
              />
            </Form.Item>

            <Form.Item label="Data type">
              <Select
                value={entityDataType}
                onChange={setEntityDataType}
                options={entityDataTypes}
              />
            </Form.Item>

            {entityDataType === "custom" && (
              <div>
                <div className={styles.entityModalValuesHeader}>
                  <span className={styles.entityModalValuesLabel}>
                    Values{" "}
                    <span className={styles.entityModalRequiredStar}>*</span>
                  </span>
                  <Space size="small">
                    <Button
                      type="default"
                      size="small"
                      icon={<InboxOutlined />}
                      onClick={() => setBulkImportModalOpen(true)}
                    />
                    <Button
                      type="default"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={addEntityValueRow}
                    />
                  </Space>
                </div>
                <div className={styles.entityModalValuesContainer}>
                  {(showAllValues
                    ? entityValues
                    : entityValues.slice(0, 8)
                  ).map((entry, index) => (
                    <div
                      key={`entity-value-${index}`}
                      className={styles.entityModalValueRow}
                    >
                      <Input
                        className={styles.entityModalValueInput}
                        value={entry}
                        onChange={(event) =>
                          handleEntityValueChange(index, event.target.value)
                        }
                        placeholder="Add synonyms, comma separated"
                      />
                      <Button
                        type="text"
                        icon={<MinusCircleOutlined />}
                        onClick={() => removeEntityValueRow(index)}
                        disabled={entityValues.length === 1}
                      />
                    </div>
                  ))}
                  {entityValues.length > 8 && (
                    <div className={styles.entityModalToggleContainer}>
                      <Button
                        type="link"
                        onClick={() => setShowAllValues(!showAllValues)}
                        className={styles.entityModalToggleButton}
                      >
                        {showAllValues
                          ? "Show less"
                          : `Show all values (${entityValues.length})`}
                      </Button>
                    </div>
                  )}
                </div>
                <div className={styles.entityModalHelperText}>
                  Add values and synonyms (comma separated)
                </div>
              </div>
            )}
          </Form>
        </Modal>

        {/* Bulk Import Modal */}
        <Modal
          title="Bulk import entity values"
          open={bulkImportModalOpen}
          onCancel={() => {
            setBulkImportModalOpen(false);
            setBulkImportText("");
            setIsDragActive(false);
          }}
          onOk={handleBulkImport}
          okText="Import"
          cancelText="Close"
          destroyOnHidden
          width={520}
          afterClose={() => {
            setIsDragActive(false);
          }}
        >
          <Form layout="vertical">
            <Form.Item
              label="Entity values"
              extra="Format: value 1, synonym 1, 2, 3... One entity value per line."
            >
              <TextArea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder={
                  isDragActive
                    ? "Drop CSV file here..."
                    : "Enter values, or drop CSV here"
                }
                rows={8}
                style={{
                  resize: "vertical",
                  border: isDragActive
                    ? "2px dashed #1890ff"
                    : "2px dashed #d9d9d9",
                  backgroundColor: isDragActive ? "#f6ffed" : "transparent",
                  borderRadius: "6px",
                  transition: "all 0.3s ease",
                }}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  const MessageProperties = () => {
    const PROMPT_VARIANT_PREFIX = "__prompt__:";
    const isPromptVariantValue = (value: unknown): value is string =>
      typeof value === "string" && value.startsWith(PROMPT_VARIANT_PREFIX);
    const extractPromptName = (value: string) =>
      value.slice(PROMPT_VARIANT_PREFIX.length);

    type MessageVariantType = "condition" | "expression" | "prompt";

    interface ConditionVariant {
      id: string;
      type: "condition";
      text: string;
      rules: ConditionRule[];
      matchType: "all" | "any";
    }

    interface ExpressionVariant {
      id: string;
      type: "expression";
      text: string;
      expression: string;
    }

    interface PromptReturnValue {
      id: string;
      operator: ConditionOperatorValue;
      value: string;
      message: string;
    }

    interface PromptVariant {
      id: string;
      type: "prompt";
      promptId: string;
      text: string;
      returnValues: PromptReturnValue[];
    }

    type MessageVariant = ConditionVariant | ExpressionVariant | PromptVariant;

    const isConditionOperator = (
      value: string
    ): value is ConditionOperatorValue =>
      CONDITION_OPERATORS.some((operator) => operator.value === value);

    const normalizePromptReturnValues = (
      raw: unknown
    ): PromptReturnValue[] => {
      if (!Array.isArray(raw)) return [];

      return raw
        .map<PromptReturnValue | null>((entry) => {
          if (!entry) return null;

          const ensuredId =
            typeof entry.id === "string" && entry.id.trim().length > 0
              ? entry.id
              : nanoid();

          const operator =
            typeof entry.operator === "string" &&
            isConditionOperator(entry.operator)
              ? entry.operator
              : "is";

          const value =
            typeof entry.value === "string"
              ? entry.value
              : typeof entry.variable === "string"
              ? entry.variable
              : "";

          const message =
            typeof entry.message === "string"
              ? entry.message
              : typeof entry.text === "string"
              ? entry.text
              : typeof entry.response === "string"
              ? entry.response
              : "";

          return {
            id: ensuredId,
            operator,
            value,
            message,
          };
        })
        .filter((entry): entry is PromptReturnValue => entry !== null);
    };

    const normalizeVariants = (raw: unknown): MessageVariant[] => {
      if (!Array.isArray(raw)) return [];

      return raw
        .map<MessageVariant | null>((item) => {
          if (!item) return null;

          if (typeof item === "string") {
            if (isPromptVariantValue(item)) {
              return {
                id: nanoid(),
                type: "prompt",
                promptId: extractPromptName(item),
                text: "",
                returnValues: [],
              };
            }

            return {
              id: nanoid(),
              type: "condition",
              text: item,
              rules: [],
              matchType: "all",
            };
          }

          if (typeof item === "object") {
            const typed = item as Record<string, any>;
            const ensuredId =
              typeof typed.id === "string" && typed.id.trim().length > 0
                ? typed.id
                : nanoid();

            if (typed.type === "prompt" && typeof typed.promptId === "string") {
              return {
                id: ensuredId,
                type: "prompt",
                promptId: typed.promptId,
                text:
                  typeof typed.text === "string"
                    ? typed.text
                    : typeof typed.message === "string"
                    ? typed.message
                    : "",
                returnValues: normalizePromptReturnValues(
                  typed.returnValues ?? typed.returns ?? typed.cases ?? []
                ),
              };
            }

            if (typed.type === "condition") {
              const rulesArray = Array.isArray(typed.rules)
                ? typed.rules.map((rule: any) => ({
                    id:
                      typeof rule?.id === "string" && rule.id.trim().length > 0
                        ? rule.id
                        : nanoid(),
                    variable:
                      typeof rule?.variable === "string" ? rule.variable : "",
                    operator:
                      typeof rule?.operator === "string" ? rule.operator : "is",
                    value: typeof rule?.value === "string" ? rule.value : "",
                  }))
                : [];

              return {
                id: ensuredId,
                type: "condition",
                text: typeof typed.text === "string" ? typed.text : "",
                rules: rulesArray,
                matchType: typed.matchType === "any" ? "any" : "all",
              };
            }

            if (typed.type === "expression") {
              return {
                id: ensuredId,
                type: "expression",
                text: typeof typed.text === "string" ? typed.text : "",
                expression:
                  typeof typed.expression === "string" ? typed.expression : "",
              };
            }

            if (typeof typed.prompt === "string") {
              return {
                id: ensuredId,
                type: "prompt",
                promptId: typed.prompt,
                text:
                  typeof typed.text === "string"
                    ? typed.text
                    : typeof typed.message === "string"
                    ? typed.message
                    : "",
                returnValues: normalizePromptReturnValues(
                  typed.returnValues ?? typed.returns ?? typed.cases ?? []
                ),
              };
            }

            if (typeof typed.value === "string") {
              if (isPromptVariantValue(typed.value)) {
                return {
                  id: ensuredId,
                  type: "prompt",
                  promptId: extractPromptName(typed.value),
                  text:
                    typeof typed.text === "string"
                      ? typed.text
                      : typeof typed.message === "string"
                      ? typed.message
                      : "",
                  returnValues: normalizePromptReturnValues(
                    typed.returnValues ?? typed.returns ?? typed.cases ?? []
                  ),
                };
              }

              return {
                id: ensuredId,
                type: "condition",
                text: typed.value,
                rules: [],
                matchType: "all",
              };
            }
          }

          return null;
        })
        .filter((variant): variant is MessageVariant => variant !== null);
    };

    const [localMessageText, setLocalMessageText] = useState<string>(
      selectedNode.data.text || ""
    );
    const [localDelay, setLocalDelay] = useState<number>(
      typeof selectedNode.data.delay === "number" ? selectedNode.data.delay : 0
    );
    const [variants, setVariants] = useState<MessageVariant[]>(() =>
      normalizeVariants(selectedNode.data.variants)
    );
    const [showVariantsEditor, setShowVariantsEditor] = useState(false);
    const [variantType, setVariantType] = useState<MessageVariantType>(
      "prompt"
    );
    const [variantEditorValue, setVariantEditorValue] = useState("");
    const [variantConditionRules, setVariantConditionRules] = useState<
      ConditionRule[]
    >([]);
    const [variantConditionMatchType, setVariantConditionMatchType] = useState<
      "all" | "any"
    >("all");
    const [variantCode, setVariantCode] = useState("");
    const [promptReturnValues, setPromptReturnValues] = useState<
      PromptReturnValue[]
    >([]);
    const [showVariantFullScreenEditor, setShowVariantFullScreenEditor] =
      useState(false);
    const [promptVariantSelection, setPromptVariantSelection] = useState("");
    const [editingVariantId, setEditingVariantId] = useState<string | null>(
      null
    );
    const [showVariantTypePopover, setShowVariantTypePopover] =
      useState(false);
    const [showPromptPopover, setShowPromptPopover] = useState(false);
    const [showConditionBuilder, setShowConditionBuilder] = useState(false);
    const [showExpressionEditor, setShowExpressionEditor] = useState(false);

    useEffect(() => {
      setLocalMessageText(selectedNode.data.text || "");
      setLocalDelay(
        typeof selectedNode.data.delay === "number" ? selectedNode.data.delay : 0
      );
      const normalized = normalizeVariants(selectedNode.data.variants);
      setVariants(normalized);

      const hasLegacyVariants = Array.isArray(selectedNode.data.variants)
        ? selectedNode.data.variants.some((item: any) => {
            if (!item) return false;
            if (typeof item === "string") return true;
            if (typeof item !== "object") return false;
            return (
              typeof item.type !== "string" ||
              (item.type === "prompt" && typeof item.promptId !== "string")
            );
          })
        : false;

      if (hasLegacyVariants && normalized.length > 0) {
        handleUpdateNode("variants", normalized);
      }

      setVariantType("prompt");
      setVariantEditorValue("");
      setVariantConditionRules([]);
      setVariantConditionMatchType("all");
      setVariantCode("");
      setPromptVariantSelection("");
      setPromptReturnValues([]);
      setEditingVariantId(null);
      setShowVariantTypePopover(false);
      setShowPromptPopover(false);
      setShowConditionBuilder(false);
      setShowExpressionEditor(false);
      setShowVariantFullScreenEditor(false);
      setShowVariantsEditor(false);
    }, [
      selectedNodeId,
      selectedNode.data.text,
      selectedNode.data.delay,
      selectedNode.data.variants,
    ]);

    const commitMessageText = () => {
      if ((selectedNode.data.text || "") !== localMessageText) {
        handleUpdateNode("text", localMessageText);
      }
    };

    const handleRichTextChange = (value: string) => {
      setLocalMessageText(value);
    };

    const handleRichTextBlur = () => {
      if ((selectedNode.data.text || "") !== localMessageText) {
        handleUpdateNode("text", localMessageText);
      }
    };

    const handleDelayChange = (value: number | null) => {
      const sanitized = Math.max(0, Math.round(value ?? 0));
      setLocalDelay(sanitized);
      if ((selectedNode.data.delay ?? 0) !== sanitized) {
        handleUpdateNode("delay", sanitized);
      }
    };

    const startVariantCreation = (initialType: MessageVariantType = "prompt") => {
      setVariantType(initialType);
      setVariantEditorValue("");
      setVariantConditionRules([]);
      setVariantConditionMatchType("all");
      setVariantCode("");
      setPromptVariantSelection("");
      setPromptReturnValues([]);
      setEditingVariantId(null);
      setShowVariantTypePopover(false);
      setShowPromptPopover(initialType === "prompt");
      setShowConditionBuilder(initialType === "condition");
      setShowExpressionEditor(initialType === "expression");
      setShowVariantFullScreenEditor(false);
      setShowVariantsEditor(true);
    };

    const handleVariantTypeChange = (type: MessageVariantType) => {
      setVariantType(type);
      setShowVariantTypePopover(false);
      if (type === "prompt") {
        setVariantEditorValue("");
        setVariantConditionRules([]);
        setVariantConditionMatchType("all");
        setVariantCode("");
        setPromptReturnValues([]);
        setShowPromptPopover(true);
        setShowConditionBuilder(false);
        setShowExpressionEditor(false);
        setShowVariantFullScreenEditor(false);
      } else if (type === "condition") {
        setPromptVariantSelection("");
        setVariantCode("");
        setPromptReturnValues([]);
        setShowPromptPopover(false);
        setShowConditionBuilder(true);
        setShowExpressionEditor(false);
        setShowVariantFullScreenEditor(false);
      } else {
        setPromptVariantSelection("");
        setVariantConditionRules([]);
        setVariantConditionMatchType("all");
        setPromptReturnValues([]);
        setShowPromptPopover(false);
        setShowConditionBuilder(false);
        setShowExpressionEditor(true);
        setShowVariantFullScreenEditor(false);
      }
    };

    const handleVariantEditorChange = (value: string) => {
      setVariantEditorValue(value);
    };

    const handleAddPromptReturnValue = () => {
      setPromptReturnValues((current) => [
        ...current,
        {
          id: nanoid(),
          operator: "is",
          value: "",
          message: "",
        },
      ]);
    };

    const handleUpdatePromptReturnValue = (
      returnId: string,
      updates: Partial<Omit<PromptReturnValue, "id">>
    ) => {
      setPromptReturnValues((current) =>
        current.map((entry) =>
          entry.id === returnId ? { ...entry, ...updates } : entry
        )
      );
    };

    const handleRemovePromptReturnValue = (returnId: string) => {
      setPromptReturnValues((current) =>
        current.filter((entry) => entry.id !== returnId)
      );
    };

    const persistVariants = (updater: (current: MessageVariant[]) => MessageVariant[]) => {
      setVariants((current) => {
        const next = updater(current);
        handleUpdateNode("variants", next);
        return next;
      });
    };

    const handleSaveVariant = () => {
      let nextVariant: MessageVariant | null = null;

      if (variantType === "prompt") {
        const promptId = promptVariantSelection.trim();
        const message = variantEditorValue.trim();
        if (!promptId || !message) return;

        const sanitizedReturnValues = promptReturnValues
          .map((entry) => {
            const operator = isConditionOperator(entry.operator)
              ? entry.operator
              : "is";

            return {
              ...entry,
              operator,
              value: entry.value.trim(),
              message: entry.message.trim(),
            };
          })
          .filter((entry) => entry.message.length > 0);

        nextVariant = {
          id: editingVariantId ?? nanoid(),
          type: "prompt",
          promptId,
          text: message,
          returnValues: sanitizedReturnValues,
        };
      } else if (variantType === "condition") {
        const content = variantEditorValue.trim();
        if (!content || variantConditionRules.length === 0) {
          return;
        }
        nextVariant = {
          id: editingVariantId ?? nanoid(),
          type: "condition",
          text: content,
          rules: variantConditionRules,
          matchType: variantConditionMatchType,
        };
      } else if (variantType === "expression") {
        const content = variantEditorValue.trim();
        const expression = variantCode.trim();
        if (!content || !expression) {
          return;
        }
        nextVariant = {
          id: editingVariantId ?? nanoid(),
          type: "expression",
          text: content,
          expression,
        };
      }

      if (!nextVariant) return;

      persistVariants((current) => {
        const index = editingVariantId
          ? current.findIndex((item) => item.id === editingVariantId)
          : -1;

        if (index >= 0) {
          const updated = [...current];
          updated[index] = nextVariant as MessageVariant;
          return updated;
        }

        return [...current, nextVariant as MessageVariant];
      });

      setVariantType("prompt");
      setVariantEditorValue("");
      setVariantConditionRules([]);
      setVariantConditionMatchType("all");
      setVariantCode("");
      setPromptVariantSelection("");
      setPromptReturnValues([]);
      setEditingVariantId(null);
      setShowPromptPopover(false);
      setShowConditionBuilder(false);
      setShowExpressionEditor(false);
      setShowVariantFullScreenEditor(false);
      setShowVariantsEditor(false);
    };

    const handleCancelEdit = () => {
      setVariantType("prompt");
      setVariantEditorValue("");
      setVariantConditionRules([]);
      setVariantConditionMatchType("all");
      setVariantCode("");
      setPromptVariantSelection("");
      setPromptReturnValues([]);
      setEditingVariantId(null);
      setShowPromptPopover(false);
      setShowConditionBuilder(false);
      setShowExpressionEditor(false);
      setShowVariantFullScreenEditor(false);
      setShowVariantsEditor(false);
    };

    const handleEditVariant = (variantId: string) => {
      const variant = variants.find((item) => item.id === variantId);
      if (!variant) return;

      setEditingVariantId(variant.id);
      setShowVariantsEditor(true);
      setShowVariantTypePopover(false);

      if (variant.type === "prompt") {
        setVariantType("prompt");
        setPromptVariantSelection(variant.promptId);
        setVariantEditorValue(variant.text || "");
        setVariantConditionRules([]);
        setVariantConditionMatchType("all");
        setVariantCode("");
        setPromptReturnValues(variant.returnValues || []);
        setShowPromptPopover(false);
        setShowConditionBuilder(false);
        setShowExpressionEditor(false);
        setShowVariantFullScreenEditor(false);
      } else if (variant.type === "condition") {
        setVariantType("condition");
        setVariantEditorValue(variant.text);
        setVariantConditionRules(variant.rules);
        setVariantConditionMatchType(variant.matchType);
        setPromptVariantSelection("");
        setVariantCode("");
        setPromptReturnValues([]);
        setShowPromptPopover(false);
        setShowConditionBuilder(false);
        setShowExpressionEditor(false);
        setShowVariantFullScreenEditor(false);
      } else {
        setVariantType("expression");
        setVariantEditorValue(variant.text);
        setVariantCode(variant.expression);
        setPromptVariantSelection("");
        setVariantConditionRules([]);
        setVariantConditionMatchType("all");
        setPromptReturnValues([]);
        setShowPromptPopover(false);
        setShowConditionBuilder(false);
        setShowExpressionEditor(false);
        setShowVariantFullScreenEditor(false);
      }
    };

    const handleVariantFullScreenSave = (code: string) => {
      setVariantCode(code);
      setShowVariantFullScreenEditor(false);
    };

    const handleVariantFullScreenClose = () => {
      setShowVariantFullScreenEditor(false);
    };

    const openVariantFullScreenEditor = () => {
      setShowExpressionEditor(false);
      setShowVariantFullScreenEditor(true);
    };

    const handleRemoveVariant = (variantId: string) => {
      persistVariants((current) =>
        current.filter((variant) => variant.id !== variantId)
      );

      if (editingVariantId === variantId) {
        handleCancelEdit();
      }
    };

    const canSaveVariant = useMemo(() => {
      if (variantType === "prompt") {
        return (
          promptVariantSelection.trim().length > 0 &&
          variantEditorValue.trim().length > 0
        );
      }

      if (variantType === "condition") {
        return (
          variantEditorValue.trim().length > 0 &&
          variantConditionRules.length > 0
        );
      }

      if (variantType === "expression") {
        return (
          variantEditorValue.trim().length > 0 && variantCode.trim().length > 0
        );
      }

      return false;
    }, [
      promptVariantSelection,
      variantType,
      variantEditorValue,
      variantConditionRules,
      variantCode,
    ]);

    const formatVariantTypeLabel = (type: MessageVariantType) => {
      switch (type) {
        case "condition":
          return "Condition";
        case "expression":
          return "Expression";
        case "prompt":
        default:
          return "Prompt";
      }
    };

    const ellipsize = (value: string, max: number = 80) =>
      value.length > max ? `${value.slice(0, max - 1)}…` : value;

    const getVariantPrimaryText = (variant: MessageVariant) => {
      if (variant.type === "prompt") {
        return variant.promptId;
      }
      return ellipsize(variant.text || "(empty message)");
    };

    const getVariantSecondaryText = (variant: MessageVariant) => {
      if (variant.type === "prompt") {
        const returnCount = variant.returnValues?.length || 0;
        if (returnCount > 0) {
          const plural = returnCount === 1 ? "return value" : "return values";
          return `${returnCount} ${plural}`;
        }

        return variant.text.trim().length > 0
          ? ellipsize(variant.text)
          : "No message configured";
      }

      if (variant.type === "condition") {
        if (variant.rules.length === 0) {
          return "No conditions configured yet";
        }
        const count = variant.rules.length;
        const plural = count === 1 ? "condition" : "conditions";
        const matchLabel =
          variant.matchType === "all" ? "Match all" : "Match any";
        return `${matchLabel} • ${count} ${plural}`;
      }

      return variant.expression.trim().length > 0
        ? "Expression configured"
        : "No expression configured";
    };

    const variantLogicSummary = useMemo(() => {
      if (variantType === "prompt") {
        if (!promptVariantSelection.trim()) {
          return "Select a prompt to use this variant.";
        }

        if (!variantEditorValue.trim()) {
          return "Add message content for this prompt variant.";
        }

        if (promptReturnValues.length === 0) {
          return "Add return values to handle prompt responses or leave empty to use the base message.";
        }

        const count = promptReturnValues.length;
        const plural = count === 1 ? "return value" : "return values";
        return `${count} ${plural} configured.`;
      }

      if (variantType === "condition") {
        if (variantConditionRules.length === 0) {
          return "Add at least one condition to use this variant.";
        }
        const count = variantConditionRules.length;
        const plural = count === 1 ? "condition" : "conditions";
        const matchLabel =
          variantConditionMatchType === "all" ? "Match all" : "Match any";
        return `${matchLabel} • ${count} ${plural}`;
      }

      if (variantType === "expression") {
        return variantCode.trim().length > 0
          ? "Expression configured"
          : "Add a JavaScript expression to determine when this variant is used.";
      }

      return "";
    }, [
      variantType,
      promptVariantSelection,
      variantEditorValue,
      promptReturnValues,
      variantConditionRules,
      variantConditionMatchType,
      variantCode,
    ]);

    return (
      <Form layout="vertical">
        <Form.Item label="Message">
          <RichTextEditor
            value={localMessageText}
            onChange={handleRichTextChange}
            onBlur={handleRichTextBlur}
            placeholder="Enter your message..."
          />
        </Form.Item>
        <Form.Item label="Message delay (ms)">
          <InputNumber
            min={0}
            step={100}
            value={localDelay}
            onChange={handleDelayChange}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Typography.Text className={styles.helperText}>
          Add a typing delay before the message is sent. Use milliseconds, e.g.
          500 for half a second.
        </Typography.Text>

        <div className={styles.variantsSection}>
          <div className={styles.variantsHeader}>
            <span className={styles.variantsTitle}>Variants</span>
            <span className={styles.variantsHeaderActions}>
              <span className={styles.variantsSparkle}>✨</span>
              <button
                type="button"
                className={styles.variantsAddButton}
                onClick={() => {
                  if (showVariantsEditor) {
                    handleCancelEdit();
                    return;
                  }
                  startVariantCreation("prompt");
                }}
              >
                +
              </button>
            </span>
          </div>

          {showVariantsEditor && (
            <div className={styles.variantEditorBox}>
              <div className={styles.variantTypeSelectorRow}>
                <span className={styles.variantTypeIcon}>✨</span>
                <Popover
                  content={
                    <div className={styles.variantTypePopoverContent}>
                      <div className={styles.variantTypePopoverLabel}>
                        Variant logic
                      </div>
                      <Button
                        type={variantType === "condition" ? "primary" : "text"}
                        block
                        className={styles.variantTypePopoverButton}
                        onClick={() => handleVariantTypeChange("condition")}
                      >
                        Condition builder
                      </Button>
                      <Button
                        type={variantType === "expression" ? "primary" : "text"}
                        block
                        className={styles.variantTypePopoverButton}
                        onClick={() => handleVariantTypeChange("expression")}
                      >
                        Expression
                      </Button>
                      <Button
                        type={variantType === "prompt" ? "primary" : "text"}
                        block
                        className={styles.variantTypePopoverButton}
                        onClick={() => handleVariantTypeChange("prompt")}
                      >
                        Prompt
                      </Button>
                    </div>
                  }
                  trigger="click"
                  placement="bottomLeft"
                  open={showVariantTypePopover}
                  onOpenChange={setShowVariantTypePopover}
                >
                  <Button
                    type="default"
                    size="small"
                    className={styles.variantTypeSelectorButton}
                    onClick={() => setShowVariantTypePopover(true)}
                  >
                    {formatVariantTypeLabel(variantType)}
                  </Button>
                </Popover>

                {variantType === "condition" && (
                  <Popover
                    placement="right"
                    trigger="click"
                    open={showConditionBuilder}
                    onOpenChange={setShowConditionBuilder}
                    overlayStyle={{ zIndex: 50000 }}
                    getPopupContainer={() => document.body}
                    content={
                      <div className={styles.conditionBuilderContainer}>
                        <ConditionBuilder
                          initialRules={variantConditionRules}
                          matchType={variantConditionMatchType}
                          onSave={(rules, matchType) => {
                            setVariantConditionRules(rules);
                            setVariantConditionMatchType(matchType);
                            setShowConditionBuilder(false);
                          }}
                          onCancel={() => setShowConditionBuilder(false)}
                        />
                      </div>
                    }
                  >
                    <Button
                      size="small"
                      onClick={() => setShowConditionBuilder(true)}
                    >
                      {variantConditionRules.length > 0
                        ? "Edit conditions"
                        : "Add conditions"}
                    </Button>
                  </Popover>
                )}

                {variantType === "expression" && (
                  <Popover
                    placement="right"
                    trigger="click"
                    open={showExpressionEditor}
                    onOpenChange={setShowExpressionEditor}
                    overlayStyle={{ zIndex: 50000 }}
                    getPopupContainer={() => document.body}
                    content={
                      <div className={styles.variantCodeEditorPopover}>
                        <div className={styles.variantCodeEditorHeader}>
                          <Typography.Text strong>
                            JavaScript expression
                          </Typography.Text>
                          <div className={styles.variantCodeEditorActions}>
                            <Button
                              size="small"
                              icon={<FullscreenOutlined />}
                              onClick={openVariantFullScreenEditor}
                              title="Open in fullscreen"
                            />
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => setShowExpressionEditor(false)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                        <div className={styles.variantCodeEditor}>
                          <Editor
                            language="javascript"
                            value={variantCode}
                            onChange={(value) => setVariantCode(value || "")}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 14,
                              lineNumbers: "on",
                              roundedSelection: false,
                              automaticLayout: true,
                              wordWrap: "on",
                              padding: { top: 10, bottom: 10 },
                            }}
                            height="200px"
                            width="400px"
                          />
                        </div>
                        <Typography.Text className={styles.variantCodeEditorHint}>
                          Examples: return userInput.length {">"} 0; | return
                          variables.status === 'active';
                        </Typography.Text>
                      </div>
                    }
                  >
                    <Button
                      size="small"
                      onClick={() => setShowExpressionEditor(true)}
                    >
                      {variantCode.trim().length > 0
                        ? "Edit expression"
                        : "Add expression"}
                    </Button>
                  </Popover>
                )}
              </div>

              <>
                {variantType === "prompt" ? (
                  <>
                    <Popover
                      placement="right"
                      trigger="click"
                      open={showPromptPopover}
                      onOpenChange={setShowPromptPopover}
                      overlayStyle={{ zIndex: PROMPT_VARIANT_POPOVER_Z_INDEX }}
                      getPopupContainer={() => document.body}
                      content={
                        <div className={styles.promptVariantPopover}>
                          <div className={styles.promptVariantPopoverContent}>
                            <PromptPicker
                              value={promptVariantSelection || ""}
                              onChange={(val) =>
                                setPromptVariantSelection(val || "")
                              }
                              placeholder="Select prompt"
                              allowCreate
                              size="middle"
                              style={{ width: "100%" }}
                            />
                            <div className={styles.promptReturnSection}>
                              <div className={styles.promptReturnHeader}>
                                <span className={styles.promptReturnTitle}>
                                  Return values
                                </span>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={handleAddPromptReturnValue}
                                  className={styles.promptReturnAddButton}
                                  aria-label="Add return value"
                                />
                              </div>
                              {promptReturnValues.length === 0 ? (
                                <div className={styles.promptReturnEmpty}>
                                  Map prompt responses to specific messages by adding return
                                  values.
                                </div>
                              ) : (
                                promptReturnValues.map((returnValue, index) => {
                                  const labelPrefix = index === 0 ? "if" : "else if";
                                  return (
                                    <React.Fragment key={returnValue.id}>
                                      {index > 0 && (
                                        <Divider className={styles.promptReturnDivider} />
                                      )}
                                      <div className={styles.promptReturnItem}>
                                        <div className={styles.promptReturnConditionRow}>
                                          <span className={styles.promptReturnIfLabel}>
                                            {`${labelPrefix} value`}
                                          </span>
                                          <Select
                                            value={returnValue.operator}
                                            onChange={(value: ConditionOperatorValue) =>
                                              handleUpdatePromptReturnValue(returnValue.id, {
                                                operator: value,
                                              })
                                            }
                                            options={CONDITION_OPERATOR_SELECT_OPTIONS}
                                            size="middle"
                                            className={styles.promptReturnOperator}
                                            popupMatchSelectWidth={false}
                                            dropdownStyle={{
                                              zIndex:
                                                PROMPT_VARIANT_OPERATOR_DROPDOWN_Z_INDEX,
                                            }}
                                            styles={{
                                              popup: {
                                                zIndex:
                                                  PROMPT_VARIANT_OPERATOR_DROPDOWN_Z_INDEX,
                                              },
                                            }}
                                            getPopupContainer={() => document.body}
                                            dropdownClassName={
                                              styles.promptReturnOperatorDropdown
                                            }
                                          />
                                          <ValueInput
                                            value={returnValue.value}
                                            onChange={(value) =>
                                              handleUpdatePromptReturnValue(returnValue.id, {
                                                value,
                                              })
                                            }
                                            placeholder="value or {var}"
                                            size="middle"
                                            className={styles.promptReturnValueInput}
                                          />
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() =>
                                              handleRemovePromptReturnValue(returnValue.id)
                                            }
                                            className={styles.promptReturnRemoveButton}
                                            aria-label="Remove return value"
                                          />
                                        </div>
                                        <div className={styles.promptReturnMessage}>
                                          <TextArea
                                            value={returnValue.message}
                                            onChange={(event) =>
                                              handleUpdatePromptReturnValue(returnValue.id, {
                                                message: event.target.value,
                                              })
                                            }
                                            placeholder="Enter the message to send when this return value matches"
                                            autoSize={{ minRows: 3, maxRows: 6 }}
                                            className={styles.promptReturnTextarea}
                                          />
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  );
                                })
                              )}
                            </div>
                          </div>
                          <div className={styles.promptVariantPopoverActions}>
                            <Button
                              size="small"
                              type="primary"
                              block
                              disabled={!promptVariantSelection.trim()}
                              onClick={() => setShowPromptPopover(false)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      }
                    >
                      <Button
                        type="default"
                        block
                        className={styles.promptVariantSelectButton}
                      >
                        {promptVariantSelection
                          ? `Prompt: ${promptVariantSelection}`
                          : "Select prompt"}
                      </Button>
                    </Popover>
                    <div className={styles.variantTextAreaWrapper}>
                      <RichTextEditor
                        value={variantEditorValue}
                        onChange={handleVariantEditorChange}
                        placeholder="Enter the message to send when this variant matches"
                        className={styles.variantRichTextEditor}
                      />
                    </div>
                  </>
                ) : (
                  <div className={styles.variantTextAreaWrapper}>
                    <RichTextEditor
                      value={variantEditorValue}
                      onChange={handleVariantEditorChange}
                      placeholder="Enter the message to send when this variant matches"
                      className={styles.variantRichTextEditor}
                    />
                  </div>
                )}
                {variantLogicSummary && (
                  <Typography.Text
                    type="secondary"
                    className={styles.variantLogicSummary}
                  >
                    {variantLogicSummary}
                  </Typography.Text>
                )}
              </>

              <div className={styles.variantEditorActions}>
                <Button onClick={handleCancelEdit}>Cancel</Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveVariant}
                  disabled={!canSaveVariant}
                >
                  {editingVariantId ? "Update variant" : "Add variant"}
                </Button>
              </div>
            </div>
          )}

          {variants.length > 0 && (
            <div className={styles.variantList}>
              {variants.map((variant) => {
                const primaryText = getVariantPrimaryText(variant);
                const secondaryText = getVariantSecondaryText(variant);
                const typeClass =
                  variant.type === "prompt"
                    ? styles.variantItemTypePrompt
                    : variant.type === "condition"
                    ? styles.variantItemTypeCondition
                    : styles.variantItemTypeExpression;

                return (
                  <div key={variant.id} className={styles.variantItem}>
                    <div
                      className={styles.variantItemContent}
                      onClick={() => handleEditVariant(variant.id)}
                      title="Click to edit"
                    >
                      <span className={styles.variantItemText}>
                        <span className={styles.variantPrimaryText}>
                          <span className={`${styles.variantItemType} ${typeClass}`}>
                            {formatVariantTypeLabel(variant.type)}
                          </span>
                          {primaryText}
                        </span>
                        {secondaryText && (
                          <span className={styles.variantItemDescription}>
                            {secondaryText}
                          </span>
                        )}
                      </span>
                      <span className={styles.editIcon}>
                        <EditOutlined />
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.variantRemoveButton}
                      onClick={() => handleRemoveVariant(variant.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Form>
    );
  };
  const PromptProperties = () => {
    const [showDescription, setShowDescription] = useState(false); // Collapsed by default
    const [promptEditorOpen, setPromptEditorOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<any>(null);
    const dispatch = useAppDispatch();
    const prompts = useAppSelector((state) => state.prompts.prompts);

    const hasPromptSelected =
      selectedNode.data.promptId && selectedNode.data.promptId.trim() !== "";

    const handlePromptButtonClick = () => {
      if (hasPromptSelected) {
        // Edit existing prompt - find the prompt and open editor
        const prompt = prompts.find(
          (p) => p.name === selectedNode.data.promptId
        );
        if (prompt) {
          setEditingPrompt(prompt);
          setPromptEditorOpen(true);
        }
      } else {
        // Create new prompt - open editor with no prompt
        setEditingPrompt(null);
        setPromptEditorOpen(true);
      }
    };

    const handlePromptSave = (promptName: string) => {
      handleUpdateNode("promptId", promptName);
    };

    return (
      <>
        <Form layout="vertical">
          <Form.Item>
            <PromptPicker
              value={selectedNode.data.promptId || ""}
              onChange={(val) => handleUpdateNode("promptId", val)}
              placeholder="Select existing prompt"
              allowCreate={true}
              createMode="modal"
              size="middle"
              style={{ marginBottom: 12 }}
            />
            <Button
              type="primary"
              block
              style={{ marginBottom: 16 }}
              onClick={handlePromptButtonClick}
            >
              {hasPromptSelected ? "Edit prompt" : "Create prompt"}
            </Button>
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Form.Item className={styles.formItem}>
              {(() => {
                const [localDescription, setLocalDescription] =
                  useState<string>(selectedNode?.data.description || "");

                useEffect(() => {
                  setLocalDescription(selectedNode?.data.description || "");
                }, [selectedNodeId]);

                const commitDescription = () => {
                  if (
                    (selectedNode?.data.description || "") !== localDescription
                  ) {
                    handleUpdateNode("description", localDescription);
                  }
                };

                const [showDescription, setShowDescription] = useState(false);

                return (
                  <div className={styles.descriptionSection}>
                    <div
                      className={styles.descriptionHeader}
                      onClick={() => setShowDescription(!showDescription)}
                    >
                      <Typography.Text strong>Description</Typography.Text>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          showDescription ? <UpOutlined /> : <DownOutlined />
                        }
                      />
                    </div>
                    {showDescription && (
                      <Input.TextArea
                        rows={4}
                        placeholder="Enter description"
                        value={localDescription}
                        onChange={(e) => setLocalDescription(e.target.value)}
                        onBlur={commitDescription}
                        onPressEnter={commitDescription}
                        className={styles.descriptionInput}
                      />
                    )}
                  </div>
                );
              })()}
            </Form.Item>
          </div>
        </Form>

        <FullScreenCodeEditor
          visible={showVariantFullScreenEditor}
          onClose={handleVariantFullScreenClose}
          onSave={handleVariantFullScreenSave}
          initialCode={variantCode}
          title="JavaScript Expression Editor"
          language="javascript"
          startFullscreen
        />

        <PromptEditor
          visible={promptEditorOpen}
          onClose={() => {
            setPromptEditorOpen(false);
            setEditingPrompt(null);
          }}
          editingPrompt={editingPrompt}
          onSave={handlePromptSave}
        />
      </>
    );
  };

  const ConditionProperties = () => {
    const [showPathOptions, setShowPathOptions] = useState(false);
    const [showConditionBuilder, setShowConditionBuilder] = useState(false);
    const [editingPathId, setEditingPathId] = useState<string | null>(null);
    const [editingElsePath, setEditingElsePath] = useState(false);
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(
      null
    );
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [currentCode, setCurrentCode] = useState("");
    const [codeEditingPathId, setCodeEditingPathId] = useState<string | null>(
      null
    );
    const [showFullScreenEditor, setShowFullScreenEditor] = useState(false);
    const [pendingEditorPathId, setPendingEditorPathId] = useState<
      string | null
    >(null);

    const paths = selectedNode.data.paths || [];
    const elsePath = selectedNode.data.elsePath ?? false;
    const elsePathLabel = selectedNode.data.elsePathLabel ?? "Else";

    // Auto-open editor when a new expression path is added
    useEffect(() => {
      if (pendingEditorPathId) {
        const pathExists = paths.find((p: any) => p.id === pendingEditorPathId);
        if (pathExists && pathExists.type === "expression") {
          setCodeEditingPathId(pendingEditorPathId);
          setCurrentCode(pathExists.condition || "return true;");
          setShowCodeEditor(true);
          setPendingEditorPathId(null);
        }
      }
    }, [paths, pendingEditorPathId]);

    const addPath = (type: "builder" | "expression") => {
      if (type === "builder") {
        // This is now handled directly in the button click
        return;
      }

      const newPathId = `path-${Date.now()}`;
      const newPath = {
        id: newPathId,
        condition: type === "expression" ? "return true;" : "New expression",
        type: type,
      };
      const updatedPaths = [...paths, newPath];
      handleUpdateNode("paths", updatedPaths);

      // If this is the first path being added, automatically enable else path
      if (paths.length === 0) {
        handleUpdateNode("elsePath", true);
      }

      setShowPathOptions(false);

      // Mark this path to auto-open the editor
      if (type === "expression") {
        setPendingEditorPathId(newPathId);
      }
    };

    const removePath = (pathId: string) => {
      const updatedPaths = paths.filter((path: any) => path.id !== pathId);
      handleUpdateNode("paths", updatedPaths);

      // If no paths remain, automatically turn off else path
      if (updatedPaths.length === 0 && elsePath) {
        handleUpdateNode("elsePath", false);
      }
    };

    const editPath = (pathId: string, anchorElement?: HTMLElement) => {
      const pathToEdit = paths.find((p: any) => p.id === pathId);
      setEditingPathId(pathId);
      setPopoverAnchor(anchorElement || null);
      setShowConditionBuilder(true);
      setShowPathOptions(false);
    };

    const toggleElsePath = () => {
      handleUpdateNode("elsePath", !elsePath);
    };

    const updateElsePathLabel = (label: string) => {
      handleUpdateNode("elsePathLabel", label);
      setEditingElsePath(false);
    };

    const openCodeEditor = (pathId: string, currentCondition: string) => {
      setCodeEditingPathId(pathId);
      setCurrentCode(currentCondition);
      setShowCodeEditor(true);
    };

    const handleCodeSave = (code: string) => {
      if (codeEditingPathId) {
        const updatedPaths = paths.map((path: any) =>
          path.id === codeEditingPathId ? { ...path, condition: code } : path
        );
        handleUpdateNode("paths", updatedPaths);
      }
    };

    const handleCodeEditorClose = () => {
      setShowCodeEditor(false);
      setCodeEditingPathId(null);
      setCurrentCode("");
    };

    const openFullScreenEditor = () => {
      setShowFullScreenEditor(true);
      setShowCodeEditor(false); // Close the popover
    };

    const handleFullScreenSave = (code: string) => {
      setCurrentCode(code);
      if (codeEditingPathId) {
        handleCodeSave(code);
      }
    };

    const handleFullScreenClose = () => {
      setShowFullScreenEditor(false);
      // Don't reopen the popover - close completely when user clicks Close
    };

    // Debug function to log current paths data structure
    const logPathsData = () => {
      console.log("Current Paths Data:", JSON.stringify(paths, null, 2));
      console.log("Node Data:", JSON.stringify(selectedNode.data, null, 2));
      console.log(
        "How to access this data for publishing: useAppSelector(getWorkflowForPublish)"
      );
    };

    const handleConditionBuilderClose = () => {
      setShowConditionBuilder(false);
      setShowPathOptions(false);
      setEditingPathId(null);
    };

    const handleConditionBuilderSave = (
      rules: any[],
      matchType: "all" | "any"
    ) => {
      // Create a more descriptive condition text
      const ruleTexts = rules.map((rule, index) => {
        const prefix = index === 0 ? "if" : "and";
        const variable = rule.variable || "variable";
        const operator = rule.operator || "is";
        const value = rule.value || "value";
        return `${prefix} {${variable}} ${operator} ${value}`;
      });

      const conditionText = ruleTexts.join(" ");

      if (editingPathId) {
        // Update existing path
        const updatedPaths = paths.map((path: any) =>
          path.id === editingPathId
            ? {
                ...path,
                condition: conditionText,
                rules: rules,
                matchType: matchType,
                type: "builder",
              }
            : path
        );
        handleUpdateNode("paths", updatedPaths);
      } else {
        // Create new path
        const newPath = {
          id: `path-${Date.now()}`,
          condition: conditionText,
          type: "builder",
          rules: rules,
          matchType: matchType,
        };
        const updatedPaths = [...paths, newPath];
        handleUpdateNode("paths", updatedPaths);

        // If this is the first path being added, automatically enable else path
        if (paths.length === 0) {
          handleUpdateNode("elsePath", true);
        }
      }

      setShowConditionBuilder(false);
      setShowPathOptions(false);
      setEditingPathId(null);
    };

    return (
      <Form layout="vertical">
        <Form.Item label="Condition type">
          <Select
            value={selectedNode.data.conditionType || "Business logic"}
            onChange={(val) => handleUpdateNode("conditionType", val)}
            options={[
              { label: "Business logic", value: "Business logic" },
              { label: "Expression", value: "Expression" },
            ]}
          />
        </Form.Item>

        <Divider />

        <div className={styles.pathsContainer}>
          <div className={styles.pathsHeader}>
            <Typography.Text strong>Paths</Typography.Text>
            <Popover
              content={
                <div className={styles.pathOptionsContent}>
                  <div className={styles.pathOptionsLabel}>
                    Evaluate using...
                  </div>
                  <Button
                    type="text"
                    icon={<ForkOutlined />}
                    className={styles.conditionBuilderButton}
                    onClick={() => {
                      setEditingPathId(null); // Clear editing state for new path
                      setPopoverAnchor(null);
                      setShowConditionBuilder(true);
                      setShowPathOptions(false);
                    }}
                  >
                    Condition builder
                  </Button>
                  <Button
                    type="text"
                    icon={<span className={styles.jsIcon}>JS</span>}
                    className={styles.jsButton}
                    onClick={() => addPath("expression")}
                  >
                    Expression
                  </Button>
                </div>
              }
              trigger="click"
              placement="bottomRight"
              open={showPathOptions}
              onOpenChange={setShowPathOptions}
            >
              <Button
                type="text"
                icon={<PlusOutlined />}
                className={styles.addPathButton}
              />
            </Popover>
          </div>{" "}
          {paths.length === 0 && (
            <div className={styles.noPathsMessage}>
              No paths added yet. Click + to add a condition path.
            </div>
          )}
          {paths.map((path: any, index: number) => (
            <div key={path.id} className={styles.pathItem}>
              <Popover
                placement="right"
                trigger="click"
                open={showConditionBuilder && editingPathId === path.id}
                onOpenChange={(open) => {
                  if (open && path.type === "builder") {
                    setShowConditionBuilder(true);
                    setEditingPathId(path.id);
                  } else {
                    setShowConditionBuilder(false);
                    setEditingPathId(null);
                  }
                  setShowPathOptions(false);
                }}
                overlayStyle={{ zIndex: 50000 }}
                getPopupContainer={() => document.body}
                content={
                  showConditionBuilder && editingPathId === path.id ? (
                    <div className={styles.conditionBuilderContainer}>
                      <ConditionBuilder
                        key={`edit-${path.id}`} // Force re-mount for each path
                        initialRules={path.rules}
                        matchType={path.matchType}
                        onSave={handleConditionBuilderSave}
                        onCancel={() => {
                          setShowConditionBuilder(false);
                          setEditingPathId(null);
                        }}
                        onClose={() => {
                          setShowConditionBuilder(false);
                          setEditingPathId(null);
                        }}
                        onRulesChange={(rules, matchType) => {
                          // Rules changed handler
                        }}
                      />
                    </div>
                  ) : null
                }
              >
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (path.type === "builder") {
                      editPath(path.id, e.currentTarget as HTMLElement);
                    } else if (path.type === "expression") {
                      setShowCodeEditor(true);
                      setCodeEditingPathId(path.id);
                      setCurrentCode(path.condition);
                    }
                  }}
                  className={`${styles.pathConditionSpan} ${
                    editingPathId === path.id ? styles.selected : ""
                  } ${path.type !== "builder" ? styles.readonly : ""}`}
                >
                  {path.condition}
                </span>
              </Popover>

              {/* Code Editor Popover for expression types */}
              {path.type === "expression" && (
                <Popover
                  placement="right"
                  trigger="click"
                  open={showCodeEditor && codeEditingPathId === path.id}
                  onOpenChange={(open) => {
                    if (open) {
                      setShowCodeEditor(true);
                      setCodeEditingPathId(path.id);
                      setCurrentCode(path.condition);
                    } else {
                      setShowCodeEditor(false);
                      setCodeEditingPathId(null);
                      setCurrentCode("");
                    }
                  }}
                  overlayStyle={{ zIndex: 50000 }}
                  overlayClassName={styles.codeEditorPopover}
                  getPopupContainer={() => document.body}
                  content={
                    showCodeEditor && codeEditingPathId === path.id ? (
                      <div className={styles.codeEditorContainer}>
                        <div className={styles.codeEditorHeader}>
                          <span style={{ fontWeight: "bold" }}>
                            JavaScript Expression
                          </span>
                          <Space>
                            <Button
                              size="small"
                              icon={<FullscreenOutlined />}
                              onClick={openFullScreenEditor}
                              title="Open in fullscreen"
                            />
                            <Button
                              type="primary"
                              size="small"
                              icon={<SaveOutlined />}
                              onClick={() => {
                                handleCodeSave(currentCode);
                                setShowCodeEditor(false);
                                setCodeEditingPathId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() => {
                                setShowCodeEditor(false);
                                setCodeEditingPathId(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </Space>
                        </div>
                        <div
                          style={{
                            width: "500px",
                            height: "200px",
                            border: "1px solid #1e1e1e",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <Editor
                            language="javascript"
                            value={currentCode}
                            onChange={(value) => setCurrentCode(value || "")}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 14,
                              lineNumbers: "on",
                              roundedSelection: false,
                              automaticLayout: true,
                              wordWrap: "on",
                              padding: { top: 10, bottom: 10 },
                            }}
                          />
                        </div>
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            color: "#666",
                          }}
                        >
                          Examples: return userInput.length {">"} 0; | return
                          variables.status === 'active';
                        </div>
                      </div>
                    ) : null
                  }
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<CodeOutlined />}
                    className={styles.codeEditorButton}
                    title="Edit JavaScript expression"
                  />
                </Popover>
              )}

              <Button
                type="text"
                size="small"
                className={styles.pathDeleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  removePath(path.id);
                }}
              >
                −
              </Button>
            </div>
          ))}
          {paths.length > 0 && (
            <div className={styles.elsePathContainer}>
              {editingElsePath ? (
                <Input
                  defaultValue={elsePathLabel}
                  autoFocus
                  onBlur={(e) => updateElsePathLabel(e.target.value || "Else")}
                  onPressEnter={(e) =>
                    updateElsePathLabel(e.currentTarget.value || "Else")
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setEditingElsePath(false);
                    }
                  }}
                  className={styles.elsePathInput}
                />
              ) : (
                <Typography.Text
                  onClick={() => setEditingElsePath(true)}
                  className={styles.editableElsePathLabel}
                >
                  Else path
                </Typography.Text>
              )}
              <Switch
                checked={elsePath}
                onChange={toggleElsePath}
                size="small"
              />
            </div>
          )}
          {/* Condition Builder for new paths from + button */}
          <Popover
            placement="right"
            trigger="click"
            open={showConditionBuilder && !editingPathId}
            onOpenChange={(open) => {
              if (!open) {
                setShowConditionBuilder(false);
                setEditingPathId(null);
              }
            }}
            overlayStyle={{ zIndex: 50000 }}
            getPopupContainer={() => document.body}
            content={
              showConditionBuilder && !editingPathId ? (
                <div className={styles.conditionBuilderContainer}>
                  <ConditionBuilder
                    key="new-path" // Force re-mount for new paths
                    initialRules={undefined}
                    matchType={undefined}
                    onSave={handleConditionBuilderSave}
                    onCancel={() => {
                      setShowConditionBuilder(false);
                      setEditingPathId(null);
                    }}
                    onClose={() => {
                      setShowConditionBuilder(false);
                      setEditingPathId(null);
                    }}
                    onRulesChange={(rules, matchType) => {
                      // Rules changed handler
                    }}
                  />
                </div>
              ) : null
            }
          >
            <div className={styles.popoverAnchor} />
          </Popover>
        </div>

        <FullScreenCodeEditor
          visible={showFullScreenEditor}
          onClose={handleFullScreenClose}
          onSave={handleFullScreenSave}
          initialCode={currentCode}
          title="JavaScript Expression Editor"
          language="javascript"
          startFullscreen={true}
        />
      </Form>
    );
  };

  const EmailProperties = () => (
    <Form layout="vertical">
      <Form.Item label="To">
        <Input
          type="email"
          value={selectedNode.data.to || ""}
          onChange={(e) => handleUpdateNode("to", e.target.value)}
          placeholder="recipient@example.com"
        />
      </Form.Item>
      <Form.Item label="Subject">
        <Input
          value={selectedNode.data.subject || ""}
          onChange={(e) => handleUpdateNode("subject", e.target.value)}
          placeholder="Email subject..."
        />
      </Form.Item>
      <Form.Item label="Body">
        <Input.TextArea
          rows={4}
          value={selectedNode.data.body || ""}
          onChange={(e) => handleUpdateNode("body", e.target.value)}
          placeholder="Email body..."
        />
      </Form.Item>
    </Form>
  );

  const SetProperties = () => {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingVariable, setEditingVariable] = useState<any>(null);

    // Initialize variables array if it doesn't exist
    const variables = selectedNode.data.variables || [];
    const parallelExecution = selectedNode.data.parallelExecution ?? true;

    const updateVariables = (newVariables: any[]) => {
      handleUpdateNode("variables", newVariables);
    };

    const updateParallelExecution = (enabled: boolean) => {
      handleUpdateNode("parallelExecution", enabled);
    };

    const handleAddVariableOption = (option: "value" | "prompt") => {
      if (option === "prompt") {
        // For prompt, create a simplified structure
        const newVariable = {
          id: `var-${Date.now()}`,
          variable: "",
          valueType: "prompt",
          prompt: "Untitled prompt", // Set default prompt
          outputVariable: "",
        };
        setEditingVariable(newVariable);
      } else {
        // For value, use the standard structure
        const newVariable = {
          id: `var-${Date.now()}`,
          variable: "",
          valueType: "value",
          value: "",
          expression: "",
        };
        setEditingVariable(newVariable);
      }
    };

    const handleVariableSave = (variableData: any) => {
      if (variables.find((v: any) => v.id === variableData.id)) {
        // Update existing variable
        const updatedVariables = variables.map((v: any) =>
          v.id === variableData.id ? variableData : v
        );
        updateVariables(updatedVariables);
      } else {
        // Add new variable
        updateVariables([...variables, variableData]);
      }
      setEditingVariable(null);
    };

    const editVariable = (variable: any) => {
      setEditingVariable(variable);
    };

    const removeVariable = (varId: string) => {
      const updatedVariables = variables.filter((v: any) => v.id !== varId);
      updateVariables(updatedVariables);
    };

    return (
      <div className={styles.setPropertiesContainer}>
        {/* Variables to set section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Typography.Text className={styles.sectionTitle}>
              Variables to set
            </Typography.Text>
            <Popover
              content={
                editingVariable && editingVariable.id.startsWith("var-") ? (
                  <VariableEditForm
                    variable={editingVariable}
                    onSave={handleVariableSave}
                    onCancel={() => setEditingVariable(null)}
                  />
                ) : (
                  <div className={styles.pathOptionsContent}>
                    <div className={styles.pathOptionsLabel}>
                      Set variable using...
                    </div>
                    <Button
                      type="text"
                      icon={<span className={styles.optionIcon}>{"{}"}</span>}
                      className={styles.conditionBuilderButton}
                      onClick={() => {
                        handleAddVariableOption("value");
                      }}
                    >
                      Value or expression
                    </Button>
                    <Button
                      type="text"
                      icon={<span className={styles.optionIcon}>{"{x}"}</span>}
                      className={styles.jsButton}
                      onClick={() => {
                        handleAddVariableOption("prompt");
                      }}
                    >
                      Prompt
                    </Button>
                  </div>
                )
              }
              trigger="click"
              placement="bottomRight"
              open={
                showAddDialog ||
                (!!editingVariable && editingVariable.id.startsWith("var-"))
              }
              onOpenChange={(open) => {
                if (!open) {
                  setShowAddDialog(false);
                  setEditingVariable(null);
                } else if (!editingVariable) {
                  setShowAddDialog(true);
                }
              }}
              overlayStyle={{ zIndex: 1000 }}
              getPopupContainer={() => document.body}
            >
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                className={styles.addButton}
              />
            </Popover>
          </div>

          {/* Variable list */}
          <div className={styles.variableList}>
            {variables.map((variable: any) => (
              <div key={variable.id} className={styles.variableItem}>
                <div
                  className={styles.variableDisplay}
                  onClick={() => editVariable(variable)}
                >
                  <span className={styles.variableCode}>
                    {variable.valueType === "value"
                      ? "{}"
                      : variable.valueType === "prompt"
                      ? "{?}"
                      : "{x}"}
                  </span>
                  <span className={styles.variableName}>
                    {variable.variable || "Unnamed"}
                  </span>
                  <span className={styles.arrow}>
                    <RightOutlined />
                  </span>
                  <span className={styles.variableValue}>
                    {variable.valueType === "expression"
                      ? variable.expression || "expression"
                      : variable.valueType === "prompt"
                      ? `${variable.prompt || "prompt"} to ${
                          variable.outputVariable || "variable"
                        }`
                      : variable.value || "value"}
                  </span>
                </div>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  className={styles.deleteButton}
                  onClick={() => removeVariable(variable.id)}
                />
              </div>
            ))}
          </div>

          {/* Single Popover for editing variables */}
          {editingVariable && !editingVariable.id.startsWith("var-") && (
            <Popover
              open={true}
              onOpenChange={(open) => {
                if (!open) setEditingVariable(null);
              }}
              placement="right"
              overlayStyle={{ zIndex: 2000 }}
              getPopupContainer={() => document.body}
              content={
                <VariableEditForm
                  variable={editingVariable}
                  onSave={handleVariableSave}
                  onCancel={() => setEditingVariable(null)}
                />
              }
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "100%",
                  width: 1,
                  height: 1,
                  pointerEvents: "none",
                }}
              />
            </Popover>
          )}

          {variables.length === 0 && !editingVariable && (
            <div className={styles.emptyState}>
              <Typography.Text type="secondary" className={styles.emptyText}>
                No variables configured. Click the + button to add one.
              </Typography.Text>
            </div>
          )}
        </div>

        {/* Parallel execution */}
        {variables.length > 0 && (
          <div className={styles.section}>
            <Form.Item label="Parallel execution" className={styles.formItem}>
              <div className={styles.switchContainer}>
                <Switch
                  checked={parallelExecution}
                  onChange={updateParallelExecution}
                  size="small"
                />
                <Typography.Text
                  type="secondary"
                  className={styles.switchLabel}
                >
                  Execute all variable assignments simultaneously
                </Typography.Text>
              </div>
            </Form.Item>
          </div>
        )}
      </div>
    );
  };

  const ImageProperties = () => {
    const value: ImageSelectorValue = {
      sourceType:
        (selectedNode.data.imageSourceType as ImageSourceType) || "upload",
      url: selectedNode.data.imageUrl || selectedNode.data.url || "",
      data: selectedNode.data.imageData || "",
      fileName: selectedNode.data.imageFileName || "",
    };

    const handleChange = (next: Required<ImageSelectorValue>) => {
      handleUpdateNodeBatch({
        imageSourceType: next.sourceType,
        imageUrl: next.url,
        url: next.url,
        imageData: next.sourceType === "upload" ? next.data : "",
        imageFileName: next.sourceType === "upload" ? next.fileName : "",
      });
    };

    return (
      <ImageSelector
        value={value}
        onChange={handleChange}
        onError={(message) => dispatch(showToast({ message, type: "error" }))}
      />
    );
  };

  const CardProperties = () => {
    const [title, setTitle] = useState<string>(selectedNode.data.title || "");
    const [description, setDescription] = useState<string>(
      selectedNode.data.description || ""
    );

    useEffect(() => {
      setTitle(selectedNode.data.title || "");
      setDescription(selectedNode.data.description || "");
    }, [
      selectedNodeId,
      selectedNode.data.title,
      selectedNode.data.description,
    ]);

    const commitTitle = () => {
      if ((selectedNode.data.title || "") !== title) {
        handleUpdateNode("title", title);
      }
    };

    const commitDescription = () => {
      if ((selectedNode.data.description || "") !== description) {
        handleUpdateNode("description", description);
      }
    };

    const rawButtons = selectedNode.data.buttons as CardButton[] | undefined;
    const normalizedButtons = useMemo(
      () => normalizeButtons(rawButtons || []),
      [rawButtons]
    );

    useEffect(() => {
      if (
        Array.isArray(rawButtons) &&
        rawButtons.some(
          (btn) =>
            typeof btn === "string" ||
            (btn && typeof btn === "object" && !btn.id)
        )
      ) {
        handleUpdateNodeBatch({ buttons: normalizedButtons });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeId]);

    const updateButtons = (next: CardButton[]) => {
      handleUpdateNodeBatch({ buttons: next });
    };

    const imageValue: ImageSelectorValue = {
      sourceType:
        (selectedNode.data.imageSourceType as ImageSourceType) || "upload",
      url: selectedNode.data.imageUrl || selectedNode.data.url || "",
      data: selectedNode.data.imageData || "",
      fileName: selectedNode.data.imageFileName || "",
    };

    const handleImageChange = (next: Required<ImageSelectorValue>) => {
      handleUpdateNodeBatch({
        imageSourceType: next.sourceType,
        imageUrl: next.url,
        url: next.url,
        imageData: next.sourceType === "upload" ? next.data : "",
        imageFileName: next.sourceType === "upload" ? next.fileName : "",
      });
    };

    return (
      <div className={styles.cardProperties}>
        <Typography.Text className={styles.sectionHeading}>
          Image
        </Typography.Text>
        <ImageSelector
          value={imageValue}
          onChange={handleImageChange}
          onError={(message) => dispatch(showToast({ message, type: "error" }))}
        />

        <div className={styles.cardTextInputs}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commitTitle}
            onPressEnter={commitTitle}
            placeholder="Enter card title, { to add variable"
            className={styles.cardTextInput}
          />
          <Input.TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={commitDescription}
            placeholder="Enter card description, { to add variable"
            autoSize={{ minRows: 3, maxRows: 4 }}
            className={styles.cardTextArea}
          />
        </div>

        <Typography.Text className={styles.sectionHeading}>
          Buttons
        </Typography.Text>
        <ButtonListEditor
          buttons={normalizedButtons}
          onChange={updateButtons}
          maxButtons={5}
          emptyHint="No buttons yet. Add one to provide quick replies."
        />
      </div>
    );
  };

  const ChoiceProperties = () => {
    const rawChoices = selectedNode.data.choices as any[] | undefined;
    const normalizedChoices = useMemo(
      () => normalizeChoiceOptions(Array.isArray(rawChoices) ? rawChoices : []),
      [rawChoices]
    );
    const initialChoices =
      normalizedChoices.length > 0
        ? normalizedChoices
        : createDefaultChoiceList();
    const [choicesState, setChoicesState] =
      useState<ChoiceOption[]>(initialChoices);
    const choicesRef = useRef<ChoiceOption[]>(initialChoices);
    const [activeChoiceId, setActiveChoiceId] = useState<string | null>(null);
    const [draftChoice, setDraftChoice] = useState<ChoiceOption | null>(null);

    useEffect(() => {
      const next =
        normalizedChoices.length > 0
          ? normalizedChoices
          : createDefaultChoiceList();
      if (!choicesEqual(next, choicesRef.current)) {
        setChoicesState(next);
      }
      choicesRef.current = next;
      setActiveChoiceId(null);
      setDraftChoice(null);
    }, [normalizedChoices, selectedNodeId]);

    useEffect(() => {
      choicesRef.current = choicesState;
    }, [choicesState]);

    const persistChoices = (next?: ChoiceOption[]) => {
      const payload = next ?? choicesRef.current;
      const sanitized = normalizeChoiceOptions(payload);
      if (choicesEqual(sanitized, normalizedChoices)) {
        return;
      }
      handleUpdateNode("choices", sanitized);
    };

    useEffect(() => {
      return () => {
        persistChoices();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeId]);

    const updateChoice = (
      id: string,
      patch: Partial<ChoiceOption>,
      options: { persist?: boolean } = {}
    ) => {
      setChoicesState((current) => {
        const next = current.map((choice) =>
          choice.id === id ? { ...choice, ...patch } : choice
        );
        choicesRef.current = next;
        if (options.persist) {
          persistChoices(next);
        }
        return next;
      });
    };

    const addChoice = () => {
      const newChoice: ChoiceOption = {
        id: generateChoiceId(),
        label: "",
      };
      const next = [...choicesRef.current, newChoice];
      setChoicesState(next);
      choicesRef.current = next;
      persistChoices(next);
      setActiveChoiceId(newChoice.id);
      setDraftChoice({ ...newChoice });
    };

    const removeChoice = (id: string) => {
      const next = choicesRef.current.filter((choice) => choice.id !== id);
      setChoicesState(next);
      choicesRef.current = next;
      persistChoices(next);
      if (activeChoiceId === id) {
        setActiveChoiceId(null);
        setDraftChoice(null);
      }
    };

    const closePopover = useCallback(() => {
      setActiveChoiceId(null);
      setDraftChoice(null);
    }, []);

    const saveDraftChoice = () => {
      if (!draftChoice) return;
      const trimmedIntent = (draftChoice.intent || "").trim();
      const trimmedButton = (draftChoice.buttonLabel || "").trim();
      updateChoice(
        draftChoice.id,
        {
          label: trimmedIntent.length > 0 ? trimmedIntent : "",
          intent: trimmedIntent || undefined,
          buttonLabel: trimmedButton.length > 0 ? trimmedButton : undefined,
        },
        { persist: true }
      );
      closePopover();
    };

    return (
      <div className={styles.choiceProperties}>
        <div className={styles.choiceHeaderRow}>
          <Typography.Text className={styles.sectionHeading}>
            Triggers
          </Typography.Text>
          <Button
            icon={<PlusOutlined />}
            type="text"
            onClick={addChoice}
            className={styles.choiceAddButton}
          />
        </div>
        <div className={styles.choiceList}>
          {choicesState.length === 0 ? (
            <div
              className={`${styles.choiceListItem} ${styles.choiceListItemEmpty}`}
            >
              <span className={styles.choiceEmptyLabel}>None</span>
            </div>
          ) : (
            choicesState.map((choice) => {
              const isActive = activeChoiceId === choice.id;
              const effectiveChoice =
                isActive && draftChoice ? draftChoice : choice;
              const summaryIntent = (effectiveChoice.intent || "").trim();
              const summaryLabel = (effectiveChoice.label || "").trim();
              const summaryDisplay =
                summaryIntent.length > 0
                  ? summaryIntent
                  : summaryLabel.length > 0
                  ? summaryLabel
                  : "Select intent";
              const isPlaceholder =
                summaryIntent.length === 0 && summaryLabel.length === 0;
              return (
                <div
                  key={choice.id}
                  className={`${styles.choiceListItem} ${
                    isActive ? styles.choiceListItemActive : ""
                  }`}
                >
                  <Popover
                    trigger="click"
                    open={isActive}
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveChoiceId(choice.id);
                        setDraftChoice({ ...choice });
                      } else {
                        closePopover();
                      }
                    }}
                    placement="right"
                    overlayClassName={styles.choicePopoverOverlay}
                    content={
                      <div className={styles.choicePopover}>
                        <Typography.Text className={styles.choicePopoverTitle}>
                          Choice settings
                        </Typography.Text>
                        <Form layout="vertical">
                          <Form.Item label="Intent">
                            <IntentPicker
                              value={effectiveChoice.intent || ""}
                              onChange={(nextIntent) => {
                                setDraftChoice((current) => {
                                  if (!current || current.id !== choice.id)
                                    return current;
                                  return {
                                    ...current,
                                    intent: nextIntent,
                                    label:
                                      typeof nextIntent === "string"
                                        ? nextIntent.trim()
                                        : "",
                                  };
                                });
                              }}
                              placeholder="Select or create intent"
                              allowCreate
                              allowClear
                              createMode="modal"
                              size="middle"
                            />
                          </Form.Item>
                          <Form.Item label="Button label">
                            <Input
                              value={effectiveChoice.buttonLabel || ""}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setDraftChoice((current) => {
                                  if (!current || current.id !== choice.id)
                                    return current;
                                  return {
                                    ...current,
                                    buttonLabel: nextValue,
                                  };
                                });
                              }}
                              placeholder="Optional button label"
                            />
                          </Form.Item>
                        </Form>
                        <div className={styles.choicePopoverFooter}>
                          <Button onClick={closePopover}>Cancel</Button>
                          <Button type="primary" onClick={saveDraftChoice}>
                            Save
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <button type="button" className={styles.choiceListTrigger}>
                      <span
                        className={`${styles.choiceListTriggerText} ${
                          isPlaceholder
                            ? styles.choiceListTriggerPlaceholder
                            : ""
                        }`}
                      >
                        {summaryDisplay}
                      </span>
                    </button>
                  </Popover>
                  <div className={styles.choiceItemActions}>
                    <Button
                      type="text"
                      icon={<MinusOutlined />}
                      onClick={() => removeChoice(choice.id)}
                      className={styles.choiceRemoveButton}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <Divider className={styles.choiceDivider} />
        <FallbackSettings
          selectedNode={selectedNode}
          selectedNodeId={selectedNodeId}
          handleUpdateNodeBatch={handleUpdateNodeBatch}
        />
      </div>
    );
  };

  const ButtonsProperties = () => {
    const rawButtons = selectedNode.data.buttons as
      | ButtonsNodeButton[]
      | undefined;
    const legacyOptions = Array.isArray(selectedNode.data.options)
      ? (selectedNode.data.options as string[])
      : [];

    const normalizedButtons = useMemo(() => {
      if (Array.isArray(rawButtons) && rawButtons.length > 0) {
        return normalizeButtonsNodeButtons(rawButtons);
      }
      return normalizeButtonsNodeButtons(legacyOptions);
    }, [rawButtons, legacyOptions]);

    const [buttonsState, setButtonsState] =
      useState<ButtonsNodeButton[]>(normalizedButtons);
    const buttonsStateRef = useRef<ButtonsNodeButton[]>(normalizedButtons);
    const normalizedButtonsRef = useRef<ButtonsNodeButton[]>(normalizedButtons);
    const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
    const buttonLabelRefs = useRef<Record<string, ValueInputHandle | null>>({});

    useEffect(() => {
      normalizedButtonsRef.current = normalizedButtons;
      setButtonsState(normalizedButtons);
      buttonsStateRef.current = normalizedButtons;
      setActiveButtonId((prev) =>
        prev && normalizedButtons.some((button) => button.id === prev)
          ? prev
          : null
      );
    }, [normalizedButtons]);

    useEffect(() => {
      buttonsStateRef.current = buttonsState;
    }, [buttonsState]);

    useEffect(() => {
      if (!activeButtonId) return;
      const focusLater = window.setTimeout(() => {
        const ref = buttonLabelRefs.current[activeButtonId];
        ref?.focus?.();
      }, 0);
      return () => window.clearTimeout(focusLater);
    }, [activeButtonId]);

    const persistButtons = (next?: ButtonsNodeButton[]) => {
      const payload = next ?? buttonsStateRef.current;
      if (buttonsEqual(payload, normalizedButtonsRef.current)) {
        return;
      }
      handleUpdateNodeBatch({
        buttons: payload,
        options: payload.map((btn) => btn.label),
      });
    };

    useEffect(() => {
      return () => {
        persistButtons();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeId]);

    const updateButtonLocal = (
      id: string,
      patch: Partial<ButtonsNodeButton>,
      options: { persist?: boolean } = {}
    ) => {
      setButtonsState((current) => {
        const next = current.map((button) =>
          button.id === id ? { ...button, ...patch } : button
        );
        buttonsStateRef.current = next;
        if (options.persist) {
          persistButtons(next);
        }
        return next;
      });
    };

    const addButton = (afterId?: string) => {
      if (buttonsStateRef.current.length >= 10) {
        return;
      }

      const newButton: ButtonsNodeButton = {
        id: generateButtonId(),
        label: "",
        matchType: "exact",
      };

      const current = buttonsStateRef.current;
      const trimmed = afterId
        ? current.map((button) =>
            button.id === afterId
              ? { ...button, label: button.label.trim() }
              : button
          )
        : current.slice();

      const insertIndex = afterId
        ? trimmed.findIndex((button) => button.id === afterId)
        : -1;

      const next =
        afterId && insertIndex >= 0
          ? [
              ...trimmed.slice(0, insertIndex + 1),
              newButton,
              ...trimmed.slice(insertIndex + 1),
            ]
          : [...trimmed, newButton];

      setButtonsState(next);
      buttonsStateRef.current = next;
      persistButtons(next);
      setActiveButtonId(newButton.id);
    };

    const removeButton = (id: string) => {
      const next = buttonsStateRef.current.filter((button) => button.id !== id);
      setButtonsState(next);
      buttonsStateRef.current = next;
      persistButtons(next);
      setActiveButtonId((prev) => (prev === id ? null : prev));
      delete buttonLabelRefs.current[id];
    };

    const handleButtonPopoverOpenChange = (id: string) => (open: boolean) => {
      setActiveButtonId((prev) => {
        if (open) {
          if (prev && prev !== id) {
            persistButtons();
          }
          return id;
        }
        if (prev === id) {
          persistButtons();
          return null;
        }
        return prev;
      });
    };

    const renderButtonEditor = (button: ButtonsNodeButton) => {
      const canRenderAddAnother = buttonsStateRef.current.length < 10;
      const isAddAnotherDisabled = button.label.trim().length === 0;

      return (
        <div className={styles.buttonsNodeEditor}>
          <Typography.Text className={styles.buttonsNodeEditorTitle}>
            Button
          </Typography.Text>
          <ValueInput
            ref={(instance) => {
              if (instance) {
                buttonLabelRefs.current[button.id] = instance;
              } else {
                delete buttonLabelRefs.current[button.id];
              }
            }}
            value={button.label}
            onChange={(value) => updateButtonLocal(button.id, { label: value })}
            onBlur={() => persistButtons()}
            onPressEnter={() => {
              persistButtons();
              setActiveButtonId(null);
            }}
            placeholder="Enter button label or {variable}"
            size="large"
          />
          {canRenderAddAnother && (
            <Button
              block
              type="default"
              className={styles.buttonsNodeAddAnother}
              disabled={isAddAnotherDisabled}
              onClick={() => addButton(button.id)}
            >
              Add another
            </Button>
          )}
        </div>
      );
    };

    return (
      <div className={styles.buttonsNodeProperties}>
        <div className={styles.buttonsNodeHeaderRow}>
          <Typography.Text className={styles.sectionHeading}>
            Buttons
          </Typography.Text>
          <Button
            icon={<PlusOutlined />}
            type="text"
            onClick={() => addButton()}
            disabled={buttonsState.length >= 10}
            className={styles.buttonsNodeAdd}
          />
        </div>

        <div className={styles.buttonsNodeList}>
          {buttonsState.length === 0 && (
            <Typography.Text type="secondary">
              No buttons yet. Add one to provide quick replies.
            </Typography.Text>
          )}
          {buttonsState.map((button) => {
            const isActive = activeButtonId === button.id;
            const displayLabel = button.label.trim() || "Add button label";
            return (
              <Popover
                key={button.id}
                trigger={["click"]}
                destroyTooltipOnHide
                placement="left"
                overlayClassName={styles.buttonsNodePopover}
                open={isActive}
                onOpenChange={handleButtonPopoverOpenChange(button.id)}
                content={renderButtonEditor(button)}
              >
                <div
                  className={`${styles.buttonsNodeListItem} ${
                    isActive ? styles.buttonsNodeListItemActive : ""
                  } ${
                    button.label.trim()
                      ? ""
                      : styles.buttonsNodeListItemInactive
                  }`}
                >
                  <span className={styles.buttonsNodeListLabel}>
                    {displayLabel}
                  </span>
                  <Button
                    type="text"
                    icon={<MinusOutlined />}
                    className={styles.buttonsNodeListRemove}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeButton(button.id);
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                  />
                </div>
              </Popover>
            );
          })}
        </div>

        <Divider className={styles.buttonsNodeDivider} />

        <FallbackSettings
          selectedNode={selectedNode}
          selectedNodeId={selectedNodeId}
          handleUpdateNodeBatch={handleUpdateNodeBatch}
        />
      </div>
    );
  };

  const CarouselProperties = () => {
    const rawCards = selectedNode.data.cards || [];
    const normalizedCards = normalizeCards(rawCards);
    const [activeKey, setActiveKey] = useState<string | string[]>(
      normalizedCards[0]?.id ? [normalizedCards[0].id] : []
    );

    useEffect(() => {
      if (
        Array.isArray(rawCards) &&
        rawCards.some(
          (card) =>
            typeof card !== "object" ||
            !card ||
            !card.id ||
            (card.buttons || []).some(
              (btn: any) => typeof btn === "string" || (btn && !btn.id)
            )
        )
      ) {
        handleUpdateNodeBatch({ cards: normalizedCards });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeId]);

    useEffect(() => {
      if (!Array.isArray(activeKey)) return;
      if (activeKey.length === 0 && normalizedCards[0]) {
        setActiveKey([normalizedCards[0].id]);
      } else if (
        activeKey.length > 0 &&
        !normalizedCards.find((card) => card.id === activeKey[0]) &&
        normalizedCards[0]
      ) {
        setActiveKey([normalizedCards[0].id]);
      }
    }, [normalizedCards, activeKey]);

    const updateCards = (nextCards: CarouselCard[]) => {
      handleUpdateNodeBatch({ cards: nextCards });
    };

    const handleCardChange = (index: number, patch: Partial<CarouselCard>) => {
      const next = normalizedCards.map((card, idx) =>
        idx === index ? { ...card, ...patch } : card
      );
      updateCards(next);
    };

    const handleButtonsChange = (index: number, buttons: CardButton[]) => {
      handleCardChange(index, { buttons });
    };

    const handleImageChange = (
      index: number,
      next: Required<ImageSelectorValue>
    ) => {
      handleCardChange(index, {
        imageSourceType: next.sourceType,
        imageUrl: next.url,
        imageData: next.sourceType === "upload" ? next.data : "",
        imageFileName: next.sourceType === "upload" ? next.fileName : "",
        url: next.url,
      });
    };

    const addCard = () => {
      const nextCard: CarouselCard = {
        id: generateCardId(),
        title: `Card ${normalizedCards.length + 1}`,
        description: "",
        imageSourceType: "upload",
        imageUrl: "",
        imageData: "",
        imageFileName: "",
        buttons: [],
      };
      const next = [...normalizedCards, nextCard];
      updateCards(next);
      setActiveKey([nextCard.id]);
    };

    const removeCard = (index: number) => {
      const next = normalizedCards.filter((_, idx) => idx !== index);
      updateCards(next);
      if (
        Array.isArray(activeKey) &&
        activeKey[0] === normalizedCards[index]?.id
      ) {
        setActiveKey(next[0] ? [next[0].id] : []);
      }
    };

    const onCollapseChange = (keys: string | string[]) => {
      setActiveKey(keys);
    };

    return (
      <div className={styles.carouselProperties}>
        <Collapse
          accordion
          activeKey={activeKey}
          onChange={onCollapseChange}
          className={styles.carouselCollapse}
        >
          {normalizedCards.map((card, index) => (
            <Collapse.Panel
              key={card.id}
              header={`Card ${index + 1}`}
              className={styles.carouselPanel}
              extra={
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeCard(index);
                  }}
                />
              }
            >
              <Form layout="vertical" className={styles.formContainer}>
                <Form.Item label="Title" className={styles.formItem}>
                  <Input
                    value={card.title}
                    onChange={(event) =>
                      handleCardChange(index, { title: event.target.value })
                    }
                    placeholder="Enter card title, { to add variable"
                    className={styles.cardTextInput}
                  />
                </Form.Item>
                <Form.Item label="Description" className={styles.formItem}>
                  <Input.TextArea
                    value={card.description || ""}
                    onChange={(event) =>
                      handleCardChange(index, {
                        description: event.target.value,
                      })
                    }
                    placeholder="Enter card description, { to add variable"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    className={styles.cardTextArea}
                  />
                </Form.Item>
              </Form>

              <Typography.Text className={styles.sectionHeading}>
                Image
              </Typography.Text>
              <ImageSelector
                value={{
                  sourceType: card.imageSourceType || "upload",
                  url: card.imageUrl || card.imageData || "",
                  data: card.imageData || "",
                  fileName: card.imageFileName || "",
                }}
                onChange={(next) => handleImageChange(index, next)}
                onError={(message) =>
                  dispatch(showToast({ message, type: "error" }))
                }
                hideHelpLink
              />

              <Typography.Text className={styles.sectionHeading}>
                Buttons
              </Typography.Text>
              <ButtonListEditor
                buttons={card.buttons || []}
                onChange={(next) => handleButtonsChange(index, next)}
                maxButtons={5}
              />
            </Collapse.Panel>
          ))}
        </Collapse>

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addCard}
          className={styles.carouselAddButton}
          disabled={normalizedCards.length >= 10}
        >
          Add card
        </Button>

        {normalizedCards.length === 0 && (
          <Typography.Text type="secondary" className={styles.carouselEmpty}>
            No cards yet. Add cards to build your carousel.
          </Typography.Text>
        )}
      </div>
    );
  };

  const NoProperties = () => (
    <div className={styles.noPropertiesContainer}>
      <SettingOutlined className={styles.noPropertiesIcon} />
      <div className={styles.noPropertiesText}>No properties available</div>
    </div>
  );

  const NodeProperties = () => {
    switch (selectedNode.type) {
      case "start":
        return <StartProperties />;
      case "capture":
        return <CaptureProperties />;
      case "message":
        return <MessageProperties />;
      case "prompt":
        return <PromptProperties />;
      case "condition":
        return <ConditionProperties />;
      case "email":
        return <EmailProperties />;
      case "set":
        return <SetProperties />;
      case "choice":
        return <ChoiceProperties />;
      case "buttons":
        return <ButtonsProperties />;
      case "card":
        return <CardProperties />;
      case "carousel":
        return <CarouselProperties />;
      case "image":
        return <ImageProperties />;
      case "api":
        return (
          <ApiProperties
            selectedNode={selectedNode}
            handleUpdateNode={handleUpdateNode}
          />
        );
      case "kb-search":
        return (
          <KbSearchProperties
            selectedNode={selectedNode}
            handleUpdateNode={handleUpdateNode}
          />
        );
      case "end":
        return (
          <div className={styles.noPropertiesContainer}>
            <div className={styles.noPropertiesText}>
              <Typography.Text strong>End block ends the agent in its current state.</Typography.Text>
            </div>
          </div>
        );
      default:
        return <NoProperties />;
    }
  };

  // Color helpers (use a consistent palette for header badge)
  const blockColor =
    selectedNode.type === "start"
      ? "#22c55e"
      : selectedNode.type === "capture"
      ? "#8b5cf6"
      : selectedNode.type === "message"
      ? "#1677ff"
      : selectedNode.type === "prompt"
      ? "#ec4899"
      : selectedNode.type === "buttons"
      ? "#14b8a6"
      : selectedNode.type === "condition"
      ? "#f59e0b"
      : selectedNode.type === "action"
      ? "#a855f7"
      : selectedNode.type === "database"
      ? "#ef4444"
      : selectedNode.type === "email"
      ? "#6366f1"
      : selectedNode.type === "card"
      ? "#ec4899"
      : selectedNode.type === "carousel"
      ? "#0ea5e9"
      : selectedNode.type === "image"
      ? "#38bdf8"
      : "#6b7280";

  return (
    <div className={styles.propertiesPanelContainer}>
      {/* Scrollable Content */}
      <div ref={contentRef} className={styles.panelContent}>
        {/* General */}
        <Typography.Text className={styles.panelTitle}>General</Typography.Text>
        <div className={styles.spacer} />
        <Form layout="vertical" className={styles.formContainer}>
          <Form.Item label="Block name" className={styles.formItem}>
            {(() => {
              const [localName, setLocalName] = useState<string>(
                selectedNode.data.label || ""
              );
              useEffect(() => {
                setLocalName(selectedNode.data.label || "");
              }, [selectedNodeId]);
              const commit = () => {
                if ((selectedNode.data.label || "") !== localName) {
                  handleUpdateNode("label", localName);
                }
              };
              return (
                <Input
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={commit}
                  onPressEnter={commit}
                />
              );
            })()}
          </Form.Item>
        </Form>

        <NodeProperties />
      </div>

      {/* Sticky Footer */}
      <div className={styles.stickyFooter}>
        <Button
          danger
          block
          icon={<DeleteOutlined />}
          onClick={handleDeleteNode}
        >
          Delete block
        </Button>
      </div>
    </div>
  );
}

// Variable Edit Form Component
const VariableEditForm: React.FC<{
  variable: any;
  onSave: (variable: any) => void;
  onCancel: () => void;
}> = ({ variable, onSave, onCancel }) => {
  const variables = useAppSelector((s) => s.variables?.list || []);
  const [selectedVariable, setSelectedVariable] = useState(
    variable.variable || ""
  );
  const [valueType, setValueType] = useState<"value" | "expression" | "prompt">(
    variable.valueType || "value"
  );
  const [value, setValue] = useState(variable.value || "");
  const [expression, setExpression] = useState(variable.expression || "");
  const [prompt, setPrompt] = useState(variable.prompt || "");
  const [outputVariable, setOutputVariable] = useState(
    variable.outputVariable || ""
  );
  const [showFullScreenEditor, setShowFullScreenEditor] = useState(false);

  const handleSave = () => {
    if (!selectedVariable.trim()) return;

    // Check required fields based on valueType
    if (valueType === "value" && !value.trim()) return;
    if (valueType === "expression" && !expression.trim()) return;
    if (valueType === "prompt" && (!prompt.trim() || !outputVariable.trim()))
      return;

    const updatedVariable = {
      ...variable,
      variable: selectedVariable.trim(),
      valueType,
      value: valueType === "value" ? value : "",
      expression: valueType === "expression" ? expression : "",
      prompt: valueType === "prompt" ? prompt : "",
      outputVariable: valueType === "prompt" ? outputVariable : undefined,
    };

    onSave(updatedVariable);
  };

  const handleFullScreenSave = (code: string) => {
    setExpression(code);
    setShowFullScreenEditor(false);
  };

  // If it's a prompt type, show simplified interface
  if (valueType === "prompt") {
    return (
      <div className={styles.variableEditForm}>
        <Form layout="vertical" className={styles.editForm}>
          <Form.Item label="Prompt" className={styles.formItem}>
            <PromptPicker
              value={prompt}
              onChange={setPrompt}
              placeholder="Select or create prompt"
              allowCreate={true}
              createMode="modal"
              size="middle"
            />
          </Form.Item>
          <Form.Item
            label="Apply output to variable"
            className={styles.formItem}
          >
            <VariablePicker
              value={outputVariable}
              onChange={setOutputVariable}
              placeholder="Select or create variable"
              allowCreate={true}
              createMode="modal"
              size="middle"
            />
          </Form.Item>

          <div className={styles.editFormFooter}>
            <Button onClick={onCancel} className={styles.cancelButton}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              disabled={!prompt.trim() || !outputVariable.trim()}
              className={styles.saveButton}
            >
              {variable.id.startsWith("var-") ? "Add Variable" : "Save Changes"}
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  // For value/expression types, show the full interface
  return (
    <div className={styles.variableEditForm}>
      <Form layout="vertical" className={styles.editForm}>
        <Form.Item label="Variable" className={styles.formItem}>
          <VariablePicker
            value={selectedVariable}
            onChange={setSelectedVariable}
            placeholder="Select or create variable"
            allowCreate={true}
            createMode="modal"
            size="middle"
          />
        </Form.Item>

        <Form.Item label="Set to" className={styles.formItem}>
          <Radio.Group
            value={valueType}
            onChange={(e) => setValueType(e.target.value)}
            className={styles.radioGroup}
          >
            <Radio value="value">Value</Radio>
            <Radio value="expression">Expression</Radio>
          </Radio.Group>
        </Form.Item>

        {valueType === "value" ? (
          <Form.Item label="Value" className={styles.formItem}>
            <ValueInput
              value={value}
              onChange={setValue}
              placeholder="Enter value or {var}"
              size="middle"
            />
          </Form.Item>
        ) : (
          <Form.Item label="Expression" className={styles.formItem}>
            <div className={styles.expressionContainer}>
              <Input.TextArea
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="Enter JavaScript expression..."
                rows={4}
                className={styles.expressionInput}
              />
              <Button
                type="text"
                onClick={() => setShowFullScreenEditor(true)}
                className={styles.fullScreenButton}
                icon={<FullscreenOutlined />}
              ></Button>
            </div>
          </Form.Item>
        )}

        <div className={styles.editFormFooter}>
          <Button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={
              !selectedVariable.trim() ||
              (valueType === "value" && !value.trim()) ||
              (valueType === "expression" && !expression.trim())
            }
            className={styles.saveButton}
          >
            {variable.id.startsWith("var-") ? "Add Variable" : "Save Changes"}
          </Button>
        </div>
      </Form>

      <FullScreenCodeEditor
        visible={showFullScreenEditor}
        initialCode={expression}
        onSave={handleFullScreenSave}
        onClose={() => setShowFullScreenEditor(false)}
        language="javascript"
        title="Edit Expression"
      />
    </div>
  );
};
