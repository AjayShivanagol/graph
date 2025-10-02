import React from 'react';
import { Select, Checkbox, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { LLM_CHUNKING_STRATEGIES } from '../../lib/knowledge-base/constants';
import styles from './UrlImportModal.module.scss';

const { Text } = Typography;
const { Option } = Select;

interface ChunkingStrategySelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ChunkingStrategySelect: React.FC<ChunkingStrategySelectProps> = ({
  value = [],
  onChange,
  className,
  style,
}) => {
  const handleChange = (selectedValues: string[]) => {
    if (onChange) {
      onChange(selectedValues);
    }
  };

  const dropdownRender = (menu: React.ReactNode) => (
    <div className={styles.strategyDropdown}>
      <div style={{ padding: '8px' }}>
        {LLM_CHUNKING_STRATEGIES.map((strategy) => (
          <div 
            key={strategy.value} 
            className={styles.strategyItem}
            onClick={(e) => {
              e.stopPropagation();
              const newValue = value.includes(strategy.value)
                ? value.filter((v) => v !== strategy.value)
                : [...value, strategy.value];
              handleChange(newValue);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '4px',
              cursor: 'pointer',
              backgroundColor: value.includes(strategy.value) ? '#eef2ff' : 'transparent',
              transition: 'background-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Checkbox 
                checked={value.includes(strategy.value)}
                style={{ marginRight: '8px', marginTop: '2px' }}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = e.target.checked
                    ? [...value, strategy.value]
                    : value.filter((v) => v !== strategy.value);
                  handleChange(newValue);
                }}
              />
              <div>
                <div className={styles.strategyItemTitle} style={{ display: 'flex', alignItems: 'center' }}>
                  {strategy.label}
                </div>
                <div className={styles.strategyItemDescription}>
                  {strategy.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const selectedLabels = value.map(
    (val) => LLM_CHUNKING_STRATEGIES.find((s) => s.value === val)?.label || val
  );

  return (
    <Select
      mode="multiple"
      value={value}
      onChange={handleChange}
      className={`${styles.select} ${className}`}
      style={style}
      placeholder="Select chunking strategies"
      dropdownRender={dropdownRender}
      optionLabelProp="label"
      maxTagCount="responsive"
      popupClassName={styles.strategyDropdown}
      dropdownStyle={{
        padding: '8px',
        borderRadius: '8px',
      }}
    >
      {LLM_CHUNKING_STRATEGIES.map((strategy) => (
        <Select.Option 
          key={strategy.value} 
          value={strategy.value} 
          label={strategy.label}
          className={styles.strategyItem}
        >
          <div className={styles.strategyItemTitle}>
            {strategy.label}
            <InfoCircleOutlined 
              style={{ 
                marginLeft: '8px', 
                color: '#9ca3af',
                fontSize: '14px'
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          </div>
          <div className={styles.strategyItemDescription}>
            {strategy.description}
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default ChunkingStrategySelect;
