import { getLanguage, onLanguageChange, t } from "./i18n";
import { APP_VERSION } from "./version";

export function supportMailto(kind: "bugreport" | "contact"): string {
  const subject = `Geodata Inspector & Cleaner v${APP_VERSION} – ${t(kind === "bugreport" ? "support.bugSubject" : "support.contactSubject")}`;
  const body = kind === "bugreport" ? t("support.bugBody") : "";
  return `mailto:michael.radeck@email.de?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;
}

export function initAppFooter(openCopyright: () => void): void {
  const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const dialog = element<HTMLDialogElement>("support-dialog");
  const opener = element<HTMLButtonElement>("footer-support");
  opener.addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("close", () => opener.focus());
  element<HTMLButtonElement>("footer-licenses").addEventListener("click", openCopyright);
  element<HTMLElement>("footer-year").textContent = String(new Date().getFullYear());

  const sync = () => {
    element<HTMLAnchorElement>("footer-help").href = `./help.html?lang=${getLanguage()}`;
    element<HTMLAnchorElement>("support-bugreport").href = supportMailto("bugreport");
    element<HTMLAnchorElement>("support-contact").href = supportMailto("contact");
  };
  sync();
  onLanguageChange(sync);
}
