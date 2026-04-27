import { safeJsonParse, uid } from "./utils.js";

const KEYS = {
  PRODUCTS: "vm_products_v1",
  CART: "vm_cart_v1",
  ADMIN_SESSION: "vm_admin_session_v1",
  CHECKOUT_DRAFT: "vm_checkout_draft_v1",
  ONECLICK: "vm_oneclick_requests_v1",
  PROMO: "vm_promo_state_v1"
};

export function lsGet(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (raw === null || raw === undefined) return fallback;
  return safeJsonParse(raw, fallback);
}

export function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function lsRemove(key) {
  localStorage.removeItem(key);
}

/* PRODUCTS */
export function getProducts() {
  return lsGet(KEYS.PRODUCTS, []);
}

export function setProducts(list) {
  lsSet(KEYS.PRODUCTS, Array.isArray(list) ? list : []);
}

export function upsertProduct(product) {
  const list = getProducts();
  const p = { ...product, updatedAt: Date.now() };
  const idx = list.findIndex((x) => x.id === p.id);
  if (idx >= 0) list[idx] = p;
  else list.unshift(p);
  setProducts(list);
  return p;
}

export function deleteProduct(id) {
  const list = getProducts().filter((p) => p.id !== id);
  setProducts(list);
}

export function getProductById(id) {
  return getProducts().find((p) => String(p.id) === String(id)) || null;
}

/* CART */
export function getCart() {
  return lsGet(KEYS.CART, { items: [], promo: null });
}

export function setCart(cart) {
  const safe = cart && typeof cart === "object" ? cart : { items: [], promo: null };
  if (!Array.isArray(safe.items)) safe.items = [];
  lsSet(KEYS.CART, safe);
  window.dispatchEvent(new CustomEvent("vm:cart-changed"));
}

export function getCartCount() {
  const cart = getCart();
  return (cart.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
}

export function cartKey({ productId, variant }) {
  const v = variant || {};
  return `${productId}__${String(v.size || "")}__${String(v.color || "")}`;
}

export function addToCart({ productId, variant, qty = 1 }) {
  const cart = getCart();
  const key = cartKey({ productId, variant });
  const items = cart.items || [];
  const idx = items.findIndex((it) => it.key === key);
  if (idx >= 0) items[idx].qty = (Number(items[idx].qty) || 0) + (Number(qty) || 0);
  else items.push({ key, productId, variant: variant || {}, qty: Number(qty) || 1 });
  cart.items = items;
  setCart(cart);
}

export function setCartQty({ key, qty }) {
  const cart = getCart();
  cart.items = (cart.items || []).map((it) => (it.key === key ? { ...it, qty: Math.max(1, Number(qty) || 1) } : it));
  setCart(cart);
}

export function removeCartItem(key) {
  const cart = getCart();
  cart.items = (cart.items || []).filter((it) => it.key !== key);
  setCart(cart);
}

export function clearCart() {
  setCart({ items: [], promo: null });
}

export function setPromo(promoObj) {
  const cart = getCart();
  cart.promo = promoObj || null;
  setCart(cart);
}

export function getPromo() {
  return getCart().promo || null;
}

/* ADMIN SESSION */
export function setAdminSession(session) {
  lsSet(KEYS.ADMIN_SESSION, session || null);
}
export function getAdminSession() {
  return lsGet(KEYS.ADMIN_SESSION, null);
}
export function clearAdminSession() {
  lsRemove(KEYS.ADMIN_SESSION);
}

/* CHECKOUT DRAFT */
export function setCheckoutDraft(draft) {
  lsSet(KEYS.CHECKOUT_DRAFT, draft || null);
}
export function getCheckoutDraft() {
  return lsGet(KEYS.CHECKOUT_DRAFT, null);
}
export function clearCheckoutDraft() {
  lsRemove(KEYS.CHECKOUT_DRAFT);
}

/* ONECLICK */
export function saveOneClickRequest(payload) {
  const list = lsGet(KEYS.ONECLICK, []);
  const item = { id: uid("oneclick"), createdAt: Date.now(), ...payload };
  list.unshift(item);
  lsSet(KEYS.ONECLICK, list);
  return item;
}

/* UTIL */
export function hardResetAll() {
  Object.values(KEYS).forEach((k) => lsRemove(k));
}