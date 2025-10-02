import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Input, Button, Select, Form } from 'antd';
import { addDataSource, setSitemapModalOpen } from '../../lib/knowledge-base/knowledgeBaseSlice';
import { REFRESH_RATES, FOLDERS, RefreshRate, ChunkingStrategy, FolderType } from '../../lib/knowledge-base/constants';
import { ChunkingStrategySelect } from './ChunkingStrategySelect';

interface FormData {
  name: string;
  sitemapUrl: string;
  refreshRate: RefreshRate;
  chunkingStrategies: ChunkingStrategy[];
  folder: FolderType;
}

export const SitemapImportModal: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.knowledgeBase.isSitemapModalOpen);
  const [form] = Form.useForm();
  
  const initialValues: FormData = {
    name: '',
    sitemapUrl: '',
    refreshRate: 'never',
    chunkingStrategies: [],
    folder: 'documentation'
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      dispatch(addDataSource({
        name: values.name || `Sitemap ${new Date().toLocaleString()}`,
        type: 'sitemap',
        url: values.sitemapUrl,
        refreshRate: values.refreshRate,
        chunkingStrategies: values.chunkingStrategies || [],
        folder: values.folder,
        status: 'processing',
        documentCount: 0
      }));
      dispatch(setSitemapModalOpen(false));
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal 
      title="Import from sitemap"
      open={isOpen} 
      onCancel={() => {
        dispatch(setSitemapModalOpen(false));
        form.resetFields();
      }}
      onOk={handleSubmit}
      width={600}
      okText="Import"
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        className="mt-4"
      >
        <Form.Item
          name="sitemapUrl"
          label="Sitemap URL"
          rules={[{ required: true, message: 'Please input sitemap URL!' }]}
        >
          <Input placeholder="https://example.com/sitemap.xml" />
        </Form.Item>

        <Form.Item name="refreshRate" label="Refresh rate">
          <Select>
            {REFRESH_RATES.map((rate) => (
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
            {FOLDERS.map((folder) => (
              <Select.Option key={folder.value} value={folder.value}>
                {folder.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item name="name" label="Name (optional)">
          <Input placeholder="Custom name for this import" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
