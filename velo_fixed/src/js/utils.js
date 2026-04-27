export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function formatPrice(value, currency = "₽") {
  const n = Number(value) || 0;
  const s = n.toLocaleString("ru-RU");
  return `${s} ${currency}`;
}

export function calcDiscountPercent(price, oldPrice) {
  const p = Number(price) || 0;
  const o = Number(oldPrice) || 0;
  if (!o || o <= p) return 0;
  return Math.round(((o - p) / o) * 100);
}

export function getQueryParams() {
  const url = new URL(window.location.href);
  const qp = {};
  url.searchParams.forEach((v, k) => {
    qp[k] = v;
  });
  return qp;
}

export function setQueryParams(next, { replace = true } = {}) {
  const url = new URL(window.location.href);
  Object.entries(next || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  });
  if (replace) window.history.replaceState({}, "", url.toString());
  else window.history.pushState({}, "", url.toString());
}

export function debounce(fn, ms = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function normalize(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function uniq(arr) {
  return Array.from(new Set(arr));
}

export function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => (out[k] = obj?.[k]));
  return out;
}

export function byUpdatedDesc(a, b) {
  return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
}

export function scrollToTopSmooth() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

/**
 * Header cart badge (без импорта storage.js чтобы не было циклов).
 * Ожидает структуру: { items: [{ qty:number }] }
 */
export function initHeaderCartBadge() {
  const update = () => {
    let count = 0;
    try {
      const raw = localStorage.getItem("vm_cart_v1");
      const cart = raw ? JSON.parse(raw) : { items: [] };
      const items = Array.isArray(cart?.items) ? cart.items : [];
      count = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    } catch {
      count = 0;
    }

    document.querySelectorAll("[data-cart-badge]").forEach((el) => {
      if (!el) return;
      if (count > 0) {
        el.hidden = false;
        el.textContent = String(count);
      } else {
        el.hidden = true;
        el.textContent = "0";
      }
    });
  };

  update();
  window.addEventListener("vm:cart-changed", update);
  window.addEventListener("storage", update);
}