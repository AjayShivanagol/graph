import React, { useState } from "react";
import { Button, Space, Typography } from "antd";
import PromptPicker from "../common/PromptPicker";
import { useAppSelector } from "../../store/hooks";

const { Title, Text } = Typography;

export default function PromptPickerTest() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const prompts = useAppSelector((state) => state.prompts.prompts);

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <Title level={3}>Prompt Picker Test</Title>

      <div style={{ marginBottom: "20px" }}>
        <Text strong>Available Prompts: {prompts.length}</Text>
        <br />
        <Text type="secondary">
          This test component verifies that the prompt picker works correctly.
        </Text>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <Text strong style={{ display: "block", marginBottom: "8px" }}>
          Select a Prompt:
        </Text>
        <PromptPicker
          value={selectedPrompt}
          onChange={(value) => setSelectedPrompt(value)}
          placeholder="Select or create prompt"
          allowCreate={true}
          size="middle"
          style={{ width: "300px" }}
        />
      </div>

      {selectedPrompt && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#f5f5f5",
            borderRadius: "6px",
          }}
        >
          <Text strong>Selected Prompt: </Text>
          <Text code>{selectedPrompt}</Text>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <Text strong style={{ display: "block", marginBottom: "8px" }}>
          Available Prompts:
        </Text>
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            style={{
              marginBottom: "8px",
              padding: "8px",
              border: "1px solid #e8e8e8",
              borderRadius: "4px",
            }}
          >
            <Text strong>{prompt.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {prompt.description}
            </Text>
            <br />
            <Text style={{ fontSize: "12px", fontFamily: "monospace" }}>
              Content: {prompt.content.substring(0, 50)}...
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
