import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Generate a unique ID with better collision resistance
const generateUniqueId = () => {
  return `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  type: "text" | "user_input" | "system";
  settings?: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PromptsState {
  prompts: Prompt[];
  selectedPrompt: string | null;
}

const initialState: PromptsState = {
  prompts: [
    {
      id: "untitled-prompt-001",
      name: "Untitled prompt",
      content: "{{ to add variables }}",
      description: "A basic prompt template",
      type: "text",
      settings: {
        model: "claude-4-sonnet",
        temperature: 0.3,
        maxTokens: 5000,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "generate-answer-001",
      name: "Generate answer",
      content:
        "Please provide a comprehensive answer to the following question: {{question}}",
      description: "Generate detailed answers to user questions",
      type: "text",
      settings: {
        model: "claude-4-sonnet",
        temperature: 0.7,
        maxTokens: 1000,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "optimize-query-001",
      name: "Optimize query",
      content:
        "Improve and optimize the following query for better results: {{query}}",
      description: "Optimize user queries for better search results",
      type: "text",
      settings: {
        model: "gpt-4o",
        temperature: 0.5,
        maxTokens: 500,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  selectedPrompt: null,
};

export const promptsSlice = createSlice({
  name: "prompts",
  initialState,
  reducers: {
    addPrompt: (
      state,
      action: PayloadAction<Omit<Prompt, "id" | "createdAt" | "updatedAt">>
    ) => {
      // Check if a prompt with the same name already exists, and if so, modify the name
      let promptName = action.payload.name;
      let counter = 1;
      while (state.prompts.some((p) => p.name === promptName)) {
        promptName = `${action.payload.name} (${counter})`;
        counter++;
      }

      const newPrompt: Prompt = {
        ...action.payload,
        name: promptName,
        id: generateUniqueId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.prompts.push(newPrompt);
    },
    updatePrompt: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Prompt> }>
    ) => {
      const { id, updates } = action.payload;
      const index = state.prompts.findIndex((p) => p.id === id);
      if (index !== -1) {
        state.prompts[index] = {
          ...state.prompts[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removePrompt: (state, action: PayloadAction<string>) => {
      state.prompts = state.prompts.filter((p) => p.id !== action.payload);
      if (state.selectedPrompt === action.payload) {
        state.selectedPrompt = null;
      }
    },
    setSelectedPrompt: (state, action: PayloadAction<string | null>) => {
      state.selectedPrompt = action.payload;
    },
    duplicatePrompt: (state, action: PayloadAction<string>) => {
      const original = state.prompts.find((p) => p.id === action.payload);
      if (original) {
        // Generate unique name for the copy
        let copyName = `${original.name} (Copy)`;
        let counter = 1;
        while (state.prompts.some((p) => p.name === copyName)) {
          copyName = `${original.name} (Copy ${counter})`;
          counter++;
        }

        const duplicate: Prompt = {
          ...original,
          id: generateUniqueId(),
          name: copyName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.prompts.push(duplicate);
      }
    },
    removeDuplicates: (state) => {
      // Remove prompts with duplicate names or IDs, keeping the first occurrence
      const seenNames = new Set<string>();
      const seenIds = new Set<string>();
      state.prompts = state.prompts.filter((prompt) => {
        // Check for duplicate names
        if (seenNames.has(prompt.name)) {
          console.log(`Removing duplicate prompt by name: ${prompt.name}`);
          return false;
        }
        // Check for duplicate IDs
        if (seenIds.has(prompt.id)) {
          console.log(`Removing duplicate prompt by ID: ${prompt.id}`);
          return false;
        }
        seenNames.add(prompt.name);
        seenIds.add(prompt.id);
        return true;
      });
      console.log(
        `Cleaned up prompts. Remaining count: ${state.prompts.length}`
      );
    },
  },
});

export const {
  addPrompt,
  updatePrompt,
  removePrompt,
  setSelectedPrompt,
  duplicatePrompt,
  removeDuplicates,
} = promptsSlice.actions;

export default promptsSlice.reducer;
