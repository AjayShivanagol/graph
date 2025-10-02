import React, { useMemo, useState } from 'react';
import { Select, Typography, Divider, Space, Button, Modal, Input, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addVariable, addVariableDetailed } from '../../store/slices/variablesSlice';

export interface VariablePickerProps {
  value?: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  allowCreate?: boolean;
  size?: 'small' | 'middle' | 'large';
  createMode?: 'inline' | 'modal';
  // Controlled dropdown open state (optional)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Controlled search value for the dropdown filter (optional)
  searchValue?: string;
  // Customize the label for inline create button
  createLabelFormat?: (search: string) => string;
}

// Reusable variable selector: inline or modal-based creation. Left-aligned dropdown.
export default function VariablePicker({ value, onChange, placeholder, style, allowCreate = true, size = 'middle', createMode = 'inline', open, onOpenChange, searchValue, createLabelFormat, bordered = true }: VariablePickerProps) {
  const variables = useAppSelector((s) => s.variables?.list || []);
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const options = useMemo(() => variables.map((v) => ({ label: v, value: v })), [variables]);
  const effectiveSearch = (searchValue ?? search).trim();
  const filteredOptions = useMemo(() => {
    if (!effectiveSearch) return options;
    const q = effectiveSearch.toLowerCase();
    return options.filter((o) => (o.label as string).toLowerCase().includes(q));
  }, [options, effectiveSearch]);

  const handleCreate = (name: string) => {
    const n = (name || '').trim();
    if (!n) return;
    dispatch(addVariable(n));
    onChange?.(n);
  };

  const openModal = () => {
    // Only open the modal here; initialize form fields after Modal is opened
    setModalOpen(true);
  };

  const submitModal = async () => {
    try {
      const vals = await form.validateFields();
      const name = (vals.name || '').trim();
      if (!name) return;
      dispatch(addVariableDetailed({
        name,
        description: vals.description || '',
        defaultValue: vals.defaultValue || undefined,
      }));
      onChange?.(name);
      setModalOpen(false);
    } catch (e) {
      // ignore
    }
  };

  return (
    <>
      <Select
        size={size}
        showSearch
        value={value || undefined}
        onChange={(v) => onChange?.(String(v))}
        onSelect={(v) => onChange?.(String(v))}
        variant={bordered ? 'outlined' : 'borderless'}
        // keep internal search updated when uncontrolled usage happens via native Select typing
        onSearch={(q) => setSearch(q)}
        open={open}
        onOpenChange={onOpenChange}
        placeholder={placeholder}
        options={filteredOptions}
        filterOption={false}
        popupMatchSelectWidth={false}
        placement="bottomLeft"
        getPopupContainer={(node) => {
          // Create or get a high-level container for variable picker
          let container = document.getElementById('variable-picker-portal');
          if (!container) {
            container = document.createElement('div');
            container.id = 'variable-picker-portal';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.zIndex = '99999999';
            (container as HTMLDivElement).dataset.insideMenu = 'true';
            document.body.appendChild(container);
          }
          (container as HTMLDivElement).dataset.insideMenu = 'true';
          return container;
        }}
        styles={{
          popup: {
            root: {
              zIndex: 99999999,
              position: 'fixed',
              minWidth: 150,
              maxWidth: 250
            }
          }
        }}
        style={style}
        popupRender={(menu) => (
          <div
            onMouseDownCapture={(e) => {
              const target = e.target as HTMLElement;
              const opt = (target.closest('.ant-select-item-option') || target.closest('[role="option"]')) as HTMLElement | null;
              if (opt && onChange) {
                const val = opt.getAttribute('data-value') || opt.getAttribute('title') || (opt.textContent || '').trim();
                if (val) {
                  onChange(String(val));
                  onOpenChange?.(false);
                }
              }
            }}
            onClickCapture={(e) => {
              const target = e.target as HTMLElement;
              const opt = (target.closest('.ant-select-item-option') || target.closest('[role="option"]')) as HTMLElement | null;
              if (opt && onChange) {
                const val = opt.getAttribute('data-value') || opt.getAttribute('title') || (opt.textContent || '').trim();
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
                <Divider style={{ margin: '4px 0' }} />
                <Space style={{ padding: 8, width: '100%', justifyContent: 'flex-start' }}>
                  {createMode === 'modal' ? (
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={openModal}
                    >
                      Create variable…
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleCreate(effectiveSearch)}
                      disabled={!effectiveSearch}
                    >
                      {createLabelFormat ? createLabelFormat(effectiveSearch) : `Create "${effectiveSearch || ''}"`}
                    </Button>
                  )}
                </Space>
              </>
            )}
          </div>
        )}
      />

      <Modal
        title="Create Variable"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitModal}
        okText="Create"
        destroyOnClose
        zIndex={100000}
        afterOpenChange={(opened) => {
          if (opened) {
            // Initialize form after the Form has mounted to avoid AntD warning
            form.resetFields();
            form.setFieldsValue({ name: search.trim() });
          }
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. api_response" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Optional description" />
          </Form.Item>
          <Form.Item name="defaultValue" label="Default value">
            <Input placeholder="Optional default" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
