// FILE: /src/js/admin.js
import {
  getProducts,
  upsertProduct,
  deleteProduct,
  setAdminSession,
  getAdminSession,
  clearAdminSession
} from "./storage.js";

import { resetToSeed } from "./seed.js";
import { $, $$, formatPrice, normalize, uid, byUpdatedDesc } from "./utils.js";
import { toast, openModal, closeModal, wireModalCloseButtons } from "./ui.js";

const ADMIN_PIN = "1234";
const CURRENCY = "₽";

let astate = { q: "", sort: "updated_desc" };

export function initAdmin() {
  wireLogin();
  wireModal();
  wireToolbar();

  const session = getAdminSession();
  if (session?.ok) {
    showPanel();
    render();
  } else {
    showLogin();
  }
}

function showLogin() {
  $("#adminLogin").hidden = false;
  $("#adminPanel").hidden = true;
}

function showPanel() {
  $("#adminLogin").hidden = true;
  $("#adminPanel").hidden = false;
}

function wireLogin() {
  $("#adminPinForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pin = String($("#adminPin")?.value || "").trim();
    if (pin !== ADMIN_PIN) {
      toast("Неверный PIN", "Демо: 1234");
      return;
    }
    setAdminSession({ ok: true, at: Date.now() });
    showPanel();
    toast("Вход выполнен", "Админка доступна.");
    render();
  });

  $("#logoutBtn")?.addEventListener("click", () => {
    clearAdminSession();
    toast("Выход", "Сессия завершена.");
    showLogin();
  });
}

function wireToolbar() {
  $("#adminSearchForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    astate.q = String($("#adminSearch")?.value || "").trim();
    render();
  });

  $("#adminSort")?.addEventListener("change", (e) => {
    astate.sort = e.target.value;
    render();
  });

  $("#createProductBtn")?.addEventListener("click", () => openEditor(null));


  $("#resetSeedBtn")?.addEventListener("click", async () => {
    if (!confirm("Сбросить товары к seed? (Корзина/черновики тоже очистятся)")) return;
    await resetToSeed();
    toast("Сброшено", "Данные восстановлены из seed.");
    window.dispatchEvent(new CustomEvent("vm:products-updated"));
    render();
  });
}

function wireModal() {
  const dlg = $("#productModal");
  if (!dlg) return;

  wireModalCloseButtons(dlg);

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) closeModal(dlg);
  });

  // quick add image url
  $("#addImageUrlBtn")?.addEventListener("click", () => {
    const url = String($("#imageUrlInput")?.value || "").trim();
    if (!url) return;

    if (!isLikelyUrl(url) && !isLikelyLocalPath(url)) {
      toast("Не похоже на ссылку", "Вставь https://... или ./assets/img/...");
      return;
    }

    const ta = $("#imagesTextarea");
    const current = readImagesTextarea();
    if (!current.includes(url)) current.push(url);
    ta.value = current.join("\n");
    $("#imageUrlInput").value = "";
    renderImagePreview(current);
  });

  // live preview when textarea changes
  $("#imagesTextarea")?.addEventListener("input", () => {
    renderImagePreview(readImagesTextarea());
  });

  $("#productForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = readForm();
    const errors = validateProduct(data);
    if (errors.length) {
      toast("Проверь поля", errors[0]);
      return;
    }

    const saved = upsertProduct(data);
    toast("Сохранено", saved.title);

    closeModal(dlg);
    window.dispatchEvent(new CustomEvent("vm:products-updated"));
    render();
  });
}

function render() {
  const list = filterSort(getProducts());
  $("#adminCount").textContent = `Всего: ${list.length}`;

  const tbody = $("#adminTbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="muted">Ничего не найдено</td></tr>`;
    return;
  }

  list.forEach((p) => tbody.appendChild(row(p)));
}

