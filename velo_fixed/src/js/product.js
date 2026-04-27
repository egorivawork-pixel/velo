import { getProductById, addToCart, saveOneClickRequest } from "./storage.js";
import { $, $$, formatPrice, calcDiscountPercent } from "./utils.js";
import { toast, openModal, closeModal, wireModalCloseButtons } from "./ui.js";

const CURRENCY = "₽";

export function initProduct({ qp } = {}) {
  const id = qp?.id;
  if (!id) {
    renderNotFound();
    return;
  }

  const p = getProductById(id);
  if (!p) {
    renderNotFound();
    return;
  }

  renderProduct(p);
  wireTabs();
  wireGallery();
  wireOneClick(p);
  wireAddToCart(p);
}

function renderNotFound() {
  const title = $("#productTitle");
  if (title) title.textContent = "Товар не найден";
  const desc = $("#productDesc");
  if (desc) desc.textContent = "Проверьте ссылку или вернитесь в каталог.";
  $("#addToCartBtn")?.setAttribute("disabled", "disabled");
  $("#oneClickBtn")?.setAttribute("disabled", "disabled");
}

function renderProduct(p) {
  document.title = `${p.title} — VeloMarket`;

  $("#productTitle").textContent = p.title;

  const sub = `Артикул: ${p.id} • Бренд: ${p.brand} • Категория: ${p.category}`;
  $("#productSub").textContent = sub;

  // breadcrumbs
  const crumbs = $("#productCrumbs");
  if (crumbs) {
    crumbs.innerHTML = `
      <a href="./index.html">Главная</a>
      <span> / </span>
      <a href="./catalog.html">Велосипеды</a>
      <span> / </span>
      <a href="./catalog.html?category=${encodeURIComponent(p.category)}">${escapeHtml(p.category)}</a>
      <span> / </span>
      <span>${escapeHtml(p.title)}</span>
    `;
  }

  // rating
  $("#productRating .rating__value").textContent = `${Number(p.rating || 0).toFixed(1)} (${Number(p.reviewsCount || 0)})`;

  // price
  $("#productPriceNow").textContent = formatPrice(p.price, CURRENCY);

  const old = $("#productPriceOld");
  const discEl = $("#productDiscount");
  const disc = calcDiscountPercent(p.price, p.oldPrice);
  if (p.oldPrice && p.oldPrice > p.price) {
    old.hidden = false;
    old.textContent = formatPrice(p.oldPrice, CURRENCY);
    discEl.hidden = false;
    discEl.textContent = `-${disc}%`;
  } else {
    old.hidden = true;
    discEl.hidden = true;
  }

  // stock
  const stock = $("#productStock");
  if (stock) {
    stock.innerHTML = p.inStock
      ? `<span class="dot dot--ok" aria-hidden="true"></span><span>В наличии</span>`
      : `<span class="dot dot--no" aria-hidden="true"></span><span>Нет в наличии</span>`;
  }

  // badges
  const badges = $("#productBadges");
  if (badges) {
    const tags = p.tags || [];
    const hasSale = tags.includes("SALE") || disc > 0;
    const hasHit = tags.includes("HIT");
    badges.innerHTML = `
      ${hasSale ? `<span class="badge-sale">SALE</span>` : ``}
      ${hasHit ? `<span class="badge-hit">ХИТ</span>` : ``}
    `;
  }

  // bullets
  const bullets = $("#productBullets");
  if (bullets) {
    const list = (p.bullets || []).slice(0, 6);
    bullets.innerHTML = list.map((b) => `<li>${escapeHtml(b)}</li>`).join("") || `<li>Надёжная сборка</li><li>Комфортная посадка</li>`;
  }

  // description
  $("#productDesc").textContent = p.description || "Описание не задано.";

  // specs
  const specs = $("#productSpecs");
  if (specs) {
    const s = Array.isArray(p.specs) ? p.specs : [];
    specs.innerHTML = s.length
      ? s.map((x) => `<div class="spec"><div class="spec__k">${escapeHtml(x.k)}</div><div class="spec__v">${escapeHtml(x.v)}</div></div>`).join("")
      : `<div class="muted">Характеристики не заданы.</div>`;
  }

  // reviews & qa (demo)
  $("#reviewsCount").textContent = String(Number(p.reviewsCount || 0));
  $("#qaCount").textContent = String(Number(p.qaCount || 0));
  $("#productReviews").innerHTML = makeDemoReviews(p);
  $("#productQA").innerHTML = makeDemoQA(p);

  // variants selects
  const sizes = p?.variants?.sizes?.length ? p.variants.sizes : ["—"];
  const colors = p?.variants?.colors?.length ? p.variants.colors : ["—"];
  const sizeSel = $("#variantSize");
  const colorSel = $("#variantColor");
  if (sizeSel) sizeSel.innerHTML = sizes.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  if (colorSel) colorSel.innerHTML = colors.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  // gallery
  renderGallery(p);

  // buttons
  const addBtn = $("#addToCartBtn");
  const oneBtn = $("#oneClickBtn");
  if (!p.inStock) {
    addBtn?.setAttribute("disabled", "disabled");
    oneBtn?.setAttribute("disabled", "disabled");
  } else {
    addBtn?.removeAttribute("disabled");
    oneBtn?.removeAttribute("disabled");
  }
}

