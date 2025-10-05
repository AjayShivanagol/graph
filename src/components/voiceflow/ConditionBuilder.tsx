import React from 'react';
import { Select, Button } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  setMatchType,
  addRule,
  removeRule,
  updateRule,
  resetConditionBuilder,
  setRules,
  ConditionRule
} from '../../store/slices/conditionBuilderSlice';
import VariablePicker from '../common/VariablePicker';
import ValueInput from '../common/ValueInput';
import styles from './ConditionBuilder.module.scss';
import { CONDITION_OPERATORS } from './conditionOperators';

const { Option } = Select;

interface ConditionBuilderProps {
  initialRules?: ConditionRule[];
  matchType?: 'all' | 'any';
  onRulesChange?: (rules: ConditionRule[], matchType: 'all' | 'any') => void;
  onClose?: () => void;
  onSave?: (rules: ConditionRule[], matchType: 'all' | 'any') => void;
  onCancel?: () => void;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  initialRules,
  matchType: initialMatchType,
  onClose,
  onSave,
  onCancel 
}) => {
  const dispatch = useDispatch();
  const { rules, matchType } = useSelector((state: RootState) => state.conditionBuilder);

  // Initialize with provided rules and matchType when component mounts or props change
  React.useEffect(() => {
    if (initialRules && initialRules.length > 0) {
      // Load existing rules for editing
      dispatch(setRules(initialRules));
      dispatch(setMatchType(initialMatchType || 'all'));
    } else {
      // If initialRules is undefined or empty, reset the builder for new condition
      dispatch(resetConditionBuilder());
      dispatch(setMatchType(initialMatchType || 'all'));
    }
  }, [initialRules, initialMatchType, dispatch]);

  // Additional effect to ensure proper reset when no initial data
  React.useEffect(() => {
    if (!initialRules || initialRules.length === 0) {
      dispatch(resetConditionBuilder());
      dispatch(setMatchType(initialMatchType || 'all'));
    }
  }, [initialRules, initialMatchType, dispatch]);

  const handleAddRule = () => {
    dispatch(addRule());
  };

  const handleRemoveRule = (ruleId: string) => {
    dispatch(removeRule(ruleId));
  };

  const handleUpdateRule = (ruleId: string, field: string, value: string) => {
    dispatch(updateRule({ id: ruleId, field: field as keyof Omit<ConditionRule, 'id'>, value }));
  };

  const handleMatchTypeChange = (type: 'all' | 'any') => {
    dispatch(setMatchType(type));
  };

  const handleSave = () => {
    onSave?.(rules, matchType);
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <div className={`${styles.conditionBuilder} condition-builder`}>
      <div className={styles.header}>
        <div className={styles.matchTypeSelector}>
          <Button
            type={matchType === 'all' ? 'primary' : 'default'}
            size="small"
            onClick={() => handleMatchTypeChange('all')}
            className={styles.matchButton}
          >
            Match all
          </Button>
          <Button
            type={matchType === 'any' ? 'primary' : 'default'}
            size="small"
            onClick={() => handleMatchTypeChange('any')}
            className={styles.matchButton}
          >
            Match any
          </Button>
          <div 
            className={styles.questionMark}
            onClick={() => window.open('https://docs.voiceflow.com/docs/logic', '_blank')}
          >
            ?
          </div>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            className={styles.addRuleButton}
            onClick={handleAddRule}
          >
            Add condition
          </Button>
        </div>
      </div>

      <div className={styles.rulesList}>
        <div className={styles.rulesHeader}>
          <span>Condition</span>
          <span>Operator</span>
          <span>Value</span>
          <span></span>
        </div>
        {rules.map((rule: ConditionRule, index: number) => (
          <div key={rule.id} className={styles.ruleItem}>
            <div className={styles.conditionCell}>
              <span className={styles.ifLabel}>
                {index === 0 ? 'if' : 'and'}
              </span>
              <VariablePicker
                value={rule.variable}
                onChange={(value) => handleUpdateRule(rule.id, 'variable', value)}
                placeholder="Select or create variable"
                size="small"
                allowCreate={true}
                createMode="modal"
              />
            </div>
            <div className={styles.operatorCell}>
              <Select
                value={rule.operator}
                onChange={(value) => handleUpdateRule(rule.id, 'operator', value)}
                className={styles.operatorSelect}
                size="small"
                placeholder="is"
                getPopupContainer={() => {
                  // Force creation at highest level
                  const body = document.body;
                  let container = document.getElementById('super-high-dropdown');
                  if (!container) {
                    container = document.createElement('div');
                    container.id = 'super-high-dropdown';
                    container.style.position = 'absolute';
                    container.style.top = '0';
                    container.style.left = '0';
                    container.style.zIndex = '2147483647'; // Maximum z-index value
                    container.style.pointerEvents = 'none';
                    body.appendChild(container);
                  }
                  return container;
                }}
                popupMatchSelectWidth={false}
                placement="bottomLeft"
                styles={{
                  popup: {
                    root: {
                      zIndex: 2147483647,
                      maxHeight: '200px',
                      overflow: 'auto',
                      pointerEvents: 'auto'
                    }
                  }
                }}
              >
                {CONDITION_OPERATORS.map(op => (
                  <Option key={op.value} value={op.value}>{op.label}</Option>
                ))}
              </Select>
            </div>
            <div className={styles.valueCell}>
              <ValueInput
                value={rule.value}
                onChange={(value: string) => handleUpdateRule(rule.id, 'value', value)}
                placeholder="value or {var}"
                size="small"
              />
            </div>
            <div className={styles.actionCell}>
              {rules.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleRemoveRule(rule.id)}
                  className={styles.removeButton}
                  danger
                />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className={styles.actions}>
        <Button
          size="small"
          onClick={handleCancel}
        >
          Close
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={handleSave}
        >
          Save condition
        </Button>
      </div>
    </div>
  );
};

export default ConditionBuilder;
