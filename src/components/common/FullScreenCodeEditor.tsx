import React, { useRef, useEffect } from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import styles from './FullScreenCodeEditor.module.scss';

const { Title } = Typography;

interface FullScreenCodeEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (code: string) => void;
  initialCode?: string;
  title?: string;
  language?: string;
  startFullscreen?: boolean;
}

export default function FullScreenCodeEditor({
  visible,
  onClose,
  onSave,
  initialCode = '',
  title = 'JavaScript Expression Editor',
  language = 'javascript',
  startFullscreen = false,
}: FullScreenCodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [code, setCode] = React.useState(initialCode);
  const [isFullscreen, setIsFullscreen] = React.useState(startFullscreen);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setCode(initialCode);
    setIsFullscreen(startFullscreen);
  }, [initialCode, startFullscreen]);

  useEffect(() => {
    // Add/remove body overflow hidden when fullscreen
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    // Cleanup function to restore overflow when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullscreen]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Set up keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleSaveAndClose();
    });
    
    // Focus the editor
    editor.focus();
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSaveStatus('saving');
    // Use setTimeout to make the save operation async
    setTimeout(() => {
      onSave(code);
      setSaveStatus('saved');
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 100);
  };

  const handleClose = () => {
    // Always close completely when clicking Close button
    onClose();
  };

  const handleSaveAndClose = () => {
    onSave(code);
    onClose();
  };

  const toggleFullscreen = () => {
    if (isFullscreen && startFullscreen) {
      // If we started in fullscreen mode and are exiting, close the modal entirely
      onClose();
    } else {
      // Normal toggle behavior
      setIsFullscreen(!isFullscreen);
    }
  };

  const editorOptions = {
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on' as const,
    wordWrap: 'on' as const,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    folding: true,
    bracketMatching: 'always' as const,
    autoIndent: 'full' as const,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    insertSpaces: true,
    suggest: {
      showMethods: true,
      showFunctions: true,
      showConstructors: true,
      showDeprecated: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showKeywords: true,
      showText: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true,
    },
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isFullscreen ? '100vw' : '90vw'}
      className={`${styles.codeEditorModal} ${isFullscreen ? styles.fullscreenMode : ''}`}
      style={{
        top: isFullscreen ? 0 : 20,
        maxWidth: isFullscreen ? '100vw' : '90vw',
        height: isFullscreen ? '100vh' : 'auto',
        padding: 0,
        margin: 0,
      }}
      styles={{
        body: {
          padding: 0,
          height: isFullscreen ? '100vh' : '70vh',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
      mask={!isFullscreen}
      maskClosable={!isFullscreen}
      closable={false}
      destroyOnHidden={false}
      wrapClassName={isFullscreen ? styles.fullscreenWrapper : ''}
    >
      {/* Header */}
      <div className={styles.editorHeader}>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        <Space>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
          />
          <Button
            type="primary"
            htmlType="button"
            icon={<SaveOutlined />}
            onClick={handleSave}
            title="Save (Ctrl+S)"
            loading={saveStatus === 'saving'}
          >
            {saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </Button>
          {!isFullscreen && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveAndClose}
              title="Save & Close (Ctrl+Enter)"
            >
              Save & Close
            </Button>
          )}
          <Button
            icon={<CloseOutlined />}
            onClick={handleClose}
            title="Close (Esc)"
          >
            Close
          </Button>
        </Space>
      </div>

      {/* Editor */}
      <div className={styles.editorContainer}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={editorOptions}
          loading={<div className={styles.loadingContainer}>Loading editor...</div>}
        />
      </div>

      {/* Footer with shortcuts info */}
      <div className={styles.editorFooter}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            Shortcuts: <strong>Ctrl+S</strong> Save | <strong>Ctrl+Enter</strong> Save & Close | <strong>F11</strong> Toggle Fullscreen
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            Examples: return userInput.length {'>'} 0; | return variables.status === 'active'; | return Date.now() % 2 === 0;
          </div>
        </div>
      </div>
    </Modal>
  );
}
