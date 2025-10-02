import React, { useState } from 'react';
import { Modal, Input, Button, Form, Select } from 'antd';
import { useDispatch } from 'react-redux';
import { setUrlImportModalOpen, addDataSource } from '../../lib/knowledge-base/knowledgeBaseSlice';
import { REFRESH_RATES, FOLDERS } from '../../lib/knowledge-base/constants';
import type { RefreshRate, FolderType, ChunkingStrategy } from '../../lib/knowledge-base/constants';
import { ChunkingStrategySelect } from './ChunkingStrategySelect';
import styles from './UrlImportModal.module.scss';

const { TextArea } = Input;

interface FormValues {
  urls: string;
  refreshRate: RefreshRate;
  chunkingStrategies: ChunkingStrategy[];
  folder: FolderType;
}

interface UrlImportModalProps {
  open: boolean;
  onCancel: () => void;
}

const UrlImportModal: React.FC<UrlImportModalProps> = ({ open, onCancel }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm<FormValues>();
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    try {
      const values = await form.validateFields();
      const { urls: urlsInput, refreshRate, chunkingStrategies, folder } = values;
      
      if (!urlsInput.trim()) return;

      setIsLoading(true);
      
      const urlList = urlsInput.split('\n').filter((url: string) => url.trim());
      const urlCount = urlList.length;
      
      // Create data source
      dispatch(addDataSource({
        name: urlCount === 1 ? urlList[0] : `${urlCount} URLs`,
        type: 'url',
        urls: urlList,
        refreshRate,
        chunkingStrategies: chunkingStrategies || [],
        folder,
        status: 'processing',
        documentCount: 0,
      }));

      // Close modal and reset form
      onCancel();
      form.resetFields();
      
    } catch (error) {
      console.error('Error importing URLs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const urlCount = form.getFieldValue('urls')?.split('\n').filter((url: string) => url.trim()).length || 0;

  return (
    <Modal
      title="Import from URLs"
      open={open}
      onCancel={onCancel}
      width={600}
      onOk={handleImport}
      okText="Import"
      cancelText="Cancel"
      confirmLoading={isLoading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          urls: '',
          refreshRate: 'never',
          chunkingStrategies: [],
          folder: 'all_data_sources'
        }}
      >
        <Form.Item 
          name="urls" 
          label="URLs (one per line)"
          rules={[{ required: true, message: 'Please enter at least one URL' }]}
        >
          <TextArea
            placeholder="https://example.com/page1\nhttps://example.com/page2"
            autoSize={{ minRows: 4, maxRows: 8 }}
            className={styles.textarea}
          />
        </Form.Item>

        <Form.Item name="refreshRate" label="Refresh rate">
          <Select>
            {REFRESH_RATES.map((rate: any) => (
              <Select.Option key={rate.value} value={rate.value}>
                {rate.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="chunkingStrategies" 
          label={
            <span>
              LLM Chunking Strategy
              <span className="text-gray-500 ml-1">(Select one or more)</span>
            </span>
          }
        >
          <ChunkingStrategySelect />
        </Form.Item>

        <Form.Item name="folder" label="Folder">
          <Select>
            {FOLDERS.map((f) => (
              <Select.Option key={f.value} value={f.value}>
                {f.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UrlImportModal;
