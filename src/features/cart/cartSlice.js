import { createSlice } from "@reduxjs/toolkit";

function readInitial() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const slice = createSlice({
  name: "cart",
  initialState: { items: readInitial() },
  reducers: {
    addItem: (state, { payload }) => {
      const exists = state.items.find((c) => c.id === payload.id);
      if (exists) {
        exists.qty += payload.qty || 1;
      } else {
        state.items.push({ ...payload, qty: Math.max(1, payload.qty || 1) });
      }
    },
    removeItem: (state, { payload: id }) => {
      state.items = state.items.filter((c) => c.id !== id);
    },
    updateQty: (state, { payload }) => {
      const { id, qty } = payload;
      const it = state.items.find((c) => c.id === id);
      if (it) it.qty = Math.max(1, Number(qty || 1));
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCart: (state, { payload }) => {
      state.items = Array.isArray(payload) ? payload : [];
    },
  },
});

export const { addItem, removeItem, updateQty, clearCart, setCart } =
  slice.actions;
export default slice.reducer;
export const selectCartItems = (s) => s.cart.items;
export const selectCartCount = (s) =>
  s.cart.items.reduce((sum, it) => sum + it.qty, 0);
export const selectCartSubtotal = (s) =>
  s.cart.items.reduce((sum, it) => sum + it.price * it.qty, 0);
