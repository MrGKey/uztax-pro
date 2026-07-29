let toastTimer: ReturnType<typeof setTimeout>;

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

export function haptic(type: "success" | "warning" | "error" | "impact" | "light" | "medium" | "heavy" = "impact") {
  try {
    const h = (window as any).Telegram?.WebApp?.HapticFeedback;
    if (!h) return;
    if (type === "success") h.notificationOccurred?.("success");
    else if (type === "warning") h.notificationOccurred?.("warning");
    else if (type === "error") h.notificationOccurred?.("error");
    else if (type === "light") h.impactOccurred?.("light");
    else if (type === "medium") h.impactOccurred?.("medium");
    else if (type === "heavy") h.impactOccurred?.("heavy");
    else h.impactOccurred?.("medium");
  } catch {}
}

export function copyToClipboard(text: string) {
  try {
    (window as any).Telegram?.WebApp?.clipboard?.writeText?.(text);
    haptic("success");
    showAlert("Nusxalandi!");
  } catch {
    navigator.clipboard.writeText(text).then(() => showAlert("Nusxalandi!"));
  }
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
