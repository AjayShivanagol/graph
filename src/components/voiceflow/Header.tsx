import React from "react";
import { Button, Input, Avatar, Space, Divider } from "antd";
import {
  SaveOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { store } from "../../store/store";
import { setWorkflowName, markAsSaved } from "../../store/slices/workflowSlice";
import { showToast } from "../../store/slices/uiSlice";
import styles from "./Header.module.scss";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const dispatch = useAppDispatch();
  const { workflowName, isDirty } = useAppSelector((state) => state.workflow);

  const handleSave = () => {
    // Get the current Redux state
    const state = store.getState();
    console.log("Redux State:", {
      workflow: state.workflow,
      nodes: state.workflow.nodes,
      edges: state.workflow.edges,
      ui: state.ui,
    });

    dispatch(markAsSaved());
    dispatch(
      showToast({
        message: "Workflow published successfully! Check console for state.",
        type: "success",
      })
    );
  };

  const handleTest = () => {
    dispatch(showToast({ message: "Testing workflow...", type: "info" }));
  };

  const handleShare = () => {
    dispatch(
      showToast({ message: "Share link copied to clipboard", type: "success" })
    );
  };

  return (
    <header className={`vf-header ${styles.header}`}>
      <div className={styles.leftSection}>
        <div className={styles.logoSection}>
          {/* Logo */}
          {/* <div className={styles.logo}>
            <ThunderboltOutlined />
          </div> */}
          <span className={styles.title}>Flow Editor</span>
        </div>

        {/* Workflow Name with Save Status */}
        <div className={styles.workflowSection}>
          <Input
            value={workflowName}
            onChange={(e) => dispatch(setWorkflowName(e.target.value))}
            placeholder="Untitled Workflow"
            variant="borderless"
            className={styles.workflowInput}
          />
          {isDirty && (
            <div className={styles.saveIndicator} title="Unsaved changes" />
          )}
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Action Buttons matching Voiceflow */}
        <Button
          icon={<ShareAltOutlined />}
          onClick={handleShare}
          className={`${styles.actionButton} ${styles.shareButton}`}
        >
          Share
        </Button>

        <Button
          icon={<PlayCircleOutlined />}
          onClick={handleTest}
          className={`${styles.actionButton} ${styles.callButton}`}
        >
          Call
        </Button>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleTest}
          className={`${styles.actionButton} ${styles.runButton}`}
        >
          Run
        </Button>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          className={`${styles.actionButton} ${styles.publishButton}`}
        >
          Publish
        </Button>
      </div>
    </header>
  );
}