function filterSort(products) {
  let list = [...products];

  if (astate.q) {
    const q = normalize(astate.q);
    list = list.filter((p) => normalize(`${p.title} ${p.brand} ${p.category}`).includes(q));
  }

  if (astate.sort === "updated_desc") list.sort(byUpdatedDesc);
  if (astate.sort === "title_asc") list.sort((a, b) => String(a.title).localeCompare(String(b.title), "ru"));
  if (astate.sort === "price_asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (astate.sort === "price_desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (astate.sort === "stock_desc") list.sort((a, b) => (b.inStock === a.inStock ? 0 : (b.inStock ? 1 : -1)));

  return list;
}

function row(p) {
  const tr = document.createElement("tr");

  const img = (p.images && p.images[0]) ? p.images[0] : "./assets/img/placeholder-bike-1.jpg";
  const tags = (p.tags || []).join(", ");

  tr.innerHTML = `
    <td>
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${escapeHtml(img)}" alt="" style="width:54px;height:40px;object-fit:cover;border-radius:12px;border:1px solid var(--line)" />
        <div>
          <div style="font-weight:900">${escapeHtml(p.title)}</div>
          <div class="muted small">${escapeHtml(p.id)}</div>
        </div>
      </div>
    </td>
    <td>${escapeHtml(p.category || "")}</td>
    <td>${escapeHtml(p.brand || "")}</td>
    <td class="num">${formatPrice(p.price || 0, CURRENCY)}</td>
    <td class="num">${p.oldPrice ? formatPrice(p.oldPrice, CURRENCY) : "—"}</td>
    <td>${p.inStock ? "Да" : "Нет"}</td>
    <td>${escapeHtml(tags || "—")}</td>
    <td class="num">${Number(p.rating || 0).toFixed(1)}</td>
    <td class="num">${Number(p.reviewsCount || 0)}</td>
    <td class="actions">
      <button class="btn btn--ghost" type="button" data-edit>Ред.</button>
      <button class="btn btn--ghost" type="button" data-del>Удал.</button>
    </td>
  `;

  tr.querySelector("[data-edit]")?.addEventListener("click", () => openEditor(p));
  tr.querySelector("[data-del]")?.addEventListener("click", () => {
    if (!confirm(`Удалить товар "${p.title}"?`)) return;
    deleteProduct(p.id);
    toast("Удалено", p.title);
    window.dispatchEvent(new CustomEvent("vm:products-updated"));
    render();
  });

  return tr;
}

function openEditor(p) {
  const dlg = $("#productModal");
  if (!dlg) return;

  const isNew = !p;
  $("#productModalTitle").textContent = isNew ? "Добавить товар" : "Редактировать товар";

  const blank = makeBlankProduct();
  const data = isNew ? blank : normalizeForForm(p);

  fillForm(data);
  renderImagePreview(Array.isArray(data.images) ? data.images : []);

  openModal(dlg);
}

function makeBlankProduct() {
  return {
    id: uid("p"),
    title: "",
    category: "горный",
    brand: "",
    price: 0,
    oldPrice: 0,
    inStock: true,
    rating: 4.5,
    reviewsCount: 0,
    qaCount: 0,
    tags: [],
    images: ["./assets/img/placeholder-bike-1.jpg"],
    bullets: [],
    description: "",
    specs: [],
    variants: { sizes: ["M"], colors: ["Чёрный"] },
    popularity: 50,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function normalizeForForm(p) {
  return {
    ...p,
    tags: Array.isArray(p.tags) ? p.tags : [],
    images: Array.isArray(p.images) ? p.images : [],
    bullets: Array.isArray(p.bullets) ? p.bullets : [],
    specs: Array.isArray(p.specs) ? p.specs : [],
    variants: p.variants && typeof p.variants === "object" ? p.variants : { sizes: [], colors: [] }
  };
}

function fillForm(p) {
  const form = $("#productForm");
  if (!form) return;

  form.dataset.editId = p.id;

  form.querySelector('[name="title"]').value = p.title || "";
  form.querySelector('[name="category"]').value = p.category || "горный";
  form.querySelector('[name="brand"]').value = p.brand || "";
  form.querySelector('[name="price"]').value = String(p.price ?? 0);
  form.querySelector('[name="oldPrice"]').value = String(p.oldPrice ?? 0);
  form.querySelector('[name="inStock"]').value = String(!!p.inStock);

  form.querySelector('[name="rating"]').value = String(p.rating ?? 0);
  form.querySelector('[name="reviewsCount"]').value = String(p.reviewsCount ?? 0);
  form.querySelector('[name="qaCount"]').value = String(p.qaCount ?? 0);

  form.querySelector('[name="tags"]').value = (p.tags || []).join(", ");

  $("#imagesTextarea").value = (p.images || []).join("\n");
  form.querySelector('[name="bullets"]').value = (p.bullets || []).join("\n");
  form.querySelector('[name="description"]').value = p.description || "";

  form.querySelector('[name="specs"]').value = (p.specs || []).map((x) => `${x.k}: ${x.v}`).join("\n");

  form.querySelector('[name="sizes"]').value = (p.variants?.sizes || []).join(", ");
  form.querySelector('[name="colors"]').value = (p.variants?.colors || []).join(", ");
}

function readForm() {
  const form = $("#productForm");
  const fd = new FormData(form);

  const editId = form.dataset.editId || uid("p");

  const title = String(fd.get("title") || "").trim();
  const category = String(fd.get("category") || "").trim();
  const brand = String(fd.get("brand") || "").trim();

  const price = Number(fd.get("price") || 0);
  const oldPrice = Number(fd.get("oldPrice") || 0);
  const inStock = String(fd.get("inStock")) === "true";

  const rating = Number(fd.get("rating") || 0);
  const reviewsCount = Number(fd.get("reviewsCount") || 0);
  const qaCount = Number(fd.get("qaCount") || 0);

  const tags = String(fd.get("tags") || "")
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean)
    .filter((x) => ["HIT", "SALE"].includes(x));

  const images = readImagesTextarea().filter(Boolean);

  const bullets = String(fd.get("bullets") || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const description = String(fd.get("description") || "").trim();

  const specs = String(fd.get("specs") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx < 0) return { k: line, v: "" };
      return { k: line.slice(0, idx).trim(), v: line.slice(idx + 1).trim() };
    });

  const sizes = String(fd.get("sizes") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const colors = String(fd.get("colors") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const now = Date.now();

  return {
    id: editId,
    title,
    category,
    brand,
    price,
    oldPrice,
    inStock,
    rating: clampRating(rating),
    reviewsCount: Math.max(0, Math.floor(reviewsCount)),
    qaCount: Math.max(0, Math.floor(qaCount)),
    tags,
    images: images.length ? images : ["./assets/img/placeholder-bike-1.jpg"],
    bullets,
    description,
    specs,
    variants: {
      sizes: sizes.length ? sizes : ["M"],
      colors: colors.length ? colors : ["Чёрный"]
    },
    popularity: guessPopularity({ rating, reviewsCount }),
    createdAt: now,
    updatedAt: now
  };
}

function validateProduct(p) {
  const errors = [];
  if (!p.title || p.title.length < 3) errors.push("Название: минимум 3 символа.");
  if (!p.brand || p.brand.length < 2) errors.push("Бренд: минимум 2 символа.");
  if (!p.category) errors.push("Категория обязательна.");
  if (!Number.isFinite(p.price) || p.price <= 0) errors.push("Цена должна быть больше 0.");
  if (!Array.isArray(p.images) || !p.images.length) errors.push("Добавь хотя бы 1 изображение.");
  return errors;
}

function exportJson() {
  const data = getProducts();
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "vm_products_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  toast("Экспортировано", "Файл vm_products_export.json скачан.");
}

function readImagesTextarea() {
  const ta = $("#imagesTextarea");
  const lines = String(ta?.value || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  return dedupe(lines);
}

function renderImagePreview(urls) {
  const box = $("#imagePreview");
  if (!box) return;

  const list = dedupe((urls || []).map((x) => String(x).trim()).filter(Boolean)).slice(0, 24);
  if (!list.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = "";
  list.forEach((src) => {
    const item = document.createElement("div");
    item.className = "imgpreview__item";

    item.innerHTML = `
      <img src="${escapeHtml(src)}" alt="" loading="lazy" />
      <div class="imgpreview__bar">
        <span class="muted" title="${escapeHtml(src)}">${shorten(src, 18)}</span>
        <button class="imgpreview__btn" type="button" data-del>×</button>
      </div>
    `;

    item.querySelector("[data-del]")?.addEventListener("click", () => {
      const next = readImagesTextarea().filter((u) => u !== src);
      $("#imagesTextarea").value = next.join("\n");
      renderImagePreview(next);
    });

    box.appendChild(item);
  });
}

function clampRating(r) {
  const n = Number(r) || 0;
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
}

function guessPopularity({ rating, reviewsCount }) {
  const r = clampRating(rating);
  const c = Math.max(0, Math.floor(Number(reviewsCount) || 0));
  return Math.max(10, Math.min(99, Math.round(r * 10 + Math.log10(c + 1) * 20)));
}

function isLikelyUrl(s) {
  return /^https?:\/\/.+/i.test(String(s || ""));
}
function isLikelyLocalPath(s) {
  return /^(\.\/|\/).+/i.test(String(s || "")) || String(s || "").includes("./assets/");
}

function dedupe(arr) {
  return Array.from(new Set(arr));
}

function shorten(s, n = 20) {
  const str = String(s || "");
  if (str.length <= n) return str;
  return str.slice(0, Math.max(8, n - 4)) + "…" + str.slice(-3);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}