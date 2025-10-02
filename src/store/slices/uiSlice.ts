import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
  toast: {
    message: string;
    type: "success" | "error" | "info" | "warning";
    visible: boolean;
  } | null;
}

const initialState: UiState = {
  theme: "system",
  sidebarOpen: true,
  loading: false,
  error: null,
  toast: null,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    showToast: (
      state,
      action: PayloadAction<{
        message: string;
        type: "success" | "error" | "info" | "warning";
      }>
    ) => {
      state.toast = {
        ...action.payload,
        visible: true,
      };
    },
    hideToast: (state) => {
      state.toast = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setTheme,
  setSidebarOpen,
  setLoading,
  setError,
  showToast,
  hideToast,
  clearError,
} = uiSlice.actions;

export default uiSlice.reducer;
