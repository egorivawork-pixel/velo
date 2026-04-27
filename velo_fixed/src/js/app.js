// FILE: /src/js/app.js
import { initSeedIfNeeded } from "./seed.js";
import { initHeaderCartBadge, getQueryParams } from "./utils.js";
import { initToasts } from "./ui.js";
import { initCatalog } from "./catalog.js";
import { initProduct } from "./product.js";
import { initCart } from "./cart.js";
import { initAdmin } from "./admin.js";

async function boot() {
  initToasts();

  // 1) seed -> localStorage (only if empty)
  await initSeedIfNeeded();

  // 2) header cart badge on any page
  initHeaderCartBadge();

  // 3) page routers
  const page = document.body?.dataset?.page || "";
  const qp = getQueryParams();

  if (page === "catalog") initCatalog({ qp });
  if (page === "product") initProduct({ qp });
  if (page === "cart") initCart();
  if (page === "admin") initAdmin();

  // 4) Home featured: mount via event (so catalog.js can reuse card renderer)
  if (page === "home") {
    const grid = document.getElementById("homeFeaturedGrid");
    if (grid) {
      window.dispatchEvent(new CustomEvent("vm:home-featured-mount", { detail: { gridId: "homeFeaturedGrid" } }));
    }
  }
}

boot();