import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DELIVERY_FEE, FREE_DELIVERY_OVER, getItem, itemPrice } from "@/lib/menu";

export type Size = "normal" | "large";

export type CartLine = {
  key: string;
  itemId: string;
  size: Size;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  add: (itemId: string, size?: Size) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export function lineKey(itemId: string, size: Size) {
  return `${itemId}:${size}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (itemId, size = "normal") => {
        const key = lineKey(itemId, size);
        const existing = get().lines.find((line) => line.key === key);
        if (existing) {
          set({
            lines: get().lines.map((line) =>
              line.key === key ? { ...line, qty: line.qty + 1 } : line,
            ),
          });
          return;
        }
        set({ lines: [...get().lines, { key, itemId, size, qty: 1 }] });
      },
      setQty: (key, qty) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((line) => line.key !== key) });
          return;
        }
        set({
          lines: get().lines.map((line) => (line.key === key ? { ...line, qty } : line)),
        });
      },
      remove: (key) => set({ lines: get().lines.filter((line) => line.key !== key) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "forno-cart" },
  ),
);

export function lineUnitPrice(line: CartLine) {
  const item = getItem(line.itemId);
  if (!item) return 0;
  return itemPrice(item, line.size);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0);
}

export function deliveryFee(subtotal: number, fulfillment: "delivery" | "pickup") {
  if (fulfillment === "pickup") return 0;
  if (subtotal >= FREE_DELIVERY_OVER) return 0;
  return DELIVERY_FEE;
}
