import { getProducts, addToCart } from "./storage.js";
import { $, $$, clamp, normalize, formatPrice, calcDiscountPercent, setQueryParams, getQueryParams, uniq, scrollToTopSmooth } from "./utils.js";
import { toast } from "./ui.js";

const CURRENCY = "₽";
const PER_PAGE = 12;

let state = {
  view: "grid",         // grid | list
  sort: "popular",      // popular | price_asc | price_desc | discount_desc
  page: 1,
  q: "",
  category: "",
  inStock: false,
  priceMin: "",
  priceMax: "",
  brands: [],           // selected brands
  tag: ""               // HIT | SALE
};

function parseInitialState(qp) {
  const s = { ...state };
  const q = qp.q || "";
  s.q = q;

  s.category = qp.category || "";
  s.tag = qp.tag || "";

  s.inStock = qp.inStock === "1" || qp.inStock === "true";
  s.sort = qp.sort || s.sort;
  s.view = qp.view || s.view;

  s.page = clamp(parseInt(qp.page || "1", 10) || 1, 1, 999);

  if (qp.min) s.priceMin = qp.min;
  if (qp.max) s.priceMax = qp.max;

  if (qp.brands) {
    s.brands = String(qp.brands).split(",").map((x) => x.trim()).filter(Boolean);
  }

  return s;
}

function writeStateToUrl() {
  setQueryParams({
    q: state.q || "",
    category: state.category || "",
    tag: state.tag || "",
    inStock: state.inStock ? "1" : "",
    sort: state.sort || "",
    view: state.view || "",
    page: String(state.page || 1),
    min: state.priceMin || "",
    max: state.priceMax || "",
    brands: state.brands.length ? state.brands.join(",") : ""
  }, { replace: true });
}

function getAllBrands(products) {
  return uniq(products.map((p) => p.brand).filter(Boolean)).sort((a, b) => a.localeCompare(b, "ru"));
}

function matchesFilters(p) {
  if (state.tag) {
    const tags = p.tags || [];
    if (!tags.includes(state.tag)) return false;
  }

  if (state.category && normalize(p.category) !== normalize(state.category)) return false;

  if (state.inStock && !p.inStock) return false;

  const min = state.priceMin !== "" ? Number(state.priceMin) : null;
  const max = state.priceMax !== "" ? Number(state.priceMax) : null;
  if (min !== null && (Number(p.price) || 0) < min) return false;
  if (max !== null && (Number(p.price) || 0) > max) return false;

  if (state.brands.length) {
    const b = normalize(p.brand);
    const ok = state.brands.some((x) => normalize(x) === b);
    if (!ok) return false;
  }

  if (state.q) {
    const hay = normalize(`${p.title} ${p.brand}`);
    if (!hay.includes(normalize(state.q))) return false;
  }

  return true;
}

function sortProducts(list) {
  const out = [...list];
  if (state.sort === "price_asc") out.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (state.sort === "price_desc") out.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (state.sort === "discount_desc") {
    out.sort((a, b) => calcDiscountPercent(b.price, b.oldPrice) - calcDiscountPercent(a.price, a.oldPrice));
  }
  if (state.sort === "popular") out.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return out;
}

function paginate(list) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = clamp(state.page, 1, pages);
  state.page = page;

  const start = (page - 1) * PER_PAGE;
  const slice = list.slice(start, start + PER_PAGE);
  return { slice, total, pages, page };
}

function renderBrands(products) {
  const wrap = $("#fBrands");
  if (!wrap) return;

  wrap.innerHTML = "";
  const brands = getAllBrands(products);

  brands.forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip chip--pill" + (state.brands.some((x) => normalize(x) === normalize(b)) ? " is-active" : "");
    btn.textContent = b;
    btn.addEventListener("click", () => {
      const exists = state.brands.some((x) => normalize(x) === normalize(b));
      state.brands = exists ? state.brands.filter((x) => normalize(x) !== normalize(b)) : [...state.brands, b];
      state.page = 1;
      renderAll();
    });
    wrap.appendChild(btn);
  });

  if (!brands.length) {
    wrap.innerHTML = `<div class="muted">Нет брендов</div>`;
  }
}

