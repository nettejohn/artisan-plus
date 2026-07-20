/**
 * Vitrine Artisan+ — Site marketing complet
 * Routes : /, /devis-facture-:metier, /artisan-:ville,
 *          /alternative-:concurrent, /cgu, /politique-confidentialite
 */
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "./i18n";

const P  = "#FF8C00";
const D  = "#0a1628";
const C  = "#111e35";
const G  = "#8899aa";
const BASE = "https://www.artisan-plus.fr";

// ── Styles globaux animés ─────────────────────────────────────────────────────
function VitrineStyles() {
  useEffect(() => {
    const id = "ap-vitrine-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      /* ══ LAYOUT ════════════════════════════════════════ */
      * { box-sizing: border-box; }

      /* ══ GRADIENT TEXT ══════════════════════════════════ */
      .ap-grad-text {
        background: linear-gradient(125deg, #FF8C00 0%, #FFB347 35%, #FF6000 65%, #FFCC44 100%);
        background-size: 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: ap-grad-shift 6s ease infinite;
        filter: drop-shadow(0 0 28px rgba(255,140,0,.55));
      }
      @keyframes ap-grad-shift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

      /* ══ BACKGROUND ORBS ════════════════════════════════ */
      @keyframes ap-orb1 { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(80px,-60px) scale(1.12)} 65%{transform:translate(-50px,70px) scale(.92)} }
      @keyframes ap-orb2 { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(-100px,40px) scale(1.08)} 80%{transform:translate(60px,-30px) scale(.96)} }
      @keyframes ap-orb3 { 0%,100%{transform:translate(0,0)} 35%{transform:translate(60px,80px) scale(1.1)} 70%{transform:translate(-30px,-40px) scale(.94)} }

      /* ══ CARDS ══════════════════════════════════════════ */
      .ap-card { transition: transform .32s cubic-bezier(.34,1.56,.64,1), box-shadow .32s ease, border-color .32s ease !important; }
      .ap-card:hover { transform: translateY(-8px) !important; box-shadow: 0 32px 72px rgba(0,0,0,.6), 0 0 50px rgba(255,140,0,.14) !important; border-color: rgba(255,140,0,.45) !important; }

      /* ══ SPOTLIGHT (cursor glow inside card) ════════════ */
      .ap-spotlight { position: relative; overflow: hidden; }
      .ap-spotlight::before {
        content: '';
        position: absolute; inset: 0;
        border-radius: inherit;
        background: radial-gradient(circle 280px at var(--mx,50%) var(--my,50%), rgba(255,140,0,.18), transparent 65%);
        opacity: 0;
        transition: opacity .35s ease;
        pointer-events: none;
        z-index: 0;
      }
      .ap-spotlight:hover::before { opacity: 1; }
      .ap-spotlight > * { position: relative; z-index: 1; }

      /* ══ BUTTONS ════════════════════════════════════════ */
      .ap-btn { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease !important; }
      .ap-btn:hover { transform: translateY(-3px) scale(1.03) !important; box-shadow: 0 12px 36px rgba(255,140,0,.5) !important; }
      .ap-btn:active { transform: translateY(1px) scale(.97) !important; }
      .ap-btn-ghost { transition: transform .18s ease, box-shadow .18s ease, background .18s ease !important; }
      .ap-btn-ghost:hover { transform: translateY(-2px) !important; background: rgba(255,255,255,.11) !important; box-shadow: 0 8px 24px rgba(0,0,0,.35) !important; }
      .ap-btn-primary { position: relative; overflow: hidden; }
      .ap-btn-primary::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.2) 0%,transparent 60%); opacity:0; transition:opacity .25s; border-radius:inherit; }
      .ap-btn-primary:hover::after { opacity:1; }

      /* ══ BADGE SHIMMER ══════════════════════════════════ */
      .ap-badge { position: relative; overflow: hidden; }
      .ap-badge::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent); animation:ap-shimmer 3.5s ease-in-out infinite; }
      @keyframes ap-shimmer { 0%{left:-100%} 100%{left:220%} }

      /* ══ FLOAT / GLOW ═══════════════════════════════════ */
      @keyframes ap-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      .ap-float { animation: ap-float 5s ease-in-out infinite; }
      @keyframes ap-glow { 0%,100%{box-shadow:0 0 30px rgba(255,140,0,.2),0 48px 130px rgba(0,0,0,.7)} 50%{box-shadow:0 0 60px rgba(255,140,0,.42),0 48px 130px rgba(0,0,0,.7)} }
      .ap-glow { animation: ap-glow 3.5s ease-in-out infinite; }

      /* ══ INVOICE ANIMATIONS ═════════════════════════════ */
      @keyframes ap-fade-up { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:none} }
      @keyframes ap-sign { 0%{stroke-dashoffset:170;opacity:0} 12%{opacity:1} 100%{stroke-dashoffset:0} }

      /* ══ HOUSE ANIMATIONS ═══════════════════════════════ */
      @keyframes ap-brick { 0%,68%{opacity:0;transform:translateY(-8px) scale(.88)} 100%{opacity:1;transform:none} }
      @keyframes ap-roof-a { 0%,52%{opacity:0;transform:translateY(-16px)} 100%{opacity:1;transform:none} }
      @keyframes ap-win { 0%,72%{opacity:0;transform:scale(.3)} 100%{opacity:1;transform:none} }
      @keyframes ap-check { 0%,88%{opacity:0;transform:scale(.2) rotate(-15deg)} 100%{opacity:1;transform:none} }

      /* ══ REVENUE ANIMATIONS ═════════════════════════════ */
      @keyframes ap-avatar { 0%{opacity:0;transform:scale(0) rotate(-8deg)} 65%{transform:scale(1.18) rotate(2deg)} 100%{opacity:1;transform:none} }

      /* ══ FAQ ════════════════════════════════════════════ */
      summary::-webkit-details-marker { display:none; }
      details { transition: border-color .25s ease; }
      details[open] { border-color: rgba(255,140,0,.4) !important; box-shadow: 0 0 20px rgba(255,140,0,.06) !important; }
      .ap-faq-plus { transition: transform .28s cubic-bezier(.34,1.56,.64,1); display:inline-block; }
      details[open] .ap-faq-plus { transform: rotate(45deg); }

      /* ══ NEON DIVIDER LINE ══════════════════════════════ */
      .ap-neon-line { width:60px; height:3px; border-radius:99px; background:linear-gradient(90deg,#FF8C00 0%,rgba(255,140,0,.3) 50%,transparent 100%); margin-top:14px; }

      /* ══ SECTION GRID PATTERN ═══════════════════════════ */
      .ap-grid-bg {
        background-image: linear-gradient(rgba(255,140,0,.05) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,140,0,.05) 1px, transparent 1px);
        background-size: 64px 64px;
      }

      /* ══ GLASSMORPHISM ══════════════════════════════════ */
      .ap-glass {
        background: rgba(255,255,255,.03) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.08) !important;
      }

      /* ══ HERO ENTRY ANIMATION ═══════════════════════════ */
      @keyframes ap-hero-in { 0%{opacity:0;transform:translateY(32px)} 100%{opacity:1;transform:none} }
      .ap-hero-line1 { animation: ap-hero-in .7s cubic-bezier(.16,1,.3,1) .1s both; }
      .ap-hero-line2 { animation: ap-hero-in .7s cubic-bezier(.16,1,.3,1) .22s both; }
      .ap-hero-line3 { animation: ap-hero-in .7s cubic-bezier(.16,1,.3,1) .32s both; }
      .ap-hero-sub   { animation: ap-hero-in .7s cubic-bezier(.16,1,.3,1) .42s both; }
      .ap-hero-cta   { animation: ap-hero-in .7s cubic-bezier(.16,1,.3,1) .52s both; }
      .ap-hero-proof { animation: ap-hero-in .7s cubic-bezier(.16,1,.3,1) .62s both; }
      .ap-hero-phone { animation: ap-hero-in .9s cubic-bezier(.16,1,.3,1) .3s both; }
    `;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ── Fond animé hero ───────────────────────────────────────────────────────────
function HeroBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Grille de points */}
      <div className="ap-grid-bg" style={{ position: "absolute", inset: 0, opacity: .6 }} />
      {/* Orbe 1 — haut gauche orange vif */}
      <div style={{ position: "absolute", top: "-20%", left: "-12%", width: "70vw", height: "70vw", maxWidth: 800, maxHeight: 800, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, rgba(255,140,0,.28) 0%, rgba(255,100,0,.06) 40%, transparent 70%)", animation: "ap-orb1 16s ease-in-out infinite", filter: "blur(2px)" }} />
      {/* Orbe 2 — centre droite bleu profond */}
      <div style={{ position: "absolute", top: "10%", right: "-20%", width: "60vw", height: "60vw", maxWidth: 700, maxHeight: 700, borderRadius: "50%", background: "radial-gradient(circle at 60% 40%, rgba(30,80,200,.22) 0%, transparent 65%)", animation: "ap-orb2 21s ease-in-out infinite", filter: "blur(4px)" }} />
      {/* Orbe 3 — bas centre orange doux */}
      <div style={{ position: "absolute", bottom: "-15%", left: "25%", width: "50vw", height: "50vw", maxWidth: 600, maxHeight: 600, borderRadius: "50%", background: "radial-gradient(circle at 50% 60%, rgba(255,100,0,.14) 0%, transparent 70%)", animation: "ap-orb3 13s ease-in-out infinite" }} />
      {/* Halo lumineux centré (style Stripe) */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "100%", maxWidth: 900, height: 400, background: "radial-gradient(ellipse at center, rgba(255,140,0,.07) 0%, transparent 70%)", pointerEvents: "none" }} />
    </div>
  );
}

// ── Carte spotlight (cursor-glow) ─────────────────────────────────────────────
function SpotlightCard({ children, style = {}, className = "", ...props }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`ap-spotlight ap-card ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {}, ...props }) {
  const ref = useRef(null);
  const [phase, setPhase] = useState("init");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) { setPhase("show"); return; }
    setPhase("hide");
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setPhase("in"); obs.disconnect(); }
    }, { threshold: 0.06, rootMargin: "0px 0px -32px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const hidden = phase === "hide";
  return (
    <div ref={ref} {...props} style={{
      opacity: hidden ? 0 : 1,
      transform: hidden ? "translateY(24px)" : "none",
      transition: phase === "in" ? `opacity .65s cubic-bezier(.16,1,.3,1) ${delay}s, transform .65s cubic-bezier(.16,1,.3,1) ${delay}s` : undefined,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Animation 1 : Devis qui se remplit ────────────────────────────────────────
function InvoiceAnimation() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "340px", margin: "0 auto" }} className="ap-float">
      <div className="ap-glow" style={{ background: "#0d1f3c", borderRadius: "32px", border: "2px solid rgba(255,140,0,0.4)", padding: "14px" }}>
        <div style={{ background: D, borderRadius: "22px", overflow: "hidden", padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", animation: "ap-fade-up .4s ease .1s both" }}>
            <span style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>Artisan<span style={{ color: P }}>+</span></span>
            <div style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(76,175,80,0.3)" }}>✓ Pro</div>
          </div>
          <div style={{ background: C, borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,140,0,0.15)", animation: "ap-fade-up .4s ease .3s both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <div style={{ color: "white", fontWeight: "800", fontSize: "11px", letterSpacing: ".5px" }}>DEVIS N° 2025-047</div>
                <div style={{ color: G, fontSize: "10px", marginTop: "3px" }}>M. Dupont — Réfection toiture</div>
              </div>
              <div style={{ color: G, fontSize: "9px" }}>15 jan. 2025</div>
            </div>
            {[
              { label: "Main d'œuvre (8h)", price: "960,00 €", delay: ".6s" },
              { label: "Tuiles terre cuite (120m²)", price: "1 280,00 €", delay: "1.0s" },
              { label: "Faîtières + Solins", price: "320,00 €", delay: "1.4s" },
              { label: "Échafaudage 3 jours", price: "450,00 €", delay: "1.8s" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", animation: `ap-fade-up .35s ease ${l.delay} both` }}>
                <span style={{ color: G, fontSize: "10px", flex: 1 }}>{l.label}</span>
                <span style={{ color: "white", fontSize: "10px", fontWeight: "700", marginLeft: "8px" }}>{l.price}</span>
              </div>
            ))}
            <div style={{ marginTop: "12px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "10px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", animation: "ap-fade-up .4s ease 2.2s both" }}>
              <span style={{ color: "white", fontWeight: "800", fontSize: "11px" }}>TOTAL TTC</span>
              <span style={{ color: P, fontWeight: "900", fontSize: "16px" }}>3 010,00 €</span>
            </div>
            <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", animation: "ap-fade-up .4s ease 2.8s both" }}>
              <div style={{ color: G, fontSize: "9px", textAlign: "center", marginBottom: "8px" }}>Signature client</div>
              <svg viewBox="0 0 160 40" width="100%" height="38">
                <path d="M8,32 C18,22 26,10 38,20 C50,30 56,12 68,22 C80,32 86,16 100,24 C114,32 120,18 136,22 C146,24 150,20 156,16" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="170" style={{ animation: "ap-sign 1.3s ease 3.2s both" }} />
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", animation: "ap-fade-up .4s ease 4.0s both" }}>
            <div style={{ flex: 1, background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: "10px", padding: "8px", textAlign: "center" }}>
              <div style={{ color: "#4CAF50", fontSize: "10px", fontWeight: "800" }}>✓ SIGNÉ</div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "10px", padding: "8px", textAlign: "center" }}>
              <div style={{ color: P, fontSize: "10px", fontWeight: "800" }}>💶 PAYÉ</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: "28px", right: "-18px", background: "rgba(76,175,80,0.93)", color: "white", fontSize: "11px", fontWeight: "700", padding: "7px 12px", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap", animation: "ap-fade-up .4s ease 4.3s both" }}>
        ✓ Devis signé !
      </div>
      <div style={{ position: "absolute", bottom: "72px", left: "-20px", background: "rgba(255,140,0,0.93)", color: "white", fontSize: "11px", fontWeight: "700", padding: "7px 12px", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap", animation: "ap-fade-up .4s ease 4.6s both" }}>
        💶 Paiement reçu
      </div>
    </div>
  );
}

// ── Animation 2 : Maison qui se construit ────────────────────────────────────
function HouseAnimation() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="210" height="210" viewBox="0 0 210 210" fill="none" aria-hidden="true">
        {/* Foundation */}
        <rect x="26" y="174" width="158" height="10" rx="3" fill="rgba(255,140,0,0.25)" style={{ animation: "ap-brick .5s ease .1s both" }} />
        {/* Wall row 1 */}
        {[0,1,2,3,4,5].map(i => (
          <rect key={`r1-${i}`} x={26+i*26} y={148} width={24} height={24} rx="1.5" fill="rgba(255,140,0,0.13)" stroke="rgba(255,140,0,0.25)" strokeWidth=".8" style={{ animation: `ap-brick .35s ease ${0.25+i*0.07}s both` }} />
        ))}
        {/* Wall row 2 */}
        {[0,1,2,3,4,5].map(i => (
          <rect key={`r2-${i}`} x={26+i*26} y={122} width={24} height={24} rx="1.5" fill="rgba(255,140,0,0.13)" stroke="rgba(255,140,0,0.25)" strokeWidth=".8" style={{ animation: `ap-brick .35s ease ${0.75+i*0.07}s both` }} />
        ))}
        {/* Wall row 3 */}
        {[0,1,2,3,4,5].map(i => (
          <rect key={`r3-${i}`} x={26+i*26} y={96} width={24} height={24} rx="1.5" fill="rgba(255,140,0,0.13)" stroke="rgba(255,140,0,0.25)" strokeWidth=".8" style={{ animation: `ap-brick .35s ease ${1.2+i*0.07}s both` }} />
        ))}
        {/* Door */}
        <rect x="90" y="146" width="30" height="38" rx="3" fill="rgba(255,140,0,0.22)" stroke="rgba(255,140,0,0.45)" strokeWidth="1" style={{ animation: "ap-brick .4s ease 1.65s both" }} />
        <circle cx="115" cy="166" r="2.5" fill={P} style={{ animation: "ap-brick .3s ease 1.75s both" }} />
        {/* Windows */}
        <rect x="34" y="126" width="24" height="16" rx="3" fill="rgba(100,180,230,0.2)" stroke="rgba(100,180,230,0.4)" strokeWidth="1" style={{ animation: "ap-win .4s ease 1.7s both" }} />
        <line x1="46" y1="126" x2="46" y2="142" stroke="rgba(100,180,230,0.3)" strokeWidth=".8" style={{ animation: "ap-win .4s ease 1.8s both" }} />
        <rect x="152" y="126" width="24" height="16" rx="3" fill="rgba(100,180,230,0.2)" stroke="rgba(100,180,230,0.4)" strokeWidth="1" style={{ animation: "ap-win .4s ease 1.9s both" }} />
        <line x1="164" y1="126" x2="164" y2="142" stroke="rgba(100,180,230,0.3)" strokeWidth=".8" style={{ animation: "ap-win .4s ease 2.0s both" }} />
        {/* Roof */}
        <polygon points="12,98 105,30 198,98" fill="rgba(255,140,0,0.16)" stroke={P} strokeWidth="2.5" strokeLinejoin="round" style={{ animation: "ap-roof-a .6s ease 1.4s both" }} />
        {/* Chimney */}
        <rect x="140" y="44" width="18" height="36" rx="2.5" fill="rgba(255,140,0,0.22)" stroke="rgba(255,140,0,0.35)" strokeWidth="1" style={{ animation: "ap-roof-a .4s ease 1.85s both" }} />
        <circle cx="149" cy="37" r="5" fill="rgba(255,255,255,0.07)" style={{ animation: "ap-win .5s ease 2.2s both" }} />
        <circle cx="156" cy="28" r="7" fill="rgba(255,255,255,0.05)" style={{ animation: "ap-win .5s ease 2.4s both" }} />
        {/* Badge check */}
        <circle cx="172" cy="50" r="19" fill={P} style={{ animation: "ap-check .4s ease 2.6s both" }} />
        <path d="M163,50 L170,58 L182,38" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "ap-check .35s ease 2.9s both" }} />
      </svg>
    </div>
  );
}

// ── Animation 3 : Chiffre d'affaires qui monte ────────────────────────────────
function RevenueAnimation() {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) {
        obs.disconnect();
        setStarted(true);
        const target = 4820, duration = 1800, t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.round(ease * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);
  const AVATARS = ["🔧","⚡","🧱","🎨","🪚","🌿","🔥","🔑","🏗️","🪟"];
  return (
    <div ref={ref} style={{ background: C, borderRadius: "24px", border: "1px solid rgba(255,140,0,0.2)", padding: "36px 28px", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ color: G, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>CA mensuel moyen</div>
      <div style={{ color: P, fontSize: "clamp(40px,6vw,56px)", fontWeight: "900", lineHeight: "1", marginBottom: "8px", fontVariantNumeric: "tabular-nums" }}>
        {count.toLocaleString("fr-FR")} €
      </div>
      <div style={{ color: G, fontSize: "13px", marginBottom: "24px" }}>par artisan actif sur Artisan+</div>
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
        {AVATARS.map((av, i) => (
          <div key={i} style={{
            width: "40px", height: "40px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.22)", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px",
            animation: started ? `ap-avatar .4s ease ${i * 0.1}s both` : "none",
          }}>{av}</div>
        ))}
      </div>
    </div>
  );
}

// ── Données métiers (50 métiers) ──────────────────────────────────────────────
const METIERS = [
  // ── Top 20 (pages combinées métier+ville) ────────────────────────────────────
  { slug:"plombier",           label:"Plombier",             emoji:"🔧", art:"le",  accroche:"devis plomberie",          kw:"plombier",            desc:"plomberie et sanitaires" },
  { slug:"electricien",        label:"Électricien",          emoji:"⚡", art:"l'",  accroche:"devis électricité",         kw:"électricien",         desc:"travaux électriques" },
  { slug:"macon",              label:"Maçon",                emoji:"🧱", art:"le",  accroche:"devis maçonnerie",          kw:"maçon",               desc:"gros œuvre et maçonnerie" },
  { slug:"carreleur",          label:"Carreleur",            emoji:"🏠", art:"le",  accroche:"devis carrelage",           kw:"carreleur",           desc:"pose de carrelage et faïence" },
  { slug:"peintre",            label:"Peintre",              emoji:"🎨", art:"le",  accroche:"devis peinture",            kw:"peintre",             desc:"peinture et décoration" },
  { slug:"menuisier",          label:"Menuisier",            emoji:"🪚", art:"le",  accroche:"devis menuiserie",          kw:"menuisier",           desc:"menuiserie et ébénisterie" },
  { slug:"chauffagiste",       label:"Chauffagiste",         emoji:"🔥", art:"le",  accroche:"devis chauffage",           kw:"chauffagiste",        desc:"chauffage et climatisation" },
  { slug:"serrurier",          label:"Serrurier",            emoji:"🔑", art:"le",  accroche:"devis serrurerie",          kw:"serrurier",           desc:"serrurerie et sécurité" },
  { slug:"couvreur",           label:"Couvreur",             emoji:"🏗️", art:"le",  accroche:"devis toiture",             kw:"couvreur",            desc:"couverture et toiture" },
  { slug:"jardinier",          label:"Jardinier",            emoji:"🌿", art:"le",  accroche:"devis jardinage",           kw:"jardinier",           desc:"jardinage et espaces verts" },
  { slug:"charpentier",        label:"Charpentier",          emoji:"🌲", art:"le",  accroche:"devis charpente",           kw:"charpentier",         desc:"charpente bois et ossature" },
  { slug:"plaquiste",          label:"Plaquiste",            emoji:"🏗️", art:"le",  accroche:"devis plaquisterie",        kw:"plaquiste",           desc:"plaquisterie et cloisons sèches" },
  { slug:"facadier",           label:"Façadier",             emoji:"🏢", art:"le",  accroche:"devis façade",              kw:"façadier",            desc:"ravalement de façade et enduits" },
  { slug:"climaticien",        label:"Climaticien",          emoji:"❄️", art:"le",  accroche:"devis climatisation",       kw:"climaticien",         desc:"installation et maintenance climatisation" },
  { slug:"ramoneur",           label:"Ramoneur",             emoji:"🏠", art:"le",  accroche:"devis ramonage",            kw:"ramoneur",            desc:"ramonage et entretien cheminée" },
  { slug:"elagueur",           label:"Élagueur",             emoji:"🌳", art:"l'",  accroche:"devis élagage",             kw:"élagueur",            desc:"élagage et abattage d'arbres" },
  { slug:"paysagiste",         label:"Paysagiste",           emoji:"🌿", art:"le",  accroche:"devis paysagisme",          kw:"paysagiste",          desc:"aménagement paysager et jardins" },
  { slug:"pisciniste",         label:"Pisciniste",           emoji:"🏊", art:"le",  accroche:"devis piscine",             kw:"pisciniste",          desc:"construction et entretien piscine" },
  { slug:"terrassier",         label:"Terrassier",           emoji:"🚜", art:"le",  accroche:"devis terrassement",        kw:"terrassier",          desc:"terrassement et travaux de sol" },
  { slug:"vitrier",            label:"Vitrier",              emoji:"🪟", art:"le",  accroche:"devis vitrerie",            kw:"vitrier",             desc:"pose et remplacement vitrage" },
  // ── Métiers supplémentaires ──────────────────────────────────────────────────
  { slug:"etancheur",          label:"Étanchéiste",          emoji:"💧", art:"l'",  accroche:"devis étanchéité",          kw:"étanchéiste",         desc:"étanchéité et imperméabilisation" },
  { slug:"ferrailleur",        label:"Ferrailleur",          emoji:"⚙️", art:"le",  accroche:"devis ferraillage",         kw:"ferrailleur",         desc:"ferraillage et armatures béton" },
  { slug:"soudeur",            label:"Soudeur",              emoji:"🔩", art:"le",  accroche:"devis soudure",             kw:"soudeur",             desc:"soudure et assemblage métallique" },
  { slug:"metallier",          label:"Métallier",            emoji:"⚙️", art:"le",  accroche:"devis métallerie",          kw:"métallier",           desc:"métallerie et serrurerie industrielle" },
  { slug:"installateur-solaire",label:"Installateur solaire",emoji:"☀️", art:"l'",  accroche:"devis solaire",             kw:"installateur solaire",desc:"installation panneaux solaires photovoltaïques" },
  { slug:"nettoyeur",          label:"Nettoyeur",            emoji:"🧹", art:"le",  accroche:"devis nettoyage",           kw:"nettoyeur",           desc:"nettoyage professionnel de bâtiments" },
  { slug:"laveur-vitres",      label:"Laveur de vitres",     emoji:"🪟", art:"le",  accroche:"devis lavage vitres",       kw:"laveur de vitres",    desc:"lavage de vitres professionnel" },
  { slug:"debarrasseur",       label:"Débarrasseur",         emoji:"📦", art:"le",  accroche:"devis débarras",            kw:"débarrasseur",        desc:"débarras et vidage maison" },
  { slug:"domoticien",         label:"Domoticien",           emoji:"🏠", art:"le",  accroche:"devis domotique",           kw:"domoticien",          desc:"installation domotique et maison connectée" },
  { slug:"installateur-alarme",label:"Installateur alarme",  emoji:"🔒", art:"l'",  accroche:"devis alarme",              kw:"installateur alarme", desc:"installation alarme et sécurité" },
  { slug:"poseur-parquet",     label:"Poseur de parquet",    emoji:"🪵", art:"le",  accroche:"devis parquet",             kw:"poseur de parquet",   desc:"pose de parquet et sols stratifiés" },
  { slug:"poseur-fenetres",    label:"Poseur de fenêtres",   emoji:"🪟", art:"le",  accroche:"devis fenêtres",            kw:"poseur de fenêtres",  desc:"pose fenêtres et menuiseries extérieures" },
  { slug:"poseur-volets",      label:"Poseur de volets",     emoji:"🏠", art:"le",  accroche:"devis volets",              kw:"poseur de volets",    desc:"pose volets et stores" },
  { slug:"staffeur",           label:"Staffeur",             emoji:"🏛️", art:"le",  accroche:"devis staff",               kw:"staffeur",            desc:"décoration en staff et plâtre ornemental" },
  { slug:"stucateur",          label:"Stucateur",            emoji:"🎨", art:"le",  accroche:"devis stuc",                kw:"stucateur",           desc:"pose de stuc et enduits décoratifs" },
  { slug:"marbrier",           label:"Marbrier",             emoji:"🪨", art:"le",  accroche:"devis marbrerie",           kw:"marbrier",            desc:"marbrerie et pierre naturelle" },
  { slug:"paveur",             label:"Paveur",               emoji:"🧱", art:"le",  accroche:"devis pavage",              kw:"paveur",              desc:"pavage et dallage extérieur" },
  { slug:"frigoriste",         label:"Frigoriste",           emoji:"❄️", art:"le",  accroche:"devis froid industriel",    kw:"frigoriste",          desc:"installation et maintenance chambre froide" },
  { slug:"technicien-fibre",   label:"Technicien fibre",     emoji:"📡", art:"le",  accroche:"devis fibre optique",       kw:"technicien fibre",    desc:"installation fibre optique et réseau" },
  { slug:"installateur-pac",   label:"Installateur PAC",     emoji:"♨️", art:"l'",  accroche:"devis pompe à chaleur",     kw:"installateur PAC",    desc:"installation pompe à chaleur" },
  { slug:"deboucheur",         label:"Déboucheur",           emoji:"🔧", art:"le",  accroche:"devis débouchage",          kw:"déboucheur",          desc:"débouchage canalisation et assainissement" },
  { slug:"desinsectiseur",     label:"Désinsectiseur",       emoji:"🐛", art:"le",  accroche:"devis désinsectisation",    kw:"désinsectiseur",      desc:"désinsectisation et traitement nuisibles" },
  { slug:"derateur",           label:"Dératiseur",           emoji:"🐭", art:"le",  accroche:"devis dératisation",        kw:"dératiseur",          desc:"dératisation et lutte contre les nuisibles" },
  { slug:"miroitier",          label:"Miroitier",            emoji:"🪞", art:"le",  accroche:"devis miroiterie",          kw:"miroitier",           desc:"pose de miroirs et vitrages décoratifs" },
  { slug:"plombier-chauffagiste",label:"Plombier-chauffagiste",emoji:"🔧",art:"le",  accroche:"devis plomberie chauffage", kw:"plombier-chauffagiste",desc:"plomberie et chauffage combinés" },
  { slug:"electricien-industriel",label:"Électricien industriel",emoji:"⚡",art:"l'",accroche:"devis électricité industrielle",kw:"électricien industriel",desc:"électricité industrielle et tertiaire" },
  { slug:"isolateur",          label:"Isolateur thermique",  emoji:"🏠", art:"l'",  accroche:"devis isolation",           kw:"isolateur",           desc:"isolation thermique et phonique" },
  { slug:"echafaudeur",        label:"Échafaudeur",          emoji:"🏗️", art:"l'",  accroche:"devis échafaudage",         kw:"échafaudeur",         desc:"montage et location d'échafaudages" },
  { slug:"carreleur-mosaiste", label:"Carreleur mosaïste",   emoji:"🎨", art:"le",  accroche:"devis mosaïque",            kw:"carreleur mosaïste",  desc:"pose de mosaïque et carrelage décoratif" },
  { slug:"peintre-batiment",   label:"Peintre en bâtiment",  emoji:"🎨", art:"le",  accroche:"devis peinture bâtiment",   kw:"peintre en bâtiment", desc:"peinture intérieure et extérieure bâtiment" },
  { slug:"electricien-domotique",label:"Électricien domotique",emoji:"⚡",art:"l'",  accroche:"devis électricité domotique",kw:"électricien domotique",desc:"électricité et domotique maison connectée" },
];

// ── Données villes (300+ communes françaises >10 000 hab.) ────────────────────
const VILLES = [
  // ── Île-de-France ───────────────────────────────────────────────────────────
  { slug:"paris",                    label:"Paris",                    dept:"75", region:"Île-de-France",             pop:"2,1M"  },
  { slug:"boulogne-billancourt",     label:"Boulogne-Billancourt",     dept:"92", region:"Île-de-France",             pop:"120k"  },
  { slug:"saint-denis",              label:"Saint-Denis",              dept:"93", region:"Île-de-France",             pop:"110k"  },
  { slug:"argenteuil",               label:"Argenteuil",               dept:"95", region:"Île-de-France",             pop:"110k"  },
  { slug:"montreuil",                label:"Montreuil",                dept:"93", region:"Île-de-France",             pop:"105k"  },
  { slug:"nanterre",                 label:"Nanterre",                 dept:"92", region:"Île-de-France",             pop:"97k"   },
  { slug:"vitry-sur-seine",          label:"Vitry-sur-Seine",          dept:"94", region:"Île-de-France",             pop:"94k"   },
  { slug:"creteil",                  label:"Créteil",                  dept:"94", region:"Île-de-France",             pop:"91k"   },
  { slug:"asnières-sur-seine",       label:"Asnières-sur-Seine",      dept:"92", region:"Île-de-France",             pop:"88k"   },
  { slug:"colombes",                 label:"Colombes",                 dept:"92", region:"Île-de-France",             pop:"88k"   },
  { slug:"aubervilliers",            label:"Aubervilliers",            dept:"93", region:"Île-de-France",             pop:"86k"   },
  { slug:"versailles",               label:"Versailles",               dept:"78", region:"Île-de-France",             pop:"85k"   },
  { slug:"courbevoie",               label:"Courbevoie",               dept:"92", region:"Île-de-France",             pop:"85k"   },
  { slug:"rueil-malmaison",          label:"Rueil-Malmaison",          dept:"92", region:"Île-de-France",             pop:"83k"   },
  { slug:"aulnay-sous-bois",         label:"Aulnay-sous-Bois",        dept:"93", region:"Île-de-France",             pop:"82k"   },
  { slug:"champigny-sur-marne",      label:"Champigny-sur-Marne",     dept:"94", region:"Île-de-France",             pop:"78k"   },
  { slug:"saint-maur-des-fosses",    label:"Saint-Maur-des-Fossés",   dept:"94", region:"Île-de-France",             pop:"77k"   },
  { slug:"drancy",                   label:"Drancy",                   dept:"93", region:"Île-de-France",             pop:"68k"   },
  { slug:"noisy-le-grand",           label:"Noisy-le-Grand",          dept:"93", region:"Île-de-France",             pop:"68k"   },
  { slug:"issy-les-moulineaux",      label:"Issy-les-Moulineaux",     dept:"92", region:"Île-de-France",             pop:"67k"   },
  { slug:"levallois-perret",         label:"Levallois-Perret",        dept:"92", region:"Île-de-France",             pop:"65k"   },
  { slug:"neuilly-sur-seine",        label:"Neuilly-sur-Seine",       dept:"92", region:"Île-de-France",             pop:"62k"   },
  { slug:"clichy",                   label:"Clichy",                   dept:"92", region:"Île-de-France",             pop:"61k"   },
  { slug:"pantin",                   label:"Pantin",                   dept:"93", region:"Île-de-France",             pop:"57k"   },
  { slug:"le-blanc-mesnil",          label:"Le Blanc-Mesnil",         dept:"93", region:"Île-de-France",             pop:"56k"   },
  { slug:"fontenay-sous-bois",       label:"Fontenay-sous-Bois",      dept:"94", region:"Île-de-France",             pop:"53k"   },
  { slug:"maisons-alfort",           label:"Maisons-Alfort",          dept:"94", region:"Île-de-France",             pop:"53k"   },
  { slug:"sartrouville",             label:"Sartrouville",             dept:"78", region:"Île-de-France",             pop:"52k"   },
  { slug:"massy",                    label:"Massy",                    dept:"91", region:"Île-de-France",             pop:"47k"   },
  { slug:"meaux",                    label:"Meaux",                    dept:"77", region:"Île-de-France",             pop:"55k"   },
  { slug:"melun",                    label:"Melun",                    dept:"77", region:"Île-de-France",             pop:"41k"   },
  { slug:"pontault-combault",        label:"Pontault-Combault",       dept:"77", region:"Île-de-France",             pop:"40k"   },
  { slug:"gennevilliers",            label:"Gennevilliers",            dept:"92", region:"Île-de-France",             pop:"41k"   },
  { slug:"vincennes",                label:"Vincennes",                dept:"94", region:"Île-de-France",             pop:"49k"   },
  { slug:"montrouge",                label:"Montrouge",                dept:"92", region:"Île-de-France",             pop:"49k"   },
  { slug:"villejuif",                label:"Villejuif",                dept:"94", region:"Île-de-France",             pop:"54k"   },
  { slug:"saint-germain-en-laye",    label:"Saint-Germain-en-Laye",   dept:"78", region:"Île-de-France",             pop:"40k"   },
  { slug:"poissy",                   label:"Poissy",                   dept:"78", region:"Île-de-France",             pop:"39k"   },
  { slug:"la-courneuve",             label:"La Courneuve",             dept:"93", region:"Île-de-France",             pop:"40k"   },
  { slug:"bobigny",                  label:"Bobigny",                  dept:"93", region:"Île-de-France",             pop:"51k"   },
  { slug:"clamart",                  label:"Clamart",                  dept:"92", region:"Île-de-France",             pop:"50k"   },
  { slug:"orly",                     label:"Orly",                     dept:"94", region:"Île-de-France",             pop:"21k"   },
  { slug:"chatou",                   label:"Chatou",                   dept:"78", region:"Île-de-France",             pop:"30k"   },
  { slug:"houilles",                 label:"Houilles",                 dept:"78", region:"Île-de-France",             pop:"32k"   },
  { slug:"conflans-sainte-honorine", label:"Conflans-Sainte-Honorine",dept:"78", region:"Île-de-France",             pop:"35k"   },
  { slug:"noisy-le-sec",             label:"Noisy-le-Sec",            dept:"93", region:"Île-de-France",             pop:"41k"   },
  { slug:"stains",                   label:"Stains",                   dept:"93", region:"Île-de-France",             pop:"37k"   },
  // ── Auvergne-Rhône-Alpes ───────────────────────────────────────────────────
  { slug:"lyon",                     label:"Lyon",                     dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"520k"  },
  { slug:"saint-etienne",            label:"Saint-Étienne",            dept:"42", region:"Auvergne-Rhône-Alpes",      pop:"175k"  },
  { slug:"grenoble",                 label:"Grenoble",                 dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"160k"  },
  { slug:"villeurbanne",             label:"Villeurbanne",             dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"150k"  },
  { slug:"clermont-ferrand",         label:"Clermont-Ferrand",        dept:"63", region:"Auvergne-Rhône-Alpes",      pop:"142k"  },
  { slug:"annecy",                   label:"Annecy",                   dept:"74", region:"Auvergne-Rhône-Alpes",      pop:"130k"  },
  { slug:"valence",                  label:"Valence",                  dept:"26", region:"Auvergne-Rhône-Alpes",      pop:"64k"   },
  { slug:"chambery",                 label:"Chambéry",                 dept:"73", region:"Auvergne-Rhône-Alpes",      pop:"60k"   },
  { slug:"venissieux",               label:"Vénissieux",               dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"67k"   },
  { slug:"caluire-et-cuire",         label:"Caluire-et-Cuire",        dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"43k"   },
  { slug:"roanne",                   label:"Roanne",                   dept:"42", region:"Auvergne-Rhône-Alpes",      pop:"36k"   },
  { slug:"montelimar",               label:"Montélimar",               dept:"26", region:"Auvergne-Rhône-Alpes",      pop:"38k"   },
  { slug:"romans-sur-isere",         label:"Romans-sur-Isère",        dept:"26", region:"Auvergne-Rhône-Alpes",      pop:"33k"   },
  { slug:"echirolles",               label:"Échirolles",               dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"35k"   },
  { slug:"saint-martin-d-heres",     label:"Saint-Martin-d'Hères",    dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"40k"   },
  { slug:"bron",                     label:"Bron",                     dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"40k"   },
  { slug:"villefranche-sur-saone",   label:"Villefranche-sur-Saône",  dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"37k"   },
  { slug:"saint-priest",             label:"Saint-Priest",             dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"43k"   },
  { slug:"vienne",                   label:"Vienne",                   dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"29k"   },
  { slug:"bourgoin-jallieu",         label:"Bourgoin-Jallieu",        dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"30k"   },
  { slug:"annemasse",                label:"Annemasse",                dept:"74", region:"Auvergne-Rhône-Alpes",      pop:"36k"   },
  { slug:"oyonnax",                  label:"Oyonnax",                  dept:"01", region:"Auvergne-Rhône-Alpes",      pop:"22k"   },
  { slug:"thonon-les-bains",         label:"Thonon-les-Bains",        dept:"74", region:"Auvergne-Rhône-Alpes",      pop:"37k"   },
  { slug:"aubiere",                  label:"Aubière",                  dept:"63", region:"Auvergne-Rhône-Alpes",      pop:"12k"   },
  // ── Provence-Alpes-Côte d'Azur ────────────────────────────────────────────
  { slug:"marseille",                label:"Marseille",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"870k"  },
  { slug:"nice",                     label:"Nice",                     dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"340k"  },
  { slug:"toulon",                   label:"Toulon",                   dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"180k"  },
  { slug:"aix-en-provence",          label:"Aix-en-Provence",         dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"142k"  },
  { slug:"avignon",                  label:"Avignon",                  dept:"84", region:"Provence-Alpes-Côte d'Azur",pop:"93k"   },
  { slug:"antibes",                  label:"Antibes",                  dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"77k"   },
  { slug:"cannes",                   label:"Cannes",                   dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"74k"   },
  { slug:"la-seyne-sur-mer",         label:"La Seyne-sur-Mer",        dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"63k"   },
  { slug:"hyeres",                   label:"Hyères",                   dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"57k"   },
  { slug:"frejus",                   label:"Fréjus",                   dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"52k"   },
  { slug:"grasse",                   label:"Grasse",                   dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"50k"   },
  { slug:"cagnes-sur-mer",           label:"Cagnes-sur-Mer",          dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"47k"   },
  { slug:"arles",                    label:"Arles",                    dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"53k"   },
  { slug:"salon-de-provence",        label:"Salon-de-Provence",       dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"44k"   },
  { slug:"aubagne",                  label:"Aubagne",                  dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"47k"   },
  { slug:"martigues",                label:"Martigues",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"48k"   },
  { slug:"draguignan",               label:"Draguignan",               dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"40k"   },
  { slug:"la-ciotat",                label:"La Ciotat",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"35k"   },
  { slug:"six-fours-les-plages",     label:"Six-Fours-les-Plages",    dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"34k"   },
  { slug:"menton",                   label:"Menton",                   dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"29k"   },
  { slug:"la-garde",                 label:"La Garde",                 dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"25k"   },
  { slug:"gap",                      label:"Gap",                      dept:"05", region:"Provence-Alpes-Côte d'Azur",pop:"41k"   },
  { slug:"vitrolles",                label:"Vitrolles",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"37k"   },
  // ── Occitanie ──────────────────────────────────────────────────────────────
  { slug:"toulouse",                 label:"Toulouse",                 dept:"31", region:"Occitanie",                 pop:"490k"  },
  { slug:"montpellier",              label:"Montpellier",              dept:"34", region:"Occitanie",                 pop:"295k"  },
  { slug:"nimes",                    label:"Nîmes",                    dept:"30", region:"Occitanie",                 pop:"150k"  },
  { slug:"perpignan",                label:"Perpignan",                dept:"66", region:"Occitanie",                 pop:"121k"  },
  { slug:"beziers",                  label:"Béziers",                  dept:"34", region:"Occitanie",                 pop:"75k"   },
  { slug:"montauban",                label:"Montauban",                dept:"82", region:"Occitanie",                 pop:"63k"   },
  { slug:"narbonne",                 label:"Narbonne",                 dept:"11", region:"Occitanie",                 pop:"54k"   },
  { slug:"carcassonne",              label:"Carcassonne",              dept:"11", region:"Occitanie",                 pop:"47k"   },
  { slug:"albi",                     label:"Albi",                     dept:"81", region:"Occitanie",                 pop:"49k"   },
  { slug:"castres",                  label:"Castres",                  dept:"81", region:"Occitanie",                 pop:"44k"   },
  { slug:"tarbes",                   label:"Tarbes",                   dept:"65", region:"Occitanie",                 pop:"43k"   },
  { slug:"sete",                     label:"Sète",                     dept:"34", region:"Occitanie",                 pop:"44k"   },
  { slug:"ales",                     label:"Alès",                     dept:"30", region:"Occitanie",                 pop:"41k"   },
  { slug:"agde",                     label:"Agde",                     dept:"34", region:"Occitanie",                 pop:"23k"   },
  { slug:"lunel",                    label:"Lunel",                    dept:"34", region:"Occitanie",                 pop:"26k"   },
  { slug:"mende",                    label:"Mende",                    dept:"48", region:"Occitanie",                 pop:"12k"   },
  { slug:"lattes",                   label:"Lattes",                   dept:"34", region:"Occitanie",                 pop:"19k"   },
  // ── Nouvelle-Aquitaine ─────────────────────────────────────────────────────
  { slug:"bordeaux",                 label:"Bordeaux",                 dept:"33", region:"Nouvelle-Aquitaine",        pop:"260k"  },
  { slug:"limoges",                  label:"Limoges",                  dept:"87", region:"Nouvelle-Aquitaine",        pop:"131k"  },
  { slug:"pau",                      label:"Pau",                      dept:"64", region:"Nouvelle-Aquitaine",        pop:"77k"   },
  { slug:"la-rochelle",              label:"La Rochelle",              dept:"17", region:"Nouvelle-Aquitaine",        pop:"76k"   },
  { slug:"poitiers",                 label:"Poitiers",                 dept:"86", region:"Nouvelle-Aquitaine",        pop:"88k"   },
  { slug:"merignac",                 label:"Mérignac",                 dept:"33", region:"Nouvelle-Aquitaine",        pop:"70k"   },
  { slug:"pessac",                   label:"Pessac",                   dept:"33", region:"Nouvelle-Aquitaine",        pop:"63k"   },
  { slug:"bayonne",                  label:"Bayonne",                  dept:"64", region:"Nouvelle-Aquitaine",        pop:"52k"   },
  { slug:"angouleme",                label:"Angoulême",                dept:"16", region:"Nouvelle-Aquitaine",        pop:"43k"   },
  { slug:"niort",                    label:"Niort",                    dept:"79", region:"Nouvelle-Aquitaine",        pop:"57k"   },
  { slug:"brive-la-gaillarde",       label:"Brive-la-Gaillarde",      dept:"19", region:"Nouvelle-Aquitaine",        pop:"47k"   },
  { slug:"agen",                     label:"Agen",                     dept:"47", region:"Nouvelle-Aquitaine",        pop:"35k"   },
  { slug:"perigueux",                label:"Périgueux",                dept:"24", region:"Nouvelle-Aquitaine",        pop:"30k"   },
  { slug:"saintes",                  label:"Saintes",                  dept:"17", region:"Nouvelle-Aquitaine",        pop:"28k"   },
  { slug:"rochefort",                label:"Rochefort",                dept:"17", region:"Nouvelle-Aquitaine",        pop:"25k"   },
  { slug:"mont-de-marsan",           label:"Mont-de-Marsan",          dept:"40", region:"Nouvelle-Aquitaine",        pop:"31k"   },
  { slug:"dax",                      label:"Dax",                      dept:"40", region:"Nouvelle-Aquitaine",        pop:"21k"   },
  // ── Hauts-de-France ────────────────────────────────────────────────────────
  { slug:"lille",                    label:"Lille",                    dept:"59", region:"Hauts-de-France",           pop:"235k"  },
  { slug:"amiens",                   label:"Amiens",                   dept:"80", region:"Hauts-de-France",           pop:"135k"  },
  { slug:"tourcoing",                label:"Tourcoing",                dept:"59", region:"Hauts-de-France",           pop:"99k"   },
  { slug:"roubaix",                  label:"Roubaix",                  dept:"59", region:"Hauts-de-France",           pop:"96k"   },
  { slug:"dunkerque",                label:"Dunkerque",                dept:"59", region:"Hauts-de-France",           pop:"92k"   },
  { slug:"calais",                   label:"Calais",                   dept:"62", region:"Hauts-de-France",           pop:"74k"   },
  { slug:"villeneuve-d-ascq",        label:"Villeneuve-d'Ascq",       dept:"59", region:"Hauts-de-France",           pop:"65k"   },
  { slug:"valenciennes",             label:"Valenciennes",             dept:"59", region:"Hauts-de-France",           pop:"44k"   },
  { slug:"lens",                     label:"Lens",                     dept:"62", region:"Hauts-de-France",           pop:"34k"   },
  { slug:"arras",                    label:"Arras",                    dept:"62", region:"Hauts-de-France",           pop:"42k"   },
  { slug:"douai",                    label:"Douai",                    dept:"59", region:"Hauts-de-France",           pop:"42k"   },
  { slug:"maubeuge",                 label:"Maubeuge",                 dept:"59", region:"Hauts-de-France",           pop:"30k"   },
  { slug:"bethune",                  label:"Béthune",                  dept:"62", region:"Hauts-de-France",           pop:"26k"   },
  { slug:"cambrai",                  label:"Cambrai",                  dept:"59", region:"Hauts-de-France",           pop:"33k"   },
  { slug:"soissons",                 label:"Soissons",                 dept:"02", region:"Hauts-de-France",           pop:"29k"   },
  { slug:"saint-quentin",            label:"Saint-Quentin",            dept:"02", region:"Hauts-de-France",           pop:"55k"   },
  { slug:"laon",                     label:"Laon",                     dept:"02", region:"Hauts-de-France",           pop:"25k"   },
  // ── Grand Est ──────────────────────────────────────────────────────────────
  { slug:"strasbourg",               label:"Strasbourg",               dept:"67", region:"Grand Est",                 pop:"285k"  },
  { slug:"reims",                    label:"Reims",                    dept:"51", region:"Grand Est",                 pop:"185k"  },
  { slug:"metz",                     label:"Metz",                     dept:"57", region:"Grand Est",                 pop:"115k"  },
  { slug:"mulhouse",                 label:"Mulhouse",                 dept:"68", region:"Grand Est",                 pop:"111k"  },
  { slug:"nancy",                    label:"Nancy",                    dept:"54", region:"Grand Est",                 pop:"104k"  },
  { slug:"colmar",                   label:"Colmar",                   dept:"68", region:"Grand Est",                 pop:"67k"   },
  { slug:"troyes",                   label:"Troyes",                   dept:"10", region:"Grand Est",                 pop:"63k"   },
  { slug:"charleville-mezieres",     label:"Charleville-Mézières",    dept:"08", region:"Grand Est",                 pop:"51k"   },
  { slug:"thionville",               label:"Thionville",               dept:"57", region:"Grand Est",                 pop:"42k"   },
  { slug:"haguenau",                 label:"Haguenau",                 dept:"67", region:"Grand Est",                 pop:"35k"   },
  { slug:"epinal",                   label:"Épinal",                   dept:"88", region:"Grand Est",                 pop:"34k"   },
  { slug:"chalons-en-champagne",     label:"Châlons-en-Champagne",    dept:"51", region:"Grand Est",                 pop:"48k"   },
  { slug:"saint-avold",              label:"Saint-Avold",              dept:"57", region:"Grand Est",                 pop:"17k"   },
  { slug:"sarreguemines",            label:"Sarreguemines",            dept:"57", region:"Grand Est",                 pop:"22k"   },
  { slug:"forbach",                  label:"Forbach",                  dept:"57", region:"Grand Est",                 pop:"22k"   },
  // ── Bretagne ───────────────────────────────────────────────────────────────
  { slug:"rennes",                   label:"Rennes",                   dept:"35", region:"Bretagne",                  pop:"220k"  },
  { slug:"brest",                    label:"Brest",                    dept:"29", region:"Bretagne",                  pop:"139k"  },
  { slug:"quimper",                  label:"Quimper",                  dept:"29", region:"Bretagne",                  pop:"63k"   },
  { slug:"lorient",                  label:"Lorient",                  dept:"56", region:"Bretagne",                  pop:"58k"   },
  { slug:"vannes",                   label:"Vannes",                   dept:"56", region:"Bretagne",                  pop:"54k"   },
  { slug:"saint-nazaire",            label:"Saint-Nazaire",            dept:"44", region:"Bretagne",                  pop:"68k"   },
  { slug:"saint-malo",               label:"Saint-Malo",               dept:"35", region:"Bretagne",                  pop:"46k"   },
  { slug:"saint-brieuc",             label:"Saint-Brieuc",             dept:"22", region:"Bretagne",                  pop:"43k"   },
  { slug:"fougeres",                 label:"Fougères",                 dept:"35", region:"Bretagne",                  pop:"20k"   },
  { slug:"morlaix",                  label:"Morlaix",                  dept:"29", region:"Bretagne",                  pop:"16k"   },
  // ── Pays de la Loire ───────────────────────────────────────────────────────
  { slug:"nantes",                   label:"Nantes",                   dept:"44", region:"Pays de la Loire",          pop:"320k"  },
  { slug:"angers",                   label:"Angers",                   dept:"49", region:"Pays de la Loire",          pop:"155k"  },
  { slug:"le-mans",                  label:"Le Mans",                  dept:"72", region:"Pays de la Loire",          pop:"149k"  },
  { slug:"saint-herblain",           label:"Saint-Herblain",           dept:"44", region:"Pays de la Loire",          pop:"46k"   },
  { slug:"cholet",                   label:"Cholet",                   dept:"49", region:"Pays de la Loire",          pop:"57k"   },
  { slug:"la-roche-sur-yon",         label:"La Roche-sur-Yon",        dept:"85", region:"Pays de la Loire",          pop:"53k"   },
  { slug:"laval",                    label:"Laval",                    dept:"53", region:"Pays de la Loire",          pop:"50k"   },
  { slug:"reze",                     label:"Rezé",                     dept:"44", region:"Pays de la Loire",          pop:"40k"   },
  { slug:"les-sables-d-olonne",      label:"Les Sables-d'Olonne",     dept:"85", region:"Pays de la Loire",          pop:"46k"   },
  // ── Normandie ──────────────────────────────────────────────────────────────
  { slug:"le-havre",                 label:"Le Havre",                 dept:"76", region:"Normandie",                 pop:"170k"  },
  { slug:"rouen",                    label:"Rouen",                    dept:"76", region:"Normandie",                 pop:"111k"  },
  { slug:"caen",                     label:"Caen",                     dept:"14", region:"Normandie",                 pop:"108k"  },
  { slug:"cherbourg-en-cotentin",    label:"Cherbourg-en-Cotentin",   dept:"50", region:"Normandie",                 pop:"80k"   },
  { slug:"evreux",                   label:"Évreux",                   dept:"27", region:"Normandie",                 pop:"50k"   },
  { slug:"dieppe",                   label:"Dieppe",                   dept:"76", region:"Normandie",                 pop:"29k"   },
  { slug:"alencon",                  label:"Alençon",                  dept:"61", region:"Normandie",                 pop:"27k"   },
  { slug:"lisieux",                  label:"Lisieux",                  dept:"14", region:"Normandie",                 pop:"22k"   },
  // ── Centre-Val de Loire ────────────────────────────────────────────────────
  { slug:"orleans",                  label:"Orléans",                  dept:"45", region:"Centre-Val de Loire",       pop:"115k"  },
  { slug:"tours",                    label:"Tours",                    dept:"37", region:"Centre-Val de Loire",       pop:"137k"  },
  { slug:"bourges",                  label:"Bourges",                  dept:"18", region:"Centre-Val de Loire",       pop:"67k"   },
  { slug:"blois",                    label:"Blois",                    dept:"41", region:"Centre-Val de Loire",       pop:"46k"   },
  { slug:"chartres",                 label:"Chartres",                 dept:"28", region:"Centre-Val de Loire",       pop:"39k"   },
  { slug:"chateauroux",              label:"Châteauroux",              dept:"36", region:"Centre-Val de Loire",       pop:"46k"   },
  { slug:"vierzon",                  label:"Vierzon",                  dept:"18", region:"Centre-Val de Loire",       pop:"26k"   },
  // ── Bourgogne-Franche-Comté ────────────────────────────────────────────────
  { slug:"dijon",                    label:"Dijon",                    dept:"21", region:"Bourgogne-Franche-Comté",   pop:"155k"  },
  { slug:"besancon",                 label:"Besançon",                 dept:"25", region:"Bourgogne-Franche-Comté",   pop:"117k"  },
  { slug:"belfort",                  label:"Belfort",                  dept:"90", region:"Bourgogne-Franche-Comté",   pop:"50k"   },
  { slug:"chalon-sur-saone",         label:"Chalon-sur-Saône",        dept:"71", region:"Bourgogne-Franche-Comté",   pop:"46k"   },
  { slug:"auxerre",                  label:"Auxerre",                  dept:"89", region:"Bourgogne-Franche-Comté",   pop:"36k"   },
  { slug:"macon",                    label:"Mâcon",                    dept:"71", region:"Bourgogne-Franche-Comté",   pop:"33k"   },
  { slug:"montbeliard",              label:"Montbéliard",              dept:"25", region:"Bourgogne-Franche-Comté",   pop:"26k"   },
  { slug:"sens",                     label:"Sens",                     dept:"89", region:"Bourgogne-Franche-Comté",   pop:"25k"   },
  // ── Corse ──────────────────────────────────────────────────────────────────
  { slug:"ajaccio",                  label:"Ajaccio",                  dept:"2A", region:"Corse",                     pop:"72k"   },
  { slug:"bastia",                   label:"Bastia",                   dept:"2B", region:"Corse",                     pop:"43k"   },
];

// ── Pages combinées métier × ville (20×20 = 400 routes) ──────────────────────
// URL pattern : /{metier.slug}-{ville.slug} ex: /plombier-paris
const TOP20_M = METIERS.slice(0, 20);
const TOP20_V = VILLES.filter(v => [
  "paris","boulogne-billancourt","marseille","lyon","toulouse","nice","nantes","strasbourg",
  "montpellier","bordeaux","lille","rennes","reims","le-havre","saint-etienne","toulon",
  "grenoble","dijon","angers","nimes"
].includes(v.slug));

const COMBO_MAP = new Map();
for (const m of TOP20_M) {
  for (const v of TOP20_V) {
    COMBO_MAP.set(`/${m.slug}-${v.slug}`, { metier: m, ville: v });
  }
}

// ── Données concurrents ───────────────────────────────────────────────────────
const CONCURRENTS = [
  {
    slug: "tolteck", label: "Tolteck", prix: "19€/mois",
    avantages: ["Interface simple", "Gestion des acomptes", "Relances automatiques"],
    inconvenients: ["Plus cher qu'Artisan+", "Pas de suivi chantier avancé", "Pas de mini-site", "Pas de paiement en ligne client"],
  },
  {
    slug: "obat", label: "Obat", prix: "39€/mois",
    avantages: ["Fonctionnalités complètes", "Planning chantier", "Gestion équipe"],
    inconvenients: ["Prix très élevé (39€/mois)", "Interface complexe", "Pas de mini-site artisan", "Pas de paiement en ligne client"],
  },
  {
    slug: "artisanfacture", label: "ArtisanFacture", prix: "29€/mois",
    avantages: ["Reconnu en France", "Support téléphonique", "Modèles de documents"],
    inconvenients: ["Coût élevé (29€/mois)", "Pas de suivi de chantier", "Pas de mini-site", "Pas de paiement en ligne client"],
  },
];

// ── SEO : textes uniques par métier ──────────────────────────────────────────
const METIERS_SEO = {
  plombier: `Le métier de plombier exige une facturation adaptée aux spécificités du BTP sanitaire. Vos interventions combinent souvent des travaux de rénovation (TVA 10% pour la main d'œuvre sur logements de plus de 2 ans) et des fournitures (TVA 20% pour les équipements neufs comme les chauffe-eaux ou baignoires). Gérer ce taux mixte sur une seule facture est une source fréquente d'erreurs. Artisan+ applique automatiquement plusieurs taux de TVA par ligne de prestation. En urgence — fuite, robinet cassé, chasse d'eau HS — vous n'avez pas le temps de sortir un ordinateur. Depuis votre smartphone, créez et envoyez la facture en 2 minutes pendant que votre client cherche encore son carnet de chèques. Les plombiers utilisateurs d'Artisan+ rapportent une réduction significative de leurs impayés grâce au paiement par carte bancaire directement depuis la facture.`,
  electricien: `Un électricien fait face à des obligations particulièrement strictes en facturation : chaque intervention doit mentionner le numéro d'assurance décennale, la certification Qualifelec si applicable, et les références aux normes NF C 15-100 pour les travaux d'installation. Pour les travaux d'efficacité énergétique (domotique, LED), si vous êtes certifié RGE, la facture doit intégrer les mentions permettant au client de bénéficier de MaPrimeRénov. Artisan+ intègre ces mentions automatiquement. Les électriciens gèrent souvent plusieurs chantiers simultanément. Le suivi multi-chantiers d'Artisan+ vous permet de voir d'un coup d'œil quelles factures sont en attente et où en sont vos encaissements — un tableau de bord qui remplace trois tableaux Excel différents.`,
  macon: `La maçonnerie est l'un des corps de métier du BTP où la facturation est la plus complexe. Pour les travaux de gros œuvre, vous êtes régulièrement confronté aux situations de travaux (appels de fonds intermédiaires), à la retenue de garantie de 5%, et à l'auto-liquidation de TVA quand vous intervenez en sous-traitance pour un promoteur. Ces trois mécanismes sont souvent sources de litiges. Artisan+ gère nativement les situations de travaux avec calcul automatique des pourcentages d'avancement, la retenue de garantie et l'auto-liquidation de TVA. Pour un maçon qui travaille aussi bien pour des particuliers que pour des entreprises générales, cette polyvalence est précieuse. La galerie photos de chantier permet aussi de documenter l'avancement des travaux et de se protéger en cas de litige.`,
  carreleur: `Chez un carreleur, chaque chantier nécessite un devis détaillé avec décomposition au mètre carré : dépose de l'ancien revêtement, préparation du support, pose du nouveau carrelage, fourniture des matériaux. Cette décomposition poste par poste rassure le client, justifie le prix et réduit les négociations. Artisan+ vous permet de créer un catalogue de prestations avec vos tarifs au m², y compris les variations selon le format des carreaux, la complexité de la pose et le type de pièce. La TVA pour un carreleur s'applique à 10% pour la main d'œuvre sur logements anciens. Artisan+ gère automatiquement ces taux selon la configuration du chantier, et génère les factures conformes à la loi 2026 en quelques clics.`,
  peintre: `Le peintre bâtiment réalise souvent les dernières interventions sur un chantier. Ce qui semble simple — peindre des murs — cache une réalité commerciale complexe : calcul des surfaces, nombre de couches, qualité des peintures, préparation du support. Ces variables font que deux devis pour une même pièce peuvent varier du simple au double. Artisan+, avec son catalogue de prix personnalisable, vous permet de créer des devis au m² parfaitement détaillés, avec des lignes séparées pour la préparation, les couches d'apprêt et les couches de finition. Vos clients comprennent votre tarif et le remettent moins en question. La signature électronique évite les allers-retours — vous envoyez le devis le soir, votre client le signe depuis son canapé.`,
  menuisier: `Le menuisier inclut souvent dans ses devis de la fabrication sur mesure (planifiée à l'atelier) et de la pose sur chantier. Ces deux composantes s'organisent en phases distinctes, avec parfois plusieurs semaines entre la fabrication et la pose finale. La facturation en deux temps (acompte à la commande, solde à la pose) est courante et doit être clairement stipulée. Artisan+ permet de créer des devis avec des échéances de paiement multiples, clairement indiquées sur le document. Pour les menuiseries extérieures (fenêtres, portes-fenêtres), si vous êtes certifié RGE, la TVA à 5,5% peut s'appliquer — un avantage commercial significatif à mettre en avant dans vos devis. Le mini-site vitrine Artisan+ vous permet d'afficher vos réalisations, un argument puissant pour convaincre de nouveaux clients.`,
  chauffagiste: `Le chauffagiste est l'un des artisans les mieux positionnés pour bénéficier des aides à la rénovation énergétique en 2026. Chaque devis de remplacement de chaudière ou d'installation de PAC doit mentionner clairement : le type d'équipement (marque, référence, SCOP/COP), la TVA applicable (5,5% si vous êtes certifié RGE), les aides déductibles. Artisan+ permet de créer ces devis complexes avec plusieurs taux de TVA. Pour les contrats de maintenance annuelle (chaudières, PAC), Artisan+ génère automatiquement les factures périodiques — un gain de temps considérable quand vous avez 50 à 100 clients en maintenance. L'historique complet des interventions par client est accessible en un clic.`,
  serrurier: `Le serrurier est l'artisan de l'urgence par excellence. Ouverture de porte, remplacement de cylindre, mise en sécurité après cambriolage... Ces interventions sont réalisées dans des conditions stressantes, avec un client qui attend et qui veut sa facture immédiatement. Artisan+, depuis un smartphone, génère la facture en 2 minutes sur le pas de la porte, avec paiement en ligne immédiat par carte bancaire. Pour les serruriers qui développent une activité de sécurité (blindage, alarme, contrôle d'accès), Artisan+ permet de créer des devis détaillés avec options, permettant au client de choisir son niveau de protection. Les devis avec options, présentés sur smartphone lors de la visite, ont un taux de signature supérieur aux devis envoyés plusieurs jours plus tard.`,
  couvreur: `Le couvreur travaille sur des chantiers dont la valeur est souvent élevée (5 000 à 50 000€ pour une réfection complète), ce qui justifie une facturation en plusieurs étapes. La pratique des situations de travaux est courante : acompte de 30% à la commande, situation intermédiaire à mi-chantier, solde à la réception. Artisan+ génère nativement ces documents intermédiaires, liés au devis initial, avec calcul automatique des sommes déjà versées. Pour les couvreurs qui interviennent aussi en rénovation thermique, la TVA à 5,5% sur les travaux RGE est un argument commercial fort. Artisan+ intègre automatiquement les mentions de garantie décennale sur les devis et factures, renforçant la confiance de vos clients.`,
  jardinier: `Le jardinier bénéficie souvent des contrats d'entretien récurrents. Un contrat de maintenance mensuel ou saisonnier représente un revenu régulier et prévisible. Ces contrats doivent préciser : fréquence des passages, prestations incluses (tonte, taille, désherbage), et conditions de révision de prix. Artisan+ permet de gérer ces contrats avec facturation automatique. Pour les chantiers de création paysagère importants, le devis doit décomposer clairement les phases : terrassement, plantation, arrosage, éclairage. Une présentation par phases avec prix et délais rassure les clients. Le mini-site vitrine Artisan+ avec galerie photos "avant/après" est particulièrement valorisant — 80% des clients choisissent leur jardinier-paysagiste sur la base des photos de réalisations.`,
  charpentier: `La charpente est un métier où la valeur des chantiers est souvent importante et les délais longs. Un charpentier fait régulièrement face à des situations de travaux, des avenants en cours de chantier (découverte de mérule, mauvais état du support), et des retenues de garantie. Artisan+ gère tous ces cas : devis initial avec options, avenant quand des travaux imprévus s'ajoutent, situations de travaux intermédiaires. Pour les charpentiers qui interviennent sur l'isolation des combles, la certification RGE ouvre droit à la TVA 5,5%. Artisan+ gère les factures de sous-traitance avec auto-liquidation de TVA quand nécessaire.`,
  plaquiste: `Le plaquiste réalise souvent ses chantiers en sous-traitance pour des entreprises générales, ce qui implique l'auto-liquidation de TVA. Cette règle, méconnue de nombreux artisans, est obligatoire et son non-respect peut entraîner des pénalités. Artisan+ gère nativement l'auto-liquidation de TVA BTP avec la mention légale correcte automatiquement ajoutée. Pour les chantiers en direct avec des particuliers, la décomposition du devis doit être précise : démolition, ossature, isolation phonique ou thermique, plaques, enduit de lissage. Cette transparence rassure le client et évite les litiges en fin de chantier sur ce qui était ou non inclus dans le prix.`,
  facadier: `Le façadier travaille sur des chantiers combinant contraintes techniques (type de façade, accessibilité) et administratives (déclaration préalable, autorisation de voirie pour les échafaudages). Un devis de ravalement doit intégrer ces contraintes : diagnostic préalable, coût de l'échafaudage, traitement des fissures, application des produits. Pour les façadiers qui réalisent aussi de l'ITE (Isolation Thermique par l'Extérieur), la certification RGE est nécessaire pour que les clients bénéficient de MaPrimeRénov avec TVA à 5,5%. Ces taux mixtes, gérés automatiquement par Artisan+, représentent des économies significatives pour vos clients et un argument de vente fort.`,
  climaticien: `L'installation de climatisation est en forte croissance. Le climaticien doit être certifié pour manipuler les fluides frigorigènes (certification RGE), avec des obligations documentaires supplémentaires sur chaque fiche d'intervention. Pour les installations réversibles (chauffage + climatisation), la TVA peut s'appliquer à 5,5% sur la partie chauffage si le logement a plus de 2 ans. Artisan+ gère ces taux mixtes complexes. Les contrats de maintenance annuelle représentent un revenu récurrent stable. Ces contrats doivent intégrer les obligations réglementaires : vérification de l'étanchéité, nettoyage des filtres. Artisan+ génère automatiquement les factures récurrentes de maintenance avec historique complet par client.`,
  ramoneur: `Le ramoneur bénéficie d'une clientèle récurrente prévisible : dans de nombreuses communes, le ramonage est obligatoire une à deux fois par an. Artisan+ permet de gérer ces contrats avec facturation automatique et rappels clients. Le certificat de ramonage délivré après chaque intervention est un document obligatoire — Artisan+ permet d'attacher ce certificat numérique à la facture. Pour un ramoneur qui développe son activité, le mini-site vitrine Artisan+ avec avis clients et certifications professionnelles est un excellent outil d'acquisition de nouveaux clients, surtout dans les zones rurales où le bouche-à-oreille numérique devient le premier canal de prospection.`,
  elagueur: `L'élagueur travaille dans des conditions particulières qui influencent sa facturation : les interventions en hauteur impliquent des tarifs différents selon la technique (perche, nacelle, grimpe), et l'évacuation des déchets verts (broyage, benne) est souvent facturée séparément. Un devis d'élagage doit décomposer clairement ces postes. L'assurance décennale d'un élagueur est un gage de sérieux à mettre en avant dans ses devis — Artisan+ intègre cette mention automatiquement. La saisonnalité est marquée dans ce métier : avec le calendrier Artisan+, planifiez vos interventions pour équilibrer votre charge de travail tout au long de l'année.`,
  paysagiste: `Le paysagiste crée des espaces extérieurs dont la valeur peut être très élevée. Pour les grands projets de création, le devis doit être très détaillé : terrassement, maçonnerie paysagère, engazonnement, plantation, arrosage automatique, éclairage. Les plantes achetées pour un client sont facturées à TVA 10%. Les travaux de terrassement et maçonnerie paysagère sont à 10%. Artisan+ gère ces taux multiples par ligne de prestation. Le mini-site vitrine avec portfolio "avant/après" est particulièrement puissant pour un paysagiste — 80% des clients choisissent sur la base des photos de réalisations passées.`,
  pisciniste: `La construction d'une piscine est l'un des investissements les plus importants pour un particulier. Les montants en jeu (15 000 à 60 000€) justifient une facturation en plusieurs étapes : acompte à la signature (max 5% selon la loi), situations progressives (terrassement, gros œuvre, équipements, finitions), solde à la réception. Pour la rénovation de piscine existante, la TVA à 10% s'applique si le logement a plus de 2 ans. La pompe à chaleur pour piscine peut bénéficier de la TVA à 5,5% si couplée avec le chauffage de la maison et si l'artisan est certifié RGE. Artisan+ gère tous ces scénarios et génère les factures pisciniste conformes automatiquement.`,
  terrassier: `Le terrassier et VRD travaille sur des chantiers d'infrastructure dont la facturation présente des spécificités BTP importantes. Pour les terrassiers qui interviennent en sous-traitance pour des maîtres d'œuvre ou des entreprises générales, l'auto-liquidation de TVA s'applique systématiquement. Artisan+ gère nativement cette mention légale. La facturation d'un terrassier est souvent complexe car les travaux sont facturés à la journée d'engin, en m³ excavés, en ml de tranchée ou en forfait selon le type de chantier. Le catalogue de prix Artisan+ permet de préconfigurer toutes ces unités de mesure pour créer des devis rapidement et sans erreur.`,
  vitrier: `Le vitrier intervient souvent en urgence — vitre cassée suite à un cambriolage ou intempérie. Comme le serrurier, le vitrier doit pouvoir facturer immédiatement sur place depuis son smartphone. Pour les travaux programmés (double vitrage, cloisons vitrées), le devis doit préciser la surface en m², le type de vitrage (Uw pour l'isolation thermique), l'épaisseur et les frais de découpe sur mesure. Pour les remplacements de fenêtres avec double vitrage HPE, la TVA à 5,5% peut s'appliquer si vous êtes certifié RGE. Ces taux spéciaux sont configurables dans Artisan+. La gestion des acomptes à la commande (pour couvrir l'achat des matériaux) est intégrée nativement.`,
  etancheur: `L'étanchéiste réalise des travaux dont l'efficacité n'est pas immédiatement visible. Cette invisibilité du travail rend la communication avec le client importante. Un devis d'étanchéité doit détailler les produits utilisés (EPDM, bitume modifié SBS, résine polyuréthane), leur durée de garantie fabricant, et la garantie décennale. Artisan+ intègre automatiquement les mentions de garantie décennale. Pour les travaux d'étanchéité sur toiture-terrasse, la TVA est à 10% (travaux d'amélioration). La documentation photographique avant/après est essentielle pour se protéger en cas de litige — Artisan+ intègre une galerie photos par chantier.`,
  ferrailleur: `Le ferrailleur travaille exclusivement en sous-traitance pour des entreprises de maçonnerie, des constructeurs ou des promoteurs immobiliers. La règle de l'auto-liquidation de TVA s'applique systématiquement : c'est le donneur d'ordre qui reverse la TVA, pas le ferrailleur. Artisan+ gère cette configuration avec la mention légale correcte automatiquement incluse. Les factures d'un ferrailleur sont souvent calculées en kg ou tonnes d'acier façonné — Artisan+ permet de configurer ces unités métier dans le catalogue de prestations. La co-activité sur les chantiers nécessite une coordination étroite avec le donneur d'ordre que la messagerie intégrée facilite.`,
  soudeur: `Le soudeur artisan intervient sur des chantiers variés : réparation d'équipements agricoles, création d'escaliers et garde-corps métalliques, charpente métallique. La diversité des interventions nécessite un catalogue de prix avec des tarifs par type de soudure (MIG/MAG, TIG, à l'arc) et par type de métal (acier noir, inox, aluminium). Pour le soudeur qui travaille en sous-traitance pour une entreprise de construction métallique ou un fabricant industriel, l'auto-liquidation de TVA s'applique quand le donneur d'ordre est un assujetti réalisant des travaux de construction. Artisan+ gère ce cas automatiquement. La traçabilité des soudures (qualification des procédés, dossiers de soudage) peut être documentée dans le suivi de chantier avec photos.`,
  metallier: `Le métallier crée des ouvrages sur mesure (portails, clôtures, escaliers, garde-corps, vérandas) dont la fabrication s'étale sur plusieurs semaines. La facturation en plusieurs étapes est indispensable : acompte à la commande (30% pour couvrir les matériaux), situation intermédiaire à la livraison en atelier, solde à la pose. Artisan+ génère ces étapes de facturation liées au devis initial. Pour les ouvrages en rénovation sur logement de plus de 2 ans, la TVA est à 10%. Pour les constructions neuves ou commerciales, la TVA est à 20%. Artisan+ configure le taux par chantier et génère les factures correctes sans risque d'erreur.`,
  "installateur-solaire": `L'installateur solaire bénéficie d'un marché exceptionnel en 2026. Mais ces aides impliquent des obligations documentaires strictes sur les devis et factures : références des équipements, puissance crête installée (kWc), certification RGE du poseur. Artisan+ génère automatiquement ces mentions. La TVA à 10% s'applique sur les installations solaires sur logements existants de plus de 2 ans ; 20% pour les constructions neuves. Artisan+ applique le bon taux selon le type de chantier. Les devis solaires qui incluent une simulation de retour sur investissement (production annuelle estimée, économies annuelles) augmentent significativement le taux de signature.`,
  nettoyeur: `Le nettoyeur professionnel de bâtiments travaille souvent sur des marchés B2B avec des contrats récurrents. La facturation en B2B est différente : factures à 30 ou 60 jours, pénalités de retard en cas d'impayé, escompte pour paiement rapide. Artisan+ gère toutes ces conditions de paiement professionnelles. Pour les contrats récurrents (nettoyage hebdomadaire d'un immeuble, entretien mensuel d'un commerce), la facturation automatique récurrente évite de créer manuellement chaque facture mensuelle. La traçabilité des passages (date, heure, signature du responsable) est souvent requise — le suivi de chantier Artisan+ avec signature client permet de documenter chaque intervention.`,
  "laveur-vitres": `Le laveur de vitres professionnel travaille souvent sur des immeubles de grande hauteur avec des techniques variées (perche, nacelle, descendeur). Les devis sont établis à la surface en m² ou au nombre de faces, avec des majorations pour les accès difficiles. Les contrats annuels (2 à 4 lavages par an) assurent un revenu prévisible. Artisan+ gère la facturation récurrente. Pour les laveurs qui interviennent sur des chantiers de construction (nettoyage fin de chantier), la facturation en sous-traitance avec auto-liquidation de TVA peut s'appliquer. Artisan+ gère automatiquement ce cas particulier. Le mini-site vitrine avec photos de vos interventions sur sites de prestige renforce votre positionnement premium.`,
  debarrasseur: `Le débarrasseur professionnel intervient lors de successions, de déménagements ou pour libérer un grenier. Ces interventions sont souvent facturées en urgence. La clarté du devis est particulièrement importante : volume estimé en m³, coût du transport en déchetterie, distinction entre ce qui peut être valorisé et ce qui doit être éliminé. Le suivi de chantier Artisan+ avec photos de l'avant et de l'après permet de documenter l'état du bien, évitant tout litige sur des objets manquants. La TVA pour les prestations de débarras est à 20% (taux normal). La géolocalisation du chantier dans Artisan+ aide à optimiser les tournées de collecte.`,
  domoticien: `Le domoticien installe des systèmes de maison connectée qui combinent plusieurs corps de métier : électricité, réseau, et parfois plomberie. Cette polyvalence est un atout commercial mais nécessite des devis très détaillés qui précisent exactement ce qui est inclus dans chaque corps de travail. Pour les logements de plus de 2 ans, la TVA est à 10% sur les travaux de domotique. Les systèmes de domotique sont souvent vendus avec un contrat de maintenance annuelle — Artisan+ gère ces contrats récurrents. La présentation de références client (vidéos de démonstration sur mini-site) est très convaincante pour les nouveaux clients hésitants face aux investissements souvent conséquents.`,
  "installateur-alarme": `L'installateur de systèmes d'alarme travaille sur un marché en forte croissance. Les devis d'alarme doivent détailler précisément les équipements pour que le client comprenne pour quoi il paie. La certification APSAD ou NF A2P est un différenciateur fort à mentionner dans les devis — Artisan+ l'inclut automatiquement dans le profil artisan. La TVA pour l'installation d'alarme sur logement existant est à 10%. Les contrats de télésurveillance représentent un revenu récurrent mensuel. Artisan+ gère ces abonnements avec facturation automatique. Le mini-site vitrine avec photos de vos installations rassure les prospects sur votre professionnalisme.`,
  "poseur-parquet": `Le poseur de parquet travaille sur des surfaces qui demandent une préparation soigneuse (ragréage, taux d'humidité, sous-couche acoustique) et une pose technique (flottant, collé, cloué). Le devis doit décomposer clairement : préparation du support, fourniture du parquet (référence, essence, classe d'usage), sous-couche, pose, plinthes et seuils. La TVA à 10% s'applique pour les logements de plus de 2 ans. Artisan+ configure ces taux par ligne de prestation. La galerie photos de vos finitions de ponçage-vitrification est très efficace pour convaincre de nouveaux clients — ces réalisations visuelles sont un argument de vente immédiat et partageable en ligne.`,
  "poseur-fenetres": `Le poseur de fenêtres et menuiseries extérieures bénéficie d'un marché dynamique grâce aux aides à la rénovation énergétique. Pour les logements de plus de 2 ans, la pose de fenêtres à double ou triple vitrage peut être éligible à la TVA à 5,5% si vous êtes certifié RGE et si les fenêtres répondent aux critères thermiques (Uw ≤ 1,3 W/m².K). Le devis doit préciser : référence du produit, valeur Uw, dimensions, type d'ouverture, couleur, et séparation fourniture/pose. Artisan+ permet cette décomposition précise avec les taux de TVA corrects par ligne. La signature électronique pendant la prise de mesures accélère la validation — votre client signe pendant que vous finalisez votre relevé.`,
  "poseur-volets": `Le poseur de volets travaille sur un marché très concurrentiel. Se différencier par la qualité du devis — détaillé, professionnel, envoyé le jour même de la visite — est un avantage concurrentiel réel. Artisan+ vous permet d'envoyer le devis le soir de la visite pendant que le client hésite encore. Pour les volets roulants motorisés avec isolation thermique sur logement de plus de 2 ans, la TVA est à 10%. Si les volets participent à l'amélioration de l'isolation thermique dans le cadre d'une rénovation globale, la TVA peut être à 5,5% (sous conditions RGE). Ces distinctions sont gérées automatiquement dans Artisan+ selon la configuration du chantier.`,
  staffeur: `Le staffeur est un artisan rare dont le savoir-faire est particulièrement valorisé dans la rénovation de bâtiments historiques et les intérieurs haut de gamme. Les devis de staff ornemental sont complexes car chaque réalisation est unique : moulures, rosaces, corniches, chapiteaux. Artisan+ avec son mini-site vitrine et sa galerie photos est particulièrement adapté à un staffeur : vous pouvez montrer vos réalisations les plus impressionnantes à chaque nouveau prospect. La TVA pour les travaux de stafferie sur logement de plus de 2 ans est à 10%. Les mentions légales sur les devis de travaux sur monuments historiques peuvent nécessiter des adaptations que Artisan+ permet de configurer.`,
  stucateur: `Le stucateur crée des revêtements décoratifs (béton ciré, stuc vénitien, tadelakt, marmorino) dont la valeur artistique est reconnue. Ces finitions haut de gamme sont souvent vendues en collaboration avec des architectes d'intérieur. Un devis de stuc doit préciser : le type de stuc, le nombre de couches, la surface en m², et les délais de séchage entre les couches. Artisan+ avec son mini-site vitrine et sa galerie photos est un outil de prospection puissant — les photos avant/après de stuc vénitien ou de béton ciré sont spectaculaires et très partagées sur les réseaux sociaux, source de nouveaux clients. La signature électronique depuis le smartphone facilite la validation des devis avec des architectes d'intérieur toujours très occupés.`,
  marbrier: `Le marbrier travaille sur des matériaux nobles dont la valeur unitaire est élevée. Pour le marbrier de bâtiment, le devis doit préciser la référence et l'origine de la pierre, les dimensions et l'épaisseur, les découpes spéciales (évier, plaque de cuisson), et le finissage (poli, brossé, adouci). La TVA est à 10% pour la fourniture et pose de marbres sur logements de plus de 2 ans. Artisan+ avec son catalogue de prix permet de créer rapidement des devis marbrerie avec les bonnes références et les bons taux. Les acomptes à la commande (nécessaires pour financer l'achat des matériaux nobles) sont gérés nativement dans Artisan+, avec le solde automatiquement calculé à la livraison.`,
  paveur: `Le paveur crée des allées, cours, terrasses et espaces extérieurs en pavés, dalles ou béton décoratif. Les chantiers comportent plusieurs phases distinctes : terrassement et préparation du lit de pose, pose des pavés, jointement, et parfois éclairage ou végétalisation des joints. Un devis paveur doit décomposer ces phases et préciser le type de pavés (béton, granit, calcaire), leurs dimensions et leur résistance au gel. La TVA est à 10% pour les travaux de pavage sur propriétés de particuliers dont le logement principal a plus de 2 ans. Pour les chantiers en sous-traitance pour des aménageurs ou des collectivités, l'auto-liquidation de TVA peut s'appliquer.`,
  frigoriste: `Le frigoriste installe et entretient les équipements frigorifiques. Ce métier est réglementé (attestation de capacité pour la manipulation des fluides frigorigènes) et nécessite une traçabilité documentaire : chaque intervention doit être consignée dans le registre d'entretien. Les contrats de maintenance préventive et corrective sont au cœur du modèle économique du frigoriste. Artisan+ gère ces contrats récurrents avec facturation automatique. Pour les installations de chambres froides ou de climatisation commerciale, la TVA est à 20% (chantiers commerciaux). La facturation en B2B avec conditions à 30 ou 60 jours est entièrement gérée dans Artisan+.`,
  "technicien-fibre": `Le technicien fibre optique installe et raccorde les équipements de réseau (câbles fibre, boîtiers PTO, ONT). Ce métier est en forte demande avec le déploiement massif de la fibre en France. Les interventions réalisées pour des opérateurs télécom en sous-traitance impliquent l'auto-liquidation de TVA dans certains cas. Artisan+ gère ces situations. Pour les réseaux en rénovation dans un logement existant, la TVA peut être à 10%. Le catalogue de prix d'un technicien fibre doit inclure les tarifs par type d'intervention (raccordement PTO, tirage de câble au ml, soudure de fibre à l'unité) — entièrement configurables dans Artisan+.`,
  "installateur-pac": `L'installateur de pompes à chaleur est l'un des métiers les plus demandés en 2026 avec le remplacement massif des chaudières à gaz et fioul. Pour bénéficier des aides (MaPrimeRénov), l'installateur doit être certifié RGE QualiPAC, et le devis doit préciser les caractéristiques techniques de la PAC (marque, modèle, COP/SCOP, puissance en kW). La TVA est à 5,5% pour les fournitures et la main d'œuvre sur logements de plus de 2 ans quand l'installateur est certifié RGE. Artisan+ génère automatiquement ces mentions sur les devis et factures. Les simulations d'économies d'énergie intégrées dans les devis Artisan+ augmentent significativement le taux de conversion.`,
  deboucheur: `Le déboucheur intervient en urgence : canalisation bouchée, WC obstrués, évier qui ne coule plus. Un client avec les WC bouchés appelle plusieurs déboucheurs et choisit le premier qui répond et donne un prix. La réactivité et la transparence tarifaire sont des facteurs décisifs. Artisan+, sur smartphone, vous permet de donner un devis en 2 minutes et de l'envoyer immédiatement. Pour les prestations d'hydrocurage et d'inspection caméra des réseaux, les devis doivent inclure les équipements utilisés — ces informations rassurent les clients sur le sérieux de l'intervention. La facture sur place, avec paiement par carte bancaire via Artisan+, est le mode opératoire idéal.`,
  desinsectiseur: `Le désinsectiseur intervient sur des problèmes qui génèrent du stress chez les clients : cafards, punaises de lit, guêpes, frelons, termites. La relation de confiance et la discrétion sont essentielles. Le devis doit préciser : le type de nuisible, les produits utilisés (biocides homologués), le nombre de passages inclus, la garantie (3 à 6 mois selon le type de traitement). La certification Certibiocide est un gage de sérieux à mentionner. La TVA pour les traitements anti-nuisibles dans les logements est à 10% pour la main d'œuvre. Le journal de chantier Artisan+ permet de documenter les passages successifs et les produits appliqués, important pour la traçabilité réglementaire.`,
  derateur: `Le dératiseur intervient contre les rongeurs dans les habitations, les entreprises agricoles et les espaces publics. Les rapports d'intervention sont obligatoires et doivent mentionner : les produits utilisés (numéro d'AMM), les points d'appâtage, les relevés de consommation. Artisan+ permet de créer ces rapports d'intervention numériques associés aux factures. La TVA pour les traitements anti-nuisibles dans les logements est à 10% pour la main d'œuvre. Les contrats de surveillance des points d'appâtage (mensuels ou trimestriels) représentent un revenu récurrent important — Artisan+ génère automatiquement ces factures périodiques.`,
  miroitier: `Le miroitier intervient dans la pose de miroirs sur mesure, le remplacement de doubles vitrages et l'installation de cloisons vitrées. Ce métier nécessite deux visites : une visite de métrage et de conseil, puis la pose une fois les pièces commandées. Artisan+ permet de gérer facilement les acomptes à la commande et le solde à la pose. La TVA est à 10% pour la fourniture et pose de miroirs et vitrages sur logements de plus de 2 ans. Pour les commerces ou bureaux, la TVA est à 20%. Artisan+ configure automatiquement le bon taux selon le type de client et l'âge du logement. La galerie photos de vos réalisations vitrées est très impactante sur votre mini-site vitrine.`,
  "plombier-chauffagiste": `Le plombier-chauffagiste cumule les spécificités de deux métiers, ce qui rend sa facturation particulièrement complexe. Sur un même chantier (installation d'une PAC et refonte du réseau hydraulique), vous gérez simultanément la plomberie (TVA 10%), le chauffage (TVA 5,5% si RGE pour les équipements thermiques), et l'eau chaude sanitaire. Ces trois composantes peuvent avoir des taux de TVA différents sur la même facture. Artisan+, avec sa gestion des taux de TVA par ligne de prestation, est particulièrement adapté à cette complexité. La certification RGE est un investissement stratégique qui ouvre droit aux chantiers MaPrimeRénov — Artisan+ intègre les mentions RGE dès que vous avez configuré votre certification dans votre profil.`,
  "electricien-industriel": `L'électricien industriel travaille sur des installations techniques complexes : armoires de commande, automates programmables, moteurs industriels. Ce marché est essentiellement B2B, avec des marchés passés sur appel d'offres. Les devis doivent être très détaillés : liste du matériel avec références constructeur, heures de main d'œuvre par type de qualification, délais d'exécution. La TVA est à 20% sur les travaux en milieu industriel et tertiaire. La facturation en plusieurs étapes avec situations de travaux est courante sur les grosses affaires. Artisan+ gère ces situations intermédiaires et la retenue de garantie que certains maîtres d'ouvrage industriels appliquent.`,
  isolateur: `L'isolateur thermique est l'un des artisans les plus demandés en 2026 grâce aux politiques de rénovation énergétique. Isolation des combles, ITI, calfeutrage des ouvrants... Ces travaux bénéficient de taux réduits : 5,5% si vous êtes certifié RGE et que les matériaux répondent aux critères éligibles. Le devis doit préciser les performances thermiques (valeur R, valeur Ud avant/après) pour que le client puisse constituer son dossier d'aides. Artisan+ génère les devis avec toutes ces mentions techniques automatiquement incluses quand vous avez configuré votre certification RGE dans votre profil. Les photos thermiques infrarouge dans la galerie Artisan+ sont un excellent outil de communication commerciale.`,
  echafaudeur: `L'échafaudeur conçoit, installe et démonte des structures d'accès temporaires. Ce métier est réglementé : la formation CACES R408 est requise, et chaque installation doit faire l'objet d'une vérification de conformité. Ces obligations doivent figurer dans les devis pour rassurer les clients professionnels. La facturation combine la location (forfait par semaine ou par mois) et la pose/dépose. Les devis doivent préciser clairement la hauteur, la longueur et le type d'échafaudage, ainsi que les conditions de prolongation de location. La TVA est à 10% pour les échafaudages installés sur des logements de plus de 2 ans en travaux de rénovation, et à 20% pour les chantiers neufs ou commerciaux.`,
  "carreleur-mosaiste": `Le carreleur mosaïste est un artisan d'art dont les réalisations combinent techniques traditionnelles et créations contemporaines. Ce savoir-faire rare justifie des tarifs premium qui doivent être clairement valorisés dans les devis. Un devis de mosaïque doit préciser : le type de tesselles (verre, céramique, pierre naturelle, émaux de Briare), la taille en m², la conception du motif si sur mesure. Les photos de réalisations passées sont absolument indispensables pour convaincre un client qui paie 3 à 5 fois le prix d'un carrelage standard. Le mini-site vitrine Artisan+ avec galerie photos est votre meilleur outil commercial. La TVA est à 10% pour les logements de plus de 2 ans.`,
  "peintre-batiment": `Le peintre en bâtiment est souvent l'artisan de la dernière étape d'un chantier de rénovation, ce qui crée un défi particulier : les travaux de peinture révèlent toutes les imperfections des corps de métiers précédents. Un devis de peinture bâtiment doit clairement stipuler l'état du support requis (lisse, sec, enduit de lissage fini), et la prise en charge ou non des finitions des malfaçons précédentes. Ces précisions évitent les litiges en fin de chantier. Pour les façades extérieures, les conditions météo sont une contrainte importante — Artisan+ intègre la météo dans le suivi de chantier. La certification RGE est accessible aux peintres qui réalisent de l'ITE, ouvrant des marchés MaPrimeRénov avec TVA à 5,5%.`,
  "electricien-domotique": `L'électricien domotique est à la croisée de l'électricité traditionnelle et des nouvelles technologies de la maison connectée. Ce spécialiste installe des systèmes KNX, Zigbee, Z-Wave ou propriétaires permettant de contrôler éclairage, volets, chauffage et sécurité depuis un smartphone. Les devis de domotique combinent plusieurs corps de travaux (câblage, pose d'équipements, programmation) et plusieurs types de TVA selon l'âge du logement. Pour les systèmes de gestion d'énergie, si l'installateur est certifié RGE, la TVA à 5,5% peut s'appliquer. Artisan+ configure ces taux multiples par ligne de prestation. Les vidéos de démonstration de vos installations sur le mini-site vitrine sont très efficaces pour convaincre les clients sceptiques.`,
};

// ── SEO : textes uniques par ville (top 20) ───────────────────────────────────
const VILLES_SEO = {
  paris: `Paris concentre la plus grande densité d'artisans et de chantiers de France, mais aussi les contraintes les plus strictes. Travailler comme artisan à Paris, c'est gérer des appartements en copropriété avec des règlements stricts, des autorisations de voirie pour les bennes, et une clientèle souvent très exigeante sur la présentation des devis et la communication. Le prix des chantiers parisiens est généralement 20 à 30% plus élevé qu'en province, ce qui rend la présentation professionnelle des devis encore plus importante pour justifier les tarifs. Artisan+ a développé des fonctionnalités particulièrement utiles à Paris : les situations de travaux pour les grands chantiers de rénovation haussmannienne, la gestion des copropriétaires multiples sur un même chantier, et le mini-site vitrine pour attirer une clientèle aisée qui recherche des artisans recommandés en ligne avant d'appeler. Les artisans parisiens utilisant Artisan+ rapportent un taux d'impayés particulièrement faible grâce au paiement en ligne intégré directement dans la facture.`,
  marseille: `Marseille est une ville de projets actifs : rénovation du centre historique, développement des quartiers nord, chantiers portuaires. L'activité BTP à Marseille est soutenue et diverse, avec des bâtiments anciens aux matériaux atypiques (pierre de la couronne, enduits à la chaux) et une clientèle très variée (particuliers modestes, copropriétés luxueuses, professionnels du tourisme). Dans ce contexte concurrentiel, la réactivité commerciale est décisive : un devis envoyé le jour même de la visite, avec un bouton de signature électronique, donne un avantage concurrentiel réel sur les artisans qui envoient leur document une semaine plus tard. Les artisans de la métropole Aix-Marseille utilisent Artisan+ pour gérer des chantiers jusqu'à Aix-en-Provence et Aubagne, centralisant toute leur activité dans une seule application à 7,99€/mois.`,
  lyon: `Lyon est une métropole en forte croissance, portée par le développement du quartier de la Confluence, la rénovation de la Presqu'île et les projets immobiliers autour des nouvelles stations de métro. Le BTP lyonnais est dynamique, avec une forte demande en rénovation de logements anciens (pentes de la Croix-Rousse, Vieux Lyon) et en construction neuve. Les artisans lyonnais font face à des maîtres d'ouvrage professionnels exigeants sur les documents contractuels : situations de travaux mensuelles, retenues de garantie, assurance dommages-ouvrage. Artisan+ répond à ces exigences avec des fonctionnalités BTP complètes. La métropole de Lyon concentre aussi de nombreux sous-traitants BTP qui travaillent pour des entreprises générales — l'auto-liquidation de TVA est donc une fonctionnalité fréquemment utilisée par les artisans lyonnais sur Artisan+.`,
  toulouse: `Toulouse est l'une des villes françaises dont la population croît le plus rapidement, alimentant une demande soutenue en logements neufs et en rénovation. L'industrie aéronautique (Airbus, ses sous-traitants) attire des cadres bien rémunérés qui investissent dans l'immobilier de qualité. Les artisans toulousains bénéficient d'un marché porteur, notamment en rénovation des maisons de ville en briques roses et en construction de piscines (l'un des marchés les plus actifs de France). La proximité avec les communes périurbaines en expansion (Colomiers, Blagnac, Balma, Tournefeuille) offre des opportunités supplémentaires. Artisan+ aide les artisans toulousains à créer des devis précis, à gérer les situations de travaux sur les constructions longues, et à se développer sur plusieurs communes simultanément grâce à la gestion multi-chantiers de l'application.`,
  bordeaux: `Bordeaux est une métropole en pleine transformation depuis l'arrivée du TGV en 2017. L'afflux de nouveaux habitants (parisiens, télétravailleurs) a créé une forte demande en rénovation de logements anciens (Chartrons, Saint-Michel, Capucins) et en construction dans les communes périurbaines. Les artisans bordelais font face à des clients souvent venus d'autres régions, avec des attentes élevées en matière de communication digitale — ils cherchent leurs artisans sur Google, comparent les devis en ligne et apprécient la signature électronique. Le mini-site vitrine Artisan+ et les avis clients sont des atouts particulièrement précieux dans ce marché concurrentiel. La Gironde est aussi très active en rénovation énergétique (isolation, PAC, panneaux solaires) grâce au bon ensoleillement et à une population sensible aux économies d'énergie.`,
  nantes: `Nantes est l'une des villes françaises dont la croissance démographique est la plus soutenue hors Paris. Ce dynamisme se traduit par une activité BTP intense : programmes neufs dans les quartiers Île de Nantes, Doulon-Gohards, Bottière-Chénaie, et rénovation intense dans le centre-ville et les communes de Loire-Atlantique. Les artisans nantais travaillent pour une clientèle jeune et connectée, habituée à comparer les services en ligne et à gérer ses démarches depuis son smartphone. Un artisan qui envoie son devis en 2 minutes avec un lien de signature électronique marque des points immédiats. La météo bretonne crée aussi une forte demande en travaux d'étanchéité, isolation et traitement de l'humidité — les artisans nantais utilisent beaucoup la fonctionnalité météo intégrée dans le suivi de chantier Artisan+.`,
  strasbourg: `Strasbourg se distingue par son riche patrimoine architectural classé à l'UNESCO et une forte culture germanique des constructions solides et bien entretenues. Les artisans strasbourgeois font face à des réglementations strictes pour les travaux en secteur sauvegardé et aux exigences thermiques rigoureuses de la région Alsace. La certification RGE est particulièrement rentable à Strasbourg où les travaux d'isolation sont très demandés. Le marché de la rénovation des maisons alsaciennes à colombages (reconstruction, restauration) est une spécialité locale qui justifie des devis très détaillés avec des matériaux et techniques traditionnels. Artisan+ permet aux artisans alsaciens de créer ces devis complexes avec plusieurs lignes de postes, des références de matériaux spécifiques et les taux de TVA appropriés selon le type de bien (monument historique, logement classique, construction neuve).`,
  lille: `Lille et sa métropole (Roubaix, Tourcoing, Villeneuve d'Ascq) constituent le 4ème pôle urbain de France avec une forte densité de logements anciens en besoin de rénovation. Les maisons d'ouvriers en briques rouges du 19ème siècle sont emblématiques du Nord, et leur rénovation (isolation, mise aux normes électriques, remplacement des menuiseries) représente un marché considérable. La rénovation énergétique est une priorité dans une région où les hivers sont rigoureux et où de nombreux ménages sont en précarité énergétique. Les artisans lillois travaillent souvent sur des marchés sociaux (bailleurs HLM) et privés simultanément. Artisan+ gère aussi bien les particuliers que les professionnels, avec des conditions de paiement adaptées (B2C immédiat, B2B à 30 ou 60 jours).`,
  nice: `Nice et la Côte d'Azur représentent un marché BTP très spécifique : villas de luxe, appartements de standing, résidences secondaires de clients aisés souvent absents qui délèguent la gestion des travaux à distance. Dans ce contexte, la communication digitale est essentielle : envoyer des photos de chantier quotidiennes via Artisan+, des factures par email et permettre le règlement en ligne par carte bancaire n'est pas un luxe — c'est la norme attendue par cette clientèle. Les artisans niçois font aussi face à la concurrence d'artisans peu scrupuleux qui pratiquent des prix très bas. Pour s'en distinguer, la présentation professionnelle (devis soignés, mini-site avec avis clients, facturation irréprochable) est indispensable. Le marché de la piscine, des terrasses et des aménagements extérieurs est particulièrement actif sur la Côte d'Azur.`,
  montpellier: `Montpellier est l'une des villes françaises à la plus forte croissance démographique. Étudiants, télétravailleurs, retraités du Nord... cette affluence crée une demande soutenue en logements et une activité BTP intense dans les zones périurbaines (Castelnau, Lattes, Grabels, Clapiers). Les artisans montpelliérains travaillent sur un marché très concurrentiel qui justifie une présentation irréprochable des devis et une grande réactivité. La forte population étudiante et les petits propriétaires de logements locatifs créent aussi un marché de rénovation locative (remise à neuf entre locataires, mise aux normes) qui nécessite des devis rapides et des factures conformes pour déduction fiscale. Artisan+ est particulièrement adapté à ces petits chantiers récurrents avec une clientèle de bailleurs qui apprécient la facturation digitale et le paiement en ligne.`,
  rennes: `Rennes est une métropole bretonne en plein essor, portée par son secteur numérique et ses grandes écoles. La ville se distingue par un niveau de vie élevé, une forte culture de l'écologie et une attention particulière à la rénovation énergétique. Les artisans rennais bénéficient d'une clientèle sensible aux certifications RGE et aux solutions économes en énergie. La Bretagne est également une région où la construction et la rénovation de maisons en pierre (granit, schiste) nécessite des artisans spécialisés. Rennes et sa couronne concentrent de nombreux projets de construction neuve à haute performance énergétique (RE2020). Artisan+ avec son suivi de chantier et ses situations de travaux est particulièrement adapté à ces projets de construction longue durée avec des maîtres d'ouvrage exigeants sur la traçabilité.`,
  grenoble: `Grenoble est une ville alpine industrielle et universitaire dont le tissu économique génère une demande spécifique : rénovation de logements souvent datés (années 1960-1970), forte demande en isolation thermique (hivers froids), et projets d'entreprises de haute technologie. La métropole grenobloise est l'une des plus actives de France en rénovation énergétique, avec des programmes de réhabilitation de copropriétés des années 70 qui représentent des marchés considérables pour les artisans RGE. La forte population universitaire et les employés de l'industrie grenobloise (semi-conducteurs, nucléaire, santé) créent un marché locatif très actif. Les propriétaires bailleurs ont besoin de factures conformes pour leurs déclarations fiscales — Artisan+ les génère automatiquement, avec les mentions légales complètes et l'archivage numérique.`,
  dijon: `Dijon et la Côte-d'Or concentrent un marché immobilier particulier lié au vignoble bourguignon : rénovation de domaines viticoles, restauration de caves et cuveries, construction de maisons de maître. Ces chantiers spécifiques, à haute valeur ajoutée, nécessitent des artisans qualifiés et des devis très détaillés. En dehors du secteur viticole, Dijon dispose d'un marché résidentiel stable alimenté par l'Université de Bourgogne et le CHU. La rénovation de l'hypercentre dijonnais (hôtels particuliers, maisons à pans de bois) est réglementée par les Architectes des Bâtiments de France — Artisan+ permet de créer des devis avec des descriptions techniques très précises et des références aux matériaux conformes aux prescriptions patrimoniales.`,
  angers: `Angers et le Maine-et-Loire bénéficient d'un cadre de vie attractif qui attire entreprises et familles. Le secteur BTP angevin est porté par la construction neuve dans les communes périurbaines et par la rénovation du bâti ancien en centre-ville. Angers est également une ville étudiante importante ce qui crée un marché locatif actif — les propriétaires bailleurs angevins ont besoin de factures conformes et de devis rapides pour leurs travaux de remise en état entre locataires. Artisan+ répond exactement à ces besoins. La région Pays de la Loire est très active en rénovation énergétique (isolation des maisons en tuffeau, typiques de la région) et en installation de panneaux solaires. Les artisans certifiés RGE du Maine-et-Loire trouvent dans Artisan+ un outil qui gère automatiquement les mentions RGE et les taux de TVA spécifiques.`,
  nimes: `Nîmes et le Gard bénéficient d'un ensoleillement exceptionnel qui en fait l'une des zones les plus attractives de France pour les panneaux solaires photovoltaïques et les pompes à chaleur. Les artisans gardois certifiés RGE ont un potentiel de marché considérable. La ville dispose également d'un riche patrimoine romain dont la restauration génère des chantiers spécialisés pour les artisans formés aux techniques de conservation. Le marché résidentiel nîmois est actif avec une forte demande en climatisation (étés très chauds) et en rénovation de villas et mas typiques du Languedoc. Les artisans nîmois couvrent souvent un territoire large (Alès, Le Vigan, Uzès) — Artisan+ avec son application smartphone est particulièrement adapté à ces déplacements fréquents entre les différents chantiers dispersés.`,
  reims: `Reims est la capitale champenoise dont l'économie est liée au champagne et au tourisme. La ville dispose d'un patrimoine architectural exceptionnel et d'un tissu de maisons bourgeoises du 19ème siècle en besoin constant de rénovation. Les artisans rémois travaillent sur deux marchés distincts : les grandes maisons des négociants de champagne (chantiers à haute valeur ajoutée) et le résidentiel classique. La proximité avec Paris attire aussi des investisseurs qui achètent des biens à rénover pour la location. Artisan+ aide les artisans rémois à gérer des projets complexes avec situations de travaux, à communiquer avec des clients parisiens via le suivi de chantier digitalisé, et à se démarquer par une présentation professionnelle irréprochable face à une concurrence locale parfois moins équipée numériquement.`,
  "saint-etienne": `Saint-Étienne est une ville en mutation, passant d'une identité industrielle à un pôle de design et de créativité. Cette transition se traduit par de nombreux projets de réhabilitation de friches industrielles en lofts et espaces de travail créatif — un marché spécifique pour les artisans capables de travailler sur des bâtiments industriels. La ville se distingue aussi par des prix de l'immobilier parmi les plus bas de France, ce qui attire des investisseurs qui rénovent des appartements pour la location. Ce marché de la rénovation locative est un débouché important pour les artisans stéphanois. La proximité avec Lyon crée aussi des opportunités pour les artisans qui couvrent les deux marchés — Artisan+ avec son suivi multi-chantiers est pratique pour gérer des interventions dans les deux villes depuis une seule application.`,
  toulon: `Toulon et le Var représentent un marché immobilier attractif pour les retraités et les familles qui quittent Paris en quête de soleil et de qualité de vie. Cette migration génère une forte demande en rénovation de villas et de maisons provençales. La clientèle varoise inclut beaucoup de propriétaires de résidences secondaires parisiens ou étrangers qui pilotent leurs travaux à distance — d'où l'importance capitale d'un suivi de chantier avec photos et d'une communication digitale irréprochable. Artisan+ est l'outil idéal pour ces artisans qui gèrent des clients absents : photos de chantier envoyées quotidiennement, factures par email, paiement en ligne par carte bancaire. Le marché de la piscine est très actif dans le Var. Les artisans varois peuvent facilement présenter un mini-site vitrine avec leurs réalisations de piscines et villas rénovées.`,
  "le-havre": `Le Havre est une ville reconstruite après-guerre par Auguste Perret, classée à l'UNESCO, avec des contraintes de rénovation spécifiques liées à son architecture en béton unique. Les artisans havrais travaillent sur deux marchés distincts : la rénovation du patrimoine Perret et le développement des nouvelles zones résidentielles en périphérie. Le port du Havre génère aussi une activité industrielle et logistique importante pour les artisans spécialisés (tuyauterie, électricité industrielle, soudure navale). Artisan+ gère aussi bien les chantiers résidentiels que les interventions industrielles B2B, avec des conditions de paiement adaptées à chaque type de client. La rénovation énergétique est un enjeu fort au Havre où de nombreux logements anciens sont mal isolés face aux vents de la Manche.`,
  versailles: `Versailles et les Yvelines constituent un marché immobilier très spécifique : châteaux, manoirs, hôtels particuliers et maisons bourgeoises de qualité nécessitent des artisans capables de rénover des bâtiments anciens avec des matériaux nobles. Les travaux en secteur sauvegardé nécessitent des autorisations préalables et l'accord de l'Architecte des Bâtiments de France. Les artisans versaillais doivent être particulièrement précis dans leurs devis (matériaux conformes aux prescriptions, délais de travaux réalistes). La clientèle versaillaise inclut de nombreux cadres supérieurs et diplomates dont les exigences en matière de communication et de professionnalisme sont très élevées. Artisan+ avec son mini-site vitrine, ses devis professionnels et son système de paiement en ligne répond à ces attentes.`,
};

// ── SEO : texte générique par région pour les villes sans seoText ─────────────
function genSeoVille(ville) {
  const ctx = {
    "Île-de-France": `En Île-de-France, le marché des artisans est l'un des plus compétitifs de France. La densité de population et les prix de l'immobilier élevés génèrent une forte demande en rénovation et en entretien, avec des clients qui attendent réactivité et professionnalisme.`,
    "Auvergne-Rhône-Alpes": `En Auvergne-Rhône-Alpes, la diversité des territoires (métropoles, stations de ski, zones rurales) crée des marchés BTP variés. L'attractivité de la région continue d'alimenter la construction neuve et la rénovation du bâti ancien.`,
    "Provence-Alpes-Côte d'Azur": `En Provence-Alpes-Côte d'Azur, le marché de la rénovation est stimulé par l'attractivité touristique et l'afflux de nouveaux habitants. Les travaux de piscine, terrasse, climatisation et rénovation énergétique sont particulièrement demandés.`,
    "Occitanie": `En Occitanie, la croissance démographique soutenue de Toulouse et Montpellier génère une forte activité BTP. La rénovation énergétique est très active grâce à l'ensoleillement favorable aux panneaux solaires et aux pompes à chaleur.`,
    "Nouvelle-Aquitaine": `En Nouvelle-Aquitaine, le dynamisme de Bordeaux et la croissance des zones côtières et rurales créent de nombreuses opportunités pour les artisans. La rénovation du patrimoine local (maisons en pierre, chartrons) est un marché spécifique à haute valeur ajoutée.`,
    "Bretagne": `En Bretagne, le marché BTP est porté par la rénovation de maisons en granite et en schiste, la forte demande en isolation thermique (hivers pluvieux) et le développement de communes attractives comme Rennes et Brest.`,
    "Normandie": `En Normandie, la rénovation du patrimoine (colombages, maisons normandes) et la remise aux normes énergétiques des maisons anciennes représentent des marchés importants. La proximité avec Paris en fait aussi une destination pour les résidences secondaires.`,
    "Hauts-de-France": `Dans les Hauts-de-France, la rénovation des maisons en briques du Nord et la réhabilitation de logements anciens à faible performance énergétique sont les principales sources d'activité pour les artisans BTP.`,
    "Grand Est": `Dans le Grand Est, les contraintes climatiques (hivers froids) génèrent une forte demande en isolation thermique et en systèmes de chauffage performants. La proximité avec l'Allemagne et la Suisse influence les standards de qualité attendus.`,
    "Pays de la Loire": `Dans les Pays de la Loire, l'attractivité de Nantes et ses environs crée un marché BTP dynamique. La rénovation de maisons en tuffeau et la construction neuve dans les communes périurbaines sont au cœur de l'activité artisanale locale.`,
    "Centre-Val de Loire": `Dans le Centre-Val de Loire, la rénovation de châteaux, manoirs et maisons de maître est une spécialité locale à haute valeur ajoutée. Le marché résidentiel des grandes villes (Tours, Orléans) est complété par une demande rurale importante.`,
    "Bourgogne-Franche-Comté": `En Bourgogne-Franche-Comté, la rénovation du patrimoine viticole et des maisons bourgeoises représente des chantiers à haute valeur. La proximité avec la Suisse génère des exigences de qualité et de présentation particulièrement élevées.`,
  };
  const regionText = ctx[ville.region] || `Dans la région ${ville.region}, le marché des artisans est actif avec une demande régulière en rénovation et construction, stimulée par une population en croissance.`;
  return `Vous êtes artisan à ${ville.label} (département ${ville.dept}) et vous cherchez un outil pour gérer vos devis et factures efficacement ? Artisan+ est la solution de référence pour les professionnels du bâtiment en ${ville.region}. ${regionText} Avec Artisan+, créez des devis professionnels en 2 minutes depuis votre smartphone, envoyez vos factures par email et encaissez en ligne par carte bancaire — tout ça à 7,99€/mois sans engagement. Les artisans de ${ville.label} utilisant Artisan+ rapportent un gain de temps de 3 à 5 heures par semaine sur la gestion administrative. Grâce au mini-site vitrine inclus, développez votre clientèle à ${ville.label} et dans les communes environnantes grâce à votre présence professionnelle en ligne, avec vos réalisations, vos certifications et vos avis clients.`;
}

// ── SEO : textes uniques par concurrent ──────────────────────────────────────
const CONCURRENTS_SEO = {
  tolteck: `Tolteck est un logiciel de devis et facturation pour artisans bien établi sur le marché français, apprécié pour son interface épurée et sa prise en main rapide. Sa force principale est sa simplicité : en quelques clics, vous créez un devis correct que vous envoyez par email. Cependant, cette simplicité a un prix : Tolteck est proposé à 19€/mois (et jusqu'à 39€/mois pour les formules complètes), soit 2 à 5 fois le tarif d'Artisan+. Pour ce supplément tarifaire, Tolteck n'offre pas de suivi de chantier avancé, pas de mini-site vitrine pour attirer de nouveaux clients, et pas de paiement en ligne intégré directement dans les factures. Ce sont pourtant des fonctionnalités devenues indispensables pour les artisans qui veulent développer leur activité. Artisan+ propose exactement ces fonctionnalités manquantes — plus un catalogue de prix personnalisable, des outils terrain (niveau à bulle, boussole, lampe torche), et la génération de fichiers Factur-X pour la réforme 2026 — pour un prix 58% moins élevé. La migration depuis Tolteck est simple : importez vos clients et prestations en quelques minutes, et votre compte Artisan+ est opérationnel immédiatement.`,
  obat: `Obat est l'une des solutions de gestion les plus complètes pour artisans et PME du bâtiment sur le marché français. Son catalogue fonctionnel est impressionnant : planning de chantier, gestion d'équipe, bibliothèque de prix BATIPRIX, comptabilité avancée... Mais cette richesse fonctionnelle a deux inconvénients majeurs. Premièrement, le prix : 39€/mois pour la formule de base, et jusqu'à 79€/mois pour les formules avancées. Pour un artisan indépendant, c'est difficile à justifier quand Artisan+ offre les fonctionnalités essentielles (devis, factures, suivi chantier, paiement en ligne, mini-site vitrine) à 7,99€/mois. Deuxièmement, la complexité : Obat nécessite une formation et une prise en main longue, ce qui peut décourager les artisans habitués à des outils simples. Artisan+ est conçu pour être opérationnel en moins de 15 minutes, sans formation. Pour les artisans qui cherchent la puissance d'Obat à un prix raisonnable, Artisan+ offre le meilleur rapport fonctionnalités/prix du marché en 2026.`,
  artisanfacture: `ArtisanFacture est l'un des logiciels de facturation les plus anciens pour artisans en France, avec une base d'utilisateurs fidèles dans le secteur du BTP. Son principal atout historique est son ancienneté et sa réputation — beaucoup d'artisans l'ont découvert via leur chambre de métiers ou leur comptable. Cependant, son positionnement tarifaire à 29€/mois est difficile à justifier face à des alternatives plus récentes. ArtisanFacture ne propose pas de suivi de chantier avancé, pas de mini-site vitrine, et pas de paiement en ligne intégré dans les factures — trois fonctionnalités devenues essentielles en 2026. Artisan+ a été conçu après ArtisanFacture, en intégrant toutes ces fonctionnalités manquantes, plus des outils exclusifs comme les outils terrain sur smartphone (niveau, boussole, mesure par IA), la génération Factur-X pour la réforme 2026, et une interface mobile vraiment optimisée pour le travail sur chantier. À 7,99€/mois — soit 63% moins cher qu'ArtisanFacture — Artisan+ est le choix évident pour les artisans qui veulent moderniser leur gestion.`,
};

// ── Fonctionnalités principales ───────────────────────────────────────────────
// ── Catégories de fonctionnalités ────────────────────────────────────────────
const FEATURE_GROUPS = [
  {
    id: "devis-facturation",
    titre: "📄 Devis & Facturation",
    sous: "Créez, envoyez, encaissez — tout en quelques clics",
    features: [
      {
        icon: "📄",
        titre: "Devis en 2 minutes",
        desc: "Catalogue de prix intégré, calcul TVA automatique, envoi par email. Votre client reçoit un devis pro depuis votre smartphone, sur le chantier.",
        benefit: "1h gagnée par devis",
      },
      {
        icon: "🧾",
        titre: "Factures conformes",
        desc: "Numérotation automatique, mentions légales françaises, TVA sur débit ou encaissement, acomptes, relances automatiques à J+15 et J+30.",
        benefit: "Zéro erreur légale",
      },
      {
        icon: "🎨",
        titre: "5 thèmes PDF pro",
        desc: "Classique, Moderne, Minimal, Premium ou Artisan : choisissez le design de vos documents. Votre logo, vos couleurs, votre marque.",
        benefit: "Image pro immédiate",
      },
      {
        icon: "✍️",
        titre: "Signature électronique",
        desc: "Votre client signe le devis depuis son téléphone en 10 secondes. Légalement valide (eIDAS), empreinte IP + date archivées automatiquement.",
        benefit: "Accord sans déplacement",
      },
      {
        icon: "🔳",
        titre: "QR code sur chaque doc",
        desc: "Chaque devis et facture intègre un QR code unique. Votre client le scanne pour signer, payer ou suivre l'avancement du chantier en temps réel.",
        benefit: "Expérience client premium",
      },
      {
        icon: "💶",
        titre: "Paiement en ligne",
        desc: "Vos clients paient directement depuis leur facture par carte bancaire (Stripe Connect). Fonds sur votre compte en 48h. Taux de paiement ×3.",
        benefit: "Encaissez plus vite",
      },
      {
        icon: "📚",
        titre: "Catalogue de prix",
        desc: "Créez votre bibliothèque de prestations avec vos tarifs. Insérez une ligne en 1 clic. Se met à jour automatiquement à partir de vos devis acceptés.",
        benefit: "Cohérence tarifaire",
      },
      {
        icon: "📸",
        titre: "Import photo IA",
        desc: "Photographiez un ancien devis papier ou une liste manuscrite. L'IA extrait les prestations et les intègre automatiquement dans votre nouveau devis.",
        benefit: "Dématérialisation en 10s",
      },
    ],
  },
  {
    id: "chantier-terrain",
    titre: "🏗️ Chantier & Terrain",
    sous: "Gérez vos chantiers depuis le terrain, en temps réel",
    features: [
      {
        icon: "🏗️",
        titre: "Suivi chantier temps réel",
        desc: "Photos avant/après, avancement en %, journal de chantier, suivi des coûts. Partagez un lien de suivi à votre client : il suit sans vous appeler.",
        benefit: "Moins d'appels clients",
      },
      {
        icon: "⛅",
        titre: "Météo chantier",
        desc: "Météo sur 7 jours directement dans votre chantier. Planifiez vos travaux extérieurs en évitant la pluie. Alertes personnalisables.",
        benefit: "Planification optimale",
      },
      {
        icon: "⏱️",
        titre: "Pointage des heures",
        desc: "Chaque membre de l'équipe pointe ses heures avec géolocalisation. Tableau de bord temps réel pour le patron. Calcul automatique du coût MO.",
        benefit: "Maîtrisez vos marges",
      },
      {
        icon: "🗺️",
        titre: "Plan chantier IA",
        desc: "Décrivez vos travaux en texte ou vocal. L'IA génère un plan d'exécution structuré avec étapes, matériaux estimés et planning recommandé.",
        benefit: "Organisation sans effort",
      },
    ],
  },
  {
    id: "ia-assistants",
    titre: "🤖 Intelligence Artificielle",
    sous: "L'IA travaille pour vous, vous gardez les mains libres",
    features: [
      {
        icon: "🎤",
        titre: "Devis vocal IA",
        desc: "Dictez votre devis à voix haute sur le chantier. L'IA transcrit, identifie les prestations, retrouve vos prix dans le catalogue et génère le document.",
        benefit: "Devis les mains dans le cambouis",
      },
      {
        icon: "🤖",
        titre: "Scan factures fournisseur",
        desc: "Photographiez vos factures d'achat (matériaux, sous-traitance). L'IA extrait montant, TVA, fournisseur et intègre tout dans votre comptabilité.",
        benefit: "Fin de la saisie manuelle",
      },
      {
        icon: "📊",
        titre: "Assistant comptable TVA",
        desc: "L'IA calcule votre TVA collectée/déductible, estime vos cotisations URSSAF et vous rappelle les échéances fiscales du trimestre.",
        benefit: "Sérénité fiscale",
      },
      {
        icon: "📋",
        titre: "Récap mensuel IA PDF",
        desc: "Chaque mois, un rapport PDF automatique : CA, charges, marge, TVA due, top clients, évolution. Exportable pour votre comptable en 1 clic.",
        benefit: "Pilotez votre activité",
      },
      {
        icon: "📅",
        titre: "Agenda + suggestions IA",
        desc: "Calendrier de vos chantiers et RDV. L'IA suggère les meilleurs créneaux selon la météo, la localisation et la dispo de votre équipe.",
        benefit: "Tournées optimisées",
      },
    ],
  },
  {
    id: "presence-equipe",
    titre: "🌐 Présence & Équipe",
    sous: "Votre vitrine en ligne et votre équipe bien gérée",
    features: [
      {
        icon: "🌐",
        titre: "Mini-site web professionnel",
        desc: "Votre page pro sur artisan-plus.fr/site/votre-nom. Galerie de réalisations, avis clients, formulaire de devis, coordonnées. En ligne en 5 minutes.",
        benefit: "Trouvé sur Google",
      },
      {
        icon: "👥",
        titre: "Gestion équipe 4 rôles",
        desc: "Patron (accès total), Chef de chantier, Ouvrier (mobile), Comptable (lecture seule). Invitations par code, droits granulaires, activité tracée.",
        benefit: "Coordination sans WhatsApp",
      },
      {
        icon: "🎁",
        titre: "Programme de parrainage",
        desc: "Parrainez un artisan = 1 mois offert pour vous deux. Lien unique personnalisé, tableau de bord parrainage, suivi des gains en temps réel.",
        benefit: "Abonnement réduit",
      },
    ],
  },
  {
    id: "tech-outils",
    titre: "📱 Tech & Outils de terrain",
    sous: "Une app fiable partout, même sans réseau",
    features: [
      {
        icon: "📱",
        titre: "PWA installable",
        desc: "Installez Artisan+ sur iOS ou Android sans passer par l'App Store. Icône sur l'écran d'accueil, chargement instantané, notifications push.",
        benefit: "Accès en 1 tap",
      },
      {
        icon: "📶",
        titre: "Mode hors connexion",
        desc: "Pas de réseau sur le chantier ? Artisan+ fonctionne hors connexion. Vos données se synchronisent automatiquement dès que le réseau revient.",
        benefit: "Zéro interruption",
      },
      {
        icon: "🧰",
        titre: "20+ outils de terrain",
        desc: "Niveau à bulle AR, boussole, mesure par photo IA, calculateur de surfaces et volumes, identificateur de matériaux IA, traduction IA en 50 langues, convertisseur d'unités, et bien plus.",
        benefit: "Une seule app suffit",
      },
    ],
  },
];

// Pour le SEO et les pages métiers (liste plate des features)
const FEATURES = FEATURE_GROUPS.flatMap(g => g.features);

// ── Témoignages ───────────────────────────────────────────────────────────────
const TEMOIGNAGES = [
  { nom: "Marc D.", metier: "Plombier", ville: "Lyon", note: 5, texte: "J'ai arrêté de faire mes devis à la main grâce à Artisan+. En 2 minutes c'est envoyé, signé électroniquement et archivé. À 7,99€/mois c'est imbattable — j'ai économisé 200€/an par rapport à mon ancien logiciel." },
  { nom: "Sophie L.", metier: "Électricienne", ville: "Paris", note: 5, texte: "Le mini-site m'a permis d'avoir une présence en ligne sans payer un développeur. Maintenant je reçois des demandes de devis directement depuis mon profil. Le paiement en ligne m'a sauvé la mise avec plusieurs clients qui traînaient à payer." },
  { nom: "Jean-Pierre M.", metier: "Maçon", ville: "Toulouse", note: 5, texte: "Simple, rapide et pas cher. J'ai comparé avec Tolteck et Obat — Artisan+ a les mêmes fonctions pour deux fois moins cher. La gestion de chantier avec les photos est vraiment pratique pour mes clients." },
];

// ── Tableau comparatif ────────────────────────────────────────────────────────
const COMPARATIF = {
  lignes: [
    "Prix mensuel",
    "Devis illimités",
    "Factures illimitées",
    "Suivi de chantier",
    "Mini-site vitrine",
    "Paiement en ligne client",
    "Signature électronique",
    "Catalogue de prix perso.",
    "Gestion multi-artisans",
    "Export PDF professionnel",
    "Support client",
  ],
  cols: [
    {
      nom: "Artisan+",
      prix: "7,99€/mois",
      values: ["7,99€/mois", true, true, true, true, true, true, true, true, true, "Chat & Email"],
      highlight: true,
    },
    {
      nom: "Tolteck",
      prix: "19€/mois",
      values: ["19€/mois", true, true, false, false, false, true, true, false, true, "Email"],
    },
    {
      nom: "Obat",
      prix: "39€/mois",
      values: ["39€/mois", true, true, true, false, false, false, true, true, true, "Téléphone"],
    },
    {
      nom: "ArtisanFacture",
      prix: "29€/mois",
      values: ["29€/mois", true, true, false, false, false, false, true, false, true, "Email"],
    },
  ],
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function setPageMeta(title, description, canonical) {
  document.title = title;
  const upsertMeta = (sel, attr, name, content) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  };
  upsertMeta('meta[name="description"]', "name", "description", description);
  upsertMeta('meta[property="og:title"]', "property", "og:title", title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", description);
  upsertMeta('meta[property="og:url"]', "property", "og:url", canonical || BASE);
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = canonical || BASE;
}

function navigate(to) {
  const hashIdx = to.indexOf("#");
  const hash = hashIdx >= 0 ? to.slice(hashIdx + 1) : null;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (hash) {
    // Scroll vers la section (petit délai pour laisser React re-rendre)
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ── Composant : En-tête ───────────────────────────────────────────────────────
function Header() {
  const { lang, setLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled,  setScrolled] = useState(false);
  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const navLinks = lang === "en"
    ? [
        { label: "Features",  href: "/#fonctionnalites" },
        { label: "Pricing",   href: "/#tarifs" },
        { label: "Trades",    href: "/#metiers" },
      ]
    : [
        { label: "Fonctionnalités", href: "/#fonctionnalites" },
        { label: "Tarifs",          href: "/#tarifs" },
        { label: "Métiers",         href: "/#metiers" },
      ];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 500,
      background: scrolled ? "rgba(10,22,40,0.97)" : D,
      borderBottom: scrolled ? "1px solid rgba(255,140,0,0.15)" : "1px solid transparent",
      backdropFilter: "blur(12px)",
      transition: "all 0.3s",
      paddingTop: "env(safe-area-inset-top, 0px)",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/" onClick={e => { e.preventDefault(); navigate("/"); setMenuOpen(false); }} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px", fontWeight: "900", color: "white", letterSpacing: "-0.5px" }}>
            Artisan<span style={{ color: P }}>+</span>
          </span>
        </a>

        {/* Desktop nav — masqué sur mobile */}
        {!isMobile && (
          <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} onClick={e => { e.preventDefault(); navigate(l.href); }}
                style={{ color: G, fontSize: "14px", fontWeight: "600", textDecoration: "none", padding: "6px 12px", borderRadius: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "white"}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{l.label}</a>
            ))}
            {/* Bouton FR/EN */}
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              style={{ background: "rgba(255,140,0,0.1)", border: "1.5px solid rgba(255,140,0,0.35)", color: P, borderRadius: "8px", padding: "5px 12px", cursor: "pointer", fontSize: "13px", fontWeight: "700", marginRight: "4px" }}
            >{lang === "fr" ? "🇬🇧 EN" : "🇫🇷 FR"}</button>
            <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
              style={{ color: G, fontSize: "14px", fontWeight: "600", textDecoration: "none", padding: "6px 12px" }}>
              {lang === "en" ? "Login" : "Connexion"}
            </a>
            <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
              style={{ background: P, color: "white", fontSize: "14px", fontWeight: "700", textDecoration: "none", padding: "10px 20px", borderRadius: "10px", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {lang === "en" ? "Create free account →" : "Créer un compte gratuit →"}
            </a>
          </nav>
        )}

        {/* Mobile : CTA + langue + hamburger */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              style={{ background: "rgba(255,140,0,0.1)", border: "1.5px solid rgba(255,140,0,0.35)", color: P, borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
            >{lang === "fr" ? "EN" : "FR"}</button>
            <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
              style={{ background: P, color: "white", fontSize: "13px", fontWeight: "700", textDecoration: "none", padding: "9px 16px", borderRadius: "10px" }}
            >
              {lang === "en" ? "Sign up free" : "Créer un compte gratuit"}
            </a>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              style={{ background: "transparent", border: "none", color: "white", fontSize: "22px", cursor: "pointer", padding: "8px 4px", lineHeight: 1 }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu déroulant */}
      {isMobile && menuOpen && (
        <div style={{
          background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,140,0,0.15)",
          borderBottom: "1px solid rgba(255,140,0,0.15)",
          padding: "8px 20px 16px",
          display: "flex", flexDirection: "column", gap: "2px",
        }}>
          {navLinks.map(l => (
            <a key={l.label} href={l.href}
              onClick={e => { e.preventDefault(); navigate(l.href); setMenuOpen(false); }}
              style={{ color: "white", fontSize: "16px", fontWeight: "600", textDecoration: "none", padding: "13px 4px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >{l.label}</a>
          ))}
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); setMenuOpen(false); }}
            style={{ color: G, fontSize: "16px", fontWeight: "600", textDecoration: "none", padding: "13px 4px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {lang === "en" ? "Login" : "Connexion"}
          </a>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); setMenuOpen(false); }}
            style={{ display: "block", textAlign: "center", background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "14px", borderRadius: "12px", textDecoration: "none", marginTop: "10px" }}>
            🚀 Créer un compte gratuit
          </a>
        </div>
      )}
    </header>
  );
}

// ── Composant : Pied de page ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: C, borderTop: "1px solid rgba(255,140,0,0.12)", padding: "60px 20px 40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "48px" }}>
          {/* Colonne logo */}
          <div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: "white", marginBottom: "12px" }}>
              Artisan<span style={{ color: P }}>+</span>
            </div>
            <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: "0 0 16px" }}>
              L'application de gestion pour artisans la plus abordable du marché. Devis, factures, chantiers — tout en un.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🇫🇷</span>
              <span style={{ color: G, fontSize: "12px", alignSelf: "center" }}>Fait en France</span>
            </div>
          </div>

          {/* Métiers */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Métiers</div>
            {METIERS.slice(0, 5).map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{m.emoji} {m.label}</a>
            ))}
            {METIERS.slice(5).map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{m.emoji} {m.label}</a>
            ))}
          </div>

          {/* Villes */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Principales villes</div>
            {VILLES.slice(0, 10).map(v => (
              <a key={v.slug} href={`/artisan-${v.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/artisan-${v.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >📍 {v.label}</a>
            ))}
          </div>

          {/* Liens utiles */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Liens utiles</div>
            {[
              { label: "Connexion", href: "/login" },
              { label: "Créer un compte", href: "/login" },
              { label: "Alternative à Tolteck", href: "/alternative-tolteck" },
              { label: "Alternative à Obat", href: "/alternative-obat" },
              { label: "Alternative à ArtisanFacture", href: "/alternative-artisanfacture" },
              { label: "Conditions d'utilisation", href: "/cgu" },
              { label: "Politique de confidentialité", href: "/politique-confidentialite" },
              { label: "Mentions légales", href: "/mentions-legales" },
            ].map(l => (
              <a key={l.label} href={l.href}
                onClick={e => { e.preventDefault(); navigate(l.href); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{l.label}</a>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#445566", fontSize: "12px", margin: 0 }}>
            © {new Date().getFullYear()} Artisan+. Tous droits réservés.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href="/cgu" onClick={e => { e.preventDefault(); navigate("/cgu"); }} style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>CGU</a>
            <a href="/politique-confidentialite" onClick={e => { e.preventDefault(); navigate("/politique-confidentialite"); }} style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>Confidentialité</a>
            <a href="/mentions-legales" onClick={e => { e.preventDefault(); navigate("/mentions-legales"); }} style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>Mentions légales</a>
            <a href="mailto:contact@artisan-plus.fr" style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Composant : Mockup app (CSS) ──────────────────────────────────────────────
function AppMockup() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "360px", margin: "0 auto" }}>
      {/* Téléphone */}
      <div style={{ background: "#0d1f3c", borderRadius: "32px", border: "3px solid rgba(255,140,0,0.3)", padding: "12px", boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,140,0,0.1)" }}>
        {/* Écran */}
        <div style={{ background: D, borderRadius: "24px", overflow: "hidden", minHeight: "480px", padding: "16px" }}>
          {/* Header app */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ color: "white", fontWeight: "900", fontSize: "16px" }}>Artisan<span style={{ color: P }}>+</span></span>
            <span style={{ fontSize: "20px" }}>🔔</span>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: "CA ce mois", val: "4 820 €", color: "#4CAF50" },
              { label: "Devis envoyés", val: "12", color: P },
              { label: "Factures", val: "8", color: "#2196F3" },
              { label: "En attente", val: "1 340 €", color: "#FFA500" },
            ].map(s => (
              <div key={s.label} style={{ background: C, borderRadius: "10px", padding: "10px", border: "1px solid rgba(255,140,0,0.1)" }}>
                <div style={{ color: G, fontSize: "9px", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ color: s.color, fontWeight: "800", fontSize: "14px" }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Devis récent */}
          <div style={{ background: C, borderRadius: "12px", padding: "12px", marginBottom: "10px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>DEV-2024-042</span>
              <span style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "6px" }}>Signé ✓</span>
            </div>
            <div style={{ color: G, fontSize: "10px" }}>Réfection toiture — M. Dupont</div>
            <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>3 240,00 €</div>
          </div>

          {/* Facture récente */}
          <div style={{ background: C, borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>FAC-2024-038</span>
              <span style={{ background: "rgba(255,165,0,0.15)", color: "#FFA500", fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "6px" }}>En attente</span>
            </div>
            <div style={{ color: G, fontSize: "10px" }}>Installation chaudière — Mme Martin</div>
            <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>1 840,00 €</div>
          </div>
        </div>
      </div>

      {/* Badge flottant */}
      <div style={{ position: "absolute", top: "20px", right: "-20px", background: "rgba(76,175,80,0.9)", color: "white", fontSize: "11px", fontWeight: "700", padding: "8px 12px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
        ✓ Devis signé !
      </div>
      <div style={{ position: "absolute", bottom: "60px", left: "-20px", background: "rgba(255,140,0,0.9)", color: "white", fontSize: "11px", fontWeight: "700", padding: "8px 12px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
        💶 Paiement reçu
      </div>
    </div>
  );
}

// ── Composant : Tableau comparatif ────────────────────────────────────────────
function TableauComparatif({ titre }) {
  return (
    <div id="tarifs" style={{ scrollMarginTop: "80px" }}>
      {titre && <h2 style={{ color: "white", fontSize: "clamp(22px,4vw,32px)", fontWeight: "800", textAlign: "center", marginBottom: "8px" }}>{titre}</h2>}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: "600px", borderCollapse: "separate", borderSpacing: 0, background: C, borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,140,0,0.15)" }}>
          <thead>
            <tr>
              <th style={{ padding: "16px 20px", textAlign: "left", color: G, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", background: "#0d1f3c", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>Fonctionnalité</th>
              {COMPARATIF.cols.map(col => (
                <th key={col.nom} style={{ padding: "16px 20px", textAlign: "center", background: col.highlight ? "rgba(255,140,0,0.12)" : "#0d1f3c", borderBottom: `1px solid ${col.highlight ? "rgba(255,140,0,0.4)" : "rgba(255,140,0,0.1)"}`, borderTop: col.highlight ? `3px solid ${P}` : "3px solid transparent" }}>
                  <div style={{ color: col.highlight ? P : "white", fontWeight: "800", fontSize: "15px" }}>{col.nom}</div>
                  <div style={{ color: col.highlight ? P : G, fontSize: "13px", fontWeight: "700", marginTop: "4px" }}>{col.prix}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARATIF.lignes.map((ligne, i) => (
              <tr key={ligne} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                <td style={{ padding: "12px 20px", color: "white", fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{ligne}</td>
                {COMPARATIF.cols.map(col => {
                  const val = col.values[i];
                  return (
                    <td key={col.nom} style={{ padding: "12px 20px", textAlign: "center", background: col.highlight ? "rgba(255,140,0,0.04)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {typeof val === "boolean" ? (
                        <span style={{ fontSize: "16px" }}>{val ? "✅" : "❌"}</span>
                      ) : (
                        <span style={{ color: col.highlight ? P : G, fontWeight: col.highlight ? "800" : "600", fontSize: "13px" }}>{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Composant : Section CTA ───────────────────────────────────────────────────
function CTASection({ titre, sous }) {
  return (
    <div style={{ background: `linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(10,22,40,0) 60%, rgba(255,140,0,0.04) 100%)`, border: "1px solid rgba(255,140,0,0.25)", borderRadius: "28px", padding: "clamp(44px,6vw,88px) 28px", textAlign: "center", margin: "0 auto", maxWidth: "800px", boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 0 60px rgba(255,140,0,0.06) inset" }}>
      <div style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: "900", color: "white", lineHeight: "1.2", marginBottom: "16px" }}>
        {titre || <>Commencez <span style={{ color: P }}>gratuitement</span> aujourd'hui</>}
      </div>
      <p style={{ color: G, fontSize: "16px", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 36px", lineHeight: "1.7" }}>
        {sous || "Aucune carte bancaire requise. Commencez gratuitement — passez Pro à 7,99€/mois quand vous êtes prêt."}
      </p>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
          className="ap-btn"
          style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "17px 36px", borderRadius: "14px", textDecoration: "none" }}
        >
          🚀 Créer un compte gratuit
        </a>
        <a href="/#tarifs" onClick={e => { e.preventDefault(); navigate("/#tarifs"); }}
          className="ap-btn ap-btn-ghost"
          style={{ background: "rgba(255,255,255,0.07)", color: "white", fontWeight: "700", fontSize: "16px", padding: "17px 36px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.18)" }}>
          Voir les tarifs
        </a>
      </div>
    </div>
  );
}

// ── PAGE : Accueil ────────────────────────────────────────────────────────────
// ── Composant : Accordion FAQ ────────────────────────────────────────────────
function FaqAccordion({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {items.map((item, i) => (
        <details key={i} style={{ background: D, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden" }}>
          <summary style={{ listStyle: "none", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", cursor: "pointer", userSelect: "none" }}>
            <span style={{ color: "white", fontSize: "15px", fontWeight: "700", lineHeight: "1.4" }}>{item.q}</span>
            <span className="ap-faq-plus" style={{ color: P, fontSize: "20px", flexShrink: 0 }}>+</span>
          </summary>
          <div style={{ padding: "0 24px 20px", color: G, fontSize: "14px", lineHeight: "1.8" }}>{item.a}</div>
        </details>
      ))}
    </div>
  );
}

// ── Données FAQ ───────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Combien coûte Artisan+ ?",
    a: "Artisan+ est disponible en version gratuite (fonctionnalités de base) et en version Pro à 7,99€/mois sans engagement. C'est le logiciel de gestion artisan le moins cher du marché — Tolteck coûte 19€/mois, ArtisanFacture 29€/mois et Obat 39€/mois.",
  },
  {
    q: "Est-ce que je peux essayer Artisan+ gratuitement ?",
    a: "Oui ! Vous pouvez créer un compte gratuitement sans carte bancaire. La version gratuite vous permet de créer des devis et factures, gérer vos clients et accéder aux fonctionnalités de base. Pour le mini-site, le paiement en ligne et le suivi chantier avancé, passez en Pro à 7,99€/mois.",
  },
  {
    q: "Est-ce que la signature électronique est légalement valable ?",
    a: "Oui. La signature électronique intégrée à Artisan+ est légalement valable en France conformément au règlement eIDAS et à l'article 1366 du Code civil. Elle génère une preuve horodatée que votre client a bien signé le devis.",
  },
  {
    q: "Artisan+ fonctionne-t-il sur smartphone ?",
    a: "Artisan+ est une Progressive Web App (PWA) optimisée pour iPhone et Android. Vous pouvez créer vos devis directement sur le chantier depuis votre téléphone, et l'installer sur votre écran d'accueil comme une vraie application mobile.",
  },
  {
    q: "Pour quels métiers du bâtiment est conçu Artisan+ ?",
    a: "Artisan+ est conçu pour tous les artisans du bâtiment : plombiers, électriciens, maçons, carreleurs, peintres, menuisiers, chauffagistes, serruriers, couvreurs, jardiniers et bien d'autres. Le catalogue de prix est adaptable à votre métier.",
  },
  {
    q: "Comment fonctionne le paiement en ligne pour mes clients ?",
    a: "Une fois votre compte Stripe Connect lié à Artisan+, vos clients peuvent payer leurs factures directement par carte bancaire en un clic. Les fonds sont virés sur votre compte bancaire en 48 heures. Artisan+ utilise Stripe, la solution de paiement la plus sécurisée du marché.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Vos données sont hébergées sur Supabase en Europe (RGPD), chiffrées en transit (HTTPS) et sécurisées par Row Level Security. Artisan+ ne partage jamais vos données avec des tiers à des fins commerciales.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Oui, sans condition. Vous pouvez résilier votre abonnement Pro en 1 clic depuis les paramètres de l'application, sans frais ni préavis. Votre compte repasse en version gratuite immédiatement.",
  },
];

function PageHome() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setPageMeta(
      "Artisan+ | App Devis Factures Artisan - 7,99€/mois",
      "Logiciel devis et factures pour artisans à 7,99€/mois. Moins cher que Tolteck, Obat et ArtisanFacture. Devis, factures, chantiers, mini-site, paiement en ligne.",
      BASE
    );
    // ── Schema.org : SoftwareApplication + WebSite + FAQPage ──────────────────
    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Artisan+",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": {
          "@type": "Offer",
          "price": "7.99",
          "priceCurrency": "EUR",
          "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" }
        },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "500", "bestRating": "5" },
        "description": "Logiciel de devis et facturation pour artisans. Devis, factures, suivi chantier, mini-site, paiement en ligne.",
        "url": BASE,
        "screenshot": `${BASE}/og-image.png`,
        "featureList": "Devis professionnels, Factures conformes, Signature électronique, Paiement en ligne, Suivi de chantier, Mini-site vitrine",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Artisan+",
        "url": BASE,
        "potentialAction": { "@type": "SearchAction", "target": `${BASE}/blog?q={search_term_string}`, "query-input": "required name=search_term_string" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_ITEMS.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
    ];
    schemas.forEach((schema, i) => {
      const id = `schema-home-${i}`;
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = id; document.head.appendChild(el); }
      el.textContent = JSON.stringify(schema);
    });
  }, []);

  return (
    <>
      {/* ── Bannière facturation électronique 2026 ──────────────── */}
      <div style={{ background: "linear-gradient(90deg, rgba(255,140,0,0.15) 0%, rgba(255,140,0,0.08) 100%)", borderBottom: "1px solid rgba(255,140,0,0.3)", padding: "10px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "16px" }}>⚡</span>
          <span style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>Anticipez la facturation électronique obligatoire 2026–2027 avec Artisan+</span>
          <span style={{ color: G, fontSize: "12px" }}>—</span>
          <span style={{ color: G, fontSize: "12px" }}>Format Factur-X (EN 16931) déjà disponible dans votre app</span>
          <a href="/facturation-electronique-obligatoire-2026"
            onClick={e => { e.preventDefault(); navigate("/facturation-electronique-obligatoire-2026"); }}
            style={{ color: P, fontSize: "12px", fontWeight: "800", textDecoration: "none", background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.4)", borderRadius: "8px", padding: "4px 10px", whiteSpace: "nowrap" }}>
            En savoir plus →
          </a>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "clamp(60px,9vw,120px) 20px clamp(48px,7vw,100px)", overflow: "hidden" }}>
        <HeroBackground />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1240px", margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? "48px" : "72px", alignItems: "center" }}>
          <div>
            {/* Badge */}
            <div className="ap-badge ap-hero-line1" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.4)", borderRadius: "20px", padding: "8px 18px", marginBottom: "32px" }}>
              <span style={{ color: P, fontSize: "12px", fontWeight: "800", letterSpacing: ".3px" }}>🏆 N°1 des apps artisan les moins chères</span>
            </div>

            <h1 style={{ margin: "0 0 24px" }}>
              <span className="ap-hero-line1" style={{ display: "block", color: "white", fontSize: "clamp(38px,5.5vw,68px)", fontWeight: "900", lineHeight: "1.05", letterSpacing: "-2px" }}>
                Vos devis et factures
              </span>
              <span className="ap-hero-line2" style={{ display: "block", fontSize: "clamp(42px,6vw,76px)", fontWeight: "900", lineHeight: "1", letterSpacing: "-2px" }}>
                <span className="ap-grad-text">en 2 minutes</span>
              </span>
              <span className="ap-hero-line3" style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "clamp(28px,3.5vw,48px)", fontWeight: "800", lineHeight: "1.15", letterSpacing: "-1px", marginTop: "4px" }}>
                Gratuit pour commencer
              </span>
            </h1>

            <p className="ap-hero-sub" style={{ color: G, fontSize: "clamp(15px,1.8vw,18px)", lineHeight: "1.75", marginBottom: "40px", maxWidth: "540px" }}>
              L'application de gestion pour artisans la plus complète et la moins chère du marché. Devis, factures, suivi chantier, mini-site vitrine et paiement en ligne — tout en un.
            </p>

            <div className="ap-hero-cta" style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "36px" }}>
              <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
                className="ap-btn ap-btn-primary"
                style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "18px 34px", borderRadius: "14px", textDecoration: "none", boxShadow: "0 8px 32px rgba(255,140,0,0.4)" }}
              >
                🚀 Créer un compte gratuit
              </a>
              <a href="#comparatif" onClick={e => { e.preventDefault(); document.getElementById("comparatif")?.scrollIntoView({ behavior: "smooth" }); }}
                className="ap-btn ap-btn-ghost"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", fontWeight: "700", fontSize: "16px", padding: "18px 30px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
                Voir le comparatif ↓
              </a>
            </div>

            {/* Proof points */}
            <div className="ap-hero-proof" style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {["✅ Sans engagement", "✅ Essai gratuit", "✅ Support inclus"].map(p => (
                <span key={p} style={{ color: G, fontSize: "13px", fontWeight: "600" }}>{p}</span>
              ))}
            </div>
          </div>

          {/* Animation devis — masquée sur mobile */}
          {!isMobile && (
            <div className="ap-hero-phone" style={{ display: "flex", justifyContent: "center" }}>
              <InvoiceAnimation />
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section style={{ background: C, padding: "40px 20px", borderTop: "1px solid rgba(255,140,0,0.12)", borderBottom: "1px solid rgba(255,140,0,0.12)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "28px" }}>
          {[
            { val: "500+",    label: "Artisans actifs" },
            { val: "10 000+", label: "Devis générés" },
            { val: "Gratuit", label: "Pour commencer" },
            { val: "4.9/5",   label: "Note moyenne" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} style={{ textAlign: "center" }}>
              <div style={{ color: P, fontWeight: "900", fontSize: "clamp(26px,4vw,38px)", letterSpacing: "-1px" }}>{s.val}</div>
              <div style={{ color: G, fontSize: "13px", marginTop: "6px" }}>{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités ─────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ padding: "clamp(60px,8vw,100px) 20px", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: "80px" }}>
            <div className="ap-badge" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.35)", borderRadius: "20px", padding: "8px 18px", marginBottom: "24px" }}>
              <span style={{ color: P, fontSize: "12px", fontWeight: "800", letterSpacing: ".3px" }}>✦ 25+ fonctionnalités incluses</span>
            </div>
            <h2 style={{ color: "white", fontSize: "clamp(28px,4.5vw,50px)", fontWeight: "900", margin: "0 0 18px", lineHeight: "1.08", letterSpacing: "-1px" }}>
              Tout ce dont un artisan a besoin,<br /><span className="ap-grad-text">dans une seule app</span>
            </h2>
            <p style={{ color: G, fontSize: "18px", maxWidth: "620px", margin: "0 auto", lineHeight: "1.7" }}>
              Du devis vocal sur le chantier au récap mensuel IA, en passant par le suivi en temps réel et les 20 outils de terrain.
            </p>
          </Reveal>

          {FEATURE_GROUPS.map(group => (
            <div key={group.id} style={{ marginBottom: "64px" }}>
              {/* En-tête de groupe */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ color: "white", fontSize: "clamp(18px,2.5vw,24px)", fontWeight: "900", margin: "0 0 6px" }}>{group.titre}</h3>
                <p style={{ color: G, fontSize: "14px", margin: 0 }}>{group.sous}</p>
                <div style={{ width: "48px", height: "3px", background: `linear-gradient(90deg, ${P}, transparent)`, borderRadius: "2px", marginTop: "12px" }} />
              </div>
              {/* Grille de cartes */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {group.features.map((f, fi) => (
                  <Reveal key={f.titre} delay={fi * 0.06} style={{ display: "flex" }}>
                    <SpotlightCard style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "22px", padding: "28px", display: "flex", flexDirection: "column", gap: "0", flex: 1 }}>
                      <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
                      <h4 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 10px", lineHeight: "1.3" }}>{f.titre}</h4>
                      <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: "0 0 16px", flexGrow: 1 }}>{f.desc}</p>
                      {f.benefit && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "8px", padding: "6px 12px", width: "fit-content" }}>
                          <span style={{ color: P, fontSize: "11px", fontWeight: "800" }}>✓ {f.benefit}</span>
                        </div>
                      )}
                    </SpotlightCard>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Construisez votre activité ───────────────────────── */}
      <section style={{ position: "relative", padding: "clamp(80px,10vw,130px) 20px", background: `linear-gradient(180deg, ${C} 0%, ${D} 100%)`, overflow: "hidden" }}>
        {/* Halo de fond */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,140,0,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: "72px" }}>
            <div className="ap-badge" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.35)", borderRadius: "20px", padding: "8px 18px", marginBottom: "24px" }}>
              <span style={{ color: P, fontSize: "12px", fontWeight: "800", letterSpacing: ".3px" }}>🏗️ Construit pour les artisans</span>
            </div>
            <h2 style={{ color: "white", fontSize: "clamp(28px,4.5vw,52px)", fontWeight: "900", margin: "0 0 16px", lineHeight: "1.08", letterSpacing: "-1px" }}>
              Construisez votre activité,<br /><span className="ap-grad-text">on gère le reste</span>
            </h2>
            <p style={{ color: G, fontSize: "17px", maxWidth: "560px", margin: "0 auto", lineHeight: "1.7" }}>De la première brique au chantier livré — Artisan+ vous accompagne à chaque étape.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "center" }}>
            <Reveal delay={0.06}>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,140,0,0.12)", borderRadius: "28px", padding: "40px 24px", backdropFilter: "blur(8px)" }}>
                <HouseAnimation />
                <div style={{ color: "white", fontWeight: "800", fontSize: "18px", marginTop: "24px", letterSpacing: "-.3px" }}>Chaque chantier maîtrisé</div>
                <p style={{ color: G, fontSize: "14px", marginTop: "10px", lineHeight: "1.7" }}>Suivez l'avancement, les coûts et partagez les photos avec vos clients en temps réel.</p>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <RevenueAnimation />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Comparatif ──────────────────────────────────────────── */}
      <section id="comparatif" style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.03) 0%, transparent 100%)`, scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(28px,4.5vw,48px)", fontWeight: "900", margin: "0 0 16px", lineHeight: "1.1", letterSpacing: "-1px" }}>
              Artisan+ :<br /><span className="ap-grad-text">2× moins cher que la concurrence</span>
            </h2>
            <p style={{ color: G, fontSize: "17px", maxWidth: "560px", margin: "0 auto" }}>
              Toutes les fonctionnalités pour 7,99€/mois au lieu de 19€ à 39€ chez nos concurrents.
            </p>
          </Reveal>
          <TableauComparatif />
        </div>
      </section>

      {/* ── Témoignages ─────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(28px,4.5vw,48px)", fontWeight: "900", margin: "0 0 12px", letterSpacing: "-1px" }}>
              Ils font confiance à <span className="ap-grad-text">Artisan+</span>
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "8px" }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: "#FFD700", fontSize: "20px" }}>★</span>)}
            </div>
            <p style={{ color: G, fontSize: "14px" }}>Note moyenne 4,9/5 · Plus de 500 artisans satisfaits</p>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {TEMOIGNAGES.map((t, ti) => (
              <Reveal key={t.nom} delay={ti * 0.12} style={{ display: "flex" }}>
                <SpotlightCard style={{ background: "linear-gradient(145deg, rgba(17,30,53,1) 0%, rgba(10,22,40,1) 100%)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "24px", padding: "32px", flex: 1, boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", gap: "3px", marginBottom: "18px" }}>
                    {[...Array(t.note)].map((_, i) => <span key={i} style={{ color: "#FFD700", fontSize: "18px" }}>★</span>)}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "15px", lineHeight: "1.8", fontStyle: "italic", margin: "0 0 24px" }}>"{t.texte}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", background: "rgba(255,140,0,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0, border: "1px solid rgba(255,140,0,0.25)", boxShadow: "0 0 16px rgba(255,140,0,0.12)" }}>
                      {t.metier === "Plombier" ? "🔧" : t.metier === "Électricienne" ? "⚡" : "🧱"}
                    </div>
                    <div>
                      <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{t.nom}</div>
                      <div style={{ color: G, fontSize: "12px", marginTop: "2px" }}>{t.metier} · {t.ville}</div>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Métiers ─────────────────────────────────────────────── */}
      <section id="metiers" style={{ padding: "clamp(60px,8vw,100px) 20px", background: C, scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 12px" }}>
              Pour <span style={{ color: P }}>tous les métiers</span> du bâtiment
            </h2>
            <p style={{ color: G, fontSize: "15px" }}>
              Catalogue de prix adapté, modèles de devis spécifiques à votre activité.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
            {METIERS.map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                className="ap-card"
                style={{ background: D, border: "1px solid rgba(255,140,0,0.12)", borderRadius: "16px", padding: "22px 16px", textDecoration: "none", textAlign: "center", display: "block" }}
              >
                <div style={{ fontSize: "30px", marginBottom: "10px" }}>{m.emoji}</div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>{m.label}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: C }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", margin: "0 0 12px" }}>
              Questions <span style={{ color: P }}>fréquentes</span>
            </h2>
            <p style={{ color: G, fontSize: "15px" }}>Tout ce que vous devez savoir sur Artisan+</p>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <CTASection />
        </div>
      </section>
    </>
  );
}

// ── PAGE : Métier ─────────────────────────────────────────────────────────────
function PageMetier({ metier }) {
  const faq = genFaqMetier(metier);
  useEffect(() => {
    const title = `Logiciel devis facture ${metier.label} | Artisan+ à 7,99€/mois`;
    const description = `Créez vos devis et factures de ${metier.desc} en 2 minutes. Logiciel ${metier.kw} Artisan+ à 7,99€/mois. Suivi chantier, mini-site, paiement en ligne inclus.`;
    setPageMeta(title, description, `${BASE}/devis-facture-${metier.slug}`);
    // Schema.org SoftwareApplication + FAQPage
    const schemas = [
      { "@context":"https://schema.org","@type":"SoftwareApplication","name":"Artisan+","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","offers":{"@type":"Offer","price":"7.99","priceCurrency":"EUR"},"description":description,"url":`${BASE}/devis-facture-${metier.slug}` },
      { "@context":"https://schema.org","@type":"FAQPage","mainEntity": faq.map(f=>({ "@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a} })) },
    ];
    schemas.forEach((s, i) => {
      const id = `schema-metier-${i}`;
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.type="application/ld+json"; el.id=id; document.head.appendChild(el); }
      el.textContent = JSON.stringify(s);
    });
  }, [metier]);

  const Icone = metier.emoji;
  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>{metier.emoji}</div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            {metier.label} ? Gérez vos devis<br />et factures en <span style={{ color: P }}>2 minutes</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ est l'outil de gestion conçu pour {art(metier.art)}{metier.label.toLowerCase()}. Créez des devis professionnels de {metier.desc}, envoyez-les par email, obtenez la signature électronique et encaissez en ligne — <strong style={{ color: P }}>gratuit pour commencer</strong>.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            className="ap-btn"
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "17px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Créer un compte gratuit — {metier.label}
          </a>
        </div>
      </section>

      {/* Contenu SEO */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "60px" }}>
            {[
              { icon: "⚡", titre: `Devis ${metier.desc} en 2 min`, desc: `Catalogue de prix ${metier.desc} intégré. Créez un devis complet en quelques clics, sans saisie répétitive.` },
              { icon: "🧾", titre: "Factures conformes", desc: "Factures légalement conformes avec TVA, acomptes, mentions obligatoires et export PDF professionnel." },
              { icon: "✍️", titre: "Signature en ligne", desc: "Vos clients signent le devis depuis leur téléphone. Plus besoin de rendez-vous pour une signature." },
              { icon: "💶", titre: "Paiement en ligne", desc: "Encaissez par carte bancaire directement depuis la facture. Virements dans les 48h sur votre compte." },
              { icon: "🌐", titre: "Mini-site gratuit", desc: `Votre vitrine en ligne de ${metier.label.toLowerCase()} avec vos réalisations. Recevez des demandes de devis directement.` },
              { icon: "🏗️", titre: "Suivi de chantier", desc: "Gérez vos chantiers de A à Z : photos, coûts, avancement. Partagez l'état d'avancement avec vos clients." },
            ].map((f, fi) => (
              <Reveal key={f.titre} delay={fi * 0.07} style={{ display: "flex" }}>
                <div className="ap-card" style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "26px", flex: 1 }}>
                  <div style={{ fontSize: "30px", marginBottom: "14px" }}>{f.icon}</div>
                  <h3 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 8px" }}>{f.titre}</h3>
                  <p style={{ color: G, fontSize: "13px", lineHeight: "1.65", margin: 0 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bloc texte SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Pourquoi Artisan+ est le meilleur logiciel de gestion pour {art(metier.art)}{metier.label.toLowerCase()} ?
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              {METIERS_SEO[metier.slug] ? (
                <>
                  <p>{METIERS_SEO[metier.slug]}</p>
                  <p>À <strong style={{ color: P }}>7,99€/mois</strong> seulement (sans engagement), Artisan+ est <strong>2 à 5 fois moins cher</strong> que Tolteck (19€/mois), Obat (39€/mois) ou ArtisanFacture (29€/mois), tout en offrant davantage de fonctionnalités.</p>
                </>
              ) : (
                <>
                  <p>En tant que {metier.kw}, vous faites face à des défis quotidiens : établir des devis rapidement, relancer les clients, suivre les paiements et gérer plusieurs chantiers en même temps. Artisan+ a été conçu pour résoudre exactement ces problèmes.</p>
                  <p>Notre logiciel de devis et de facturation pour {metier.kw} vous permet de :</p>
                  <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                    <li>Créer un devis de {metier.desc} en moins de 2 minutes grâce à votre catalogue de prix personnel</li>
                    <li>Envoyer le devis par email avec signature électronique légalement valide</li>
                    <li>Générer la facture en un clic depuis le devis accepté</li>
                    <li>Recevoir le paiement par carte bancaire directement depuis la facture</li>
                    <li>Suivre vos chantiers de {metier.desc} avec photos et suivi des coûts</li>
                    <li>Présenter vos réalisations sur votre mini-site vitrine professionnel</li>
                  </ul>
                  <p>À <strong style={{ color: P }}>7,99€/mois</strong> seulement (sans engagement), Artisan+ est <strong>2 à 5 fois moins cher</strong> que Tolteck (19€/mois), Obat (39€/mois) ou ArtisanFacture (29€/mois), tout en offrant davantage de fonctionnalités.</p>
                </>
              )}
            </div>
          </div>

          <TableauComparatif titre={`Artisan+ vs les alternatives pour ${art(metier.art)}${metier.label.toLowerCase()}`} />

          {/* FAQ métier */}
          <div style={{ marginTop: "56px", marginBottom: "56px" }}>
            <h2 style={{ color: "white", fontWeight: "900", fontSize: "22px", margin: "0 0 24px" }}>
              Questions fréquentes — <span style={{ color: P }}>{metier.label}</span>
            </h2>
            <FaqAccordion items={faq} />
          </div>

          {/* Liens villes combinées */}
          {TOP20_V.length > 0 && (
            <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "32px", marginBottom: "48px" }}>
              <h2 style={{ color: "white", fontWeight: "800", fontSize: "18px", margin: "0 0 20px" }}>
                {metier.label} par ville
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {TOP20_V.map(v => (
                  <a key={v.slug} href={`/${metier.slug}-${v.slug}`}
                    onClick={e => { e.preventDefault(); navigate(`/${metier.slug}-${v.slug}`); }}
                    style={{ background: D, border: "1px solid rgba(255,140,0,0.15)", borderRadius: "8px", padding: "7px 14px", color: G, fontSize: "13px", textDecoration: "none", transition: "color 0.15s, border-color 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = P; e.currentTarget.style.borderColor = "rgba(255,140,0,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = G; e.currentTarget.style.borderColor = "rgba(255,140,0,0.15)"; }}
                  >{metier.label} {v.label}</a>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <CTASection titre={<>Commencez maintenant,<br /><span style={{ color: P }}>{metier.label}</span></>} sous={`Rejoignez les artisans en ${metier.desc} qui font confiance à Artisan+. Essai gratuit, sans carte bancaire.`} />
          </div>
        </div>
      </section>
    </>
  );
}

function art(a) { return a === "l'" ? "l'" : `${a} `; }

// ── PAGE : Ville ──────────────────────────────────────────────────────────────
function PageVille({ ville }) {
  useEffect(() => {
    const title = `Artisan+ ${ville.label} | Logiciel devis facture artisan ${ville.label}`;
    const description = `Logiciel de devis et factures pour artisans à ${ville.label} (${ville.dept}). Gérez votre activité en ${ville.region} à 7,99€/mois. Essai gratuit.`;
    setPageMeta(title, description, `${BASE}/artisan-${ville.slug}`);
    const schema = {
      "@context":"https://schema.org","@type":"LocalBusiness","name":`Artisan+ — ${ville.label}`,"description":description,
      "url":`${BASE}/artisan-${ville.slug}`,
      "areaServed":{"@type":"City","name":ville.label,"containedInPlace":{"@type":"AdministrativeArea","name":ville.region}},
      "priceRange":"7,99€/mois","currenciesAccepted":"EUR",
    };
    let el = document.getElementById("schema-ville");
    if (!el) { el = document.createElement("script"); el.type="application/ld+json"; el.id="schema-ville"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, [ville]);

  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📍</div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            Artisans à <span style={{ color: P }}>{ville.label}</span>,<br />simplifiez votre gestion
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ est utilisé par des centaines d'artisans en {ville.region}, dont beaucoup à {ville.label}. Devis, factures, chantiers et paiement en ligne à <strong style={{ color: P }}>7,99€/mois</strong> — aucun engagement.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            className="ap-btn"
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "17px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Démarrer gratuitement à {ville.label}
          </a>
        </div>
      </section>

      {/* Contenu SEO */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Chiffres ville */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "56px" }}>
            {[
              { val: ville.pop, label: `Habitants à ${ville.label}` },
              { val: "7,99€/mois", label: "Prix Artisan+ Pro" },
              { val: "2 min", label: "Pour créer un devis" },
              { val: "100%", label: "Sans engagement" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <div className="ap-card" style={{ background: C, borderRadius: "18px", padding: "22px", textAlign: "center", border: "1px solid rgba(255,140,0,0.12)" }}>
                  <div style={{ color: P, fontWeight: "900", fontSize: "26px" }}>{s.val}</div>
                  <div style={{ color: G, fontSize: "12px", marginTop: "6px" }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bloc SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Artisan+ : le logiciel de gestion des artisans à {ville.label}
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>{VILLES_SEO[ville.slug] || genSeoVille(ville)}</p>
            </div>
          </div>

          {/* Métiers dans cette ville */}
          <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 24px" }}>
            Artisan+ pour tous les métiers à {ville.label}
          </h2>
          {/* Liens combinés si la ville est dans le Top 20 */}
          {(() => {
            const isTop20 = TOP20_V.some(v => v.slug === ville.slug);
            if (!isTop20) return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "56px" }}>
                {METIERS.slice(0,20).map(m => (
                  <a key={m.slug} href={`/devis-facture-${m.slug}`}
                    onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                    className="ap-card"
                    style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "14px", padding: "18px 12px", textDecoration: "none", textAlign: "center", display: "block" }}>
                    <div style={{ fontSize: "26px", marginBottom: "8px" }}>{m.emoji}</div>
                    <div style={{ color: "white", fontSize: "12px", fontWeight: "700" }}>{m.label}</div>
                  </a>
                ))}
              </div>
            );
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginBottom: "56px" }}>
                {TOP20_M.map(m => (
                  <a key={m.slug} href={`/${m.slug}-${ville.slug}`}
                    onClick={e => { e.preventDefault(); navigate(`/${m.slug}-${ville.slug}`); }}
                    className="ap-card"
                    style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "14px", padding: "14px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                    <div>
                      <div style={{ color: "white", fontSize: "12px", fontWeight: "700" }}>{m.label}</div>
                      <div style={{ color: P, fontSize: "10px" }}>à {ville.label} →</div>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}

          <TableauComparatif titre={`Comparatif logiciels artisan à ${ville.label}`} />

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <CTASection titre={<>Artisans à <span style={{ color: P }}>{ville.label}</span>,<br />démarrez gratuitement</>} sous={`Rejoignez les artisans de ${ville.region} sur Artisan+. Essai gratuit, sans carte bancaire, sans engagement.`} />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : Alternative ────────────────────────────────────────────────────────
function PageAlternative({ concurrent }) {
  useEffect(() => {
    const title = `Alternative à ${concurrent.label} | Artisan+ moins cher à 7,99€/mois`;
    const description = `Vous cherchez une alternative à ${concurrent.label} (${concurrent.prix}) ? Artisan+ offre plus de fonctionnalités à 7,99€/mois. Comparatif complet.`;
    setPageMeta(title, description, `${BASE}/alternative-${concurrent.slug}`);
  }, [concurrent]);

  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", display: "inline-block", padding: "6px 16px", marginBottom: "20px" }}>
            <span style={{ color: P, fontWeight: "800", fontSize: "13px" }}>Alternative à {concurrent.label}</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            Artisan+ vs {concurrent.label} :<br /><span style={{ color: P }}>7,99€/mois au lieu de {concurrent.prix}</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ propose les mêmes fonctionnalités que {concurrent.label} — et même plus — pour un tarif jusqu'à <strong style={{ color: P }}>{Math.round((1 - 7.99 / parseFloat(concurrent.prix)) * 100)}% moins cher</strong>. Découvrez le comparatif complet.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Essayer Artisan+ gratuitement
          </a>
        </div>
      </section>

      {/* Contenu */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Prix cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "60px" }}>
            <Reveal delay={0.05} style={{ display: "flex" }}>
              <div style={{ background: "rgba(255,140,0,0.09)", border: "2px solid rgba(255,140,0,0.45)", borderRadius: "22px", padding: "34px", textAlign: "center", flex: 1, boxShadow: "0 16px 48px rgba(255,140,0,0.12)" }}>
                <div style={{ color: P, fontWeight: "900", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>✅ Artisan+</div>
                <div style={{ color: P, fontWeight: "900", fontSize: "44px" }}>7,99€</div>
                <div style={{ color: G, fontSize: "14px" }}>/mois — tout inclus</div>
                <div style={{ marginTop: "16px", color: G, fontSize: "13px", lineHeight: "1.65" }}>
                  {FEATURES.slice(0, 4).map(f => <div key={f.titre}>✅ {f.titre}</div>)}
                  <div>✅ Mini-site vitrine</div>
                  <div>✅ Paiement en ligne</div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.12} style={{ display: "flex" }}>
              <div className="ap-card" style={{ background: C, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "22px", padding: "34px", textAlign: "center", flex: 1 }}>
                <div style={{ color: G, fontWeight: "700", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{concurrent.label}</div>
                <div style={{ color: "white", fontWeight: "900", fontSize: "44px" }}>{concurrent.prix.replace("/mois", "")}</div>
                <div style={{ color: G, fontSize: "14px" }}>/mois</div>
                <div style={{ marginTop: "16px", color: G, fontSize: "13px", lineHeight: "1.65" }}>
                  {concurrent.avantages.map(a => <div key={a}>✅ {a}</div>)}
                  {concurrent.inconvenients.map(i => <div key={i} style={{ color: "#ff6b6b" }}>❌ {i}</div>)}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Contenu SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Pourquoi choisir Artisan+ plutôt que {concurrent.label} ?
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              {CONCURRENTS_SEO[concurrent.slug] ? (
                <p>{CONCURRENTS_SEO[concurrent.slug]}</p>
              ) : (
                <>
                  <p>{concurrent.label} est un logiciel de gestion pour artisans bien connu, facturé à {concurrent.prix}. C'est une solution correcte, mais à ce tarif, beaucoup d'artisans cherchent une alternative plus accessible sans sacrifier les fonctionnalités.</p>
                  <p>Artisan+ offre à <strong style={{ color: P }}>7,99€/mois</strong> :</p>
                  <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                    <li><strong>Devis et factures illimités</strong> avec catalogue de prix personnalisé</li>
                    <li><strong>Signature électronique</strong> légalement valide directement depuis le devis</li>
                    <li><strong>Suivi de chantier avancé</strong> avec photos, coûts et partage client</li>
                    <li><strong>Mini-site vitrine</strong> professionnel pour attirer de nouveaux clients</li>
                    <li><strong>Paiement en ligne</strong> par carte bancaire — une fonctionnalité que {concurrent.label} ne propose pas</li>
                    <li><strong>Support par chat et email</strong> inclus dans l'abonnement</li>
                  </ul>
                  <p>En résumé : Artisan+ propose plus de fonctionnalités que {concurrent.label} pour un prix {Math.round((1 - 7.99 / parseFloat(concurrent.prix)) * 100)}% moins élevé. Sans engagement, avec un essai gratuit pour tester avant de s'abonner.</p>
                </>
              )}
            </div>
          </div>

          <TableauComparatif titre={`Artisan+ vs ${concurrent.label} — comparatif complet`} />

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <CTASection titre={<>Passez à <span style={{ color: P }}>Artisan+</span>,<br />l'alternative moins chère</>} sous={`Migrez depuis ${concurrent.label} en quelques minutes. Essai gratuit, sans carte bancaire, sans engagement.`} />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : CGU ────────────────────────────────────────────────────────────────
function PageCGU() {
  useEffect(() => {
    setPageMeta(
      "Conditions Générales d'Utilisation | Artisan+",
      "Conditions générales d'utilisation de l'application Artisan+. Modalités d'abonnement, droits et obligations des utilisateurs.",
      `${BASE}/cgu`
    );
  }, []);

  return (
    <section style={{ padding: "clamp(60px,8vw,80px) 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", marginBottom: "8px" }}>Conditions Générales d'Utilisation</h1>
        <p style={{ color: G, fontSize: "13px", marginBottom: "40px" }}>Dernière mise à jour : 1er juin 2025</p>

        {[
          {
            titre: "Éditeur du Service",
            contenu: `Le Service Artisan+ est édité par Kessler Cassandra, auto-entrepreneur — SIRET : 99513518300011 — Email : contact@artisan-plus.fr`,
          },
          {
            titre: "1. Objet et acceptation",
            contenu: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application Artisan+ (ci-après "le Service") éditée par Kessler Cassandra, auto-entrepreneur. En créant un compte ou en utilisant le Service, l'utilisateur accepte sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.`,
          },
          {
            titre: "2. Description du Service",
            contenu: `Artisan+ est une application web de gestion destinée aux artisans et professionnels du bâtiment. Le Service permet notamment : la création de devis et factures, le suivi de chantiers, la gestion de clients, la publication d'un mini-site vitrine, l'envoi de documents par email, la signature électronique de devis et la réception de paiements en ligne via Stripe Connect.`,
          },
          {
            titre: "3. Accès et compte utilisateur",
            contenu: `L'accès au Service nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes, à maintenir la confidentialité de ses identifiants et à informer immédiatement Artisan+ de toute utilisation non autorisée de son compte. L'accès est personnel et non transférable. Un essai gratuit est disponible avec des fonctionnalités limitées.`,
          },
          {
            titre: "4. Abonnement et tarification",
            contenu: `Le plan Pro est proposé à 7,99€ TTC par mois, facturé mensuellement via Stripe. L'abonnement est sans engagement, résiliable à tout moment depuis les paramètres du compte ou via le portail Stripe. Aucun remboursement n'est effectué pour les périodes en cours. Les prix peuvent être modifiés avec un préavis de 30 jours par email.`,
          },
          {
            titre: "5. Données et responsabilités",
            contenu: `L'utilisateur est seul responsable des données saisies (informations clients, montants, descriptions), de la conformité fiscale et légale de ses documents, et du respect des obligations déclaratives liées à son activité. Artisan+ n'est pas responsable des erreurs dans les documents générés. Il incombe à l'utilisateur de vérifier la conformité de ses devis et factures avec la législation applicable.`,
          },
          {
            titre: "6. Propriété intellectuelle",
            contenu: `L'application Artisan+, ses logos, sa charte graphique et l'ensemble de ses contenus sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou utilisation non autorisée est strictement interdite. L'utilisateur conserve la propriété de ses données et documents créés via le Service.`,
          },
          {
            titre: "7. Disponibilité et maintenance",
            contenu: `Artisan+ s'efforce d'assurer la disponibilité du Service 24h/24 et 7j/7. Des interruptions peuvent survenir pour maintenance, mise à jour ou en cas de force majeure. Artisan+ ne garantit pas un accès ininterrompu au Service et ne saurait être tenu responsable des dommages résultant d'une indisponibilité.`,
          },
          {
            titre: "8. Résiliation",
            contenu: `L'utilisateur peut résilier son abonnement à tout moment depuis son espace Paramètres > Abonnement, ou en contactant contact@artisan-plus.fr. Artisan+ se réserve le droit de suspendre ou de résilier un compte en cas de violation des présentes CGU, d'utilisation abusive ou frauduleuse, sans préavis.`,
          },
          {
            titre: "9. Loi applicable et litiges",
            contenu: `Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord amiable dans un délai de 30 jours, tout litige sera soumis aux tribunaux compétents de Paris.`,
          },
          {
            titre: "10. Contact",
            contenu: `Pour toute question relative aux présentes CGU, vous pouvez contacter Artisan+ à l'adresse : contact@artisan-plus.fr`,
          },
        ].map(s => (
          <div key={s.titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "12px" }}>{s.titre}</h2>
            <p style={{ color: G, fontSize: "14px", lineHeight: "1.8", margin: 0 }}>{s.contenu}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PAGE : Politique de confidentialité ───────────────────────────────────────
function PageRGPD() {
  useEffect(() => {
    setPageMeta(
      "Politique de Confidentialité RGPD | Artisan+",
      "Politique de confidentialité et protection des données personnelles d'Artisan+. Conformité RGPD, droits des utilisateurs, données collectées.",
      `${BASE}/politique-confidentialite`
    );
  }, []);

  return (
    <section style={{ padding: "clamp(60px,8vw,80px) 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", marginBottom: "8px" }}>Politique de Confidentialité</h1>
        <p style={{ color: G, fontSize: "13px", marginBottom: "40px" }}>Dernière mise à jour : 1er juin 2025 — Conforme au Règlement Général sur la Protection des Données (RGPD)</p>

        {[
          {
            titre: "1. Responsable du traitement",
            contenu: `Kessler Cassandra (auto-entrepreneur, SIRET : 99513518300011) est responsable du traitement de vos données personnelles. Contact : contact@artisan-plus.fr — Vous pouvez nous contacter pour toute question relative à vos données.`,
          },
          {
            titre: "2. Données collectées",
            contenu: `Nous collectons les données suivantes : Données d'identification : nom, prénom, adresse email, numéro de téléphone (si fourni). Données professionnelles : SIRET, numéro de TVA, adresse professionnelle, métier. Données de facturation : informations Stripe pour le paiement de l'abonnement (non stockées en clair chez nous). Données d'utilisation : documents créés (devis, factures), informations clients, photos de chantier. Données techniques : adresse IP, type de navigateur, pages visitées (analytics anonymisés).`,
          },
          {
            titre: "3. Finalités et bases légales",
            contenu: `Vos données sont traitées pour : l'exécution du contrat d'abonnement (base légale : exécution contractuelle), la gestion de votre compte et du Service (base légale : exécution contractuelle), l'envoi de notifications liées au Service (base légale : intérêt légitime), la conformité avec les obligations légales et fiscales (base légale : obligation légale), l'amélioration du Service avec analytics anonymisés (base légale : intérêt légitime).`,
          },
          {
            titre: "4. Hébergement et sous-traitants",
            contenu: `Vos données sont hébergées chez : Supabase (base de données, authentification) — serveurs en Europe (UE). Vercel (hébergement de l'application) — serveurs UE et US avec garanties RGPD. Stripe (paiements) — certifié PCI-DSS, conforme RGPD. Ces sous-traitants sont liés par des clauses contractuelles types conformes au RGPD.`,
          },
          {
            titre: "5. Durée de conservation",
            contenu: `Vos données sont conservées pendant la durée de votre abonnement et 3 ans après la résiliation de votre compte (obligations légales de conservation des données comptables). Les données de logs techniques sont conservées 12 mois. À l'expiration de ces délais, vos données sont supprimées ou anonymisées.`,
          },
          {
            titre: "6. Vos droits RGPD",
            contenu: `Conformément au RGPD, vous disposez des droits suivants : Droit d'accès : obtenir une copie de vos données. Droit de rectification : corriger des données inexactes. Droit à l'effacement : demander la suppression de vos données. Droit à la portabilité : recevoir vos données dans un format structuré. Droit d'opposition : vous opposer à certains traitements. Droit à la limitation : limiter le traitement de vos données. Pour exercer ces droits : contact@artisan-plus.fr. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
          },
          {
            titre: "7. Sécurité",
            contenu: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, authentification sécurisée via Supabase Auth, accès aux données restreint par Row Level Security (RLS), mots de passe hashés (bcrypt), clés API jamais exposées côté client.`,
          },
          {
            titre: "8. Cookies et consentement",
            contenu: `Artisan+ utilise deux catégories de cookies :\n\n• Cookies essentiels — indispensables au fonctionnement du Service (session utilisateur, authentification, préférences). Toujours actifs, ils ne peuvent pas être désactivés.\n• Cookies analytiques — mesure d'audience anonymisée pour améliorer l'application (optionnels). Aucune donnée transmise à des tiers publicitaires.\n\nÀ votre première visite, un bandeau de consentement vous permet d'accepter tout, refuser les cookies analytiques, ou personnaliser vos choix. Votre décision est mémorisée localement dans votre navigateur. Vous pouvez la modifier à tout moment en vidant les données du site dans les paramètres de votre navigateur.`,
          },
          {
            titre: "9. Modifications",
            contenu: `Nous pouvons modifier cette politique de confidentialité. En cas de modification substantielle, vous serez informé par email au moins 30 jours avant l'entrée en vigueur des changements. La poursuite de l'utilisation du Service après cette date vaut acceptation de la nouvelle politique.`,
          },
          {
            titre: "10. Contact DPO",
            contenu: `Pour toute question relative à la protection de vos données personnelles : contact@artisan-plus.fr — Nous nous engageons à répondre dans un délai de 30 jours.`,
          },
        ].map(s => (
          <div key={s.titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "12px" }}>{s.titre}</h2>
            <p style={{ color: G, fontSize: "14px", lineHeight: "1.8", margin: 0 }}>{s.contenu}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PAGE : Mentions Légales ───────────────────────────────────────────────────
function PageMentionsLegales() {
  useEffect(() => {
    setPageMeta(
      "Mentions Légales | Artisan+",
      "Mentions légales de l'application Artisan+ — éditeur, hébergeur, propriété intellectuelle.",
      `${BASE}/mentions-legales`
    );
  }, []);

  return (
    <section style={{ padding: "clamp(60px,8vw,80px) 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", marginBottom: "8px" }}>Mentions Légales</h1>
        <p style={{ color: G, fontSize: "13px", marginBottom: "40px" }}>Dernière mise à jour : juin 2026</p>

        {[
          {
            titre: "1. Éditeur du site",
            contenu: `Le site www.artisan-plus.fr est édité par :\nKessler Cassandra\nAuto-entrepreneur\nSIRET : 99513518300011\nEmail : contact@artisan-plus.fr\nDirectrice de la publication : Kessler Cassandra`,
          },
          {
            titre: "2. Hébergement",
            contenu: `Le site est hébergé par :\nVercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — https://vercel.com\n\nBase de données hébergée par :\nSupabase Inc. — https://supabase.com — serveurs en Europe (UE).`,
          },
          {
            titre: "3. Propriété intellectuelle",
            contenu: `L'ensemble des contenus présents sur ce site (textes, images, logos, base de données) sont la propriété exclusive de Kessler Cassandra et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation ou utilisation non autorisée est strictement interdite sans autorisation écrite préalable.`,
          },
          {
            titre: "4. Responsabilité",
            contenu: `Kessler Cassandra s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, l'exactitude, la complétude ou l'actualité des informations ne peuvent être garanties. L'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.`,
          },
          {
            titre: "5. Données personnelles",
            contenu: `Pour toute information relative au traitement de vos données personnelles, veuillez consulter notre Politique de Confidentialité accessible à l'adresse : https://www.artisan-plus.fr/politique-confidentialite`,
          },
          {
            titre: "6. Contact",
            contenu: `Pour toute question relative aux présentes mentions légales : contact@artisan-plus.fr`,
          },
        ].map(s => (
          <div key={s.titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "12px" }}>{s.titre}</h2>
            <p style={{ color: G, fontSize: "14px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-line" }}>{s.contenu}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── FAQ dynamique par métier ──────────────────────────────────────────────────
function genFaqMetier(metier) {
  const kw = metier.kw; const desc = metier.desc;
  return [
    { q:`Combien coûte un ${kw} ?`, a:`Le tarif d'un ${kw} varie selon la région, le type de travaux et la complexité de l'intervention. En France, comptez généralement entre 40 et 100€/heure selon le niveau de qualification. Pour un devis précis et gratuit, utilisez Artisan+ : vos clients reçoivent un devis professionnel en 2 minutes.` },
    { q:`Comment trouver un bon ${kw} ?`, a:`Pour trouver un ${kw} fiable, vérifiez qu'il possède une assurance décennale (obligatoire), un numéro SIRET et des avis clients. Demandez toujours plusieurs devis comparatifs. Un ${kw} professionnel utilise un logiciel de devis comme Artisan+ pour vous fournir un document clair et détaillé.` },
    { q:`Quelles mentions obligatoires sur un devis de ${kw} ?`, a:`Un devis de ${kw} doit obligatoirement mentionner : la dénomination sociale et le SIRET, la description détaillée des travaux de ${desc}, le prix unitaire HT et TTC, la TVA applicable (5,5%, 10% ou 20%), la durée de validité et la date de début des travaux. Artisan+ génère automatiquement des devis conformes à la loi.` },
    { q:`Comment facturer en tant que ${kw} auto-entrepreneur ?`, a:`En tant que ${kw} auto-entrepreneur, votre facture doit inclure votre numéro SIRET, la mention "TVA non applicable, art. 293B du CGI" si vous n'êtes pas assujetti à la TVA, les détails de vos prestations de ${desc} et vos coordonnées bancaires. Artisan+ gère tout ça automatiquement.` },
    { q:`Quelle application pour gérer les devis et factures de ${kw} ?`, a:`Artisan+ est l'application idéale pour un ${kw} : création de devis en 2 minutes, envoi par email, signature électronique légale, génération de factures, suivi des paiements et mini-site vitrine. À 7,99€/mois, c'est la solution la moins chère du marché — 2 à 5× moins cher que Tolteck ou Obat.` },
  ];
}

// ── PAGE : Métier × Ville (400 pages combinées) ───────────────────────────────
function PageMetierVille({ metier, ville }) {
  useEffect(() => {
    const title = `${metier.label} à ${ville.label} | Devis et factures — Artisan+`;
    const desc  = `Vous êtes ${metier.kw} à ${ville.label} (${ville.dept}) ? Artisan+ vous permet de créer vos devis de ${metier.desc} en 2 minutes. Logiciel ${metier.kw} à 7,99€/mois. Essai gratuit.`;
    setPageMeta(title, desc, `${BASE}/${metier.slug}-${ville.slug}`);
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `${metier.label} à ${ville.label}`,
      "description": desc,
      "areaServed": { "@type": "City", "name": ville.label, "containedInPlace": { "@type": "AdministrativeArea", "name": ville.region } },
      "provider": { "@type": "Organization", "name": "Artisan+", "url": BASE },
    };
    let el = document.getElementById("schema-combo");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-combo"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, [metier, ville]);

  const faq = genFaqMetier(metier);
  return (
    <>
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>{metier.emoji}</div>
          <h1 style={{ color: "white", fontSize: "clamp(26px,5vw,48px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            {metier.label} à <span style={{ color: P }}>{ville.label}</span><br />
            <span style={{ fontSize: "0.75em" }}>Devis et factures en 2 minutes</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(14px,2vw,17px)", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px", margin: "0 auto 32px" }}>
            Artisan+ aide les {metier.kw}s de {ville.label} ({ville.region}) à créer des devis professionnels de {metier.desc} en quelques clics. Logiciel de devis et facturation à <strong style={{ color: P }}>7,99€/mois</strong>, sans engagement.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Créer un compte gratuit — {metier.label} {ville.label}
          </a>
        </div>
      </section>

      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Avantages métier+ville */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginBottom: "56px" }}>
            {[
              { icon: "⚡", titre: `Devis ${metier.desc} en 2 min`, desc: `Catalogue de prix personnalisé pour vos travaux à ${ville.label}. Envoyez un devis professionnel depuis votre smartphone.` },
              { icon: "✍️", titre: "Signature électronique", desc: `Vos clients à ${ville.label} signent le devis depuis leur téléphone. Légalement valide, gain de temps garanti.` },
              { icon: "💶", titre: "Paiement en ligne", desc: `Encaissez par carte bancaire. Vos clients à ${ville.label} paient leur facture en un clic.` },
              { icon: "🌐", titre: `Mini-site ${metier.label} ${ville.label}`, desc: `Votre page vitrine en ligne pour attirer de nouveaux clients ${metier.kw} à ${ville.label}.` },
            ].map(f => (
              <div key={f.titre} style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ fontSize: "26px", marginBottom: "10px" }}>{f.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "14px", margin: "0 0 8px" }}>{f.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bloc SEO texte */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "20px", margin: "0 0 16px" }}>
              Artisan+ : le logiciel de gestion des {metier.kw}s à {ville.label}
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              {METIERS_SEO[metier.slug] && (
                <p style={{ marginBottom: "16px" }}>{METIERS_SEO[metier.slug]}</p>
              )}
              <p>{VILLES_SEO[ville.slug] || genSeoVille(ville)}</p>
            </div>
          </div>

          <TableauComparatif titre={`Meilleur logiciel pour ${metier.kw} à ${ville.label}`} />

          {/* FAQ */}
          <div style={{ marginTop: "56px", marginBottom: "56px" }}>
            <h2 style={{ color: "white", fontWeight: "900", fontSize: "22px", margin: "0 0 24px" }}>
              Questions fréquentes — {metier.label} à {ville.label}
            </h2>
            <FaqAccordion items={faq} />
          </div>

          <div style={{ textAlign: "center" }}>
            <CTASection
              titre={<>{metier.label} à <span style={{ color: P }}>{ville.label}</span>,<br />démarrez gratuitement</>}
              sous={`Rejoignez les ${metier.kw}s de ${ville.region} sur Artisan+. Essai gratuit, sans carte bancaire.`}
            />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : Facturation électronique obligatoire 2026 ─────────────────────────
function PageFacturationElectronique() {
  useEffect(() => {
    setPageMeta(
      "Facturation électronique obligatoire 2026–2027 | Anticipez avec Artisan+",
      "À partir du 1er septembre 2026, toutes les entreprises doivent recevoir des factures électroniques (Factur-X). Dès 2027, les artisans et TPE doivent aussi les émettre. Artisan+ génère le format Factur-X (EN 16931) et se prépare à la connexion aux Plateformes Agréées.",
      `${BASE}/facturation-electronique-obligatoire-2026`
    );
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "La facturation électronique est-elle obligatoire pour les artisans ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. À partir du 1er septembre 2026, toutes les entreprises (y compris les artisans) doivent pouvoir recevoir des factures électroniques structurées via une PDP agréée. Dès le 1er septembre 2027, les TPE, PME et micro-entreprises devront aussi émettre leurs factures dans un format structuré (Factur-X, UBL ou CII)." } },
        { "@type": "Question", "name": "Qu'est-ce que le format Factur-X ?", "acceptedAnswer": { "@type": "Answer", "text": "Factur-X est le format de facture électronique structurée choisi par la France. C'est un PDF enrichi d'un fichier XML conforme à la norme européenne EN 16931. Il est lisible par l'humain (PDF) et traitable automatiquement par les logiciels (XML)." } },
        { "@type": "Question", "name": "Artisan+ génère-t-il des factures Factur-X ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. Artisan+ génère des factures PDF classiques ET permet de télécharger le fichier Factur-X XML correspondant en un clic. Ce fichier est conforme à la norme EN 16931 et au profil Factur-X MINIMUM ou EN16931 selon votre régime de TVA." } },
        { "@type": "Question", "name": "Dois-je faire quelque chose maintenant ?", "acceptedAnswer": { "@type": "Answer", "text": "Avec Artisan+, vous pouvez déjà télécharger le fichier Factur-X XML de chaque facture depuis votre tableau de bord. La connexion automatique à une Plateforme de Dématérialisation Partenaire (PDP) agréée est en cours de préparation. Nous vous tiendrons informé dès qu'elle sera disponible." } },
      ]
    };
    let el = document.getElementById("schema-facture-elec");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-facture-elec"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, []);

  const TIMELINE = [
    { date: "1er septembre 2026", icon: "📥", titre: "Réception obligatoire", desc: "Toutes les entreprises françaises (quelle que soit leur taille) doivent être capables de recevoir des factures électroniques structurées via une Plateforme de Dématérialisation Partenaire (PDP) agréée par l'État.", who: "Toutes entreprises" },
    { date: "1er septembre 2027", icon: "📤", titre: "Émission obligatoire TPE/PME", desc: "Les TPE, PME, micro-entreprises et auto-entrepreneurs du BTP et des services doivent émettre leurs factures B2B dans un format structuré accepté : Factur-X, UBL ou CII. Les factures PDF non structurées ne seront plus acceptées.", who: "Artisans, TPE, PME" },
  ];

  const FORMATS = [
    { nom: "Factur-X", tag: "Recommandé 🇫🇷", desc: "PDF + XML embarqué. Le standard français, lisible par l'humain et traitable automatiquement. Artisan+ génère ce format.", color: "#FF8C00" },
    { nom: "UBL 2.1", tag: "Européen", desc: "Universal Business Language. Standard pan-européen utilisé notamment en Belgique, Pays-Bas, Danemark. Pur XML.", color: "#4CAF50" },
    { nom: "CII (UN/CEFACT)", tag: "International", desc: "Cross Industry Invoice. Base du Factur-X. Standard ONU utilisé en Allemagne (ZUGFeRD) et au Japon.", color: "#2196F3" },
  ];

  const FAQ_FE = [
    { q: "Qui est concerné par la réforme de 2026 ?", a: "Toutes les entreprises françaises soumises à la TVA (y compris les auto-entrepreneurs assujettis à la TVA). Les micro-entreprises sous le seuil de franchise TVA (art. 293B CGI) sont aussi concernées dès 2027 pour l'émission, même si leur XML contiendra une mention d'exonération." },
    { q: "Qu'est-ce qu'une PDP (Plateforme de Dématérialisation Partenaire) ?", a: "C'est un opérateur privé agréé par la DGFIP pour transmettre et recevoir des factures électroniques. Il est immatriculé, contrôlé et tenu de respecter des normes de sécurité strictes. Artisan+ se prépare à s'interfacer avec les principales PDP pour accompagner ses utilisateurs vers la conformité." },
    { q: "Mes factures PDF actuelles ne sont-elles plus valables ?", a: "Pour les transactions B2C (artisan → particulier), le PDF reste valable. Pour les transactions B2B (artisan → entreprise, SCI, etc.), à partir du 1er septembre 2027, il faudra émettre des factures dans un format structuré (Factur-X, UBL ou CII)." },
    { q: "Artisan+ est-il prêt pour la réforme ?", a: "Artisan+ génère déjà des factures au format Factur-X (XML structuré conforme EN 16931) : pour chaque facture, un bouton dans votre tableau de bord vous permet de télécharger le fichier XML. La connexion à une PDP agréée (obligatoire pour l'émission légale) est en cours de préparation — nous vous informerons dès son déploiement." },
    { q: "Qu'arrive-t-il si je n'émets pas de factures électroniques en 2027 ?", a: "Des pénalités peuvent s'appliquer en cas de non-conformité. La DGFiP a prévu des amendes pouvant atteindre 15€ par facture non conforme, plafonnées à 15 000€ par an. Il est recommandé de se préparer dès maintenant." },
  ];

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.06) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", padding: "6px 16px", marginBottom: "24px" }}>
            <span style={{ color: P, fontSize: "12px", fontWeight: "800" }}>⚡ Loi de finances 2024 — Réforme DGFiP</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.1", margin: "0 0 20px", letterSpacing: "-1px" }}>
            Facturation électronique<br /><span style={{ color: P }}>obligatoire en 2026–2027</span> :<br />Anticipez avec Artisan+
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "680px", margin: "0 auto 36px" }}>
            À partir du 1er septembre 2026, toute entreprise française devra pouvoir recevoir des factures électroniques structurées. Dès septembre 2027, les artisans et TPE/PME devront aussi les émettre au format Factur-X, UBL ou CII. Artisan+ génère déjà le format Factur-X conforme EN 16931.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
              style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none" }}>
              🚀 Créer un compte gratuit — anticipez dès maintenant
            </a>
            <a href="#calendrier" onClick={e => { e.preventDefault(); document.getElementById("calendrier")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: "rgba(255,255,255,0.06)", color: "white", fontWeight: "700", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
              Voir le calendrier
            </a>
          </div>
        </div>
      </section>

      {/* ── Badge conformité ──────────────────────────────────────── */}
      <section style={{ background: C, padding: "24px 20px", borderTop: "1px solid rgba(255,140,0,0.1)", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }}>
          {[
            { icon: "✅", label: "Factur-X XML conforme EN 16931" },
            { icon: "✅", label: "Profil MINIMUM (micro-entreprise)" },
            { icon: "✅", label: "Profil EN16931 (TVA)" },
            { icon: "✅", label: "Téléchargement XML en 1 clic" },
          ].map(b => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>{b.icon}</span>
              <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Calendrier ────────────────────────────────────────────── */}
      <section id="calendrier" style={{ padding: "clamp(60px,8vw,100px) 20px", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: "900", margin: "0 0 12px" }}>
              Calendrier de la réforme
            </h2>
            <p style={{ color: G, fontSize: "15px" }}>Deux échéances à retenir pour les artisans</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {TIMELINE.map((t, i) => (
              <div key={t.date} style={{ background: C, border: `1px solid ${i === 1 ? "rgba(255,140,0,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "20px", padding: "32px", position: "relative" }}>
                {i === 1 && <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: P, color: "white", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "10px", whiteSpace: "nowrap" }}>⚠️ CONCERNÉ : artisans & TPE</div>}
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{t.icon}</div>
                <div style={{ color: P, fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>{t.date}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "18px", margin: "0 0 12px" }}>{t.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: "0 0 16px" }}>{t.desc}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "4px 10px" }}>
                  <span style={{ color: P, fontSize: "11px", fontWeight: "700" }}>👥 {t.who}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formats acceptés ──────────────────────────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px", background: C }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,32px)", fontWeight: "900", margin: "0 0 8px", textAlign: "center" }}>
            Formats acceptés par l'État
          </h2>
          <p style={{ color: G, fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
            3 formats structurés sont reconnus. Artisan+ implémente <strong style={{ color: P }}>Factur-X</strong>, le standard français.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {FORMATS.map(f => (
              <div key={f.nom} style={{ background: D, border: `1px solid ${f.color}33`, borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ color: "white", fontWeight: "900", fontSize: "20px" }}>{f.nom}</span>
                  <span style={{ background: `${f.color}22`, color: f.color, fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "8px" }}>{f.tag}</span>
                </div>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche dans Artisan+ ───────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,32px)", fontWeight: "900", margin: "0 0 12px", textAlign: "center" }}>
            Comment ça fonctionne dans <span style={{ color: P }}>Artisan+</span> ?
          </h2>
          <p style={{ color: G, fontSize: "14px", textAlign: "center", marginBottom: "48px" }}>
            Trois données Supabase confirmées comme stockées en format structuré : client, lignes de facture, TVA, SIRET.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { step: "1", icon: "📄", titre: "Créez votre facture normalement", desc: "Rien ne change dans votre workflow habituel : clients, lignes, TVA, notes. Artisan+ stocke toutes les données en format structuré dans Supabase." },
              { step: "2", icon: "⚡", titre: "Cliquez sur « Factur-X »", desc: "Dans la liste de vos factures, un bouton bleu « Factur-X » apparaît à côté du bouton PDF. Cliquez dessus pour télécharger le fichier XML structuré." },
              { step: "3", icon: "📤", titre: "Transmettez le fichier XML", desc: "Envoyez le fichier .xml à votre client ou à votre PDP (Plateforme de Dématérialisation Partenaire). Le fichier est conforme EN 16931, profil Factur-X MINIMUM ou EN16931." },
            ].map(s => (
              <div key={s.step} style={{ background: C, border: "1px solid rgba(255,140,0,0.15)", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
                <div style={{ width: "40px", height: "40px", background: P, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "white", fontWeight: "900", fontSize: "18px" }}>{s.step}</div>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{s.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 10px" }}>{s.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Données Supabase structurées ──────────────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px", background: C }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,30px)", fontWeight: "900", margin: "0 0 8px", textAlign: "center" }}>
            Données structurées vérifiées dans Supabase
          </h2>
          <p style={{ color: G, fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
            Toutes les données nécessaires au Factur-X sont déjà stockées en base de données.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {[
              ["Table factures", "numero, total_ht, tva, total_ttc, created_at, nature_operation, tva_sur_debits"],
              ["Table lignes_facture", "description, quantite, prix_unitaire, total"],
              ["Table clients", "nom, email, telephone, adresse"],
              ["Table profils (artisan)", "nom, siret, adresse, telephone, email, iban"],
            ].map(([table, champs]) => (
              <div key={table} style={{ background: D, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginBottom: "8px" }}>✅ {table}</div>
                <div style={{ color: G, fontSize: "11px", lineHeight: "1.6", fontFamily: "monospace" }}>{champs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(22px,3.5vw,34px)", fontWeight: "900", margin: "0 0 36px", textAlign: "center" }}>
            Questions <span style={{ color: P }}>fréquentes</span>
          </h2>
          <FaqAccordion items={FAQ_FE} />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <CTASection
            titre={<>Anticipez la réforme 2026–2027<br /><span style={{ color: P }}>avec Artisan+, dès aujourd'hui</span></>}
            sous="Artisan+ génère déjà le format Factur-X (EN 16931) et se prépare à la connexion aux Plateformes Agréées. Essai gratuit, sans carte bancaire, à 7,99€/mois ensuite."
          />
        </div>
      </section>
    </>
  );
}

// ── Données : variantes facturation électronique (4 nouvelles pages) ──────────

const FACT_ELEC_VARIANTS = {
  "/facturation-electronique-artisan": {
    title: "Facturation électronique obligatoire pour les artisans 2026–2027 | Artisan+",
    desc: "Tous les artisans sont concernés : réception obligatoire dès sept. 2026, émission dès sept. 2027. Artisan+ génère déjà le Factur-X conforme EN 16931 — essai gratuit.",
    canonical: `${BASE}/facturation-electronique-artisan`,
    badge: "🔨 Guide artisan — Réforme DGFiP 2024",
    h1: ["Facturation électronique", "obligatoire pour les artisans", "tout ce qu'il faut savoir"],
    intro: "Plombier, électricien, maçon, couvreur, auto-entrepreneur du BTP... tous les artisans français sont directement concernés par la réforme de la facturation électronique. Deux dates à retenir : septembre 2026 pour la réception, septembre 2027 pour l'émission. Artisan+ vous prépare dès aujourd'hui.",
    bullets: [
      { icon: "📥", titre: "Réception obligatoire : 1er sept. 2026", desc: "Vous devrez pouvoir recevoir des factures structurées de vos fournisseurs via une Plateforme de Dématérialisation Partenaire (PDP) agréée par la DGFiP." },
      { icon: "📤", titre: "Émission obligatoire : 1er sept. 2027", desc: "Pour vos clients professionnels (B2B), vos factures PDF classiques ne suffiront plus. Vous devrez émettre des fichiers au format Factur-X, UBL ou CII." },
      { icon: "🆓", titre: "Micro-entrepreneurs aussi concernés", desc: "Même sans TVA (franchise art. 293B CGI), vous devrez émettre des factures au format Factur-X profil MINIMUM à partir du 1er septembre 2027." },
      { icon: "⚠️", titre: "Sanctions jusqu'à 15 000€/an", desc: "Des amendes de 15€ par facture non conforme, plafonnées à 15 000€ par an, sont prévues. Mieux vaut anticiper dès maintenant." },
      { icon: "✅", titre: "Artisan+ génère déjà le Factur-X", desc: "Artisan+ génère automatiquement le fichier XML Factur-X (EN 16931) pour chaque facture créée. La connexion aux PDP agréées est en préparation pour une conformité complète." },
      { icon: "💶", titre: "À 7,99€/mois seulement", desc: "Artisan+ est le logiciel complet le moins cher du marché : devis, factures, Factur-X, suivi chantier, paiement en ligne — tout inclus." },
    ],
    faq: [
      { q: "Tous les artisans sont-ils concernés par la réforme ?", a: "Oui : artisans en entreprise individuelle, auto-entrepreneurs, micro-entrepreneurs, EURL, SARL du BTP — toutes les structures sont concernées, quelle que soit leur taille." },
      { q: "Un artisan micro-entrepreneur sans TVA est-il concerné ?", a: "Oui. Même sous le seuil de franchise TVA (article 293B CGI), vous devrez émettre des factures au format Factur-X profil MINIMUM à partir du 1er septembre 2027. Ce profil simplifié est prévu exactement pour ce cas." },
      { q: "Comment Artisan+ me prépare-t-il à la réforme ?", a: "Artisan+ génère automatiquement le fichier XML Factur-X conforme EN 16931 pour chaque facture créée. Un bouton dans votre tableau de bord vous permet de le télécharger en un clic. Le bon profil (MINIMUM ou EN16931) est sélectionné automatiquement selon votre régime TVA." },
      { q: "La réforme s'applique-t-elle aux factures pour particuliers ?", a: "Non. L'obligation concerne uniquement les transactions B2B (entre professionnels). Vos factures pour clients particuliers (B2C) restent au format PDF classique." },
    ],
    ctaTitre: <>Artisan+ prépare déjà<br /><span style={{ color: P }}>les artisans à la réforme 2026</span></>,
    ctaSous: "Générez vos factures Factur-X conformes dès maintenant. Essai gratuit sans carte bancaire. Puis 7,99€/mois.",
  },
  "/facture-electronique-tpe-pme": {
    title: "Facture électronique obligatoire TPE/PME 2026–2027 | Guide & conformité | Artisan+",
    desc: "La facture électronique est obligatoire pour toutes les TPE et PME françaises : réception en sept. 2026, émission en sept. 2027. Formats acceptés, PDP, sanctions, solutions.",
    canonical: `${BASE}/facture-electronique-tpe-pme`,
    badge: "🏢 Guide TPE/PME — Réforme DGFiP 2026",
    h1: ["Facture électronique obligatoire", "TPE & PME", "calendrier, formats et conformité"],
    intro: "La réforme de la facturation électronique impacte toutes les entreprises françaises, des grandes entreprises aux micro-entreprises. Pour les TPE (moins de 10 salariés) et PME (moins de 250 salariés) du BTP et des services, les obligations arrivent progressivement. Voici tout ce que vous devez savoir pour anticiper sereinement.",
    bullets: [
      { icon: "📅", titre: "Calendrier adapté aux petites structures", desc: "Les TPE et PME ont jusqu'au 1er septembre 2027 pour l'émission (réception obligatoire dès 2026). Ce délai leur permet de s'adapter progressivement." },
      { icon: "📄", titre: "3 formats acceptés par l'État", desc: "Factur-X (PDF + XML embarqué, standard français), UBL 2.1 (pan-européen) et CII (international). En France, le Factur-X est le format recommandé." },
      { icon: "🔗", titre: "PDP : Plateforme de Dématérialisation Partenaire", desc: "Vous devrez passer par une PDP agréée par la DGFiP pour transmettre et recevoir vos factures électroniques. Artisan+ sera compatible avec les principales PDP." },
      { icon: "🧾", titre: "B2B uniquement pour l'émission", desc: "L'obligation d'émission électronique s'applique uniquement aux transactions entre professionnels (B2B). Vos factures aux particuliers (B2C) restent au format PDF." },
      { icon: "✅", titre: "Artisan+ prépare les TPE du BTP", desc: "Artisan+ est spécialement conçu pour les TPE et artisans du bâtiment. Il génère déjà les fichiers Factur-X XML (EN 16931) et se prépare à la connexion aux PDP agréées." },
      { icon: "💶", titre: "Moins de 8€/mois pour être conforme", desc: "Artisan+ est l'outil le plus abordable du marché incluant la génération Factur-X : 7,99€/mois avec devis, factures, suivi chantier et paiement en ligne inclus." },
    ],
    faq: [
      { q: "TPE avec 2 salariés : quand devons-nous émettre des factures électroniques ?", a: "La date d'obligation d'émission pour les TPE (moins de 10 salariés) et PME est fixée au 1er septembre 2027. Vous avez jusqu'à cette date pour vous équiper d'un logiciel conforme." },
      { q: "Nos factures PDF actuelles deviennent-elles invalides ?", a: "Pas pour les clients particuliers (B2C) — les PDF restent valides. Pour les clients professionnels (B2B) à partir du 1er septembre 2027, le format structuré (Factur-X, UBL ou CII) sera exigé." },
      { q: "Qu'est-ce qu'une PDP et pourquoi en avons-nous besoin ?", a: "Une Plateforme de Dématérialisation Partenaire (PDP) est un opérateur agréé par la DGFiP pour transmettre les factures électroniques entre entreprises. Elle garantit la sécurité, la traçabilité et la conformité des échanges." },
      { q: "Y a-t-il des aides de l'État pour financer la mise en conformité ?", a: "Des dispositifs d'accompagnement sont prévus. Renseignez-vous auprès de votre CMA ou expert-comptable. Avec Artisan+ à 7,99€/mois, la mise en conformité coûte moins qu'un repas au restaurant." },
    ],
    ctaTitre: <>Conformez votre TPE<br /><span style={{ color: P }}>à la réforme 2026–2027 avec Artisan+</span></>,
    ctaSous: "Essai gratuit sans carte bancaire. Génération Factur-X incluse. Puis seulement 7,99€/mois.",
  },
  "/logiciel-facturation-electronique-gratuit": {
    title: "Logiciel facturation électronique gratuit artisan 2026 : comparatif | Artisan+",
    desc: "Quel logiciel de facturation électronique choisir pour être conforme en 2026 ? Comparatif des solutions gratuites et abordables pour artisans et TPE. Artisan+ à 7,99€/mois.",
    canonical: `${BASE}/logiciel-facturation-electronique-gratuit`,
    badge: "💻 Comparatif 2026 — Conformité Factur-X",
    h1: ["Logiciel de facturation", "électronique conforme 2026", "le comparatif honnête"],
    intro: "La réforme de 2026–2027 oblige à utiliser un logiciel compatible Factur-X ou UBL. Mais entre les solutions soi-disant gratuites et les abonnements à 40€/mois, comment choisir ? Voici un comparatif honnête des meilleures options pour les artisans et TPE, avec leurs vrais prix et fonctionnalités.",
    bullets: [
      { icon: "🏆", titre: "Artisan+ — 7,99€/mois", desc: "Meilleur rapport qualité-prix : devis, factures, Factur-X XML, suivi chantier, paiement en ligne, mini-site. Essai gratuit sans carte bancaire. Factur-X inclus dès le 1er mois." },
      { icon: "⚖️", titre: "Tolteck — 19€/mois", desc: "Interface simple, correcte pour les devis/factures basiques. Pas de suivi chantier ni paiement en ligne. 2,4× plus cher qu'Artisan+." },
      { icon: "⚖️", titre: "Obat — 39€/mois", desc: "Fonctionnalités complètes mais prix élevé. Interface complexe. 4,9× plus cher qu'Artisan+. Adapté plutôt aux entreprises de 5+ salariés." },
      { icon: "✅", titre: "Ce que doit inclure un logiciel conforme", desc: "Génération Factur-X XML (conforme EN 16931), profil MINIMUM (micro-entreprises) ET profil EN16931 (TVA), téléchargement du fichier XML. Artisan+ remplit tous ces critères." },
      { icon: "🆓", titre: "Les vraies solutions gratuites existent-elles ?", desc: "Excel ou PDF ne génèrent pas de Factur-X conforme. Pour être légalement en règle en 2027, un logiciel dédié est nécessaire. Artisan+ à 7,99€/mois est la solution la plus abordable." },
      { icon: "🎯", titre: "Critères de choix pour un artisan", desc: "Vérifiez : génération Factur-X incluse, interface adaptée au terrain (smartphone), prix raisonnable, support client français, essai gratuit. Artisan+ coche toutes ces cases." },
    ],
    faq: [
      { q: "Existe-t-il un logiciel de facturation électronique vraiment gratuit pour artisan ?", a: "Les solutions réellement gratuites (Excel, LibreOffice) ne génèrent pas de fichiers Factur-X conformes EN 16931. Pour être légalement conforme en 2027, un logiciel dédié est nécessaire. Artisan+ est la solution la plus abordable à 7,99€/mois avec un essai gratuit sans engagement." },
      { q: "Artisan+ génère-t-il vraiment les fichiers Factur-X ?", a: "Oui. Pour chaque facture créée dans Artisan+, un bouton 'Factur-X' dans votre tableau de bord vous permet de télécharger instantanément le fichier XML structuré conforme EN 16931. Le profil MINIMUM (micro-entreprises) ou EN16931 (assujettis TVA) est sélectionné automatiquement." },
      { q: "Y a-t-il des aides de l'État pour financer le logiciel ?", a: "Des dispositifs d'accompagnement PME/TPE sont prévus. Renseignez-vous auprès de votre CMA ou de votre expert-comptable. Avec Artisan+ à 7,99€/mois, la mise en conformité reste très abordable sans aide." },
      { q: "Puis-je essayer Artisan+ gratuitement avant de m'abonner ?", a: "Oui. Artisan+ propose un essai gratuit complet sans carte bancaire. Vous pouvez créer vos devis, factures et télécharger vos fichiers Factur-X avant de décider si vous souhaitez vous abonner." },
    ],
    ctaTitre: <>Essai gratuit<br /><span style={{ color: P }}>Factur-X inclus dès le départ</span></>,
    ctaSous: "7,99€/mois après l'essai gratuit. Le logiciel le moins cher du marché avec Factur-X, devis, factures, suivi chantier et paiement en ligne.",
  },
  "/facture-electronique-obligatoire-2027": {
    title: "Facture électronique obligatoire 2027 — artisans et TPE : êtes-vous prêts ? | Artisan+",
    desc: "Le 1er septembre 2027, tous les artisans et TPE devront émettre des factures électroniques structurées (Factur-X). Préparez-vous dès maintenant avec Artisan+.",
    canonical: `${BASE}/facture-electronique-obligatoire-2027`,
    badge: "⚠️ Deadline 2027 — Artisans & TPE concernés",
    h1: ["Facture électronique", "obligatoire en 2027", "artisans et TPE : préparez-vous"],
    intro: "Le 1er septembre 2027, il ne s'agit plus d'une recommandation : tous les artisans et TPE françaises devront émettre leurs factures professionnelles au format électronique structuré. Les factures PDF non structurées ne seront plus acceptées pour les transactions B2B. Voici comment anticiper sereinement avec Artisan+.",
    bullets: [
      { icon: "📅", titre: "1er sept. 2026 : réception obligatoire", desc: "Premier jalon : toutes les entreprises devront pouvoir recevoir des factures électroniques structurées via une PDP agréée." },
      { icon: "📤", titre: "1er sept. 2027 : émission obligatoire TPE/artisans", desc: "C'est la date qui vous concerne directement : vos factures B2B devront être émises au format Factur-X, UBL ou CII. Les PDF non structurés ne suffiront plus." },
      { icon: "👨‍👩‍👦", titre: "Particuliers non concernés par l'émission", desc: "L'obligation ne s'applique qu'aux transactions B2B (entre professionnels). Vos factures pour clients particuliers (B2C) restent au format PDF sans changement." },
      { icon: "💰", titre: "Sanctions : jusqu'à 15 000€/an", desc: "Des amendes de 15€ par facture non conforme, plafonnées à 15 000€ par an, sont prévues. C'est pourquoi anticiper dès maintenant est la meilleure stratégie." },
      { icon: "🔄", titre: "Factur-X : rien de visible pour vous", desc: "Avec Artisan+, rien ne change dans votre façon de travailler. Vous créez votre facture normalement, et le fichier XML Factur-X est généré automatiquement en arrière-plan." },
      { icon: "🚀", titre: "Artisan+ : en route pour 2027", desc: "Artisan+ génère déjà des fichiers Factur-X (EN 16931) et se prépare à la connexion aux Plateformes Agréées pour une conformité complète au 1er septembre 2027." },
    ],
    faq: [
      { q: "Pourquoi 2027 pour les TPE alors que la réforme démarre en 2026 ?", a: "La réforme est progressive : 2026 pour la réception (toutes entreprises), 2027 pour l'émission des ETI, PME, TPE et micro-entreprises. Ce calendrier permet aux petites structures de s'adapter progressivement." },
      { q: "Qu'est-ce qui change concrètement pour un artisan en 2027 ?", a: "Lorsque vous facturez une entreprise (maître d'ouvrage, autre artisan, SCI, etc.), votre facture PDF classique ne suffit plus. Vous devrez soit envoyer directement un fichier Factur-X, soit passer par une PDP pour transmettre la facture de façon dématérialisée." },
      { q: "Et si je travaille exclusivement avec des particuliers ?", a: "Si 100% de votre activité est B2C (clients particuliers), vous n'êtes pas directement concerné par l'obligation d'émission de 2027. Mais vous devrez quand même pouvoir recevoir des factures électroniques de vos fournisseurs à partir de 2026." },
      { q: "Comment démarrer avec Artisan+ pour être conforme en 2027 ?", a: "Créez votre compte Artisan+ gratuitement, renseignez votre SIRET et vos informations professionnelles, puis commencez à créer vos factures normalement. Pour chaque facture, le bouton 'Factur-X' dans votre tableau de bord génère instantanément le fichier XML conforme." },
    ],
    ctaTitre: <>Ne laissez pas 2027<br /><span style={{ color: P }}>vous surprendre — anticipez avec Artisan+</span></>,
    ctaSous: "Artisan+ génère déjà le format Factur-X (EN 16931) et se prépare à la connexion aux PDP agréées. Essai gratuit sans carte bancaire, puis 7,99€/mois.",
  },
};

// ── Données : variantes pages génériques mots-clés (9 nouvelles pages) ────────

const GENERIC_VARIANTS = {
  "/facture-en-ligne-gratuit": {
    title: "Faire une facture en ligne gratuit — Artisan+ | Essai gratuit artisan",
    desc: "Créez vos factures en ligne gratuitement avec Artisan+. Conforme à la loi française, envoi par email, paiement en ligne. Essai gratuit pour artisans et auto-entrepreneurs.",
    canonical: `${BASE}/facture-en-ligne-gratuit`,
    badge: "💶 Facture en ligne — Essai gratuit artisan",
    h1: ["Faire une facture en ligne", "gratuitement", "en 2 minutes — pour les artisans"],
    intro: "Vous êtes artisan ou auto-entrepreneur et vous cherchez à créer vos factures en ligne gratuitement, sans logiciel à installer et sans prise de tête ? Artisan+ vous permet de générer des factures conformes à la loi française, professionnelles et prêtes à envoyer par email — en moins de 2 minutes. Essai gratuit, sans carte bancaire.",
    features: [
      { icon: "⚡", titre: "Facture créée en 2 minutes", desc: "Remplissez les informations de votre client, sélectionnez vos prestations dans votre catalogue et envoyez directement par email. Simple, rapide, professionnel." },
      { icon: "📋", titre: "Toutes les mentions légales incluses", desc: "TVA, SIRET, numéro de facture séquentiel, conditions de règlement, mentions obligatoires... Artisan+ génère automatiquement des factures conformes à la législation française." },
      { icon: "📱", titre: "Sur smartphone, depuis le chantier", desc: "Pas besoin d'un ordinateur. Artisan+ fonctionne sur iPhone et Android. Créez et envoyez votre facture directement depuis votre chantier." },
      { icon: "💳", titre: "Paiement en ligne inclus", desc: "Vos clients paient directement depuis leur facture par carte bancaire. Artisan+ intègre Stripe pour un paiement sécurisé en quelques clics." },
      { icon: "🔄", titre: "Devis → Facture en 1 clic", desc: "Transformez un devis accepté en facture instantanément. Toutes les informations sont reprises automatiquement, sans ressaisie." },
      { icon: "🏛️", titre: "Anticipez la réforme 2026", desc: "Artisan+ génère le fichier Factur-X XML (EN 16931) et se prépare à la connexion aux PDP agréées, pour vous accompagner vers la conformité." },
    ],
    pricing: "Essai gratuit complet · Puis 7,99€/mois seulement",
    faq: [
      { q: "Artisan+ est-il vraiment gratuit pour créer des factures ?", a: "Artisan+ propose un essai gratuit complet sans carte bancaire. Après l'essai, l'abonnement est à 7,99€/mois — le tarif le plus bas du marché pour un logiciel complet incluant devis, factures, suivi chantier et paiement en ligne." },
      { q: "Mes factures sont-elles légalement conformes ?", a: "Oui. Artisan+ génère des factures conformes à la législation française : numéro séquentiel unique, mentions obligatoires (SIRET, TVA, délai de paiement, pénalités de retard), format PDF professionnel." },
      { q: "Comment mes clients reçoivent-ils leur facture ?", a: "Artisan+ envoie la facture directement par email au client, avec un bouton de paiement en ligne. Vous pouvez aussi télécharger le PDF pour l'envoyer manuellement ou l'imprimer." },
      { q: "Combien de factures puis-je créer ?", a: "Illimité. Artisan+ ne limite pas le nombre de factures que vous pouvez créer. Créez autant de factures que vous le souhaitez pour l'abonnement mensuel fixe de 7,99€." },
    ],
    ctaTitre: <>Créez votre première facture<br /><span style={{ color: P }}>gratuitement en 2 minutes</span></>,
    ctaSous: "Essai gratuit sans carte bancaire. Factures conformes, envoi email, paiement en ligne inclus. Puis 7,99€/mois.",
  },
  "/facture-en-ligne-artisan": {
    title: "Facture en ligne artisan : créez et envoyez en 2 minutes | Artisan+",
    desc: "Application de facturation en ligne pour artisans : devis, factures conformes, signature électronique, paiement en ligne. À 7,99€/mois — 2 à 5× moins cher que la concurrence.",
    canonical: `${BASE}/facture-en-ligne-artisan`,
    badge: "🔨 Facturation en ligne — Spécial artisans",
    h1: ["Facture en ligne", "pour artisan", "le meilleur outil en 2026"],
    intro: "En tant qu'artisan, vous n'avez ni le temps ni l'envie de passer des heures sur votre comptabilité. Artisan+ est conçu pour vous : une application de facturation en ligne simple, rapide et pensée pour le terrain. Créez vos factures depuis votre smartphone sur le chantier, envoyez-les par email et recevez vos paiements en ligne.",
    features: [
      { icon: "🔨", titre: "Conçu pour les artisans du BTP", desc: "Plombier, électricien, maçon, couvreur, menuisier... Artisan+ inclut un catalogue de prix adapté à votre métier, avec des modèles de prestations prédéfinis." },
      { icon: "✍️", titre: "Signature électronique des devis", desc: "Vos clients signent leur devis depuis leur smartphone, en quelques secondes. La signature électronique est légalement valide et évite les allers-retours." },
      { icon: "📊", titre: "Suivi chantier intégré", desc: "Suivez l'avancement de vos chantiers, ajoutez des photos, des notes vocales et des documents. Artisan+ va bien au-delà de la simple facturation." },
      { icon: "👥", titre: "Gestion équipe et sous-traitants", desc: "Donnez accès à vos ouvriers avec des permissions adaptées. Ils peuvent voir les chantiers, ajouter des photos et noter l'avancement." },
      { icon: "🌐", titre: "Mini-site vitrine inclus", desc: "Artisan+ génère automatiquement votre mini-site professionnel avec vos prestations, photos et avis clients. Votre carte de visite numérique, sans effort." },
      { icon: "⚡", titre: "Anticipez la réforme 2026–2027", desc: "Artisan+ génère les fichiers Factur-X XML (EN 16931) et se prépare à la connexion aux PDP agréées pour vous accompagner vers la conformité." },
    ],
    pricing: "7,99€/mois · Essai gratuit · Annulable à tout moment",
    faq: [
      { q: "Artisan+ est-il adapté à tous les corps de métier ?", a: "Oui. Artisan+ est utilisé par des plombiers, électriciens, maçons, couvreurs, menuisiers, jardiniers, paysagistes, climaticiens et plus de 50 métiers du BTP et des services. Le catalogue de prestations est personnalisable selon votre métier." },
      { q: "Puis-je travailler hors connexion sur le chantier ?", a: "Oui. Artisan+ fonctionne hors connexion sur votre smartphone. Les données se synchronisent automatiquement quand vous retrouvez une connexion internet." },
      { q: "Artisan+ est-il adapté à un auto-entrepreneur ?", a: "Oui. Artisan+ gère aussi bien les micro-entreprises sans TVA (profil simplifié) que les entreprises assujetties à la TVA (taux de 5,5%, 10% ou 20% configurables). Le régime est configurable dans votre profil." },
      { q: "Comment Artisan+ se compare à Tolteck ou Obat ?", a: "Artisan+ est 2 à 5× moins cher que la concurrence (7,99€/mois contre 19€ pour Tolteck et 39€ pour Obat) et propose en plus : suivi de chantier avancé, mini-site vitrine, paiement en ligne et outils terrain." },
    ],
    ctaTitre: <>Rejoignez les artisans<br /><span style={{ color: P }}>qui gagnent du temps avec Artisan+</span></>,
    ctaSous: "Essai gratuit sans carte bancaire. 7,99€/mois ensuite — annulable à tout moment.",
  },
  "/devis-en-ligne-gratuit": {
    title: "Devis en ligne gratuit pour artisan : créez votre devis en 2 minutes | Artisan+",
    desc: "Créez votre devis en ligne gratuitement avec Artisan+. Conforme aux mentions légales, signature électronique incluse. Essai gratuit pour artisans et auto-entrepreneurs.",
    canonical: `${BASE}/devis-en-ligne-gratuit`,
    badge: "📄 Devis en ligne — Gratuit artisans",
    h1: ["Devis en ligne gratuit", "pour artisans", "professionnel et conforme en 2 minutes"],
    intro: "Créer un devis professionnel ne devrait pas prendre plus de 2 minutes. Avec Artisan+, remplissez votre catalogue de prix une fois, et créez ensuite chaque devis en quelques clics. Vos clients reçoivent un devis PDF professionnel, le signent électroniquement depuis leur téléphone, et vous confirmez le chantier sans aller-retour.",
    features: [
      { icon: "⚡", titre: "Devis créé en 2 minutes", desc: "Sélectionnez vos prestations dans votre catalogue personnalisé, ajustez les quantités et envoyez. Votre catalogue mémorise tous vos prix habituels." },
      { icon: "✍️", titre: "Signature électronique légalement valide", desc: "Vos clients signent depuis leur smartphone, en temps réel. La signature électronique a la même valeur légale qu'une signature manuscrite en France." },
      { icon: "📋", titre: "Mentions obligatoires automatiques", desc: "Artisan+ inclut automatiquement toutes les mentions légales : durée de validité, taux de TVA, numéro SIRET, conditions d'acceptation et délai d'exécution prévisionnel." },
      { icon: "🔄", titre: "Transformation en facture en 1 clic", desc: "Dès la signature, transformez votre devis en facture instantanément. Toutes les informations sont reprises automatiquement, aucune ressaisie n'est nécessaire." },
      { icon: "📱", titre: "Depuis votre smartphone sur le chantier", desc: "Créez et envoyez vos devis depuis votre iPhone ou Android sur le chantier. Artisan+ fonctionne hors connexion et synchronise automatiquement." },
      { icon: "💶", titre: "Paiement d'acompte en ligne", desc: "Après signature du devis, demandez un acompte payable directement en ligne par carte bancaire. Recevez le paiement avant de démarrer le chantier." },
    ],
    pricing: "Essai gratuit complet · Puis 7,99€/mois",
    faq: [
      { q: "Artisan+ est-il gratuit pour créer des devis ?", a: "Artisan+ propose un essai gratuit complet sans carte bancaire. Après l'essai, l'abonnement est à 7,99€/mois — le tarif le plus bas du marché pour un logiciel complet incluant devis, factures, signature électronique et paiement en ligne." },
      { q: "La signature électronique est-elle légalement valide ?", a: "Oui. En France, la signature électronique est régie par le règlement eIDAS (UE n° 910/2014). Une signature électronique simple a la même valeur probante qu'une signature manuscrite lorsqu'elle est horodatée et liée à un document." },
      { q: "Puis-je personnaliser mes modèles de devis ?", a: "Oui. Artisan+ vous permet de créer votre catalogue de prix personnalisé avec vos prestations habituelles et vos prix. Vous pouvez aussi ajouter votre logo, vos couleurs et vos mentions spécifiques (garantie décennale, etc.)." },
      { q: "Combien de devis puis-je créer ?", a: "Illimité. Artisan+ ne limite pas le nombre de devis ou de factures que vous pouvez créer. Créez autant de devis que vous le souhaitez pour l'abonnement mensuel fixe." },
    ],
    ctaTitre: <>Créez votre premier devis<br /><span style={{ color: P }}>en ligne en 2 minutes — c'est gratuit</span></>,
    ctaSous: "Essai gratuit sans carte bancaire. Devis conformes, signature électronique, transformation en facture. Puis 7,99€/mois.",
  },
  "/application-devis-facture-gratuite": {
    title: "Application devis facture gratuite artisan 2026 : comparatif | Artisan+",
    desc: "Quelle application de devis et facture choisir pour un artisan ? Comparatif des meilleures applications gratuites et abordables. Artisan+ : l'app complète à 7,99€/mois.",
    canonical: `${BASE}/application-devis-facture-gratuite`,
    badge: "📱 Comparatif app — Artisans 2026",
    h1: ["Application devis & facture", "gratuite ou abordable", "pour artisans : le vrai comparatif"],
    intro: "Vous cherchez une application de devis et facture pour artisan, gratuite ou à petit prix ? Le marché propose de nombreuses solutions, mais toutes ne se valent pas. Voici un comparatif honnête, basé sur les vraies fonctionnalités et le prix réel, pour vous aider à choisir l'application qui correspond à votre activité.",
    features: [
      { icon: "🏆", titre: "Artisan+ — 7,99€/mois (Recommandé)", desc: "Devis, factures, suivi chantier, signature électronique, paiement en ligne, mini-site, 20 outils terrain, Factur-X 2026. Le plus complet au meilleur prix." },
      { icon: "⚖️", titre: "Tolteck — 19€/mois", desc: "Interface simple, devis et factures corrects. Pas de suivi chantier, pas de paiement en ligne, pas de mini-site. 2,4× plus cher qu'Artisan+." },
      { icon: "⚖️", titre: "Obat — 39€/mois", desc: "Fonctionnalités complètes mais prix très élevé. Adapté aux entreprises de 5+ salariés. Interface complexe. 4,9× plus cher qu'Artisan+." },
      { icon: "⚖️", titre: "ArtisanFacture — 29€/mois", desc: "Correct pour la facturation basique. Sans suivi chantier ni paiement en ligne. 3,6× plus cher qu'Artisan+. Interface vieillissante." },
      { icon: "📱", titre: "Apps mobiles natives vs PWA", desc: "Artisan+ est une PWA installable sur iOS et Android — aussi performante qu'une app native, sans passer par l'App Store ou Google Play. Fonctionne hors connexion." },
      { icon: "🎯", titre: "Critères de choix essentiels", desc: "Hors connexion, catalogue de prix personnalisable, signature électronique, paiement en ligne, conformité Factur-X 2026, prix abordable. Artisan+ coche toutes ces cases." },
    ],
    pricing: "Artisan+ : 7,99€/mois · Essai gratuit · Sans engagement",
    faq: [
      { q: "Il existe-t-il une vraie application gratuite pour devis et factures artisan ?", a: "Les applications réellement gratuites et complètes n'existent pas dans ce secteur. Les offres gratuites sont soit très limitées (nombre de devis, fonctionnalités bloquées), soit des freemiums avec les vraies fonctionnalités payantes. Artisan+ à 7,99€/mois est la solution la plus abordable avec un essai gratuit complet." },
      { q: "Artisan+ fonctionne-t-il sur iPhone et Android ?", a: "Oui. Artisan+ est une Progressive Web App (PWA) installable sur iOS (iPhone, iPad) et Android. Elle s'utilise comme une application native, fonctionne hors connexion et ne nécessite pas de passer par l'App Store ou le Google Play Store." },
      { q: "Artisan+ est-il conforme à la réforme de la facturation électronique 2026 ?", a: "Oui. Artisan+ génère déjà des fichiers Factur-X XML conformes EN 16931 pour chaque facture créée. Vous serez conforme à la réforme de septembre 2026 (réception) et septembre 2027 (émission) sans aucune mise à jour nécessaire." },
      { q: "Puis-je gérer plusieurs artisans ou ouvriers avec Artisan+ ?", a: "Oui. Artisan+ propose une gestion d'équipe : vous pouvez ajouter des ouvriers ou des sous-traitants à vos chantiers avec des permissions adaptées." },
    ],
    ctaTitre: <>Essayez l'application la plus complète<br /><span style={{ color: P }}>au meilleur prix — dès maintenant</span></>,
    ctaSous: "Artisan+ : l'application devis facture pour artisans. Essai gratuit sans carte bancaire. 7,99€/mois ensuite.",
  },
  "/logiciel-devis-facture-artisan": {
    title: "Meilleur logiciel devis facture artisan 2026 : comparatif complet | Artisan+",
    desc: "Quel logiciel de devis et facture choisir pour votre activité d'artisan ? Comparatif Artisan+, Tolteck, Obat, ArtisanFacture. Prix, fonctionnalités, conformité 2026.",
    canonical: `${BASE}/logiciel-devis-facture-artisan`,
    badge: "💻 Comparatif logiciels — Artisans 2026",
    h1: ["Meilleur logiciel", "devis et facture", "pour artisan en 2026"],
    intro: "Choisir son logiciel de devis et facturation est une décision importante pour un artisan. Un bon outil vous fait gagner plusieurs heures par semaine sur la gestion administrative. Voici notre comparatif complet et honnête des meilleurs logiciels disponibles en 2026, avec leurs vrais prix et fonctionnalités.",
    features: [
      { icon: "🥇", titre: "Artisan+ — 7,99€/mois", desc: "Meilleur rapport qualité-prix du marché. Devis professionnels, factures conformes, suivi de chantier avancé, signature électronique, paiement en ligne, mini-site, Factur-X 2026 inclus." },
      { icon: "📊", titre: "Fonctionnalités indispensables", desc: "Catalogue de prix personnalisable, mentions légales automatiques, envoi par email, transformation devis→facture, numérotation automatique, export PDF, mode mobile." },
      { icon: "🔬", titre: "Fonctionnalités avancées d'Artisan+", desc: "Suivi chantier avec photos, notes vocales et checklist, gestion d'équipe/ouvriers, mini-site vitrine automatique, 20 outils terrain (niveau, boussole, mesure IA)." },
      { icon: "⚡", titre: "Prêt pour la réforme 2026", desc: "Artisan+ génère les fichiers Factur-X XML conformes EN 16931, obligatoires pour la facturation électronique B2B dès 2027. Vous êtes prêt sans action supplémentaire." },
      { icon: "📱", titre: "Vraiment utilisable sur le terrain", desc: "Interface conçue pour être utilisée sur un smartphone, sur un chantier. Fonctionne hors connexion et synchronise automatiquement." },
      { icon: "💶", titre: "2 à 5× moins cher que la concurrence", desc: "Artisan+ à 7,99€/mois contre 19€ (Tolteck), 29€ (ArtisanFacture) et 39€ (Obat). Moins cher pour plus de fonctionnalités." },
    ],
    pricing: "Artisan+ : 7,99€/mois · Essai gratuit · Annulable à tout moment",
    faq: [
      { q: "Quel est le meilleur logiciel de devis et facture pour artisan ?", a: "Artisan+ est le meilleur rapport qualité-prix du marché en 2026 : 7,99€/mois avec toutes les fonctionnalités nécessaires (devis, factures, suivi chantier, paiement en ligne, Factur-X). C'est aussi le moins cher du marché pour un outil complet." },
      { q: "Artisan+ est-il adapté à tous les métiers ?", a: "Oui. Artisan+ est utilisé par plus de 50 corps de métier : plombiers, électriciens, maçons, couvreurs, menuisiers, peintres, carreleurs, jardiniers, paysagistes et bien d'autres. Le catalogue de prix est entièrement personnalisable." },
      { q: "Comment Artisan+ se différencie-t-il de Tolteck ?", a: "Artisan+ propose plus de fonctionnalités (suivi chantier, mini-site, paiement en ligne, outils terrain, Factur-X) pour un prix 2,4× inférieur (7,99€ vs 19€). Tolteck est simple mais limité aux devis et factures basiques." },
      { q: "Y a-t-il un engagement de durée ?", a: "Non. Artisan+ est sans engagement. Vous pouvez annuler à tout moment depuis votre compte, sans frais de résiliation. L'essai gratuit vous permet de tester toutes les fonctionnalités sans risque." },
    ],
    ctaTitre: <>Le logiciel qu'il vous faut<br /><span style={{ color: P }}>gratuit pour commencer</span></>,
    ctaSous: "Devis, factures, suivi chantier, paiement en ligne, Factur-X 2026. Tout inclus. Sans engagement. Annulable à tout moment.",
  },
  "/faire-une-facture-gratuitement": {
    title: "Comment faire une facture gratuitement ? Guide complet artisan 2026 | Artisan+",
    desc: "Comment créer une facture conforme gratuitement ? Mentions obligatoires, format, envoi et paiement en ligne. Guide pratique pour artisans et auto-entrepreneurs.",
    canonical: `${BASE}/faire-une-facture-gratuitement`,
    badge: "📄 Guide pratique — Facture conforme artisan",
    h1: ["Comment faire", "une facture gratuitement", "guide complet pour artisans 2026"],
    intro: "Créer une facture conforme à la législation française peut sembler compliqué pour un artisan. Entre les mentions légales obligatoires, la numérotation correcte et la TVA, il y a beaucoup à retenir. Ce guide vous explique exactement comment procéder — et comment Artisan+ automatise tout ça pour vous.",
    features: [
      { icon: "📋", titre: "Mentions légales obligatoires sur une facture", desc: "Numéro de facture séquentiel, date d'émission, vos coordonnées complètes (SIRET, TVA intracommunautaire), coordonnées du client, description des prestations, taux de TVA applicable, montant HT et TTC, conditions de règlement, pénalités de retard." },
      { icon: "🔢", titre: "Numérotation chronologique obligatoire", desc: "Les factures doivent être numérotées de façon chronologique et sans rupture de séquence. Artisan+ génère automatiquement les numéros de facture conformes (ex: 2026-001, 2026-002...) sans que vous ayez à y penser." },
      { icon: "💶", titre: "TVA : quel taux appliquer ?", desc: "Le taux de TVA dépend du type de travaux : 5,5% pour les travaux d'amélioration énergétique, 10% pour la rénovation, 20% pour les travaux neufs. Si vous êtes sous le seuil de franchise TVA, la mention 'TVA non applicable - art. 293B CGI' suffit." },
      { icon: "📧", titre: "Comment envoyer la facture à votre client ?", desc: "La facture peut être envoyée par email (PDF), remise en main propre ou envoyée par courrier. Artisan+ vous permet d'envoyer directement par email depuis l'application, avec un bouton de paiement en ligne intégré." },
      { icon: "💳", titre: "Facture payable en ligne", desc: "Artisan+ intègre Stripe pour permettre à vos clients de payer leur facture en ligne par carte bancaire. Plus besoin d'attendre un virement ou un chèque." },
      { icon: "⚡", titre: "Factur-X : la nouvelle obligation 2027", desc: "À partir de septembre 2027, vos factures B2B devront aussi inclure un fichier XML structuré (Factur-X). Artisan+ génère ce fichier automatiquement pour chaque facture." },
    ],
    pricing: "Essai gratuit · Puis 7,99€/mois · Sans engagement",
    faq: [
      { q: "Quelles sont les mentions obligatoires sur une facture d'artisan ?", a: "Une facture d'artisan doit obligatoirement mentionner : numéro de facture séquentiel, date d'émission, vos nom/prénom/adresse professionnelle, votre SIRET, les coordonnées complètes du client, la description des travaux et prestations, les prix unitaires HT, le taux de TVA applicable et le montant TTC, les conditions de règlement et les pénalités de retard (mention obligatoire en B2B)." },
      { q: "Puis-je créer une facture sur Word ou Excel ?", a: "Techniquement oui, mais c'est déconseillé. Un modèle Word ou Excel vous expose à oublier des mentions légales, à avoir une numérotation incorrecte et à ne pas être conforme à la réforme de la facturation électronique 2026. Un logiciel dédié comme Artisan+ garantit la conformité automatiquement." },
      { q: "Combien de temps dois-je conserver mes factures ?", a: "En France, les factures doivent être conservées pendant 10 ans à compter de la date de clôture de l'exercice comptable. Artisan+ stocke toutes vos factures en ligne de façon sécurisée, accessibles à tout moment depuis votre smartphone ou ordinateur." },
      { q: "La facture doit-elle être signée par le client ?", a: "Non, la facture n'a pas besoin d'être signée par le client — c'est le devis qui doit l'être. La facture est émise par le professionnel une fois les travaux réalisés. Elle constate la dette du client envers vous." },
    ],
    ctaTitre: <>Automatisez votre facturation<br /><span style={{ color: P }}>avec Artisan+ — c'est gratuit pour commencer</span></>,
    ctaSous: "Factures conformes, numérotation automatique, envoi email, paiement en ligne. Essai gratuit sans carte bancaire, puis 7,99€/mois.",
  },
  "/faire-un-devis-gratuitement": {
    title: "Comment faire un devis gratuitement ? Guide pour artisans 2026 | Artisan+",
    desc: "Comment créer un devis professionnel et conforme gratuitement ? Mentions obligatoires, calcul du prix, envoi et signature électronique. Guide artisan 2026.",
    canonical: `${BASE}/faire-un-devis-gratuitement`,
    badge: "📝 Guide pratique — Devis artisan conforme",
    h1: ["Comment faire", "un devis gratuitement", "guide complet et pratique artisan"],
    intro: "Un devis bien rédigé est votre meilleure chance de décrocher un chantier et de vous protéger en cas de litige. Mais comment s'assurer que votre devis est conforme à la loi française, professionnel et percutant ? Ce guide vous explique tout — et comment Artisan+ automatise la partie fastidieuse.",
    features: [
      { icon: "📋", titre: "Mentions obligatoires sur un devis", desc: "Date d'émission et durée de validité, vos coordonnées complètes et SIRET, coordonnées du client, description détaillée des travaux, prix unitaires HT et TTC, taux de TVA, conditions d'acceptation, mention de l'assurance décennale si applicable." },
      { icon: "💰", titre: "Comment calculer le prix d'un devis", desc: "Additionnez : main d'œuvre (heures × taux horaire), matériaux (avec votre marge), frais de déplacement, marge bénéficiaire. Ajoutez 10-15% pour les imprévus. Artisan+ calcule automatiquement les totaux HT, TVA et TTC." },
      { icon: "✍️", titre: "Signature électronique légalement valide", desc: "En France, la signature électronique d'un devis est légalement valide depuis 2016. Artisan+ permet à vos clients de signer depuis leur smartphone — sans imprimer, sans scanner, sans courrier." },
      { icon: "📱", titre: "Devis depuis votre smartphone", desc: "Créez votre devis depuis le chantier avec votre smartphone lors de la visite du client. Envoyez-le par email avant de repartir — votre client est impressionné, vous décrochez plus souvent le chantier." },
      { icon: "🔄", titre: "Transformer le devis en facture", desc: "Dès que le client signe, transformez le devis en facture en un clic. Artisan+ reprend toutes les informations automatiquement — aucune ressaisie, aucune perte de temps." },
      { icon: "📊", titre: "Suivi des devis en attente", desc: "Artisan+ affiche l'état de chaque devis : envoyé, signé, refusé, expiré. Vous savez en un coup d'œil quels chantiers vous avez décrochés et lesquels nécessitent une relance." },
    ],
    pricing: "Essai gratuit complet · Puis 7,99€/mois · Sans engagement",
    faq: [
      { q: "Un devis est-il obligatoire pour un artisan ?", a: "Le devis est obligatoire dès que le montant des travaux dépasse 150€ pour un client particulier (consommateur). En pratique, il est recommandé pour tout chantier, quelle que soit la valeur, pour éviter les litiges et vous protéger juridiquement." },
      { q: "Combien de temps un devis est-il valable ?", a: "La durée de validité d'un devis doit être mentionnée sur le document. Elle est généralement de 30 jours, mais vous pouvez la fixer librement. Artisan+ génère automatiquement la date d'expiration selon la durée que vous configurez." },
      { q: "Le client peut-il refuser de payer après avoir signé le devis ?", a: "Un devis signé constitue un contrat. Si le client refuse de payer après avoir signé et que les travaux ont été réalisés conformément au devis, vous pouvez le mettre en demeure. Artisan+ conserve toutes les preuves de signature électronique horodatées." },
      { q: "Artisan+ permet-il de créer des devis personnalisés par métier ?", a: "Oui. Artisan+ propose un catalogue de prix personnalisable : vous créez vos propres prestations (plomberie, électricité, maçonnerie, etc.) avec vos prix habituels. Quand vous créez un devis, il vous suffit de sélectionner les prestations et ajuster les quantités." },
    ],
    ctaTitre: <>Créez votre premier devis<br /><span style={{ color: P }}>en 2 minutes — essai gratuit</span></>,
    ctaSous: "Devis conformes, signature électronique légalement valide, transformation en facture en 1 clic. Essai gratuit, puis 7,99€/mois.",
  },
  "/application-facturation-gratuite": {
    title: "Application de facturation gratuite artisan 2026 : comparatif | Artisan+",
    desc: "Quelle application de facturation gratuite choisir pour un artisan ou auto-entrepreneur ? Comparatif honnête des meilleures solutions. Artisan+ : l'app complète à 7,99€/mois.",
    canonical: `${BASE}/application-facturation-gratuite`,
    badge: "📱 Comparatif apps facturation — 2026",
    h1: ["Application de facturation", "pour artisan", "gratuite ou abordable : notre sélection"],
    intro: "Une bonne application de facturation peut vous faire gagner plusieurs heures par semaine. Mais entre les apps vraiment gratuites (souvent très limitées) et les solutions payantes, comment choisir ? Voici notre sélection honnête des meilleures applications de facturation pour artisans en 2026.",
    features: [
      { icon: "🏆", titre: "Artisan+ : 7,99€/mois (Recommandé)", desc: "La plus complète pour les artisans : devis, factures, Factur-X 2026, suivi chantier, paiement en ligne, mini-site. Essai gratuit complet sans carte bancaire." },
      { icon: "📱", titre: "Fonctionnement sur smartphone : essentiel", desc: "Un artisan n'est pas derrière un bureau. L'application doit fonctionner sur smartphone, hors connexion, et être simple à utiliser d'une main. Artisan+ est conçu pour ça." },
      { icon: "⚡", titre: "Rapidité de création : critère n°1", desc: "La meilleure application est celle que vous utilisez vraiment. Artisan+ permet de créer un devis ou une facture en moins de 2 minutes depuis le chantier, grâce au catalogue de prix personnalisable." },
      { icon: "💳", titre: "Paiement en ligne : un vrai plus", desc: "Les applications qui intègrent le paiement en ligne (Stripe) vous permettent d'être payé plus vite. Artisan+ intègre Stripe pour un paiement par carte bancaire directement depuis la facture." },
      { icon: "🏛️", titre: "Conformité légale et Factur-X 2026", desc: "Vérifiez que l'application génère des documents conformes (mentions légales, numérotation) et, pour 2026–2027, un fichier Factur-X XML. Artisan+ génère le format Factur-X et se prépare à la connexion aux PDP agréées." },
      { icon: "💶", titre: "Le vrai coût total de possession", desc: "Une application à 0€ mais limitée vous coûtera du temps perdu. Artisan+ à 7,99€/mois vous fait gagner en moyenne 3 à 5 heures par semaine — un ROI immédiat dès le premier mois." },
    ],
    pricing: "Artisan+ : 7,99€/mois · Essai gratuit sans carte bancaire",
    faq: [
      { q: "Existe-t-il une vraie application de facturation artisan gratuite ?", a: "Les applications de facturation réellement gratuites et complètes sont rares. La plupart proposent un freemium limité (nombre de factures, fonctionnalités bloquées) ou une période d'essai. Artisan+ propose un essai gratuit complet, puis 7,99€/mois — le tarif le plus bas du marché pour un outil professionnel." },
      { q: "Artisan+ est-il conforme à la législation française ?", a: "Oui. Artisan+ génère des factures et devis conformes à la législation française : mentions légales obligatoires, numérotation chronologique, TVA correcte selon le type de travaux, et fichiers Factur-X XML pour la réforme de 2026." },
      { q: "L'application fonctionne-t-elle hors connexion ?", a: "Oui. Artisan+ est une PWA (Progressive Web App) qui fonctionne hors connexion sur votre smartphone. Les données créées sans connexion se synchronisent automatiquement quand vous retrouvez un réseau." },
      { q: "Puis-je importer mes clients et données existantes ?", a: "Oui. Artisan+ permet d'importer vos clients et de renseigner votre catalogue de prix dès le démarrage. Le support client vous accompagne dans la migration si vous passez d'un autre logiciel." },
    ],
    ctaTitre: <>Testez l'app de facturation artisan<br /><span style={{ color: P }}>la plus complète — gratuitement</span></>,
    ctaSous: "Artisan+ : devis, factures, suivi chantier, paiement en ligne, Factur-X 2026. Essai gratuit sans carte bancaire, puis 7,99€/mois.",
  },
  "/facture-auto-entrepreneur-gratuit": {
    title: "Facture auto-entrepreneur gratuit 2026 : guide complet | Artisan+",
    desc: "Comment créer une facture conforme en tant qu'auto-entrepreneur artisan ? Mentions obligatoires, TVA, numérotation. Artisan+ : l'outil idéal pour démarrer gratuitement.",
    canonical: `${BASE}/facture-auto-entrepreneur-gratuit`,
    badge: "🧾 Guide auto-entrepreneur — Facturation 2026",
    h1: ["Facture auto-entrepreneur", "gratuit et conforme", "guide complet 2026"],
    intro: "Auto-entrepreneur dans le BTP ou les services ? La facturation a ses propres règles pour votre statut : mentions obligatoires spécifiques, gestion de la franchise TVA, numérotation chronologique... Voici tout ce que vous devez savoir pour créer des factures conformes et comment Artisan+ vous simplifie la vie dès le premier mois.",
    features: [
      { icon: "📋", titre: "Mentions spécifiques auto-entrepreneur", desc: "Mention 'TVA non applicable, art. 293B du CGI' si vous êtes sous le seuil de franchise TVA. Votre numéro SIRET, votre forme juridique (EI), votre numéro de registre des métiers (RM) pour les artisans." },
      { icon: "🔢", titre: "Numérotation obligatoire et continue", desc: "Chaque facture doit avoir un numéro unique, chronologique et sans rupture. Artisan+ gère automatiquement la numérotation de vos factures (format 2026-001, 2026-002...) dans le respect des obligations légales." },
      { icon: "💶", titre: "Franchise TVA : comment l'indiquer ?", desc: "Si votre chiffre d'affaires est sous le seuil de franchise TVA, vous ne facturez pas de TVA. La mention légale 'TVA non applicable, art. 293B CGI' est obligatoire sur chaque facture. Artisan+ l'ajoute automatiquement." },
      { icon: "📧", titre: "Envoi et archivage obligatoire 10 ans", desc: "Les factures doivent être conservées 10 ans. Artisan+ archive toutes vos factures dans le cloud, accessibles à tout moment depuis votre smartphone ou ordinateur." },
      { icon: "⚡", titre: "Factur-X même pour les auto-entrepreneurs", desc: "Même en tant qu'auto-entrepreneur, vous devrez émettre des factures Factur-X pour vos clients professionnels à partir de septembre 2027. Artisan+ génère le profil MINIMUM spécialement prévu pour les micro-entreprises." },
      { icon: "🚀", titre: "Démarrez rapidement avec Artisan+", desc: "Créez votre compte, renseignez votre SIRET et votre statut (auto-entrepreneur sans TVA), et créez votre première facture en moins de 5 minutes. Essai gratuit, sans carte bancaire." },
    ],
    pricing: "Essai gratuit complet · Puis 7,99€/mois · Sans engagement",
    faq: [
      { q: "Quelles sont les mentions obligatoires sur une facture d'auto-entrepreneur artisan ?", a: "Pour un auto-entrepreneur artisan : nom/prénom, adresse professionnelle, numéro SIRET, numéro au Registre des Métiers (RM), date de la facture, numéro chronologique, description des prestations, montant HT ou TTC selon régime TVA, et la mention 'TVA non applicable, art. 293B CGI' si vous êtes en franchise de TVA." },
      { q: "Un auto-entrepreneur doit-il obligatoirement utiliser un logiciel ?", a: "Non, ce n'est pas légalement obligatoire. Mais un logiciel comme Artisan+ garantit la conformité automatique de vos factures (numérotation, mentions légales, archivage) et vous fait gagner du temps. Avec la réforme de 2026, un logiciel capable de générer du Factur-X devient pratiquement incontournable." },
      { q: "Artisan+ est-il adapté aux auto-entrepreneurs sans TVA ?", a: "Oui. Artisan+ gère les deux régimes : avec TVA (taux configurables) et sans TVA (franchise art. 293B CGI). La mention légale spécifique est ajoutée automatiquement sur chaque facture selon votre configuration." },
      { q: "La réforme de la facturation électronique s'applique-t-elle aux auto-entrepreneurs ?", a: "Oui. Même en tant qu'auto-entrepreneur, vous devrez émettre des factures au format structuré Factur-X profil MINIMUM pour vos clients professionnels à partir du 1er septembre 2027. Artisan+ gère ce profil automatiquement." },
    ],
    ctaTitre: <>Artisan+ est fait pour<br /><span style={{ color: P }}>les auto-entrepreneurs artisans</span></>,
    ctaSous: "Factures conformes, gestion franchise TVA automatique, Factur-X 2026 inclus. Essai gratuit sans carte bancaire, puis 7,99€/mois.",
  },
};

// ── Composant partagé : pages facturation électronique (variantes) ─────────────

function PageFactElecVariante({ slug }) {
  const v = FACT_ELEC_VARIANTS[slug];
  useEffect(() => {
    if (!v) return;
    setPageMeta(v.title, v.desc, v.canonical);
    const schema = {
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": v.faq.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } }))
    };
    let el = document.getElementById("schema-fe-v");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-fe-v"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return <PageHome />;
  return (
    <>
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: "linear-gradient(180deg,rgba(255,140,0,0.06) 0%,transparent 100%)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", padding: "6px 16px", marginBottom: "24px" }}>
            <span style={{ color: P, fontSize: "12px", fontWeight: "800" }}>{v.badge}</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.1", margin: "0 0 20px", letterSpacing: "-1px" }}>
            {v.h1[0]}<br /><span style={{ color: P }}>{v.h1[1]}</span>{v.h1[2] && <><br />{v.h1[2]}</>}
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", maxWidth: "720px", margin: "0 auto 36px" }}>{v.intro}</p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
              style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none" }}>
              🚀 Créer un compte gratuit — anticipez dès maintenant
            </a>
            <a href="/facturation-electronique-obligatoire-2026" onClick={e => { e.preventDefault(); navigate("/facturation-electronique-obligatoire-2026"); }}
              style={{ background: "rgba(255,255,255,0.06)", color: "white", fontWeight: "700", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
              Guide complet réforme →
            </a>
          </div>
        </div>
      </section>
      <section style={{ background: C, padding: "24px 20px", borderTop: "1px solid rgba(255,140,0,0.1)", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }}>
          {[{ icon: "✅", label: "Factur-X XML conforme EN 16931" }, { icon: "✅", label: "Profil MINIMUM (micro-entreprise)" }, { icon: "✅", label: "Profil EN16931 (TVA)" }, { icon: "✅", label: "Téléchargement XML en 1 clic" }].map(b => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>{b.icon}</span>
              <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: "900", margin: "0 0 48px", textAlign: "center" }}>Ce que vous devez savoir</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
            {v.bullets.map((b, i) => (
              <div key={i} style={{ background: C, borderRadius: "16px", padding: "28px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{b.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "16px", margin: "0 0 10px" }}>{b.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: "clamp(40px,6vw,80px) 20px", background: C }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,32px)", fontWeight: "900", margin: "0 0 40px", textAlign: "center" }}>Questions fréquentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {v.faq.map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "24px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ color: "white", fontWeight: "700", fontSize: "15px", margin: "0 0 10px" }}>{f.q}</h3>
                <p style={{ color: G, fontSize: "14px", lineHeight: "1.7", margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <CTASection titre={v.ctaTitre} sous={v.ctaSous} />
        </div>
      </section>
    </>
  );
}

// ── Composant partagé : pages génériques mots-clés ────────────────────────────

function PageGenerique({ slug }) {
  const v = GENERIC_VARIANTS[slug];
  useEffect(() => {
    if (!v) return;
    setPageMeta(v.title, v.desc, v.canonical);
    const schema = {
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": v.faq.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } }))
    };
    let el = document.getElementById("schema-gen");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-gen"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return <PageHome />;
  return (
    <>
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: "linear-gradient(180deg,rgba(255,140,0,0.06) 0%,transparent 100%)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", padding: "6px 16px", marginBottom: "24px" }}>
            <span style={{ color: P, fontSize: "12px", fontWeight: "800" }}>{v.badge}</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.1", margin: "0 0 20px", letterSpacing: "-1px" }}>
            {v.h1[0]}<br /><span style={{ color: P }}>{v.h1[1]}</span>{v.h1[2] && <><br />{v.h1[2]}</>}
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", maxWidth: "720px", margin: "0 auto 36px" }}>{v.intro}</p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
              className="ap-btn"
              style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "17px 30px", borderRadius: "14px", textDecoration: "none" }}>
              🚀 Créer un compte gratuit
            </a>
            <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }}
              className="ap-btn ap-btn-ghost"
              style={{ background: "rgba(255,255,255,0.06)", color: "white", fontWeight: "700", fontSize: "16px", padding: "17px 28px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
              Voir toutes les fonctionnalités
            </a>
          </div>
        </div>
      </section>
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {v.features.map((f, i) => (
              <Reveal key={i} delay={i * 0.07} style={{ display: "flex" }}>
                <div className="ap-card" style={{ background: C, borderRadius: "20px", padding: "28px", border: "1px solid rgba(255,255,255,0.06)", flex: 1 }}>
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                  <h3 style={{ color: "white", fontWeight: "800", fontSize: "16px", margin: "0 0 10px" }}>{f.titre}</h3>
                  <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: 0 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {v.pricing && (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <span style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "8px 20px", color: P, fontWeight: "700", fontSize: "13px" }}>
                {v.pricing}
              </span>
            </div>
          )}
        </div>
      </section>
      <section style={{ padding: "clamp(40px,6vw,80px) 20px", background: C }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,32px)", fontWeight: "900", margin: "0 0 40px", textAlign: "center" }}>Questions fréquentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {v.faq.map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "24px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ color: "white", fontWeight: "700", fontSize: "15px", margin: "0 0 10px" }}>{f.q}</h3>
                <p style={{ color: G, fontSize: "14px", lineHeight: "1.7", margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <CTASection titre={v.ctaTitre} sous={v.ctaSous} />
        </div>
      </section>
    </>
  );
}

// ── PAGE : 404 ───────────────────────────────────────────────────────────────
function PageNotFound() {
  useEffect(() => {
    setPageMeta(
      "Page introuvable | Artisan+",
      "La page que vous cherchez n'existe pas.",
      BASE
    );
  }, []);

  return (
    <section style={{ padding: "clamp(80px,10vw,120px) 20px", textAlign: "center" }}>
      <div style={{ maxWidth: "540px", margin: "0 auto" }}>
        <div style={{ fontSize: "80px", fontWeight: "900", color: P, lineHeight: 1 }}>404</div>
        <h1 style={{ color: "white", fontSize: "clamp(22px,4vw,32px)", fontWeight: "800", margin: "16px 0 12px" }}>
          Page introuvable
        </h1>
        <p style={{ color: G, fontSize: "15px", lineHeight: "1.7", marginBottom: "36px" }}>
          Cette page n'existe pas ou a été déplacée.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block", background: P, color: "white",
            padding: "14px 32px", borderRadius: "12px",
            fontWeight: "700", fontSize: "15px", textDecoration: "none",
          }}
        >
          Retour à l'accueil
        </a>
      </div>
    </section>
  );
}

// ── Routeur principal ─────────────────────────────────────────────────────────
export { METIERS, VILLES, CONCURRENTS };

export default function Vitrine() {
  const { lang, setLang, t } = useLanguage();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const metier     = METIERS.find(m => path === `/devis-facture-${m.slug}`);
  const ville      = VILLES.find(v => path === `/artisan-${v.slug}`);
  const concurrent = CONCURRENTS.find(c => path === `/alternative-${c.slug}`);
  const combo      = COMBO_MAP.get(path);

  let PageContent;
  if      (metier)                                                        PageContent = <PageMetier metier={metier} />;
  else if (ville)                                                         PageContent = <PageVille  ville={ville} />;
  else if (concurrent)                                                    PageContent = <PageAlternative concurrent={concurrent} />;
  else if (combo)                                                         PageContent = <PageMetierVille metier={combo.metier} ville={combo.ville} />;
  else if (path === "/cgu")                                               PageContent = <PageCGU />;
  else if (path === "/politique-confidentialite")                         PageContent = <PageRGPD />;
  else if (path === "/mentions-legales")                                  PageContent = <PageMentionsLegales />;
  else if (path === "/facturation-electronique-obligatoire-2026")        PageContent = <PageFacturationElectronique />;
  else if (FACT_ELEC_VARIANTS[path])                                      PageContent = <PageFactElecVariante slug={path} />;
  else if (GENERIC_VARIANTS[path])                                        PageContent = <PageGenerique slug={path} />;
  else if (path === "/")                                                   PageContent = <PageHome />;
  else                                                                    PageContent = <PageNotFound />;

  return (
    <div style={{ minHeight: "100vh", background: D, fontFamily: "'Segoe UI', -apple-system, sans-serif", color: "white" }}>
      <VitrineStyles />
      <Header />
      <main>{PageContent}</main>
      <Footer />
    </div>
  );
}
