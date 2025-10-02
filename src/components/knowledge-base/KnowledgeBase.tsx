import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Typography,
  Input,
  Modal,
  Button,
  Select,
  Slider,
  Tooltip,
} from "antd";
import {
  SettingOutlined,
  CloseOutlined,
  MinusOutlined,
  SearchOutlined,
  ExpandOutlined,
  FileTextOutlined,
  PlusOutlined,
  FolderOutlined,
  FileTextTwoTone,
} from "@ant-design/icons";
import { message, Progress } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import {
  setPreviewModalOpen,
  setSettingsModalOpen,
  setAddDataSourceModalOpen,
  setUrlImportModalOpen,
  setSitemapModalOpen,
  setPreviewQuestion,
  setPreviewResponse,
  setSelectedDataSource,
  addDataSource,
  removeDataSource,
  setFileUploadModalOpen,
} from "../../lib/knowledge-base/knowledgeBaseSlice";
import { DATA_SOURCE_TYPES } from "../../lib/knowledge-base/constants";
import UrlImportModal from "./UrlImportModal";
import { SitemapImportModal } from "./SitemapImportModal";
import TextImportModal from "./TextImportModal";
import styles from "./KnowledgeBase.module.scss";

interface KnowledgeBaseProps {
  // Add props as needed for integration
}

