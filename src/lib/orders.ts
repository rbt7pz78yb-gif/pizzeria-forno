import type { Size } from "@/lib/cart";

export type Fulfillment = "delivery" | "pickup";
export type PayMethod = "card" | "swish";
export type OrderStatus = "received" | "baking" | "ready" | "out" | "done";

export type OrderLine = {
  itemId: string;
  name: string;
  size: Size;
  qty: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  createdAt: string;
  lines: OrderLine[];
  fulfillment: Fulfillment;
  customer: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    postcode?: string;
    city?: string;
  };
  note?: string;
  payment: {
    method: PayMethod;
    last4?: string;
    brand?: string;
  };
  subtotal: number;
  delivery: number;
  total: number;
};

const KEY = "forno-orders";

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  const next = [order, ...loadOrders()].slice(0, 30);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getOrder(id: string) {
  return loadOrders().find((order) => order.id === id);
}

export function createOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `FOR-${n}`;
}

export function statusAt(order: Order, now = Date.now()): OrderStatus {
  const elapsed = now - new Date(order.createdAt).getTime();
  if (elapsed < 18_000) return "received";
  if (elapsed < 50_000) return "baking";
  if (order.fulfillment === "pickup") {
    if (elapsed < 85_000) return "ready";
    return "done";
  }
  if (elapsed < 90_000) return "out";
  return "done";
}

export const STATUS_COPY: Record<OrderStatus, { title: string; detail: string }> = {
  received: {
    title: "Mottagen",
    detail: "Köket har din order. Degarna väntar.",
  },
  baking: {
    title: "I ugnen",
    detail: "90 sekunder i 450 grader. Leopardfläckar på gång.",
  },
  ready: {
    title: "Redo för avhämtning",
    detail: "Hämta vid disken på Åsögatan 48. Säg ordernumret.",
  },
  out: {
    title: "På väg",
    detail: "Budet är ute. Håll telefonen nära.",
  },
  done: {
    title: "Klar",
    detail: "Tack. Vi ses vid nästa deg.",
  },
};
