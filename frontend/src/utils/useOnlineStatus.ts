import { useState, useEffect } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const go = () => setOnline(true);
    const goAway = () => setOnline(false);
    window.addEventListener("online", go);
    window.addEventListener("offline", goAway);
    return () => {
      window.removeEventListener("online", go);
      window.removeEventListener("offline", goAway);
    };
  }, []);
  return online;
}
