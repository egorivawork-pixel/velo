// FILE: /src/js/ui.js
import { $, $$ } from "./utils.js";

let toastRoot = null;

export function initToasts() {
  toastRoot = $("#toasts") || null;
}

export function toast(title, text = "", { timeout = 2600 } = {}) {
  if (!toastRoot) initToasts();
  if (!toastRoot) return;

  const el = document.createElement("div");
  el.className = "toast";

  el.innerHTML = `
    <div class="toast__icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M20 7h-3V4H7v3H4v13h16V7Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M7 7h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="toast__body">
      <div class="toast__title">${escapeHtml(title)}</div>
      ${text ? `<div class="toast__text">${escapeHtml(text)}</div>` : ``}
    </div>
    <button class="toast__x" type="button" aria-label="Закрыть">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  const close = () => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    setTimeout(() => el.remove(), 150);
  };

  el.querySelector(".toast__x")?.addEventListener("click", close);

  el.style.opacity = "0";
  el.style.transform = "translateY(6px)";
  toastRoot.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transition = "opacity .15s ease, transform .15s ease";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });

  if (timeout > 0) setTimeout(close, timeout);
}

export function openModal(dialogEl) {
  if (!dialogEl) return;
  if (typeof dialogEl.showModal === "function") dialogEl.showModal();
  else dialogEl.setAttribute("open", "open");
}

export function closeModal(dialogEl) {
  if (!dialogEl) return;
  if (typeof dialogEl.close === "function") dialogEl.close();
  else dialogEl.removeAttribute("open");
}

export function wireModalCloseButtons(root = document) {
  $$("[data-close-modal]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const dlg = btn.closest("dialog");
      if (dlg) closeModal(dlg);
    });
  });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}