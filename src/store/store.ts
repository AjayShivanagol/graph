import { configureStore } from "@reduxjs/toolkit";
import workflowReducer from "./slices/workflowSlice";
import uiReducer from "./slices/uiSlice";
import userInteractionReducer from "./slices/userInteractionSlice";
import variablesReducer from "./slices/variablesSlice";
import conditionBuilderReducer from "./slices/conditionBuilderSlice";
import promptsReducer from "./slices/promptsSlice";
import knowledgeBaseReducer from "../lib/knowledge-base/knowledgeBaseSlice";
import intentsReducer from "./slices/intentsSlice";
import entitiesReducer from "./slices/entitiesSlice";

export const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    ui: uiReducer,
    userInteraction: userInteractionReducer,
    variables: variablesReducer,
    intents: intentsReducer,
    conditionBuilder: conditionBuilderReducer,
    prompts: promptsReducer,
    knowledgeBase: knowledgeBaseReducer,
    entities: entitiesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