const KnowledgeBase: React.FC = () => {
  const dispatch = useDispatch();
  const {
    isPreviewModalOpen,
    isSettingsModalOpen,
    isAddDataSourceModalOpen,
    isUrlImportModalOpen,
    isFileUploadModalOpen,
    previewQuestion,
    previewResponse,
    dataSources,
  } = useSelector((state: RootState) => state.knowledgeBase);

  const [temperature, setTemperature] = useState(0.1);
  const [maxTokens, setMaxTokens] = useState(256);
  const [aiModel, setAiModel] = useState("gpt-3.5-turbo");
  const [instructions, setInstructions] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [chunkingStrategy, setChunkingStrategy] = useState<string>("semantic");
  const [folderName, setFolderName] = useState<string>("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [isTextImportModalOpen, setIsTextImportModalOpen] =
    useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chunkingOptions = [
    { value: "semantic", label: "Semantic Chunking" },
    { value: "fixed", label: "Fixed Size Chunking" },
    { value: "recursive", label: "Recursive Chunking" },
  ];

  // Knowledge Base Icon Component
  const KnowledgeBaseIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="#4F46E5"
        stroke="#4F46E5"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2" fill="white" />
      <circle cx="12" cy="6" r="1" fill="white" />
      <circle cx="18" cy="12" r="1" fill="white" />
      <circle cx="12" cy="18" r="1" fill="white" />
      <circle cx="6" cy="12" r="1" fill="white" />
      <circle cx="15.5" cy="8.5" r="0.8" fill="white" />
      <circle cx="15.5" cy="15.5" r="0.8" fill="white" />
      <circle cx="8.5" cy="15.5" r="0.8" fill="white" />
      <circle cx="8.5" cy="8.5" r="0.8" fill="white" />
    </svg>
  );

  // Data source options (excluding Zendesk as requested)
  const handlePreviewClick = () => {
    dispatch(setPreviewModalOpen(true));
  };

  const [showDataSourceMenu, setShowDataSourceMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"header" | "center">(
    "header"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerButtonRef = useRef<HTMLDivElement>(null);
  const centerButtonRef = useRef<HTMLDivElement>(null);

  const handleAddDataSourceClick = (
    position: "header" | "center" = "header"
  ) => {
    setDropdownPosition(position);
    setShowDataSourceMenu(!showDataSourceMenu);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        headerButtonRef.current &&
        !headerButtonRef.current.contains(event.target as Node) &&
        centerButtonRef.current &&
        !centerButtonRef.current.contains(event.target as Node)
      ) {
        setShowDataSourceMenu(false);
      }
    };

    if (showDataSourceMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDataSourceMenu]);

  const handleDataSourceTypeClick = (type: string) => {
    dispatch(setAddDataSourceModalOpen(false));

    if (type === "url") {
      dispatch(setUrlImportModalOpen(true));
    } else if (type === "sitemap") {
      dispatch(setSitemapModalOpen(true));
    } else if (type === "file") {
      dispatch(setFileUploadModalOpen(true));
    } else if (type === "text") {
      setIsTextImportModalOpen(true);
    }
    // Handle other data source types here
  };

  const handleSendQuestion = async () => {
    if (!previewQuestion.trim()) return;

    // Simulate API call
    dispatch(
      setPreviewResponse(
        "This is a simulated response to your question. In a real implementation, this would call your knowledge base API."
      )
    );
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const fileType = file.type;
    const isValidType = validTypes.includes(fileType);
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

    if (!isValidType) {
      message.error(
        "Invalid file type. Please upload PDF, TXT, or DOCX files only."
      );
      return false;
    }

    if (!isValidSize) {
      message.error("File size too large. Maximum size is 10MB.");
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(validateFile);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(validateFile);
      setFiles((prev) => [...prev, ...newFiles]);
      e.dataTransfer.clearData();
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      message.warning("Please select at least one file to upload");
      return;
    }

    if (!folderName.trim()) {
      message.warning("Please select a folder");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("chunkingStrategy", chunkingStrategy);
        formData.append("folder", folderName);

        try {
          // Replace with actual API call
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            // Add headers if needed (e.g., authorization)
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          console.log("Upload successful:", result);

          // Add the uploaded file to the data sources
          dispatch(
            addDataSource({
              name: file.name,
              type: "file",
              refreshRate: "never",
              chunkingStrategies:
                chunkingStrategy === "semantic"
                  ? ["smart_chunking"]
                  : chunkingStrategy === "fixed"
                  ? ["faq_optimization"]
                  : ["remove_html_noise"],
              folder: "documentation", // Default folder, adjust as needed
              status: "ready",
              documentCount: 1,
            })
          );

          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          message.error(`Failed to upload ${file.name}. Please try again.`);
          throw error; // Stop further uploads on error
        }
      }

      message.success("Files uploaded successfully!");
      setFiles([]);
      setFolderName("");
      dispatch(setFileUploadModalOpen(false));
    } catch (error) {
      console.error("Upload process failed:", error);
      message.error("Failed to complete upload. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleApiCall = async (endpoint: string, data: any) => {
    // Placeholder for future API integration
    console.log(`API call to ${endpoint}:`, data);
    return { success: true, data: "Mock response" };
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.header}>
          <Typography.Title level={4} className={styles.title}>
            Knowledge base
          </Typography.Title>

          <div className={styles.headerActions}>
            {/* Search Bar */}
            <div className={styles.searchContainer}>
              <Input
                placeholder="Search"
                prefix={<SearchOutlined style={{ color: "#999" }} />}
                suffix={<div className={styles.keyboardShortcut}>⌘K</div>}
                className={styles.searchInput}
              />
            </div>

            {/* Settings Button */}
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => dispatch(setSettingsModalOpen(true))}
              className={styles.settingsButton}
            />

            {/* Preview Button */}
            <Button
              onClick={handlePreviewClick}
              className={styles.previewButton}
            >
              Preview
            </Button>

            {/* Add data source Button with Dropdown */}
            <div
              className={styles.addDataSourceContainer}
              ref={headerButtonRef}
            >
              <Button
                type="primary"
                onClick={() => handleAddDataSourceClick("header")}
                className={styles.addDataSourceButton}
              >
                Add data source
              </Button>
              {showDataSourceMenu && dropdownPosition === "header" && (
                <div className={styles.dataSourceDropdown} ref={dropdownRef}>
                  {DATA_SOURCE_TYPES.map((option) => (
                    <div
                      key={option.value}
                      className={styles.dropdownItem}
                      onClick={() => {
                        handleDataSourceTypeClick(option.value);
                        setShowDataSourceMenu(false);
                      }}
                    >
                      <div className={styles.dropdownIcon}>{option.icon}</div>
                      <div className={styles.dropdownContent}>
                        <div className={styles.dropdownTitle}>
                          {option.label}
                        </div>
                        {option.value === "file" && (
                          <div className={styles.dropdownSubtext}>
                            pdf, txt, docx
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className={styles.dropdownFooter}>
                    <span className={styles.dropdownFooterText}>
                      Add sources with the{" "}
                      <a href="#" className={styles.apiLink}>
                        Knowledge API
                      </a>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Header - matches Voiceflow breadcrumb structure */}
      <div className={styles.navigationHeader}>
        <div className={styles.navigationContent}>
          <section className={styles.breadcrumbs}>
            <span className={styles.breadcrumbItem}>
              <a className={styles.breadcrumbLink}>
                <span className={styles.breadcrumbText}>
                  All data sources ({dataSources.length})
                </span>
              </a>
            </span>
          </section>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {dataSources.length > 0 ? (
          <>
            {/* Left Sidebar - only show when there are data sources */}
            <div className={styles.leftSidebar}>
              <div className={styles.dataSourcesList}>
                {dataSources.map((source) => (
                  <div key={source.id} className={styles.dataSourceItem}>
                    <div className={styles.dataSourceIcon}>
                      {DATA_SOURCE_TYPES.find(
                        (type) => type.value === source.type
                      )?.icon || "📄"}
                    </div>
                    <div className={styles.dataSourceInfo}>
                      <div className={styles.dataSourceName}>{source.name}</div>
                      <div className={styles.dataSourceStatus}>
                        {source.status === "processing" && "Processing..."}
                        {source.status === "ready" &&
                          `${source.documentCount || 0} documents`}
                        {source.status === "error" && "Error"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Content with sidebar */}
            <div className={styles.centerContent}>
              {/* Content when there are data sources */}
            </div>
          </>
        ) : (
          <div className={styles.fullWidthCenterContent}>
            <div className={styles.emptyStateCard}>
              <div className={styles.iconContainer}>
                <KnowledgeBaseIcon />
              </div>
              <Typography.Text className={styles.emptyTitle}>
                No data sources exist
              </Typography.Text>
              <Typography.Text className={styles.emptyDescription}>
                Add data sources to your agent to build a knowledge base of
                material.{" "}
                <Button
                  type="link"
                  className={styles.learnMoreButton}
                  onClick={() => handleAddDataSourceClick("center")}
                >
                  Learn more
                </Button>
              </Typography.Text>
              <div className={styles.buttonContainer}>
                <div
                  className={styles.centerAddDataSourceContainer}
                  ref={centerButtonRef}
                >
                  <Button
                    type="primary"
                    onClick={() => handleAddDataSourceClick("center")}
                    className={styles.primaryButton}
                  >
                    Add data source
                  </Button>
                  {showDataSourceMenu && dropdownPosition === "center" && (
                    <div
                      className={styles.centerDataSourceDropdown}
                      ref={dropdownRef}
                    >
                      {DATA_SOURCE_TYPES.map((option) => (
                        <div
                          key={option.value}
                          className={styles.dropdownItem}
                          onClick={() => {
                            handleDataSourceTypeClick(option.value);
                            setShowDataSourceMenu(false);
                          }}
                        >
                          <div className={styles.dropdownIcon}>
                            {option.icon}
                          </div>
                          <div className={styles.dropdownContent}>
                            <div className={styles.dropdownTitle}>
                              {option.label}
                            </div>
                            {option.value === "file" && (
                              <div className={styles.dropdownSubtext}>
                                pdf, txt, docx
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className={styles.dropdownFooter}>
                        <span className={styles.dropdownFooterText}>
                          Add sources with the{" "}
                          <a href="#" className={styles.apiLink}>
                            Knowledge API
                          </a>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Knowledge Base Preview Modal */}
      <Modal
        title="Knowledge Base Preview"
        open={isPreviewModalOpen}
        onCancel={() => dispatch(setPreviewModalOpen(false))}
        footer={null}
        width={600}
        className={styles.previewModal}
      >
        <div className={styles.previewContent}>
          <div className={styles.previewHeader}>
            <Typography.Text className={styles.settingLabel}>
              Test your knowledge base
            </Typography.Text>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => dispatch(setSettingsModalOpen(true))}
              className={styles.settingsButton}
            />
          </div>
          <Input
            value={previewQuestion}
            onChange={(e) => dispatch(setPreviewQuestion(e.target.value))}
            placeholder="Ask a question about your knowledge base..."
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            onClick={handleSendQuestion}
            loading={false}
            block
            style={{ marginBottom: 24 }}
          >
            Ask Question
          </Button>
          {previewResponse && (
            <div className={styles.responseContainer}>
              <div className={styles.response}>{previewResponse}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Knowledge Base Settings Modal */}
      <Modal
        title="Knowledge base settings"
        open={isSettingsModalOpen}
        onCancel={() => dispatch(setSettingsModalOpen(false))}
        footer={[
          <Button
            key="cancel"
            onClick={() => dispatch(setSettingsModalOpen(false))}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={() => dispatch(setSettingsModalOpen(false))}
          >
            Save Changes
          </Button>,
        ]}
        width={500}
        className={styles.settingsModal}
      >
        <div className={styles.settingsContent}>
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>AI Model</label>
            <Select
              value="claude-4-sonnet"
              className={styles.modelSelect}
              style={{ width: "100%" }}
            >
              <Select.Option value="claude-4-sonnet">
                Claude 4 - Sonnet
              </Select.Option>
            </Select>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.settingHeader}>
              <label className={styles.settingLabel}>Temperature</label>
              <span className={styles.settingValue}>0.1</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={0.1}
              className={styles.temperatureSlider}
            />
            <div className={styles.sliderLabels}>
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.settingHeader}>
              <label className={styles.settingLabel}>Max Tokens</label>
              <Input
                value="500"
                className={styles.settingInput}
                size="small"
                style={{ width: 80 }}
              />
            </div>
            <div className={styles.sliderContainer}>
              <Slider
                min={10}
                max={24000}
                value={500}
                className={styles.tokensSlider}
              />
              <div className={styles.sliderLabels}>
                <span>10</span>
                <span>24000</span>
              </div>
            </div>
          </div>

          {/* Chunk limit */}
          <div className={styles.settingGroup}>
            <div className={styles.settingHeader}>
              <label className={styles.settingLabel}>Chunk limit</label>
              <Input value="3" className={styles.settingInput} size="small" />
            </div>
            <div className={styles.sliderContainer}>
              <Slider
                min={1}
                max={10}
                value={3}
                className={styles.chunkSlider}
              />
              <div className={styles.sliderLabels}>
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* System */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>System</label>
            <Input.TextArea
              value="You are an FAQ AI chat agent. Information will be provided to help answer the user's questions. Always summarize your response to be as brief as possible and be extremely concise. Your responses should be fewer than a couple of sentences."
              rows={6}
              className={styles.systemTextarea}
            />
          </div>
        </div>
      </Modal>

      {/* URL Import Modal */}
      <UrlImportModal
        open={isUrlImportModalOpen}
        onCancel={() => dispatch(setUrlImportModalOpen(false))}
      />

      {/* Text Import Modal */}
      <TextImportModal
        open={isTextImportModalOpen}
        onCancel={() => setIsTextImportModalOpen(false)}
      />

      {/* File Upload Modal */}
      <Modal
        title="Upload Files"
        open={isFileUploadModalOpen}
        onCancel={() => !isUploading && dispatch(setFileUploadModalOpen(false))}
        footer={[
          <Button
            key="cancel"
            onClick={() => dispatch(setFileUploadModalOpen(false))}
            disabled={isUploading}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            onClick={handleUpload}
            loading={isUploading}
            disabled={files.length === 0 || !folderName.trim() || isUploading}
          >
            {isUploading ? `Uploading... ${uploadProgress}%` : "Upload"}
          </Button>,
        ]}
      >
        <div
          style={{ padding: "20px 0", textAlign: "center" }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div
            style={{
              border: `2px dashed ${dragActive ? "#1890ff" : "#d9d9d9"}`,
              borderRadius: "8px",
              padding: "40px 20px",
              marginBottom: "20px",
              cursor: "pointer",
              transition: "border-color 0.3s",
              backgroundColor: dragActive ? "#f0f9ff" : "transparent",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>
              {dragActive ? "⬆️" : "📁"}
            </div>
            <div
              style={{ fontSize: "16px", marginBottom: "8px", fontWeight: 500 }}
            >
              {dragActive ? "Drop files here" : "Drag and drop files here"}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#8c8c8c",
                marginBottom: "16px",
              }}
            >
              or
            </div>
            <Button
              type="primary"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
            >
              Browse Files
            </Button>
            <div
              style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "16px" }}
            >
              Supported formats: PDF, TXT, DOCX (Max 10MB each)
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: "none" }}
              disabled={isUploading}
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontWeight: 500 }}>
                Files to upload ({files.length}):
              </span>
              {files.length > 0 && (
                <Button
                  type="link"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                  style={{ padding: 0, height: "auto" }}
                >
                  Clear all
                </Button>
              )}
            </div>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: "4px",
                padding: "12px",
                minHeight: "100px",
                backgroundColor: "#fafafa",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {files.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px",
                        backgroundColor: "#fff",
                        borderRadius: "4px",
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <FileTextOutlined style={{ color: "#1890ff" }} />
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {file.name}
                        </span>
                        <span style={{ color: "#8c8c8c", fontSize: "12px" }}>
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<CloseOutlined />}
                        size="small"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                        style={{ flexShrink: 0 }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    color: "#8c8c8c",
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No files selected
                </div>
              )}
            </div>

            <div style={{ marginTop: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ marginBottom: "8px", fontWeight: 500 }}>
                  Chunking Strategy
                </div>
                <Select
                  value={chunkingStrategy}
                  onChange={setChunkingStrategy}
                  style={{ width: "100%" }}
                  disabled={isUploading}
                >
                  {chunkingOptions.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <div style={{ marginBottom: "8px", fontWeight: 500 }}>
                  Folder
                </div>
                <Input
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  disabled={isUploading}
                  prefix={<FolderOutlined />}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {isUploading && (
              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress
                  percent={uploadProgress}
                  status="active"
                  showInfo={false}
                  strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <SitemapImportModal />
    </div>
  );
};

export default KnowledgeBase;
