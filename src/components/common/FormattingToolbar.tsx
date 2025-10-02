import React from "react";
import { Button, Space, Tooltip } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  LinkOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

export interface FormattingToolbarProps {
  onFormat: (format: string) => void;
  style?: React.CSSProperties;
  size?: "small" | "middle" | "large";
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onFormat,
  style,
  size = "small",
}) => {
  const defaultStyle: React.CSSProperties = {
    marginBottom: 8,
    borderBottom: "1px solid #d9d9d9",
    paddingBottom: 8,
    ...style,
  };

  return (
    <div style={defaultStyle}>
      <Space size="small">
        <Tooltip title="Bold">
          <Button
            size={size}
            icon={<BoldOutlined />}
            onClick={() => onFormat("bold")}
          />
        </Tooltip>
        <Tooltip title="Italic">
          <Button
            size={size}
            icon={<ItalicOutlined />}
            onClick={() => onFormat("italic")}
          />
        </Tooltip>
        <Tooltip title="Underline">
          <Button
            size={size}
            icon={<UnderlineOutlined />}
            onClick={() => onFormat("underline")}
          />
        </Tooltip>
        <Tooltip title="Strikethrough">
          <Button
            size={size}
            icon={<StrikethroughOutlined />}
            onClick={() => onFormat("strikethrough")}
          />
        </Tooltip>
        <Tooltip title="Link">
          <Button
            size={size}
            icon={<LinkOutlined />}
            onClick={() => onFormat("link")}
          />
        </Tooltip>
        <Tooltip title="Bullet List">
          <Button
            size={size}
            icon={<UnorderedListOutlined />}
            onClick={() => onFormat("unordered-list")}
          />
        </Tooltip>
        <Tooltip title="Numbered List">
          <Button
            size={size}
            icon={<OrderedListOutlined />}
            onClick={() => onFormat("ordered-list")}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export default FormattingToolbar;
