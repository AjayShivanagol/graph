import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IntentDetail {
  name: string;
  description?: string;
  utterances?: string[];
  color?: string;
  requiredEntities?: string[];
}

export interface IntentsState {
  list: string[];
  details: Record<string, IntentDetail>;
}

const initialState: IntentsState = {
  list: ["Default Intent", "Fallback Intent", "Escalate"],
  details: {},
};

export const intentsSlice = createSlice({
  name: "intents",
  initialState,
  reducers: {
    setIntents(state, action: PayloadAction<string[]>) {
      const unique = Array.from(new Set(action.payload.map((item) => item.trim()))).filter(Boolean);
      unique.sort((a, b) => a.localeCompare(b));
      state.list = unique;
    },
    addIntent(state, action: PayloadAction<string>) {
      const name = action.payload.trim();
      if (!name) return;
      if (!state.list.includes(name)) {
        state.list.push(name);
        state.list.sort((a, b) => a.localeCompare(b));
      }
    },
    addIntentDetailed(state, action: PayloadAction<IntentDetail>) {
      const payload = action.payload;
      const name = (payload.name || "").trim();
      if (!name) return;
      if (!state.list.includes(name)) {
        state.list.push(name);
        state.list.sort((a, b) => a.localeCompare(b));
      }
      state.details[name] = {
        ...payload,
        name,
        description: payload.description?.trim() || undefined,
        utterances: Array.isArray(payload.utterances)
          ? payload.utterances.filter((item) => !!item && item.trim().length > 0)
          : undefined,
        requiredEntities: Array.isArray(payload.requiredEntities)
          ? payload.requiredEntities
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0)
          : undefined,
      };
    },
    removeIntent(state, action: PayloadAction<string>) {
      const target = action.payload;
      state.list = state.list.filter((intent) => intent !== target);
      delete state.details[target];
    },
  },
});

export const { setIntents, addIntent, addIntentDetailed, removeIntent } = intentsSlice.actions;
export default intentsSlice.reducer;
