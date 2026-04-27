import {
  getCart,
  getProducts,
  getProductById,
  setCartQty,
  removeCartItem,
  clearCart,
  setPromo,
  getPromo,
  setCheckoutDraft,
  getCheckoutDraft,
  clearCheckoutDraft
} from "./storage.js";

import { $, $$, formatPrice } from "./utils.js";
import { toast } from "./ui.js";

const CURRENCY = "₽";

export function initCart() {
  render();

  // promo
  $("#applyPromoBtn")?.addEventListener("click", applyPromo);

  // checkout toggle
  $("#checkoutBtn")?.addEventListener("click", () => {
    const sec = $("#checkoutSection");
    if (!sec) return;
    sec.hidden = false;
    toast("Оформление", "Заполните форму (можно сохранить черновик).");
  });

  $("#closeCheckoutBtn")?.addEventListener("click", () => {
    const sec = $("#checkoutSection");
    if (!sec) return;
    sec.hidden = true;
  });

  // draft
  $("#saveDraftBtn")?.addEventListener("click", () => {
    const draft = readCheckoutForm();
    setCheckoutDraft(draft);
    toast("Черновик сохранён", "Данные формы сохранены локально.");
  });

  // submit
  $("#checkoutForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const draft = readCheckoutForm();

    if (!draft.name || draft.name.length < 2) {
      toast("Проверьте имя", "Введите имя (минимум 2 символа).");
      return;
    }
    if (!draft.phone || draft.phone.length < 6) {
      toast("Проверьте телефон", "Введите корректный телефон.");
      return;
    }
    if (!draft.city || !draft.address) {
      toast("Проверьте адрес", "Заполните город и адрес.");
      return;
    }

    // "создадим заказ" локально (как демо) — просто сохраняем в localStorage ключом vm_last_order_v1
    const cart = getCart();
    const promo = getPromo();
    const pricing = calcPricing(cart);

    const order = {
      id: `order_${Date.now()}`,
      createdAt: Date.now(),
      customer: draft,
      cart,
      promo,
      pricing
    };

    try {
      localStorage.setItem("vm_last_order_v1", JSON.stringify(order));
    } catch {}

    clearCart();
    clearCheckoutDraft();

    toast("Заказ сохранён", "Это демо: заказ записан в LocalStorage и корзина очищена.");
    $("#checkoutSection").hidden = true;
    render();
  });

  // load draft into form
  fillDraftIfAny();

  // re-render on cart change
  window.addEventListener("vm:cart-changed", render);
}

function fillDraftIfAny() {
  const d = getCheckoutDraft();
  if (!d) return;
  const form = $("#checkoutForm");
  if (!form) return;

  for (const [k, v] of Object.entries(d)) {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = v ?? "";
  }
}

