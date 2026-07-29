import { useState, useEffect } from "react";
import { haptic } from "../utils/telegram";
import { OnboardIllustration1, OnboardIllustration2, OnboardIllustration3 } from "../utils/icons";

const slides = [
  {
    title: "1% soliq avtomatik",
    desc: "UzTax avtomatik tarzda 1% soliqni hisoblab beradi. Siz faqat daromad olasiz.",
    Illustration: OnboardIllustration1,
  },
  {
    title: "Bir bosishda to'lov",
    desc: "Payme, Click va Uzum orqali to'lov havolalarini yarating va mijozlarga yuboring.",
    Illustration: OnboardIllustration2,
  },
  {
    title: "Xarajatlar nazorati",
    desc: "Barcha xarajatlaringizni kuzatib boring va oylik hisobotlarni qabul qiling.",
    Illustration: OnboardIllustration3,
  },
];

export function useOnboarding() {
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem("uztax_onboarded") === "1"; }
    catch { return false; }
  });
  const dismiss = () => {
    try { localStorage.setItem("uztax_onboarded", "1"); } catch {}
    setSeen(true);
  };
  return { seen, dismiss };
}

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const s = slides[slide];

  useEffect(() => {
    const t = setInterval(() => {
      setAnimDir("right");
      setSlide((p) => (p < slides.length - 1 ? p + 1 : 0));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const next = () => {
    haptic("impact");
    if (slide < slides.length - 1) {
      setAnimDir("right");
      setSlide(slide + 1);
    } else onDone();
  };

  const skip = () => {
    haptic("impact");
    onDone();
  };

  return (
    <div className="onboard-overlay">
      <div className="onboard-content">
        <div key={slide} className={`onboard-slide slide-${animDir}`}>
          <div className="onboard-illustration">
            <s.Illustration />
          </div>
          <h2 className="onboard-title">{s.title}</h2>
          <p className="onboard-desc">{s.desc}</p>
        </div>
        <div className="onboard-dots">
          {slides.map((_, i) => (
            <button key={i} className={`onboard-dot${i === slide ? " active" : ""}`} onClick={() => { haptic("impact"); setAnimDir(i > slide ? "right" : "left"); setSlide(i); }} />
          ))}
        </div>
      </div>
      <div className="onboard-footer">
        <button className="btn btn-gold" onClick={next}>
          {slide < slides.length - 1 ? "Davom etish" : "Boshlash"}
        </button>
        {slide < slides.length - 1 && (
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={skip}>
            O'tkazib yuborish
          </button>
        )}
      </div>
    </div>
  );
}
