
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import inventoryReducer from "../features/inventory/InventorySlice";

type Item = { id: string; name: string; price: number };

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as Item[] },
  reducers: {
    addItem(state, action: PayloadAction<Item>) {
      state.items.push(action.payload);
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;

export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    inventory: inventoryReducer
  },
});