function readCheckoutForm() {
  const form = $("#checkoutForm");
  if (!form) return {};
  const fd = new FormData(form);
  return {
    name: String(fd.get("name") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    email: String(fd.get("email") || "").trim(),
    city: String(fd.get("city") || "").trim(),
    address: String(fd.get("address") || "").trim(),
    comment: String(fd.get("comment") || "").trim()
  };
}

function applyPromo() {
  const code = String($("#promoCode")?.value || "").trim().toUpperCase();
  if (!code) {
    setPromo(null);
    toast("Промокод очищен", "Скидка снята.");
    render();
    return;
  }

  // DEMO RULE:
  // VELO10 = -10% (max 3000), VELO5 = -5% (max 1500)
  if (code === "VELO10") {
    setPromo({ code, type: "percent", value: 10, cap: 3000 });
    toast("Промокод применён", "Скидка 10% (до 3 000 ₽).");
  } else if (code === "VELO5") {
    setPromo({ code, type: "percent", value: 5, cap: 1500 });
    toast("Промокод применён", "Скидка 5% (до 1 500 ₽).");
  } else {
    setPromo(null);
    toast("Промокод не найден", "Демо: VELO10 или VELO5.");
  }

  render();
}

function render() {
  const cart = getCart();
  const items = cart.items || [];

  $("#cartSubtitle").textContent = items.length ? `Позиций: ${items.length}` : "—";

  const list = $("#cartList");
  if (!list) return;

  if (!items.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">Корзина пустая</div>
        <div class="empty-state__text">Добавь товары из каталога — и они появятся здесь.</div>
        <a class="btn btn--primary" href="./catalog.html">Перейти в каталог</a>
      </div>
    `;
    renderSummary(cart);
    return;
  }

  const productsById = new Map(getProducts().map((p) => [String(p.id), p]));

  list.innerHTML = "";
  items.forEach((it) => {
    const p = productsById.get(String(it.productId));
    if (!p) return;

    list.appendChild(cartItemRow(p, it));
  });

  renderSummary(cart);
}

function cartItemRow(p, it) {
  const el = document.createElement("div");
  el.className = "cart-item";

  const img = (p.images && p.images[0]) ? p.images[0] : "./assets/img/placeholder-bike-1.jpg";
  const v = it.variant || {};
  const meta = [v.size ? `Размер: ${v.size}` : "", v.color ? `Цвет: ${v.color}` : ""].filter(Boolean).join(" • ");

  el.innerHTML = `
    <a class="cart-item__img" href="./product.html?id=${encodeURIComponent(p.id)}" aria-label="${escapeHtml(p.title)}">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy" />
    </a>

    <div class="cart-item__mid">
      <div class="cart-item__title">${escapeHtml(p.title)}</div>
      <div class="cart-item__meta">${escapeHtml(p.brand)} • ${escapeHtml(p.category)}${meta ? " • " + escapeHtml(meta) : ""}</div>
      <div class="cart-item__prices">
        <span class="price__now">${formatPrice(p.price, CURRENCY)}</span>
        ${p.oldPrice && p.oldPrice > p.price ? `<span class="price__old">${formatPrice(p.oldPrice, CURRENCY)}</span>` : ``}
      </div>
    </div>

    <div class="cart-item__right">
      <div class="qty" aria-label="Количество">
        <button class="qty__btn" type="button" data-dec>-</button>
        <div class="qty__val" data-val>${Number(it.qty) || 1}</div>
        <button class="qty__btn" type="button" data-inc>+</button>
      </div>

      <button class="cart-item__remove" type="button" data-remove>Удалить</button>
    </div>
  `;

  el.querySelector("[data-inc]")?.addEventListener("click", () => {
    setCartQty({ key: it.key, qty: (Number(it.qty) || 1) + 1 });
  });

  el.querySelector("[data-dec]")?.addEventListener("click", () => {
    const next = Math.max(1, (Number(it.qty) || 1) - 1);
    setCartQty({ key: it.key, qty: next });
  });

  el.querySelector("[data-remove]")?.addEventListener("click", () => {
    removeCartItem(it.key);
    toast("Удалено", p.title);
  });

  return el;
}

function calcPricing(cart) {
  const items = cart.items || [];
  const map = new Map(getProducts().map((p) => [String(p.id), p]));

  const subtotal = items.reduce((sum, it) => {
    const p = map.get(String(it.productId));
    if (!p) return sum;
    return sum + (Number(p.price) || 0) * (Number(it.qty) || 0);
  }, 0);

  const promo = getPromo();
  let discount = 0;

  if (promo && promo.type === "percent") {
    discount = Math.round(subtotal * (promo.value / 100));
    if (promo.cap) discount = Math.min(discount, Number(promo.cap) || discount);
  }

  discount = Math.min(discount, subtotal);
  const total = Math.max(0, subtotal - discount);

  return { subtotal, discount, total };
}

function renderSummary(cart) {
  const items = cart.items || [];
  const pricing = calcPricing(cart);

  $("#sumItems").textContent = String(items.reduce((s, it) => s + (Number(it.qty) || 0), 0));
  $("#sumSubtotal").textContent = formatPrice(pricing.subtotal, CURRENCY);
  $("#sumTotal").textContent = formatPrice(pricing.total, CURRENCY);

  const dRow = $("#discountRow");
  if (pricing.discount > 0) {
    dRow.hidden = false;
    $("#sumDiscount").textContent = `-${formatPrice(pricing.discount, CURRENCY)}`;
  } else {
    dRow.hidden = true;
    $("#sumDiscount").textContent = formatPrice(0, CURRENCY);
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}