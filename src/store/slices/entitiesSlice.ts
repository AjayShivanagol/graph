import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface EntityDataType {
  label: string;
  value: string;
}

export interface EntityValue {
  value: string;
  synonyms?: string[];
}

export interface EntityDetail {
  name: string;
  dataType?: string;
  values?: EntityValue[];
  description?: string;
}

export interface EntitiesState {
  list: string[];
  details: Record<string, EntityDetail>;
  dataTypes: EntityDataType[];
}

const initialState: EntitiesState = {
  list: ["OrderNumber", "Email", "Location"],
  details: {},
  dataTypes: [
    { label: "Custom", value: "custom" },
    { label: "Number", value: "number" },
    { label: "Email", value: "email" },
    { label: "Name", value: "name" },
    { label: "Age", value: "age" },
    { label: "Url", value: "url" },
    { label: "Phone", value: "phone" },
    { label: "Date", value: "date" },
    { label: "Time", value: "time" },
    { label: "Location", value: "location" },
  ],
};

const ensureUniqueSorted = (items: string[]) => {
  const unique = Array.from(new Set(items.map((item) => item.trim()))).filter(
    Boolean
  );
  unique.sort((a, b) => a.localeCompare(b));
  return unique;
};

export const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    setEntities(state, action: PayloadAction<string[]>) {
      state.list = ensureUniqueSorted(action.payload);
    },
    addEntity(state, action: PayloadAction<string>) {
      const name = action.payload.trim();
      if (!name) return;
      if (!state.list.includes(name)) {
        state.list.push(name);
        state.list.sort((a, b) => a.localeCompare(b));
      }
    },
    addEntityDetailed(state, action: PayloadAction<EntityDetail>) {
      const payload = action.payload;
      const name = (payload.name || "").trim();
      if (!name) return;
      if (!state.list.includes(name)) {
        state.list.push(name);
        state.list.sort((a, b) => a.localeCompare(b));
      }

      let normalizedValues: EntityValue[] | undefined;
      if (Array.isArray(payload.values)) {
        const collected: EntityValue[] = [];
        payload.values.forEach((entry) => {
          const primary = entry.value?.trim();
          if (!primary) return;
          const synonyms = Array.isArray(entry.synonyms)
            ? entry.synonyms.map((synonym) => synonym.trim()).filter(Boolean)
            : undefined;
          const normalized: EntityValue = {
            value: primary,
            ...(synonyms && synonyms.length > 0 ? { synonyms } : {}),
          };
          collected.push(normalized);
        });
        normalizedValues = collected.length > 0 ? collected : undefined;
      }

      state.details[name] = {
        ...payload,
        name,
        dataType: payload.dataType || undefined,
        description: payload.description?.trim() || undefined,
        values: normalizedValues,
      };
    },
    removeEntity(state, action: PayloadAction<string>) {
      const target = action.payload;
      state.list = state.list.filter((entity) => entity !== target);
      delete state.details[target];
    },
    setDataTypes(state, action: PayloadAction<EntityDataType[]>) {
      state.dataTypes = action.payload;
    },
  },
});

export const {
  setEntities,
  addEntity,
  addEntityDetailed,
  removeEntity,
  setDataTypes,
} = entitiesSlice.actions;
export default entitiesSlice.reducer;
