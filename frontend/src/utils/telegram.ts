export function showAlert(msg: string) {
  try {
    (window as any).Telegram?.WebApp?.showAlert?.(msg);
  } catch {
    alert(msg);
  }
}

export function showConfirm(msg: string): Promise<boolean> {
  try {
    return (window as any).Telegram?.WebApp?.showConfirm?.(msg) ?? Promise.resolve(false);
  } catch {
    return Promise.resolve(confirm(msg));
  }
}

export function haptic(type: "success" | "warning" | "error" | "impact" = "impact") {
  try {
    const h = (window as any).Telegram?.WebApp?.HapticFeedback;
    if (!h) return;
    if (type === "success") h.notificationOccurred?.("success");
    else if (type === "warning") h.notificationOccurred?.("warning");
    else if (type === "error") h.notificationOccurred?.("error");
    else h.impactOccurred?.("medium");
  } catch {}
}

export function copyToClipboard(text: string) {
  try {
    (window as any).Telegram?.WebApp?.clipboard?.writeText?.(text);
    haptic("success");
    showAlert("Skopirovano!");
  } catch {
    navigator.clipboard.writeText(text).then(() => showAlert("Skopirovano!"));
  }
}

export function formatSum(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}
