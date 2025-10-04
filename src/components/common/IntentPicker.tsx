import React, { useMemo, useState } from "react";
import {
  Select,
  Typography,
  Divider,
  Space,
  Button,
  Modal,
  Input,
  Form,
  Tag,
  Popover,
  Empty,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addIntent, addIntentDetailed } from "../../store/slices/intentsSlice";
import { addEntityDetailed } from "../../store/slices/entitiesSlice";

export interface IntentPickerProps {
  value?: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  allowCreate?: boolean;
  allowClear?: boolean;
  size?: "small" | "middle" | "large";
  createMode?: "inline" | "modal";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  searchValue?: string;
  createLabelFormat?: (search: string) => string;
  selectOnCreate?: boolean;
}

const normalizeUtterances = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === "string" ? item : ""))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const normalizeEntities = (entities?: string[]): string[] => {
  if (!Array.isArray(entities)) return [];
  return entities
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export default function IntentPicker({
  value,
  onChange,
  placeholder,
  style,
  allowCreate = true,
  allowClear = true,
  size = "middle",
  createMode = "inline",
  open,
  onOpenChange,
  searchValue,
  createLabelFormat,
  bordered = true,
  selectOnCreate = false,
}: IntentPickerProps) {
  const intents = useAppSelector((s) => s.intents?.list || []);
  const entities = useAppSelector((s) => s.entities?.list || []);
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [entitySearch, setEntitySearch] = useState("");
  const [pendingEntityName, setPendingEntityName] = useState("");
  const [entityValues, setEntityValues] = useState<string[]>([""]);
  const [bulkImportText, setBulkImportText] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [form] = Form.useForm();
  const [entityForm] = Form.useForm();

  const options = useMemo(
    () => intents.map((intent) => ({ label: intent, value: intent })),
    [intents]
  );
  const entityOptions = useMemo(
    () => entities.map((entity) => ({ label: entity, value: entity })),
    [entities]
  );
  const effectiveSearch = (searchValue ?? search).trim();
  const filteredOptions = useMemo(() => {
    if (!effectiveSearch) return options;
    const q = effectiveSearch.toLowerCase();
    return options.filter((opt) => String(opt.label).toLowerCase().includes(q));
  }, [options, effectiveSearch]);

  const handleCreate = (name: string) => {
    const next = (name || "").trim();
    if (!next) return;
    dispatch(addIntent(next));
    if (selectOnCreate) {
      onChange?.(next);
    }
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const appendEntityToIntent = (entityName: string) => {
    const trimmed = (entityName || "").trim();
    if (!trimmed) return;
    setSelectedEntities((current) => {
      if (current.includes(trimmed)) return current;
      return [...current, trimmed];
    });
  };

  const resetEntityModalState = () => {
    setBulkImportText("");
    setEntityValues([""]);
    entityForm.resetFields();
  };

  const submitModal = async () => {
    try {
      const values = await form.validateFields();
      const name = (values.name || "").trim();
      if (!name) return;
      const utterances = normalizeUtterances(values.utterances);
      const requiredEntities = normalizeEntities(selectedEntities);
      dispatch(
        addIntentDetailed({
          name,
          description: values.description?.trim() || undefined,
          utterances: utterances.length ? utterances : undefined,
          requiredEntities: requiredEntities.length ? requiredEntities : undefined,
        })
      );
      if (selectOnCreate) {
        onChange?.(name);
      }
      setModalOpen(false);
    } catch (error) {
      // ignore validation errors
    }
  };

  const handleEntityValueChange = (index: number, next: string) => {
    setEntityValues((current) => {
      const updated = [...current];
      updated[index] = next;
      return updated;
    });
  };

  const addEntityValueRow = () => {
    setEntityValues((current) => [...current, ""]);
  };

  const removeEntityValueRow = (index: number) => {
    setEntityValues((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const parseEntityValues = () => {
    return entityValues
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
  };

  const submitEntityModal = async () => {
    try {
      const values = await entityForm.validateFields();
      const name = (values.name || "").trim();
      if (!name) return;
      const normalizedValues = parseEntityValues();
      dispatch(
        addEntityDetailed({
          name,
          dataType: values.dataType,
          description: values.description?.trim() || undefined,
          values: normalizedValues.length ? normalizedValues : undefined,
        })
      );
      appendEntityToIntent(name);
      setEntityModalOpen(false);
    } catch (error) {
      // ignore validation errors
    }
  };

  const handleBulkImport = () => {
    const entries = bulkImportText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setEntityValues(entries.length > 0 ? entries : [""]);
    setBulkModalOpen(false);
    setBulkImportText("");
  };

  const handleSelectEntity = (entityName: string) => {
    appendEntityToIntent(entityName);
    setEntityPopoverOpen(false);
  };

  const handleRemoveEntity = (entityName: string) => {
    setSelectedEntities((current) => current.filter((item) => item !== entityName));
  };

  const filteredEntityOptions = useMemo(() => {
    const query = entitySearch.trim().toLowerCase();
    return entityOptions
      .filter((option) => !selectedEntities.includes(option.value))
      .filter((option) =>
        query ? String(option.label).toLowerCase().includes(query) : true
      );
  }, [entityOptions, entitySearch, selectedEntities]);

  return (
    <>
      <Select
        size={size}
        showSearch
        allowClear={allowClear}
        value={value && value.length > 0 ? value : undefined}
        onChange={(next) => {
          if (typeof next === "undefined" || next === null) {
            onChange?.("");
            return;
          }
          onChange?.(String(next));
        }}
        onSelect={(next) => onChange?.(String(next))}
        variant={bordered ? "outlined" : "borderless"}
        onSearch={(query) => setSearch(query)}
        open={open}
        onOpenChange={onOpenChange}
        placeholder={placeholder}
        options={filteredOptions}
        filterOption={false}
        popupMatchSelectWidth={false}
        placement="bottomLeft"
        getPopupContainer={() => {
          let container = document.getElementById("intent-picker-portal");
          if (!container) {
            container = document.createElement("div");
            container.id = "intent-picker-portal";
            container.style.position = "absolute";
            container.style.top = "0";
            container.style.left = "0";
            container.style.zIndex = "99999999";
            (container as HTMLDivElement).dataset.insideMenu = "true";
            document.body.appendChild(container);
          }
          (container as HTMLDivElement).dataset.insideMenu = "true";
          return container;
        }}
        styles={{
          popup: {
            root: {
              zIndex: 99999999,
              position: "fixed",
              minWidth: 200,
              maxWidth: 280,
            },
          },
        }}
        style={style}
        popupRender={(menu) => (
          <div
            onMouseDownCapture={(event) => {
              const target = event.target as HTMLElement;
              const option = (
                target.closest(".ant-select-item-option") ||
                target.closest('[role="option"]')
              ) as HTMLElement | null;
              if (option && onChange) {
                const val =
                  option.getAttribute("data-value") ||
                  option.getAttribute("title") ||
                  (option.textContent || "").trim();
                if (val) {
                  onChange(String(val));
                  onOpenChange?.(false);
                }
              }
            }}
            onClickCapture={(event) => {
              const target = event.target as HTMLElement;
              const option = (
                target.closest(".ant-select-item-option") ||
                target.closest('[role="option"]')
              ) as HTMLElement | null;
              if (option && onChange) {
                const val =
                  option.getAttribute("data-value") ||
                  option.getAttribute("title") ||
                  (option.textContent || "").trim();
                if (val) {
                  onChange(String(val));
                  onOpenChange?.(false);
                }
              }
            }}
          >
            {menu}
            {allowCreate && (
              <>
                <Divider style={{ margin: "4px 0" }} />
                <Space
                  style={{
                    padding: 8,
                    width: "100%",
                    justifyContent: "flex-start",
                  }}
                >
                  {createMode === "modal" ? (
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={openModal}
                    >
                      Create intent…
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleCreate(effectiveSearch)}
                      disabled={!effectiveSearch}
                    >
                      {createLabelFormat
                        ? createLabelFormat(effectiveSearch)
                        : `Create "${effectiveSearch || ""}"`}
                    </Button>
                  )}
                </Space>
              </>
            )}
          </div>
        )}
      />

      <Modal
        title="Create intent"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitModal}
        okText="Create intent"
        destroyOnClose
        zIndex={100000}
        afterOpenChange={(opened) => {
          if (opened) {
            form.resetFields();
            form.setFieldsValue({
              name: search.trim(),
              utterances: search.trim() ? [search.trim()] : [""],
            });
            setSelectedEntities([]);
            setEntitySearch("");
          }
        }}
        afterClose={() => {
          setSelectedEntities([]);
          setEntitySearch("");
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Enter intent name" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Trigger this intent when…" />
          </Form.Item>
          <Form.List name="utterances">
            {(fields, { add, remove }) => (
              <Form.Item
                label={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div>Utterances</div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Enter sample phrase or {"{entity}"}
                      </Typography.Text>
                    </div>
                    <Button
                      type="default"
                      size="small"
                      icon={<ThunderboltOutlined />}
                      disabled
                    >
                      Generate
                    </Button>
                  </div>
                }
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {fields.length === 0 && (
                    <Typography.Text type="secondary">
                      No utterances yet
                    </Typography.Text>
                  )}
                  {fields.map((field) => (
                    <Space
                      key={field.key}
                      align="start"
                      style={{ width: "100%" }}
                    >
                      <Form.Item
                        {...field}
                        style={{ flex: 1 }}
                        rules={[
                          {
                            required: true,
                            message: "Utterance cannot be empty",
                          },
                        ]}
                      >
                        <Input placeholder="Enter sample phrase or {entity}" />
                      </Form.Item>
                      <Button
                        type="text"
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add("")}
                    style={{ width: "100%" }}
                  >
                    Add utterance
                  </Button>
                </Space>
              </Form.Item>
            )}
          </Form.List>
          <Form.Item
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span>Required entities</span>
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  open={entityPopoverOpen}
                  onOpenChange={(nextOpen) => {
                    setEntityPopoverOpen(nextOpen);
                    if (nextOpen) {
                      setEntitySearch("");
                    }
                  }}
                  content={
                    <div style={{ width: 240 }}>
                      <Input
                        placeholder="Search"
                        value={entitySearch}
                        onChange={(event) => setEntitySearch(event.target.value)}
                        size="small"
                        style={{ marginBottom: 8 }}
                        autoFocus
                      />
                      <div
                        style={{
                          maxHeight: 200,
                          overflowY: "auto",
                          marginBottom: 8,
                        }}
                      >
                        {filteredEntityOptions.length === 0 ? (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No matches"
                          />
                        ) : (
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {filteredEntityOptions.map((option) => (
                              <Button
                                key={option.value}
                                type="text"
                                style={{ justifyContent: "flex-start" }}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelectEntity(option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </Space>
                        )}
                      </div>
                      <Divider style={{ margin: "4px 0" }} />
                      <Button
                        type="link"
                        icon={<PlusOutlined />}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setPendingEntityName(entitySearch.trim());
                          setEntityModalOpen(true);
                          setEntityPopoverOpen(false);
                        }}
                        style={{ padding: 0 }}
                      >
                        Create entity
                      </Button>
                    </div>
                  }
                >
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onMouseDown={(event) => event.preventDefault()}
                  />
                </Popover>
              </div>
            }
          >
            <Space size={[8, 8]} wrap>
              {selectedEntities.length === 0 ? (
                <Typography.Text type="secondary">
                  No required entities
                </Typography.Text>
              ) : (
                selectedEntities.map((entity) => (
                  <Tag
                    key={entity}
                    closable
                    onClose={() => handleRemoveEntity(entity)}
                  >
                    {entity}
                  </Tag>
                ))
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create entity"
        open={entityModalOpen}
        onCancel={() => {
          setEntityModalOpen(false);
        }}
        onOk={submitEntityModal}
        okText="Create entity"
        destroyOnClose
        zIndex={100001}
        afterOpenChange={(opened) => {
          if (opened) {
            resetEntityModalState();
            entityForm.setFieldsValue({
              name: pendingEntityName,
              dataType: "custom",
            });
            setEntityValues([""]);
          }
        }}
        afterClose={() => {
          resetEntityModalState();
          setPendingEntityName("");
        }}
      >
        <Form form={entityForm} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Entity name is required" }]}
          >
            <Input placeholder="Enter entity name" autoFocus />
          </Form.Item>
          <Form.Item name="dataType" label="Data type">
            <Select
              options={[
                { label: "Custom", value: "custom" },
                { label: "Number", value: "number" },
                { label: "Date", value: "date" },
                { label: "Color", value: "color" },
                { label: "Location", value: "location" },
              ]}
              placeholder="Select type"
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Optional description" />
          </Form.Item>
          <Form.Item
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span>Values</span>
                <Space>
                  <Button
                    type="default"
                    size="small"
                    icon={<InboxOutlined />}
                    onClick={() => setBulkModalOpen(true)}
                  >
                    Bulk import
                  </Button>
                  <Button
                    type="default"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addEntityValueRow}
                  >
                    Add value
                  </Button>
                </Space>
              </div>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {entityValues.map((entry, index) => (
                <Space
                  key={`entity-value-${index}`}
                  align="start"
                  style={{ width: "100%" }}
                >
                  <Input
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
                  />
                </Space>
              ))}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Bulk import entity values"
        open={bulkModalOpen}
        onCancel={() => {
          setBulkModalOpen(false);
          setBulkImportText("");
        }}
        onOk={handleBulkImport}
        okText="Import"
        cancelText="Close"
        destroyOnClose
        zIndex={100002}
      >
        <Typography.Paragraph type="secondary">
          Format: value, synonym 1, synonym 2 (one per line)
        </Typography.Paragraph>
        <Input.TextArea
          value={bulkImportText}
          onChange={(event) => setBulkImportText(event.target.value)}
          placeholder="Enter values, or drop CSV here"
          autoSize={{ minRows: 6, maxRows: 10 }}
        />
      </Modal>
    </>
  );
}
