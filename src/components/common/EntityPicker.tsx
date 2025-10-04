import React, { useMemo, useState } from "react";
import { Select, Input, Button, Divider, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addEntity } from "../../store/slices/entitiesSlice";

interface EntityPickerProps {
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  size?: "small" | "middle" | "large";
  disabled?: boolean;
  className?: string;
}

const EntityPicker: React.FC<EntityPickerProps> = ({
  value,
  onChange,
  placeholder = "Select entity",
  allowClear = true,
  size = "middle",
  disabled,
  className,
}) => {
  const dispatch = useAppDispatch();
  const entities = useAppSelector((state) => state.entities.list);
  const [open, setOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState("");

  const options = useMemo(
    () => entities.map((entity) => ({ label: entity, value: entity })),
    [entities]
  );

  const commitChange = (next?: string) => {
    if (onChange) {
      onChange(next);
    }
  };

  const handleCreateEntity = () => {
    const trimmed = newEntityName.trim();
    if (!trimmed) return;
    dispatch(addEntity(trimmed));
    commitChange(trimmed);
    setNewEntityName("");
    setOpen(false);
  };

  return (
    <Select
      showSearch
      size={size}
      value={value || undefined}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      options={options}
      onChange={(nextValue) => commitChange(nextValue)}
      onClear={() => commitChange(undefined)}
      open={open}
      onDropdownVisibleChange={setOpen}
      dropdownRender={(menu) => (
        <div>
          {menu}
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ display: "flex", gap: 8, padding: "0 8px 8px" }}>
            <Input
              size="small"
              placeholder="Create new entity"
              value={newEntityName}
              onChange={(event) => setNewEntityName(event.target.value)}
              onPressEnter={handleCreateEntity}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleCreateEntity}
            >
              Add
            </Button>
          </div>
          <Typography.Text
            type="secondary"
            style={{ display: "block", padding: "0 12px 8px", fontSize: 12 }}
          >
            Entities are managed in the Entity CMS. New entities will appear in
            the list above.
          </Typography.Text>
        </div>
      )}
      className={className}
      filterOption={(input, option) =>
        (option?.label as string)
          ?.toLowerCase()
          .includes((input || "").toLowerCase()) ?? false
      }
    />
  );
};

export default EntityPicker;
