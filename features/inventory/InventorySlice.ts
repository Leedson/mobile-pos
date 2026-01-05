// src/features/inventory/inventorySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchInventoryApi
} from "../inventory/InventoryAPI";

/* -------------------- ASYNC ACTIONS -------------------- */

export const fetchInventory = createAsyncThunk(
  "inventory/fetchInventory",
  async () => {
    return await fetchInventoryApi();
  }
);

/* -------------------- SLICE -------------------- */

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    empName: '',
  },
  reducers: {
    // for local-only updates if needed
    resetInventory: (state: any) => {
      state.items = [];
    },
    setEmpName: (state: any, action: any) => {
      state.empName = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      /* FETCH */
      .addCase(fetchInventory.pending, (state: any) => {
        state.status = "loading";
      })
      .addCase(fetchInventory.fulfilled, (state: any, action) => {
        state.status = "success";
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state: any, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { resetInventory, setEmpName } = inventorySlice.actions;
export default inventorySlice.reducer;
