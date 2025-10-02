import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConditionRule {
  id: string;
  variable: string;
  operator: string;
  value: string;
}

export interface ConditionBuilderState {
  rules: ConditionRule[];
  matchType: 'all' | 'any';
  isOpen: boolean;
}

const initialState: ConditionBuilderState = {
  rules: [
    { id: 'rule-1', variable: '', operator: 'is', value: '' }
  ],
  matchType: 'all',
  isOpen: false,
};

const conditionBuilderSlice = createSlice({
  name: 'conditionBuilder',
  initialState,
  reducers: {
    setMatchType: (state, action: PayloadAction<'all' | 'any'>) => {
      state.matchType = action.payload;
    },
    addRule: (state) => {
      const newRule: ConditionRule = {
        id: `rule-${Date.now()}`,
        variable: '',
        operator: 'is',
        value: ''
      };
      state.rules.push(newRule);
    },
    removeRule: (state, action: PayloadAction<string>) => {
      state.rules = state.rules.filter(rule => rule.id !== action.payload);
      // Ensure at least one rule exists
      if (state.rules.length === 0) {
        state.rules.push({ id: 'rule-1', variable: '', operator: 'is', value: '' });
      }
    },
    updateRule: (state, action: PayloadAction<{ id: string; field: keyof Omit<ConditionRule, 'id'>; value: string }>) => {
      const { id, field, value } = action.payload;
      const rule = state.rules.find(r => r.id === id);
      if (rule) {
        rule[field] = value;
      }
    },
    setRules: (state, action: PayloadAction<ConditionRule[]>) => {
      state.rules = action.payload;
    },
    resetConditionBuilder: (state) => {
      state.rules = [{ id: 'rule-1', variable: '', operator: 'is', value: '' }];
      state.matchType = 'all';
    },
    setIsOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const {
  setMatchType,
  addRule,
  removeRule,
  updateRule,
  setRules,
  resetConditionBuilder,
  setIsOpen,
} = conditionBuilderSlice.actions;

export default conditionBuilderSlice.reducer;
