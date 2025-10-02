import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface VariableDetail {
  name: string;
  description?: string;
  color?: string;
  defaultValue?: string;
}

export interface VariablesState {
  // Backwards-compatible list of names for existing pickers
  list: string[];
  // Optional details keyed by variable name
  details: Record<string, VariableDetail>;
}

const initialState: VariablesState = {
  list: ["user_name", "email", "age", "status", "score"], // Add some sample variables for testing
  details: {},
};

export const variablesSlice = createSlice({
  name: "variables",
  initialState,
  reducers: {
    setVariables(state, action: PayloadAction<string[]>) {
      state.list = Array.from(new Set(action.payload)).sort();
    },
    addVariable(state, action: PayloadAction<string>) {
      const name = action.payload.trim();
      if (!name) return;
      if (!state.list.includes(name)) state.list.push(name);
      state.list.sort();
    },
    addVariableDetailed(state, action: PayloadAction<VariableDetail>) {
      const payload = action.payload;
      const name = (payload.name || "").trim();
      if (!name) return;
      if (!state.list.includes(name)) state.list.push(name);
      state.list.sort();
      state.details[name] = { ...payload, name };
    },
    removeVariable(state, action: PayloadAction<string>) {
      state.list = state.list.filter((v) => v !== action.payload);
      delete state.details[action.payload];
    },
  },
});

export const {
  setVariables,
  addVariable,
  addVariableDetailed,
  removeVariable,
} = variablesSlice.actions;
export default variablesSlice.reducer;