function renderActiveFilters() {
  const root = $("#activeFilters");
  if (!root) return;

  const chips = [];

  if (state.category) chips.push({ k: "category", label: `Тип: ${state.category}` });
  if (state.inStock) chips.push({ k: "inStock", label: `В наличии` });
  if (state.tag) chips.push({ k: "tag", label: `${state.tag}` });
  if (state.priceMin !== "" || state.priceMax !== "") {
    const a = state.priceMin !== "" ? `от ${formatPrice(state.priceMin, CURRENCY)}` : "";
    const b = state.priceMax !== "" ? `до ${formatPrice(state.priceMax, CURRENCY)}` : "";
    chips.push({ k: "price", label: `Цена ${[a, b].filter(Boolean).join(" ")}`.trim() });
  }
  if (state.brands.length) chips.push({ k: "brands", label: `Бренды: ${state.brands.join(", ")}` });
  if (state.q) chips.push({ k: "q", label: `Поиск: “${state.q}”` });

  root.innerHTML = "";
  chips.forEach((c) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "chip is-active";
    el.innerHTML = `<span>${escapeHtml(c.label)}</span><span class="chip__x" aria-hidden="true">×</span>`;
    el.addEventListener("click", () => {
      if (c.k === "category") state.category = "";
      if (c.k === "inStock") state.inStock = false;
      if (c.k === "tag") state.tag = "";
      if (c.k === "price") { state.priceMin = ""; state.priceMax = ""; }
      if (c.k === "brands") state.brands = [];
      if (c.k === "q") state.q = "";
      state.page = 1;
      syncControlsFromState();
      renderAll();
    });
    root.appendChild(el);
  });
}

function renderProductsGrid(products) {
  const grid = $("#productsGrid");
  const wrap = $("#productsWrap");
  if (!grid || !wrap) return;

  wrap.classList.toggle("is-list", state.view === "list");

  const filtered = products.filter(matchesFilters);
  const sorted = sortProducts(filtered);
  const { slice, total, pages, page } = paginate(sorted);

  $("#catalogCount").textContent = `Найдено: ${total}`;
  const searchInput = $(".search__input");
  if (searchInput && state.q) searchInput.value = state.q;

  grid.innerHTML = "";

  if (!slice.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__title">Ничего не найдено</div>
        <div class="empty-state__text">Попробуй изменить фильтры или сбросить их.</div>
        <button class="btn btn--primary" type="button" id="emptyReset">Сбросить фильтры</button>
      </div>
    `;
    $("#emptyReset")?.addEventListener("click", () => {
      resetAllFilters();
      renderAll();
    });
  } else {
    slice.forEach((p) => grid.appendChild(productCard(p)));
  }

  renderPagination({ pages, page });
  renderActiveFilters();

  writeStateToUrl();
}

function renderPagination({ pages, page }) {
  const root = $("#pagination");
  if (!root) return;

  root.innerHTML = "";

  const mk = (label, target, { disabled = false, active = false } = {}) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pagebtn" + (active ? " is-active" : "");
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener("click", () => {
      state.page = target;
      renderAll();
      scrollToTopSmooth();
    });
    return b;
  };

  root.appendChild(mk("‹", page - 1, { disabled: page <= 1 }));
  const windowSize = 7;
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(pages, start + windowSize - 1);

  for (let i = start; i <= end; i++) root.appendChild(mk(String(i), i, { active: i === page }));
  root.appendChild(mk("›", page + 1, { disabled: page >= pages }));
}

function productCard(p) {
  const el = document.createElement("article");
  el.className = "card pcard";

  const discount = calcDiscountPercent(p.price, p.oldPrice);
  const img = (p.images && p.images[0]) ? p.images[0] : "./assets/img/placeholder-bike-1.jpg";

  const tags = Array.isArray(p.tags) ? p.tags : [];
  const hasSale = tags.includes("SALE") || discount > 0;
  const hasHit = tags.includes("HIT");

  const bullets = (p.bullets || []).slice(0, 4);

  el.setAttribute("role", "link");
  el.setAttribute("tabindex", "0");

  el.innerHTML = `
    <div class="badges">
      ${hasSale ? `<span class="badge-sale">SALE</span>` : ``}
      ${hasHit ? `<span class="badge-hit">ХИТ</span>` : ``}
    </div>

    <div class="card-tools" aria-hidden="true">
      <button class="toolbtn" type="button" title="Избранное">♡</button>
      <button class="toolbtn" type="button" title="Сравнение">≋</button>
    </div>

    <a class="pcard__img" href="./product.html?id=${encodeURIComponent(p.id)}" aria-label="${escapeHtml(p.title)}">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy" />
    </a>

    <div class="pcard__body">
      <a class="pcard__title" href="./product.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a>

      <div class="pcard__meta">
        <span>${escapeHtml(p.brand || "")}</span>
        <span>${p.inStock ? "В наличии" : "Нет в наличии"}</span>
      </div>

      <div class="pcard__price">
        <span class="price__now">${formatPrice(p.price, CURRENCY)}</span>
        ${p.oldPrice && p.oldPrice > p.price ? `<span class="price__old">${formatPrice(p.oldPrice, CURRENCY)}</span>` : ``}
      </div>

      ${bullets.length ? `<ul class="pcard__bullets">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ``}
    </div>
  `;

  const openCard = () => {
    window.location.href = `./product.html?id=${encodeURIComponent(p.id)}`;
  };

  el.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    openCard();
  });

  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCard();
    }
  });

  return el;
}

