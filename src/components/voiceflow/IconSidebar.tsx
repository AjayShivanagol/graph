import React, { useState } from "react";
import { Button, Tooltip, Modal, Form, Input, Select } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  NodeIndexOutlined,
  FileTextOutlined,
  RocketOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface IconSidebarProps {
  onViewChange?: (view: string) => void;
  selectedView: string;
}

const IconSidebar: React.FC<IconSidebarProps> = ({ onViewChange, selectedView }) => {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishForm] = Form.useForm();

  const iconButtons = [
    { icon: <NodeIndexOutlined />, tooltip: "Workflow", key: "workflow" },
    { icon: <FileTextOutlined />, tooltip: "Knowledge Base", key: "knowledge" },
    { icon: <RocketOutlined />, tooltip: "Publish", key: "publish" },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const values = await publishForm.validateFields();
      console.log('Publishing with values:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      Modal.success({
        title: 'Published Successfully',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        content: 'Your workflow has been published successfully!',
      });
      
      setIsPublishModalOpen(false);
      publishForm.resetFields();
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleIconClick = (key: string) => {
    if (key === 'publish') {
      setIsPublishModalOpen(true);
      return;
    }

    // Handle view changes
    const path = key === 'workflow' ? '/workflow' : '/knowledge-base';
    navigate(path);
    
    // Call the onViewChange prop if provided (for backward compatibility)
    if (onViewChange) {
      onViewChange(key);
    }
    
    console.log(`Selected ${key} view`);
  };

  return (
    <>
      <Modal
        title="Publish Workflow"
        open={isPublishModalOpen}
        onCancel={() => setIsPublishModalOpen(false)}
        onOk={handlePublish}
        confirmLoading={isPublishing}
        okText="Publish Now"
        okButtonProps={{
          icon: <RocketOutlined />,
          type: 'primary',
        }}
      >
        <Form
          form={publishForm}
          layout="vertical"
          initialValues={{
            environment: 'staging',
            version: '1.0.0',
          }}
        >
          <Form.Item
            name="version"
            label="Version"
            rules={[{ required: true, message: 'Please input the version!' }]}
          >
            <Input placeholder="e.g., 1.0.0" />
          </Form.Item>
          <Form.Item
            name="environment"
            label="Environment"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="staging">Staging</Option>
              <Option value="production">Production</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="Release Notes"
          >
            <Input.TextArea rows={3} placeholder="What's new in this version?" />
          </Form.Item>
        </Form>
      </Modal>
      
      <div
        style={{
          width: "48px",
          height: "100vh",
          backgroundColor: "#2c3e50",
          display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "16px",
        paddingBottom: "16px",
        borderRight: "1px solid #34495e",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      {iconButtons.map((item, index) => {
        const isSelected = selectedView === item.key;
        return (
          <Tooltip
            key={item.key}
            title={item.tooltip}
            placement="right"
            mouseEnterDelay={0.5}
            mouseLeaveDelay={0.1}
            autoAdjustOverflow={false}
          >
            <Button
              type="text"
              icon={item.icon}
              onClick={() => handleIconClick(item.key)}
              style={{
                width: "32px",
                height: "32px",
                color: isSelected ? "#ffffff" : "#bdc3c7",
                backgroundColor: isSelected ? "#1677ff" : "transparent",
                border: "none",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "#34495e";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#bdc3c7";
                }
              }}
            />
          </Tooltip>
        );
      })}
      </div>
    </>
  );
};

export default IconSidebar;
