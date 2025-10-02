import React, { useState } from 'react';
import { Modal, Button, Input, Select, message } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addDataSource } from '../../lib/knowledge-base/knowledgeBaseSlice';

const { TextArea } = Input;

interface TextImportModalProps {
  open: boolean;
  onCancel: () => void;
}

const TextImportModal: React.FC<TextImportModalProps> = ({ open, onCancel }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [chunkingStrategy, setChunkingStrategy] = useState('semantic');
  const [folder, setFolder] = useState('documentation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const chunkingOptions = [
    { value: 'semantic', label: 'Semantic Chunking' },
    { value: 'fixed', label: 'Fixed Size Chunking' },
    { value: 'recursive', label: 'Recursive Chunking' },
  ];

  const folderOptions = [
    { value: 'documentation', label: 'Documentation' },
    { value: 'support', label: 'Support' },
    { value: 'product', label: 'Product' },
  ];

  const handleSubmit = async () => {
    if (!text.trim()) {
      message.warning('Please enter some text to import');
      return;
    }

    if (!title.trim()) {
      message.warning('Please enter a title for this content');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to Redux store
      dispatch(addDataSource({
        name: title,
        type: 'text',
        content: text,
        refreshRate: 'never',
        chunkingStrategies: chunkingStrategy === 'semantic' ? ['smart_chunking'] : 
                          chunkingStrategy === 'fixed' ? ['faq_optimization'] : 
                          ['remove_html_noise'],
        folder: folder as any,
        status: 'ready',
        documentCount: 1
      }));

      message.success('Text imported successfully!');
      onCancel();
      setText('');
      setTitle('');
    } catch (error) {
      console.error('Error importing text:', error);
      message.error('Failed to import text. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Import Text"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>,
        <Button 
          key="import" 
          type="primary" 
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!text.trim() || !title.trim()}
        >
          Import
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>Title</div>
        <Input
          placeholder="Enter a title for this content"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>Content</div>
        <TextArea
          rows={8}
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>Chunking Strategy</div>
        <Select
          value={chunkingStrategy}
          onChange={setChunkingStrategy}
          style={{ width: '100%' }}
          disabled={isSubmitting}
          options={chunkingOptions}
        />
      </div>

      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>Folder</div>
        <Select
          value={folder}
          onChange={setFolder}
          style={{ width: '100%' }}
          disabled={isSubmitting}
          options={folderOptions}
          suffixIcon={<FolderOutlined />}
        />
      </div>
    </Modal>
  );
};

export default TextImportModal;
