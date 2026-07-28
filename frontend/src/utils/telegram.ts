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

export function copyToClipboard(text: string) {
  try {
    (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    (window as any).Telegram?.WebApp?.clipboard?.writeText?.(text);
    showAlert("Скопировано!");
  } catch {
    navigator.clipboard.writeText(text).then(() => showAlert("Скопировано!"));
  }
}

export function formatSum(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}