function defaultVariant(p) {
  const sizes = p?.variants?.sizes || [];
  const colors = p?.variants?.colors || [];
  return {
    size: sizes[0] || "",
    color: colors[0] || ""
  };
}
function variantLabel(v) {
  const a = v?.size ? `размер ${v.size}` : "";
  const b = v?.color ? `цвет ${v.color}` : "";
  return [a, b].filter(Boolean).join(", ") || "вариант по умолчанию";
}

function syncControlsFromState() {
  // price
  const pmin = $("#fPriceMin"); const pmax = $("#fPriceMax");
  if (pmin) pmin.value = state.priceMin;
  if (pmax) pmax.value = state.priceMax;

  // inStock
  const inst = $("#fInStock");
  if (inst) inst.checked = !!state.inStock;

  // category radios
  $$(`#fCategory input[type="radio"]`).forEach((r) => {
    r.checked = String(r.value) === String(state.category || "");
  });

  // sort chips
  $$(".sort-chips .chip").forEach((c) => {
    c.classList.toggle("is-active", c.dataset.sort === state.sort);
  });

  // view
  $$(".segmented__btn").forEach((b) => {
    const active = b.dataset.view === state.view;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function wireControls(products) {
  // search from header
  const searchForm = $("#catalogSearchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = String(searchForm.querySelector('input[name="q"]')?.value || "").trim();
      state.q = val;
      state.page = 1;
      renderAll();
    });
    const inp = searchForm.querySelector('input[name="q"]');
    if (inp) inp.value = state.q || "";
  }

  // price presets
  $("#pricePresets")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-max]");
    if (!btn) return;
    state.priceMin = "";
    state.priceMax = String(btn.dataset.max || "");
  });

  // apply/reset
  $("#applyFiltersBtn")?.addEventListener("click", () => {
    state.page = 1;
    renderAll();
  });
  $("#resetFiltersBtn")?.addEventListener("click", () => {
    resetAllFilters();
    renderAll();
  });

  // inStock
  $("#fInStock")?.addEventListener("change", (e) => {
    state.inStock = !!e.target.checked;
  });

  // category
  $("#fCategory")?.addEventListener("change", (e) => {
    const r = e.target.closest('input[type="radio"]');
    if (!r) return;
    state.category = r.value || "";
  });

  // price inputs
  $("#fPriceMin")?.addEventListener("input", (e) => (state.priceMin = e.target.value));
  $("#fPriceMax")?.addEventListener("input", (e) => (state.priceMax = e.target.value));

  // sort chips
  $$(".sort-chips .chip").forEach((c) => {
    c.addEventListener("click", () => {
      state.sort = c.dataset.sort || "popular";
      state.page = 1;
      renderAll();
    });
  });

  // view
  $$(".segmented__btn").forEach((b) => {
    b.addEventListener("click", () => {
      state.view = b.dataset.view || "grid";
      renderAll();
    });
  });

  // listen seed updates from admin
  window.addEventListener("vm:products-updated", () => {
    renderAll();
    renderBrands(getProducts());
  });

  // Home featured hook
  window.addEventListener("vm:home-featured-mount", (ev) => {
    const gridId = ev.detail?.gridId;
    const homeGrid = document.getElementById(gridId);
    if (!homeGrid) return;
    renderHomeFeatured(homeGrid, getProducts());
  });
}

function resetAllFilters() {
  state = {
    ...state,
    page: 1,
    q: "",
    category: "",
    inStock: false,
    priceMin: "",
    priceMax: "",
    brands: [],
    tag: "",
    sort: "popular",
    view: state.view || "grid"
  };
  // sync header search input
  const sf = $("#catalogSearchForm");
  if (sf) sf.querySelector('input[name="q"]').value = "";
  syncControlsFromState();
}

function renderAll() {
  const products = getProducts();
  syncControlsFromState();
  renderBrands(products);
  renderProductsGrid(products);
}

export function initCatalog({ qp } = {}) {
  state = parseInitialState(qp || getQueryParams());
  syncControlsFromState();
  const products = getProducts();

  renderBrands(products);
  wireControls(products);
  renderAll();
}

/* HOME FEATURED */
function renderHomeFeatured(root, products) {
  const list = [...products]
    .filter((p) => (p.tags || []).includes("HIT") || (p.tags || []).includes("SALE") || calcDiscountPercent(p.price, p.oldPrice) > 0)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 8);

  root.innerHTML = "";
  list.slice(0, 4).forEach((p) => root.appendChild(productCard(p)));
}

/* escape */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}