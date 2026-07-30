const WebApp = () => (window as any).Telegram?.WebApp;

export function showAlert(msg: string) {
  try {
    WebApp()?.showAlert?.(msg);
  } catch { alert(msg); }
}

export function showConfirm(msg: string): Promise<boolean> {
  try {
    return WebApp()?.showConfirm?.(msg) ?? Promise.resolve(false);
  } catch { return Promise.resolve(confirm(msg)); }
}

export function haptic(type: "success" | "warning" | "error" | "impact" | "light" | "medium" | "heavy" = "impact") {
  try {
    const h = WebApp()?.HapticFeedback;
    if (!h) return;
    const actions: Record<string, () => void> = {
      success: () => h.notificationOccurred?.("success"),
      warning: () => h.notificationOccurred?.("warning"),
      error: () => h.notificationOccurred?.("error"),
      light: () => h.impactOccurred?.("light"),
      medium: () => h.impactOccurred?.("medium"),
      heavy: () => h.impactOccurred?.("heavy"),
      impact: () => h.impactOccurred?.("medium"),
    };
    actions[type]?.();
  } catch {}
}

export function copyToClipboard(text: string) {
  try {
    WebApp()?.clipboard?.writeText?.(text);
    haptic("success");
  } catch {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

// === Telegram Mini App advanced features ===

export function setMainButton(text: string, color?: string, onClick?: () => void) {
  try {
    const btn = WebApp()?.MainButton;
    if (!btn) return;
    btn.setText(text);
    if (color) btn.setParams({ color });
    btn.show();
    if (onClick) btn.onClick?.(onClick);
  } catch {}
}

export function hideMainButton() {
  try { WebApp()?.MainButton?.hide(); } catch {}
}

export function showBackButton(onClick: () => void) {
  try {
    const btn = WebApp()?.BackButton;
    if (!btn) return;
    btn.show();
    btn.onClick?.(onClick);
  } catch {}
}

export function hideBackButton() {
  try { WebApp()?.BackButton?.hide(); } catch {}
}

export function showPopup(title: string, message: string, btnText = "OK") {
  try {
    WebApp()?.showPopup?.({ title, message, buttons: [{ type: "default", text: btnText }] });
  } catch {}
}

export async function requestBiometric(): Promise<boolean> {
  try {
    const bio = WebApp()?.BiometricManager;
    if (!bio) return false;
    await bio.init();
    if (!bio.isAccessGranted) {
      bio.requestAccess?.();
      return false;
    }
    return true;
  } catch { return false; }
}

export function getTelegramUser() {
  try { return WebApp()?.initDataUnsafe?.user; } catch { return null; }
}

export function formatSum(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
