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
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addIntent,
  addIntentDetailed,
} from "../../store/slices/intentsSlice";

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
}

const normalizeUtterances = (value?: string) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export default function IntentPicker({
  value,
  onChange,
  placeholder,
  style,
  allowCreate = true,
  allowClear = false,
  size = "middle",
  createMode = "inline",
  open,
  onOpenChange,
  searchValue,
  createLabelFormat,
  bordered = true,
}: IntentPickerProps) {
  const intents = useAppSelector((s) => s.intents?.list || []);
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const options = useMemo(
    () => intents.map((intent) => ({ label: intent, value: intent })),
    [intents]
  );
  const effectiveSearch = (searchValue ?? search).trim();
  const filteredOptions = useMemo(() => {
    if (!effectiveSearch) return options;
    const q = effectiveSearch.toLowerCase();
    return options.filter((opt) =>
      String(opt.label).toLowerCase().includes(q)
    );
  }, [options, effectiveSearch]);

  const handleCreate = (name: string) => {
    const next = (name || "").trim();
    if (!next) return;
    dispatch(addIntent(next));
    onChange?.(next);
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const submitModal = async () => {
    try {
      const values = await form.validateFields();
      const name = (values.name || "").trim();
      if (!name) return;
      const utterances = normalizeUtterances(values.utterances);
      dispatch(
        addIntentDetailed({
          name,
          description: values.description?.trim() || undefined,
          utterances: utterances.length ? utterances : undefined,
        })
      );
      onChange?.(name);
      setModalOpen(false);
    } catch (error) {
      // ignore validation errors
    }
  };

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
        getPopupContainer={(node) => {
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
              minWidth: 180,
              maxWidth: 260,
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
        title="Create Intent"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitModal}
        okText="Create"
        destroyOnClose
        zIndex={100000}
        afterOpenChange={(opened) => {
          if (opened) {
            form.resetFields();
            form.setFieldsValue({ name: search.trim() });
          }
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. order_status" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Optional description" />
          </Form.Item>
          <Form.Item
            name="utterances"
            label={
              <div>
                <div>Sample utterances</div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Separate with commas
                </Typography.Text>
              </div>
            }
          >
            <Input placeholder="e.g. track my order, where is my package" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