function renderGallery(p) {
  const imgs = (p.images && p.images.length ? p.images : ["./assets/img/placeholder-bike-1.jpg"]).slice(0, 6);
  const thumbs = $("#galleryThumbs");
  const main = $("#galleryMain");

  if (main) {
    main.src = imgs[0];
    main.alt = p.title;
  }

  if (thumbs) {
    thumbs.innerHTML = "";
    imgs.forEach((src, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thumb" + (idx === 0 ? " is-active" : "");
      b.setAttribute("aria-label", `Изображение ${idx + 1}`);
      b.innerHTML = `<img src="${escapeHtml(src)}" alt="" loading="lazy" />`;
      b.addEventListener("click", () => {
        $$(".thumb", thumbs).forEach((t) => t.classList.remove("is-active"));
        b.classList.add("is-active");
        if (main) main.src = src;
      });
      thumbs.appendChild(b);
    });
  }
}

function wireGallery() {
  // всё уже повешено на кнопки в renderGallery
}

function wireTabs() {
  const tabs = $$(".tab");
  const panes = $$(".tabpane");
  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => {
        x.classList.toggle("is-active", x === t);
        x.setAttribute("aria-selected", x === t ? "true" : "false");
      });
      const key = t.dataset.tab;
      panes.forEach((p) => p.classList.toggle("is-active", p.dataset.pane === key));
    });
  });
}

function getSelectedVariant() {
  return {
    size: $("#variantSize")?.value || "",
    color: $("#variantColor")?.value || ""
  };
}

function wireAddToCart(p) {
  $("#addToCartBtn")?.addEventListener("click", () => {
    if (!p.inStock) {
      toast("Нет в наличии", "Выберите другой товар.");
      return;
    }
    const variant = getSelectedVariant();
    addToCart({ productId: p.id, variant, qty: 1 });
    toast("Добавлено в корзину", `${p.title} • ${variantLabel(variant)}`);
  });
}

function wireOneClick(p) {
  const dlg = $("#oneClickModal");
  const form = $("#oneClickForm");
  const openBtn = $("#oneClickBtn");

  if (!dlg || !form || !openBtn) return;

  wireModalCloseButtons(dlg);

  openBtn.addEventListener("click", () => {
    $("#oneClickProduct").textContent = `Товар: ${p.title} • ${variantLabel(getSelectedVariant())}`;
    openModal(dlg);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      productId: p.id,
      productTitle: p.title,
      variant: getSelectedVariant(),
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      comment: String(fd.get("comment") || "").trim()
    };

    if (!payload.name || payload.name.length < 2) {
      toast("Проверьте имя", "Введите имя (минимум 2 символа).");
      return;
    }
    if (!payload.phone || payload.phone.length < 6) {
      toast("Проверьте телефон", "Введите корректный телефон.");
      return;
    }

    saveOneClickRequest(payload);
    toast("Заявка сохранена", "Мы перезвоним (демо).");

    form.reset();
    closeModal(dlg);
  });

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) closeModal(dlg);
  });
}

function variantLabel(v) {
  const a = v?.size ? `размер ${v.size}` : "";
  const b = v?.color ? `цвет ${v.color}` : "";
  return [a, b].filter(Boolean).join(", ") || "вариант по умолчанию";
}

function makeDemoReviews(p) {
  const n = Math.min(3, Math.max(1, Math.floor((p.reviewsCount || 3) / 40)));
  const base = [
    { name: "Алексей", stars: "★★★★★", text: "Отличный накат и управляемость. Сборка аккуратная." },
    { name: "Марина", stars: "★★★★☆", text: "Удобная посадка, тормоза уверенные. Доставка — демо." },
    { name: "Илья", stars: "★★★★★", text: "Хороший вариант за эти деньги. Рекомендую!" }
  ];
  return base.slice(0, n).map((r) => `
    <div class="review">
      <div class="review__head">
        <div class="review__name">${r.name}</div>
        <div class="muted">${r.stars}</div>
      </div>
      <div class="review__text">${r.text}</div>
    </div>
  `).join("");
}

function makeDemoQA(p) {
  const base = [
    { q: "Подойдёт ли для города?", a: "Да, особенно если маршруты асфальт/плитка. Для трейла — по назначению модели." },
    { q: "Есть ли гарантия?", a: "Это демо-магазин. В реальном проекте — добавьте блок гарантий/условий." },
    { q: "Можно ли выбрать другой цвет?", a: "Да, выберите в вариантах (цвет/размер), это попадёт в корзину отдельной позицией." }
  ];
  const n = Math.min(3, Math.max(1, Math.floor((p.qaCount || 3) / 30)));
  return base.slice(0, n).map((x) => `
    <div class="qa-item">
      <div class="qa__head">
        <div class="qa__q">${x.q}</div>
      </div>
      <div class="qa__a">${x.a}</div>
    </div>
  `).join("");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}