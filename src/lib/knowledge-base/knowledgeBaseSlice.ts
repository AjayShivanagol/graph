import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RefreshRate, ChunkingStrategy, FolderType, DataSourceType } from './constants';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  url?: string;
  urls?: string[];
  content?: string;
  refreshRate: RefreshRate;
  chunkingStrategies: ChunkingStrategy[];
  folder: FolderType;
  createdAt: string;
  updatedAt: string;
  status: 'processing' | 'ready' | 'error';
  documentCount?: number;
}

export interface KnowledgeBaseState {
  dataSources: DataSource[];
  selectedDataSource: string | null;
  isPreviewModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isAddDataSourceModalOpen: boolean;
  isUrlImportModalOpen: boolean;
  isSitemapModalOpen: boolean;
  isFileUploadModalOpen: boolean;
  isTextImportModalOpen: boolean;
  searchQuery: string;
  previewQuestion: string;
  previewResponse: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: KnowledgeBaseState = {
  dataSources: [],
  selectedDataSource: null,
  isPreviewModalOpen: false,
  isSettingsModalOpen: false,
  isAddDataSourceModalOpen: false,
  isUrlImportModalOpen: false,
  isSitemapModalOpen: false,
  isFileUploadModalOpen: false,
  isTextImportModalOpen: false,
  searchQuery: '',
  previewQuestion: '',
  previewResponse: '',
  isLoading: false,
  error: null,
};

const knowledgeBaseSlice = createSlice({
  name: 'knowledgeBase',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setPreviewModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isPreviewModalOpen = action.payload;
    },
    setSettingsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isSettingsModalOpen = action.payload;
    },
    setAddDataSourceModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddDataSourceModalOpen = action.payload;
    },
    setUrlImportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isUrlImportModalOpen = action.payload;
    },
    setSitemapModalOpen(state, action: PayloadAction<boolean>) {
      state.isSitemapModalOpen = action.payload;
    },
    setFileUploadModalOpen(state, action: PayloadAction<boolean>) {
      state.isFileUploadModalOpen = action.payload;
    },
    setTextImportModalOpen(state, action: PayloadAction<boolean>) {
      state.isTextImportModalOpen = action.payload;
    },
    setPreviewQuestion: (state, action: PayloadAction<string>) => {
      state.previewQuestion = action.payload;
    },
    setPreviewResponse: (state, action: PayloadAction<string>) => {
      state.previewResponse = action.payload;
    },
    setSelectedDataSource: (state, action: PayloadAction<string | null>) => {
      state.selectedDataSource = action.payload;
    },
    addDataSource: (state, action: PayloadAction<Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newDataSource: DataSource = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.dataSources.push(newDataSource);
    },
    updateDataSource: (state, action: PayloadAction<{ id: string; updates: Partial<DataSource> }>) => {
      const { id, updates } = action.payload;
      const index = state.dataSources.findIndex(ds => ds.id === id);
      if (index !== -1) {
        state.dataSources[index] = {
          ...state.dataSources[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeDataSource: (state, action: PayloadAction<string>) => {
      state.dataSources = state.dataSources.filter(ds => ds.id !== action.payload);
      if (state.selectedDataSource === action.payload) {
        state.selectedDataSource = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSearchQuery,
  setPreviewModalOpen,
  setSettingsModalOpen,
  setAddDataSourceModalOpen,
  setUrlImportModalOpen,
  setSitemapModalOpen,
  setFileUploadModalOpen,
  setTextImportModalOpen,
  setPreviewQuestion,
  setPreviewResponse,
  setSelectedDataSource,
  addDataSource,
  updateDataSource,
  removeDataSource,
  setLoading,
  setError,
  clearError,
} = knowledgeBaseSlice.actions;

export default knowledgeBaseSlice.reducer;
