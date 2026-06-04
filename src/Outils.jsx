import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { QRCodeCanvas } from "qrcode.react";
import ProGate from "./ProGate";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const inp = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px", padding: "11px 14px", color: "white", fontSize: "14px",
  outline: "none", width: "100%", boxSizing: "border-box",
};
const btn = (color = PRIMARY, bg = `rgba(255,140,0,0.12)`, border = `rgba(255,140,0,0.35)`) => ({
  background: bg, border: `1px solid ${border}`, color,
  borderRadius: "10px", padding: "11px 18px", fontSize: "14px",
  fontWeight: "700", cursor: "pointer", display: "inline-flex",
  alignItems: "center", gap: "8px",
});

// Image → base64 JPEG (reused from NouveauDevis pattern)
function compresserImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

const OUTILS = [
  { id: "mesure",      emoji: "📐", titre: "Mesure par photo",       desc: "IA calcule les m²",          cat: "ia"      },
  { id: "calculatrice",emoji: "🧮", titre: "Calculatrice métier",    desc: "m², m³, ml, TVA…",           cat: "calcul"  },
  { id: "vocal",       emoji: "🎙️", titre: "Devis vocal",            desc: "Dictez, l'IA remplit",       cat: "ia"      },
  { id: "niveau",      emoji: "🫧", titre: "Niveau à bulle",         desc: "Gyroscope téléphone",        cat: "phone"   },
  { id: "lampe",       emoji: "🔦", titre: "Lampe torche",           desc: "Flash du téléphone",         cat: "phone"   },
  { id: "loupe",       emoji: "🔍", titre: "Loupe",                  desc: "Zoom caméra",                cat: "phone"   },
  { id: "boussole",    emoji: "🧭", titre: "Boussole",               desc: "Orientation magnétique",     cat: "phone"   },
  { id: "decibel",     emoji: "🔊", titre: "Décibelmètre",           desc: "Mesure le bruit",            cat: "phone"   },
  { id: "galerie",     emoji: "🖼️", titre: "Galerie réalisations",   desc: "Photos avant/après",        cat: "photos"  },
  { id: "annotation",  emoji: "✏️", titre: "Annotation photo",       desc: "Dessinez sur vos photos",   cat: "photos"  },
  { id: "comparateur", emoji: "↔️", titre: "Comparateur avant/après",desc: "Côte à côte",               cat: "photos"  },
  { id: "scanner",     emoji: "📄", titre: "Scanner documents",      desc: "Photographiez vos contrats", cat: "photos"  },
  { id: "qr-scanner",  emoji: "📱", titre: "Scanner QR",             desc: "Lisez les QR codes",        cat: "outils"  },
  { id: "checklist",   emoji: "✅", titre: "Checklist chantier",     desc: "Listes personnalisables",    cat: "outils"  },
  { id: "materiau",    emoji: "🧱", titre: "ID matériaux",           desc: "Photo → identification IA", cat: "ia"      },
  { id: "meteo-pro",   emoji: "🌤️", titre: "UV · Air · Soleil",      desc: "Conditions de travail",     cat: "env"     },
  { id: "sms",         emoji: "💬", titre: "SMS rapides",            desc: "Modèles prêts à envoyer",   cat: "comm"    },
  { id: "carte",       emoji: "💼", titre: "Carte de visite QR",    desc: "Votre contact en QR code",  cat: "comm"    },
  { id: "notes-vocal", emoji: "🎤", titre: "Notes vocales",          desc: "Enregistrez sur chantier",  cat: "comm"    },
  { id: "traduction",  emoji: "🌍", titre: "Traduction BTP",         desc: "IA traduit en temps réel",  cat: "ia"      },
];

const CAT_COLORS = {
  ia:     { label: "IA",           color: "#a855f7", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.3)" },
  calcul: { label: "Calcul",       color: "#7ec8e3", bg: "rgba(126,200,227,0.1)", border: "rgba(126,200,227,0.3)" },
  phone:  { label: "Téléphone",    color: PRIMARY,   bg: "rgba(255,140,0,0.1)",   border: "rgba(255,140,0,0.3)" },
  photos: { label: "Photos",       color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   border: "rgba(76,175,80,0.3)" },
  outils: { label: "Outils",       color: "#ffb347", bg: "rgba(255,179,71,0.1)",  border: "rgba(255,179,71,0.3)" },
  env:    { label: "Environnement",color: "#6495ED", bg: "rgba(100,149,237,0.1)", border: "rgba(100,149,237,0.3)" },
  comm:   { label: "Comm.",        color: "#ff6b9d", bg: "rgba(255,107,157,0.1)", border: "rgba(255,107,157,0.3)" },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Outils({ user, profil, isPro = true, onUpgrade }) {
  const [tool, setTool] = useState(null);

  // Calculatrice
  const [calcDisplay, setCalcDisplay]   = useState("0");
  const [calcExpr,    setCalcExpr]      = useState("");
  const [calcTva,     setCalcTva]       = useState(20);

  // Mesure photo
  const [mesureFile,     setMesureFile]     = useState(null);
  const [mesureRef,      setMesureRef]      = useState("");
  const [mesureAnalyzing,setMesureAnalyzing]= useState(false);
  const [mesureResult,   setMesureResult]   = useState(null);
  const [mesureError,    setMesureError]    = useState("");

  // Devis vocal
  const [vocalActive,   setVocalActive]   = useState(false);
  const [vocalTranscript,setVocalTranscript]= useState("");
  const [vocalProcessing,setVocalProcessing]= useState(false);
  const [vocalResult,   setVocalResult]   = useState(null);
  const [vocalError,    setVocalError]    = useState("");
  const recognitionRef = useRef(null);

  // Niveau à bulle
  const [niveauBeta,  setNiveauBeta]  = useState(0);
  const [niveauGamma, setNiveauGamma] = useState(0);
  const [niveauPerm,  setNiveauPerm]  = useState(false);

  // Lampe torche
  const [lampeOn,     setLampeOn]     = useState(false);
  const [lampeStream, setLampeStream] = useState(null);
  const [lampeError,  setLampeError]  = useState("");

  // Loupe
  const loupeVideoRef = useRef(null);
  const [loupeStream, setLoupeStream] = useState(null);
  const [loupeZoom,   setLoupeZoom]   = useState(2);
  const [loupeError,  setLoupeError]  = useState("");

  // Boussole
  const [compassHeading, setCompassHeading] = useState(null);
  const [compassPerm,    setCompassPerm]    = useState(false);
  const [compassError,   setCompassError]  = useState("");

  // Décibelmètre
  const [decibelDb,      setDecibelDb]      = useState(0);
  const [decibelRunning, setDecibelRunning] = useState(false);
  const [decibelError,   setDecibelError]   = useState("");
  const decibelAudioRef = useRef(null);
  const decibelRafRef   = useRef(null);

  // Galerie
  const [galeriePhotos, setGaleriePhotos] = useState([]);
  const [galerieLoading,setGalerieLoading]= useState(false);

  // Annotation
  const annotCanvasRef = useRef(null);
  const annotImgRef    = useRef(null);
  const [annotFile,    setAnnotFile]    = useState(null);
  const [annotDrawing, setAnnotDrawing] = useState(false);
  const [annotTool,    setAnnotTool]    = useState("pen");
  const [annotColor,   setAnnotColor]   = useState("#FF8C00");
  const [annotSize,    setAnnotSize]    = useState(3);
  const annotLastRef   = useRef(null);

  // Comparateur
  const [compAvant,  setCompAvant]  = useState(null);
  const [compApres,  setCompApres]  = useState(null);

  // Matériau ID
  const [matFile,      setMatFile]      = useState(null);
  const [matAnalyzing, setMatAnalyzing] = useState(false);
  const [matResult,    setMatResult]    = useState(null);
  const [matError,     setMatError]     = useState("");

  // Météo pro (UV/Air/Soleil)
  const [meteoProData,    setMeteoProData]    = useState(null);
  const [meteoProLoading, setMeteoProLoading] = useState(false);
  const [meteoProError,   setMeteoProError]   = useState("");

  // QR scanner
  const qrVideoRef    = useRef(null);
  const [qrStream,   setQrStream]   = useState(null);
  const [qrResult,   setQrResult]   = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const [qrError,    setQrError]    = useState("");
  const qrRafRef     = useRef(null);

  // SMS rapides
  const [smsClients, setSmsClients] = useState([]);
  const [smsTel,     setSmsTel]     = useState("");

  // Notes vocales
  const [notesRec,       setNotesRec]       = useState(false);
  const [notesRecordings,setNotesRecordings]= useState([]);
  const [notesError,     setNotesError]     = useState("");
  const notesRecorderRef = useRef(null);
  const notesChunksRef   = useRef([]);

  // Traduction
  const [tradTexte,     setTradTexte]     = useState("");
  const [tradLangue,    setTradLangue]    = useState("Anglais");
  const [tradResult,    setTradResult]    = useState(null);
  const [tradProcessing,setTradProcessing]= useState(false);
  const [tradError,     setTradError]     = useState("");

  // Checklist
  const [checklists,      setChecklists]      = useState([]);
  const [checklistActif,  setChecklistActif]  = useState(null);
  const [checklistNvNom,  setChecklistNvNom]  = useState("");
  const [checklistNvItem, setChecklistNvItem] = useState("");

  // ── Chargement ───────────────────────────────────────────────────
  useEffect(() => {
    loadChecklists();
    if (tool === "galerie") loadGalerie();
    if (tool === "sms") loadSmsClients();
  }, [tool]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup au changement de tool ────────────────────────────────
  useEffect(() => {
    return () => {
      stopLampe();
      stopLoupe();
      stopDecibel();
      stopQrScan();
      stopVocal();
      stopNiveauListeners();
      stopCompassListeners();
    };
  }, [tool]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  const loadChecklists = () => {
    try {
      const raw = localStorage.getItem(`artisan_checklists_${user.id}`);
      setChecklists(raw ? JSON.parse(raw) : []);
    } catch { setChecklists([]); }
  };

  const saveChecklists = (cl) => {
    localStorage.setItem(`artisan_checklists_${user.id}`, JSON.stringify(cl));
    setChecklists(cl);
  };

  const loadGalerie = async () => {
    setGalerieLoading(true);
    const { data } = await supabase.from("chantiers").select("id, nom, photos").eq("user_id", user.id);
    const all = (data || []).flatMap(ch =>
      (ch.photos || []).map(p => ({ ...p, chantier: ch.nom }))
    ).filter(p => p.url?.startsWith("http"));
    setGaleriePhotos(all);
    setGalerieLoading(false);
  };

  const loadSmsClients = async () => {
    const { data } = await supabase.from("clients").select("id, nom, telephone").eq("user_id", user.id).order("nom");
    setSmsClients((data || []).filter(c => c.telephone));
  };

  // ── Lampe ────────────────────────────────────────────────────────
  const startLampe = async () => {
    setLampeError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const track = stream.getVideoTracks()[0];
      await track.applyConstraints({ advanced: [{ torch: true }] });
      setLampeStream(stream);
      setLampeOn(true);
    } catch (e) {
      setLampeError("Lampe torche non disponible sur cet appareil. " + (e.message || ""));
    }
  };
  const stopLampe = () => {
    if (lampeStream) {
      lampeStream.getTracks().forEach(t => { try { t.applyConstraints({ advanced: [{ torch: false }] }); } catch {} t.stop(); });
      setLampeStream(null);
    }
    setLampeOn(false);
  };
  const toggleLampe = () => lampeOn ? stopLampe() : startLampe();

  // ── Loupe ────────────────────────────────────────────────────────
  const startLoupe = async () => {
    setLoupeError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setLoupeStream(stream);
      if (loupeVideoRef.current) { loupeVideoRef.current.srcObject = stream; loupeVideoRef.current.play(); }
    } catch (e) { setLoupeError("Caméra non accessible : " + e.message); }
  };
  const stopLoupe = () => {
    if (loupeStream) { loupeStream.getTracks().forEach(t => t.stop()); setLoupeStream(null); }
  };

  // ── Décibelmètre ─────────────────────────────────────────────────
  const startDecibel = async () => {
    setDecibelError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx    = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      decibelAudioRef.current = { ctx, stream, analyser };
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
        const db  = Math.round(20 * Math.log10(rms / 255) + 90);
        setDecibelDb(Math.max(0, Math.min(db, 120)));
        decibelRafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setDecibelRunning(true);
    } catch (e) { setDecibelError("Micro non accessible : " + e.message); }
  };
  const stopDecibel = () => {
    if (decibelRafRef.current) { cancelAnimationFrame(decibelRafRef.current); decibelRafRef.current = null; }
    if (decibelAudioRef.current) {
      try { decibelAudioRef.current.stream.getTracks().forEach(t => t.stop()); decibelAudioRef.current.ctx.close(); } catch {}
      decibelAudioRef.current = null;
    }
    setDecibelRunning(false);
    setDecibelDb(0);
  };

  // ── Niveau ───────────────────────────────────────────────────────
  const handleOrientation = useCallback((e) => {
    setNiveauBeta(Math.round(e.beta  || 0));
    setNiveauGamma(Math.round(e.gamma || 0));
  }, []);
  const startNiveau = async () => {
    if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
      try { await DeviceOrientationEvent.requestPermission(); } catch { return; }
    }
    window.addEventListener("deviceorientation", handleOrientation);
    setNiveauPerm(true);
  };
  const stopNiveauListeners = () => window.removeEventListener("deviceorientation", handleOrientation);

  // ── Boussole ─────────────────────────────────────────────────────
  const handleCompass = useCallback((e) => {
    const heading = e.webkitCompassHeading ?? (e.alpha != null ? (360 - e.alpha) : null);
    if (heading != null) setCompassHeading(Math.round(heading));
  }, []);
  const startCompass = async () => {
    setCompassError("");
    if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
      try { await DeviceOrientationEvent.requestPermission(); }
      catch { setCompassError("Permission refusée pour la boussole."); return; }
    }
    window.addEventListener("deviceorientation", handleCompass);
    setCompassPerm(true);
  };
  const stopCompassListeners = () => window.removeEventListener("deviceorientation", handleCompass);

  // ── QR scanner ───────────────────────────────────────────────────
  const startQrScan = async () => {
    setQrError(""); setQrResult("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setQrStream(stream);
      setQrScanning(true);
      if (qrVideoRef.current) { qrVideoRef.current.srcObject = stream; await qrVideoRef.current.play(); }
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (!qrVideoRef.current || !qrScanning) return;
          try {
            const barcodes = await detector.detect(qrVideoRef.current);
            if (barcodes.length > 0) {
              setQrResult(barcodes[0].rawValue);
              stopQrScan();
              return;
            }
          } catch {}
          qrRafRef.current = setTimeout(scan, 300);
        };
        scan();
      } else {
        setQrError("BarcodeDetector non supporté. Utilisez Chrome Android.");
      }
    } catch (e) { setQrError("Caméra non accessible : " + e.message); }
  };
  const stopQrScan = () => {
    if (qrRafRef.current) { clearTimeout(qrRafRef.current); qrRafRef.current = null; }
    if (qrStream) { qrStream.getTracks().forEach(t => t.stop()); setQrStream(null); }
    setQrScanning(false);
  };

  // ── Vocal recognition ────────────────────────────────────────────
  const startVocal = () => {
    setVocalError("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVocalError("Reconnaissance vocale non supportée sur ce navigateur (utilisez Chrome)."); return; }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = e => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      setVocalTranscript(t.trim());
    };
    rec.onerror = (e) => setVocalError("Erreur : " + e.error);
    rec.start();
    recognitionRef.current = rec;
    setVocalActive(true);
  };
  const stopVocal = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    setVocalActive(false);
  };
  const processVocal = async () => {
    if (!vocalTranscript.trim()) { setVocalError("Rien à analyser — parlez d'abord."); return; }
    setVocalProcessing(true); setVocalError("");
    try {
      const r = await fetch("/api/process-vocal-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription: vocalTranscript }),
      });
      const j = await r.json();
      if (!j.ok) { setVocalError("❌ " + (j.error || "Erreur")); }
      else setVocalResult(j.data);
    } catch (e) { setVocalError("❌ Réseau : " + e.message); }
    setVocalProcessing(false);
  };

  // ── Notes vocales ────────────────────────────────────────────────
  const startNotesRec = async () => {
    setNotesError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      notesChunksRef.current = [];
      recorder.ondataavailable = e => notesChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(notesChunksRef.current, { type: "audio/webm" });
        const url  = URL.createObjectURL(blob);
        const name = new Date().toLocaleTimeString("fr-FR");
        setNotesRecordings(p => [{ url, name, blob }, ...p]);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      notesRecorderRef.current = recorder;
      setNotesRec(true);
    } catch (e) { setNotesError("Micro non accessible : " + e.message); }
  };
  const stopNotesRec = () => {
    if (notesRecorderRef.current) { try { notesRecorderRef.current.stop(); } catch {} notesRecorderRef.current = null; }
    setNotesRec(false);
  };

  // ── Météo pro ────────────────────────────────────────────────────
  const loadMeteoPro = () => {
    setMeteoProLoading(true); setMeteoProError("");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const [forecastRes, airRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max,sunrise,sunset&timezone=auto&forecast_days=1`),
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10&timezone=auto`),
        ]);
        const [fd, ad] = await Promise.all([forecastRes.json(), airRes.json()]);
        setMeteoProData({
          uv:      fd.daily?.uv_index_max?.[0] ?? null,
          sunrise: fd.daily?.sunrise?.[0]?.split("T")[1]?.slice(0,5) ?? "--",
          sunset:  fd.daily?.sunset?.[0]?.split("T")[1]?.slice(0,5) ?? "--",
          aqi:     ad.current?.european_aqi ?? null,
          pm25:    ad.current?.pm2_5 ?? null,
          pm10:    ad.current?.pm10  ?? null,
          lat:     lat.toFixed(4),
          lon:     lon.toFixed(4),
        });
      } catch (e) { setMeteoProError("Impossible de charger les données : " + e.message); }
      setMeteoProLoading(false);
    }, (err) => { setMeteoProError("Localisation refusée : " + err.message); setMeteoProLoading(false); });
  };

  // ── Annotation canvas ────────────────────────────────────────────
  const drawAnnotStart = (e) => {
    if (!annotCanvasRef.current) return;
    e.preventDefault();
    setAnnotDrawing(true);
    const rect = annotCanvasRef.current.getBoundingClientRect();
    const scaleX = annotCanvasRef.current.width  / rect.width;
    const scaleY = annotCanvasRef.current.height / rect.height;
    const cx = ((e.touches?.[0]?.clientX ?? e.clientX) - rect.left) * scaleX;
    const cy = ((e.touches?.[0]?.clientY ?? e.clientY) - rect.top) * scaleY;
    annotLastRef.current = { x: cx, y: cy };
    const ctx = annotCanvasRef.current.getContext("2d");
    ctx.strokeStyle = annotColor;
    ctx.lineWidth = annotSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
  };
  const drawAnnotMove = (e) => {
    if (!annotDrawing || !annotCanvasRef.current || annotTool !== "pen") return;
    e.preventDefault();
    const rect = annotCanvasRef.current.getBoundingClientRect();
    const scaleX = annotCanvasRef.current.width  / rect.width;
    const scaleY = annotCanvasRef.current.height / rect.height;
    const cx = ((e.touches?.[0]?.clientX ?? e.clientX) - rect.left) * scaleX;
    const cy = ((e.touches?.[0]?.clientY ?? e.clientY) - rect.top) * scaleY;
    const ctx = annotCanvasRef.current.getContext("2d");
    ctx.lineTo(cx, cy);
    ctx.stroke();
    annotLastRef.current = { x: cx, y: cy };
  };
  const drawAnnotEnd = (e) => {
    setAnnotDrawing(false);
    if (!annotCanvasRef.current) return;
    const ctx = annotCanvasRef.current.getContext("2d");
    ctx.closePath();
    if (annotTool === "fleche" && annotLastRef.current) {
      // Already drawn the shaft; just close
    }
  };
  const initAnnotCanvas = (file) => {
    setAnnotFile(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (!annotCanvasRef.current) return;
      annotCanvasRef.current.width  = img.width;
      annotCanvasRef.current.height = img.height;
      const ctx = annotCanvasRef.current.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const clearAnnotCanvas = () => {
    if (!annotCanvasRef.current || !annotFile) return;
    const url = URL.createObjectURL(annotFile);
    const img = new Image();
    img.onload = () => {
      const ctx = annotCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, annotCanvasRef.current.width, annotCanvasRef.current.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const downloadAnnotation = () => {
    if (!annotCanvasRef.current) return;
    const a = document.createElement("a");
    a.download = "annotation.jpg";
    a.href = annotCanvasRef.current.toDataURL("image/jpeg", 0.92);
    a.click();
  };

  // ── IA calls ─────────────────────────────────────────────────────
  const analyserMesure = async (file) => {
    if (!file) return;
    setMesureAnalyzing(true); setMesureError(""); setMesureResult(null);
    const b64 = await compresserImage(file);
    if (!b64) { setMesureError("❌ Impossible de lire l'image."); setMesureAnalyzing(false); return; }
    try {
      const r = await fetch("/api/vision-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo-measure", imageBase64: b64, mimeType: "image/jpeg", objet_reference: mesureRef }),
      });
      const j = await r.json();
      if (!j.ok) setMesureError("❌ " + (j.error || "Erreur IA"));
      else setMesureResult(j.data);
    } catch (e) { setMesureError("❌ Réseau : " + e.message); }
    setMesureAnalyzing(false);
  };

  const analyserMateriau = async (file) => {
    if (!file) return;
    setMatAnalyzing(true); setMatError(""); setMatResult(null);
    const b64 = await compresserImage(file);
    if (!b64) { setMatError("❌ Impossible de lire l'image."); setMatAnalyzing(false); return; }
    try {
      const r = await fetch("/api/vision-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "identify-material", imageBase64: b64, mimeType: "image/jpeg" }),
      });
      const j = await r.json();
      if (!j.ok) setMatError("❌ " + (j.error || "Erreur IA"));
      else setMatResult(j.data);
    } catch (e) { setMatError("❌ Réseau : " + e.message); }
    setMatAnalyzing(false);
  };

  const traduit = async () => {
    if (!tradTexte.trim()) return;
    setTradProcessing(true); setTradError(""); setTradResult(null);
    try {
      const r = await fetch("/api/translate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: tradTexte, langue_cible: tradLangue }),
      });
      const j = await r.json();
      if (!j.ok) setTradError("❌ " + (j.error || "Erreur IA"));
      else setTradResult(j.data);
    } catch (e) { setTradError("❌ Réseau : " + e.message); }
    setTradProcessing(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // CALCULATRICE MÉTIER
  // ═══════════════════════════════════════════════════════════════
  const calcPress = (val) => {
    if (val === "C") { setCalcDisplay("0"); setCalcExpr(""); return; }
    if (val === "=") {
      try {
        const expr = (calcExpr + calcDisplay).replace(/×/g, "*").replace(/÷/g, "/");
        const result = Function('"use strict"; return (' + expr + ')')();
        setCalcDisplay(String(+result.toFixed(6)));
        setCalcExpr("");
      } catch { setCalcDisplay("Err"); setCalcExpr(""); }
      return;
    }
    if (["+", "-", "×", "÷"].includes(val)) {
      setCalcExpr(calcExpr + calcDisplay + val);
      setCalcDisplay("0");
      return;
    }
    if (val === "m²") { setCalcDisplay(d => String(parseFloat(d) ** 2 <= 0 ? d : d)); return; }
    if (val === "+TVA") {
      const base = parseFloat(calcDisplay);
      if (!isNaN(base)) setCalcDisplay(String(+(base * (1 + calcTva / 100)).toFixed(2)));
      return;
    }
    if (val === "-TVA") {
      const ttc = parseFloat(calcDisplay);
      if (!isNaN(ttc)) setCalcDisplay(String(+(ttc / (1 + calcTva / 100)).toFixed(2)));
      return;
    }
    if (val === "⌫") {
      setCalcDisplay(d => d.length > 1 ? d.slice(0, -1) : "0");
      return;
    }
    if (val === ".") {
      setCalcDisplay(d => d.includes(".") ? d : d + ".");
      return;
    }
    setCalcDisplay(d => d === "0" ? val : d + val);
  };

  // ═══════════════════════════════════════════════════════════════
  // CHECKLISTS
  // ═══════════════════════════════════════════════════════════════
  const creerChecklist = () => {
    if (!checklistNvNom.trim()) return;
    const nv = { id: Date.now().toString(), nom: checklistNvNom.trim(), items: [], createdAt: new Date().toISOString() };
    const cl = [nv, ...checklists];
    saveChecklists(cl);
    setChecklistActif(nv.id);
    setChecklistNvNom("");
  };
  const ajouterItem = () => {
    if (!checklistNvItem.trim()) return;
    const cl = checklists.map(c => c.id === checklistActif
      ? { ...c, items: [...c.items, { id: Date.now().toString(), texte: checklistNvItem.trim(), fait: false }] }
      : c);
    saveChecklists(cl);
    setChecklistNvItem("");
  };
  const toggleItem = (checkId, itemId) => {
    const cl = checklists.map(c => c.id === checkId
      ? { ...c, items: c.items.map(it => it.id === itemId ? { ...it, fait: !it.fait } : it) }
      : c);
    saveChecklists(cl);
  };
  const supprimerItem = (checkId, itemId) => {
    const cl = checklists.map(c => c.id === checkId
      ? { ...c, items: c.items.filter(it => it.id !== itemId) }
      : c);
    saveChecklists(cl);
  };
  const supprimerChecklist = (id) => {
    saveChecklists(checklists.filter(c => c.id !== id));
    if (checklistActif === id) setChecklistActif(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // HELPERS UI
  // ═══════════════════════════════════════════════════════════════
  const aqiLabel = (v) => {
    if (v == null) return "—";
    if (v <= 20)  return { label: "Bon ✓",             color: "#4CAF50" };
    if (v <= 40)  return { label: "Modéré",             color: "#ffb347" };
    if (v <= 60)  return { label: "Mauvais sensitifs",  color: PRIMARY   };
    if (v <= 80)  return { label: "Mauvais ⚠️",         color: "#ff6b6b" };
    return               { label: "Très mauvais ❌",    color: "#ff2222" };
  };

  const uvLabel = (v) => {
    if (v == null) return "—";
    if (v <= 2)  return { label: "Faible",    color: "#4CAF50", conseil: "Pas de protection nécessaire" };
    if (v <= 5)  return { label: "Modéré",    color: "#ffb347", conseil: "Crème solaire recommandée" };
    if (v <= 7)  return { label: "Élevé",     color: PRIMARY,   conseil: "Crème FPS 30+, chapeau" };
    if (v <= 10) return { label: "Très élevé",color: "#ff6b6b", conseil: "Protection maximale !" };
    return               { label: "Extrême",  color: "#ff2222", conseil: "Évitez l'exposition directe" };
  };

  // ═══════════════════════════════════════════════════════════════
  // GATE PRO
  // ═══════════════════════════════════════════════════════════════
  if (!isPro) {
    return (
      <ProGate
        featureKey="outils"
        mode="page"
        onUpgrade={onUpgrade}
        onDismiss={null}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  const renderToolContent = () => {
    const cardS = { background: CARD, borderRadius: "14px", padding: "20px", border: "1px solid rgba(255,140,0,0.12)", marginBottom: "12px" };

    // ── Mesure par photo ────────────────────────────────────────
    if (tool === "mesure") return (
      <div>
        <div style={cardS}>
          <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 14px" }}>
            📸 Prenez ou importez une photo (pièce, mur, surface). L'IA estime les m², ml et volumes.
            Pour plus de précision, placez un objet de référence (règle, porte = 2m…).
          </p>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
              Objet de référence (optionnel)
            </label>
            <input value={mesureRef} onChange={e => setMesureRef(e.target.value)}
              placeholder="Ex : porte standard (2m), brique 25cm…"
              style={{ ...inp, marginBottom: "12px" }} />
          </div>
          <label style={{ display: "block", background: "rgba(168,85,247,0.12)", border: "1.5px solid rgba(168,85,247,0.4)", borderRadius: "12px", padding: "14px", cursor: mesureAnalyzing ? "wait" : "pointer", textAlign: "center", color: "#a855f7", fontSize: "15px", fontWeight: "700" }}>
            {mesureAnalyzing ? "⏳ Analyse IA en cours…" : "📷 Choisir / Photographier"}
            <input type="file" accept="image/*" capture="environment" hidden disabled={mesureAnalyzing}
              onChange={e => { if (e.target.files[0]) { setMesureFile(e.target.files[0]); analyserMesure(e.target.files[0]); } e.target.value = ""; }} />
          </label>
          {mesureError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginTop: "10px" }}>{mesureError}</div>}
        </div>
        {mesureResult && (
          <div style={cardS}>
            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Résultats IA · Précision : {mesureResult.precision}
            </div>
            {mesureResult.surfaces?.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "white", fontSize: "14px" }}>{s.nom}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "16px" }}>{s.surface_m2} m²</span>
                  {s.longueur_m && <div style={{ color: "#8899aa", fontSize: "11px" }}>{s.longueur_m}m × {s.largeur_m}m</div>}
                </div>
              </div>
            ))}
            {mesureResult.lineaires?.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "white", fontSize: "14px" }}>{l.nom}</span>
                <span style={{ color: "#7ec8e3", fontWeight: "800" }}>{l.longueur_ml} ml</span>
              </div>
            ))}
            {mesureResult.total_m2 > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: "8px", borderTop: "2px solid rgba(255,140,0,0.2)" }}>
                <span style={{ color: "white", fontWeight: "700" }}>Total surfaces</span>
                <span style={{ color: PRIMARY, fontWeight: "900", fontSize: "20px" }}>{mesureResult.total_m2} m²</span>
              </div>
            )}
            {mesureResult.notes && <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "10px", fontStyle: "italic" }}>💡 {mesureResult.notes}</div>}
            {mesureResult.conseils && <div style={{ color: "#ffb347", fontSize: "12px", marginTop: "6px" }}>📌 {mesureResult.conseils}</div>}
          </div>
        )}
      </div>
    );

    // ── Calculatrice métier ─────────────────────────────────────
    if (tool === "calculatrice") {
      const ROWS = [
        ["C", "⌫", "%", "÷"],
        ["7", "8", "9", "×"],
        ["4", "5", "6", "-"],
        ["1", "2", "3", "+"],
        ["0", ".", "+TVA", "="],
        ["m²", "m³", "ml", "-TVA"],
      ];
      return (
        <div style={{ maxWidth: "360px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <label style={{ color: "#8899aa", fontSize: "12px", whiteSpace: "nowrap" }}>TVA %</label>
            <input type="number" value={calcTva} onChange={e => setCalcTva(parseFloat(e.target.value) || 20)}
              style={{ ...inp, width: "80px", textAlign: "center" }} />
          </div>
          <div style={{ background: DARK, borderRadius: "16px", padding: "20px 16px 16px", border: "1px solid rgba(255,140,0,0.15)", marginBottom: "12px" }}>
            <div style={{ color: "#8899aa", fontSize: "12px", textAlign: "right", minHeight: "18px", overflow: "hidden", textOverflow: "ellipsis" }}>{calcExpr}</div>
            <div style={{ color: "white", fontSize: "42px", fontWeight: "800", textAlign: "right", marginBottom: "18px", letterSpacing: "-1px", wordBreak: "break-all" }}>{calcDisplay}</div>
            {ROWS.map((row, ri) => (
              <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "8px" }}>
                {row.map(v => {
                  const isOp = ["+", "-", "×", "÷", "="].includes(v);
                  const isSpec = ["C", "⌫", "%"].includes(v);
                  const isMet = ["m²", "m³", "ml", "+TVA", "-TVA"].includes(v);
                  return (
                    <button key={v} onClick={() => calcPress(v)} style={{
                      background: isOp ? PRIMARY : isSpec ? "rgba(255,100,100,0.15)" : isMet ? "rgba(100,149,237,0.15)" : "rgba(255,255,255,0.07)",
                      border: "none", borderRadius: "12px", padding: "16px 6px",
                      color: isOp ? "white" : isSpec ? "#ff6b6b" : isMet ? "#6495ED" : "white",
                      fontSize: v.length > 2 ? "11px" : "18px", fontWeight: "700",
                      cursor: "pointer", transition: "opacity 0.1s",
                    }}>{v}</button>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ color: "#8899aa", fontSize: "11px", textAlign: "center" }}>
            +TVA / -TVA : ajoute ou retire la TVA au montant affiché
          </div>
        </div>
      );
    }

    // ── Devis vocal ─────────────────────────────────────────────
    if (tool === "vocal") return (
      <div>
        <div style={cardS}>
          <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 14px" }}>
            🎙️ Parlez naturellement : "Devis pour M. Dupont, 50m² de carrelage à 45€ le m², pose incluse".
            L'IA structure automatiquement le devis.
          </p>
          <div style={{ background: DARK, borderRadius: "12px", padding: "16px", minHeight: "100px", marginBottom: "14px", fontSize: "14px", color: "white", lineHeight: "1.6", border: "1px solid rgba(255,255,255,0.07)" }}>
            {vocalTranscript || <span style={{ color: "#556" }}>Votre dictée apparaîtra ici…</span>}
          </div>
          {vocalError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{vocalError}</div>}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={vocalActive ? stopVocal : startVocal} style={{
              ...btn(vocalActive ? "#ff6b6b" : PRIMARY, vocalActive ? "rgba(255,80,80,0.12)" : "rgba(255,140,0,0.12)", vocalActive ? "rgba(255,80,80,0.4)" : "rgba(255,140,0,0.4)"),
              flex: 1, justifyContent: "center",
              animation: vocalActive ? "pulse 1.2s ease-in-out infinite" : "none",
            }}>
              {vocalActive ? "⏹ Arrêter" : "🎙️ Dicter"}
            </button>
            {vocalTranscript && !vocalActive && (
              <button onClick={processVocal} disabled={vocalProcessing} style={{ ...btn("#a855f7", "rgba(168,85,247,0.12)", "rgba(168,85,247,0.4)"), flex: 1, justifyContent: "center" }}>
                {vocalProcessing ? "⏳ Analyse…" : "✨ Structurer le devis"}
              </button>
            )}
            {vocalTranscript && (
              <button onClick={() => { setVocalTranscript(""); setVocalResult(null); }} style={{ ...btn("#8899aa", "transparent", "rgba(255,255,255,0.1)") }}>🗑️</button>
            )}
          </div>
        </div>
        {vocalResult && (
          <div style={cardS}>
            <div style={{ color: PRIMARY, fontWeight: "700", marginBottom: "12px" }}>✅ Devis structuré</div>
            {vocalResult.client_nom && <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "4px" }}>👤 {vocalResult.client_nom} {vocalResult.client_telephone ? `· ${vocalResult.client_telephone}` : ""}</div>}
            {vocalResult.lignes?.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "white", fontSize: "14px" }}>{l.description}</div>
                  <div style={{ color: "#8899aa", fontSize: "12px" }}>{l.quantite} {l.unite} × {l.prix_unitaire} €</div>
                </div>
                <div style={{ color: PRIMARY, fontWeight: "700" }}>{(l.quantite * l.prix_unitaire).toFixed(2)} €</div>
              </div>
            ))}
            {vocalResult.lignes?.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: "700", fontSize: "16px" }}>
                <span style={{ color: "white" }}>Total HT</span>
                <span style={{ color: PRIMARY }}>{vocalResult.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0).toFixed(2)} €</span>
              </div>
            )}
            {vocalResult.elements_manquants?.length > 0 && (
              <div style={{ color: "#ffb347", fontSize: "12px", marginTop: "10px" }}>⚠️ Manquant : {vocalResult.elements_manquants.join(", ")}</div>
            )}
          </div>
        )}
      </div>
    );

    // ── Niveau à bulle ──────────────────────────────────────────
    if (tool === "niveau") {
      const isLevel = Math.abs(niveauBeta) < 2 && Math.abs(niveauGamma) < 2;
      return (
        <div style={{ textAlign: "center" }}>
          <div style={cardS}>
            <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 16px" }}>
              Posez votre téléphone à plat ou contre une surface. La bulle doit être centrée.
            </p>
            {!niveauPerm ? (
              <button onClick={startNiveau} style={{ ...btn(), width: "100%", justifyContent: "center", padding: "16px" }}>
                🫧 Activer le niveau
              </button>
            ) : (
              <>
                <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto 20px", background: "rgba(255,255,255,0.04)", borderRadius: "50%", border: `3px solid ${isLevel ? "#4CAF50" : PRIMARY}`, transition: "border-color 0.3s" }}>
                  {/* Réticule central */}
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "40px", height: "40px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />
                  {/* Bulle */}
                  <div style={{
                    position: "absolute",
                    top:  `calc(50% + ${Math.max(-80, Math.min(80, niveauBeta  * 2))}px)`,
                    left: `calc(50% + ${Math.max(-80, Math.min(80, niveauGamma * 2))}px)`,
                    transform: "translate(-50%,-50%)",
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: isLevel ? "#4CAF50" : PRIMARY,
                    boxShadow: `0 0 20px ${isLevel ? "#4CAF50" : PRIMARY}88`,
                    transition: "background 0.3s, box-shadow 0.3s",
                  }} />
                </div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: isLevel ? "#4CAF50" : PRIMARY, marginBottom: "8px" }}>
                  {isLevel ? "✓ À niveau !" : "↔ Ajustez"}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Inclinaison</div>
                    <div style={{ color: "white", fontSize: "20px", fontWeight: "800" }}>{niveauBeta}°</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Roulis</div>
                    <div style={{ color: "white", fontSize: "20px", fontWeight: "800" }}>{niveauGamma}°</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // ── Lampe torche ────────────────────────────────────────────
    if (tool === "lampe") return (
      <div style={{ textAlign: "center" }}>
        <div style={{ ...cardS, padding: "40px 20px" }}>
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>{lampeOn ? "🔦" : "🔦"}</div>
          <button onClick={toggleLampe} style={{
            width: "120px", height: "120px", borderRadius: "50%",
            background: lampeOn ? PRIMARY : "rgba(255,255,255,0.07)",
            border: `3px solid ${lampeOn ? PRIMARY : "rgba(255,255,255,0.15)"}`,
            color: "white", fontSize: "32px", cursor: "pointer",
            boxShadow: lampeOn ? `0 0 40px ${PRIMARY}88` : "none",
            transition: "all 0.3s",
          }}>{lampeOn ? "💡" : "💡"}</button>
          <div style={{ color: lampeOn ? PRIMARY : "#8899aa", fontWeight: "700", fontSize: "16px", marginTop: "18px" }}>
            {lampeOn ? "Lampe allumée — touchez pour éteindre" : "Touchez pour allumer"}
          </div>
          {lampeError && <div style={{ color: "#ff6b6b", fontSize: "12px", marginTop: "12px" }}>{lampeError}</div>}
          {lampeError && <div style={{ color: "#8899aa", fontSize: "11px", marginTop: "6px", fontStyle: "italic" }}>
            Note : La lampe torche nécessite Chrome sur Android. Sur iOS, utilisez l'application Lampe native.
          </div>}
        </div>
      </div>
    );

    // ── Loupe ───────────────────────────────────────────────────
    if (tool === "loupe") return (
      <div>
        <div style={cardS}>
          {!loupeStream ? (
            <button onClick={startLoupe} style={{ ...btn(), width: "100%", justifyContent: "center", padding: "16px" }}>
              🔍 Activer la caméra loupe
            </button>
          ) : (
            <>
              <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "14px", background: "#000" }}>
                <video ref={loupeVideoRef} autoPlay playsInline muted
                  style={{ width: "100%", display: "block", transform: `scale(${loupeZoom})`, transformOrigin: "center center" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#8899aa", fontSize: "12px", whiteSpace: "nowrap" }}>Zoom ×{loupeZoom}</span>
                <input type="range" min="1" max="5" step="0.5" value={loupeZoom}
                  onChange={e => setLoupeZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: PRIMARY }} />
                <button onClick={stopLoupe} style={{ ...btn("#ff6b6b", "rgba(255,80,80,0.12)", "rgba(255,80,80,0.3)"), padding: "8px 14px", fontSize: "12px" }}>
                  ✕ Fermer
                </button>
              </div>
            </>
          )}
          {loupeError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginTop: "10px" }}>{loupeError}</div>}
        </div>
      </div>
    );

    // ── Boussole ────────────────────────────────────────────────
    if (tool === "boussole") {
      const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
      const dirLabel = compassHeading != null ? dirs[Math.round(compassHeading / 45) % 8] : "—";
      return (
        <div style={{ textAlign: "center" }}>
          <div style={cardS}>
            {compassError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{compassError}</div>}
            {!compassPerm ? (
              <button onClick={startCompass} style={{ ...btn(), width: "100%", justifyContent: "center", padding: "16px" }}>
                🧭 Activer la boussole
              </button>
            ) : (
              <>
                <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto 20px" }}>
                  {/* Cadran */}
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                    {["N", "E", "S", "O"].map((d, i) => (
                      <div key={d} style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: `rotate(${i * 90}deg) translateY(-80px) translateX(-50%)`,
                        color: d === "N" ? "#ff6b6b" : "#8899aa", fontSize: "13px", fontWeight: "700",
                      }}>{d}</div>
                    ))}
                  </div>
                  {/* Aiguille */}
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: "4px", height: "80px",
                    transform: `translateX(-50%) translateY(-100%) rotate(${compassHeading ?? 0}deg)`,
                    transformOrigin: "bottom center",
                    background: "linear-gradient(to top, #ff6b6b, #ff2222)",
                    borderRadius: "2px 2px 0 0",
                    transition: "transform 0.2s ease",
                  }} />
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "10px", height: "10px", borderRadius: "50%", background: "white" }} />
                </div>
                <div style={{ fontSize: "32px", fontWeight: "900", color: PRIMARY }}>{compassHeading ?? "—"}°</div>
                <div style={{ color: "#8899aa", fontSize: "18px", fontWeight: "700" }}>{dirLabel}</div>
              </>
            )}
          </div>
          <div style={{ color: "#8899aa", fontSize: "11px", textAlign: "center", marginTop: "6px" }}>
            Note : La boussole est plus précise en s'éloignant des armatures métalliques et appareils électriques.
          </div>
        </div>
      );
    }

    // ── Décibelmètre ────────────────────────────────────────────
    if (tool === "decibel") {
      const dbColor = decibelDb < 40 ? "#4CAF50" : decibelDb < 65 ? "#ffb347" : decibelDb < 85 ? PRIMARY : "#ff6b6b";
      const dbLabel = decibelDb < 40 ? "Silence" : decibelDb < 65 ? "Normal" : decibelDb < 85 ? "Fort" : "Danger ⚠️";
      return (
        <div style={{ textAlign: "center" }}>
          <div style={cardS}>
            <div style={{ fontSize: "72px", fontWeight: "900", color: dbColor, transition: "color 0.2s", lineHeight: 1, marginBottom: "6px" }}>
              {decibelDb}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#8899aa", marginBottom: "16px" }}>dB · {dbLabel}</div>
            {/* Barre niveau */}
            <div style={{ height: "12px", background: "rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ height: "100%", width: `${Math.min(decibelDb, 120) / 120 * 100}%`, background: `linear-gradient(90deg, #4CAF50, ${PRIMARY}, #ff6b6b)`, transition: "width 0.1s", borderRadius: "6px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "20px", fontSize: "11px" }}>
              {[{ v: 0, l: "Silence 0-40" }, { v: 40, l: "Normal 40-65" }, { v: 65, l: "Fort 65-85" }, { v: 85, l: "Danger 85+" }].map(item => (
                <div key={item.v} style={{ color: "#8899aa", fontStyle: "italic" }}>{item.l}</div>
              ))}
            </div>
            {decibelError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{decibelError}</div>}
            <button onClick={decibelRunning ? stopDecibel : startDecibel} style={{
              ...btn(decibelRunning ? "#ff6b6b" : PRIMARY, decibelRunning ? "rgba(255,80,80,0.12)" : "rgba(255,140,0,0.12)", decibelRunning ? "rgba(255,80,80,0.4)" : "rgba(255,140,0,0.4)"),
              width: "100%", justifyContent: "center", padding: "14px",
            }}>
              {decibelRunning ? "⏹ Arrêter la mesure" : "🔊 Mesurer le bruit"}
            </button>
          </div>
        </div>
      );
    }

    // ── Galerie réalisations ────────────────────────────────────
    if (tool === "galerie") return (
      <div>
        {galerieLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#8899aa" }}>⏳ Chargement de la galerie…</div>
        ) : galeriePhotos.length === 0 ? (
          <div style={{ ...cardS, textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🖼️</div>
            <div style={{ color: "#8899aa" }}>Aucune photo de chantier trouvée.<br />Ajoutez des photos dans la section Chantiers.</div>
          </div>
        ) : (
          <>
            <div style={{ color: "#8899aa", fontSize: "12px", marginBottom: "14px" }}>{galeriePhotos.length} photo{galeriePhotos.length > 1 ? "s" : ""} de réalisations</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {galeriePhotos.map((p, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", cursor: "pointer" }}
                  onClick={() => window.open(p.url, "_blank")}>
                  <img src={p.url} alt={p.chantier} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "4px 6px" }}>
                    <div style={{ color: "white", fontSize: "9px", fontWeight: "600" }}>{p.categorie}</div>
                    <div style={{ color: "#ccc", fontSize: "9px" }}>{p.chantier}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );

    // ── Annotation photo ────────────────────────────────────────
    if (tool === "annotation") return (
      <div>
        {!annotFile ? (
          <div style={cardS}>
            <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 14px" }}>Importez ou photographiez une image pour la commenter : plans, photos de chantier, croquis…</p>
            <label style={{ display: "block", background: "rgba(76,175,80,0.12)", border: "1.5px solid rgba(76,175,80,0.4)", borderRadius: "12px", padding: "20px", cursor: "pointer", textAlign: "center", color: "#4CAF50", fontSize: "15px", fontWeight: "700" }}>
              ✏️ Choisir une image
              <input type="file" accept="image/*" capture="environment" hidden onChange={e => { if (e.target.files[0]) initAnnotCanvas(e.target.files[0]); e.target.value = ""; }} />
            </label>
          </div>
        ) : (
          <>
            {/* Barre d'outils */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center" }}>
              {[{ id: "pen", label: "✏️ Stylo" }, { id: "arrow", label: "→ Flèche" }].map(t => (
                <button key={t.id} onClick={() => setAnnotTool(t.id)} style={{
                  ...btn(annotTool === t.id ? "white" : "#8899aa", annotTool === t.id ? PRIMARY : "transparent", annotTool === t.id ? PRIMARY : "rgba(255,255,255,0.1)"),
                  padding: "7px 12px", fontSize: "12px",
                }}>{t.label}</button>
              ))}
              <input type="color" value={annotColor} onChange={e => setAnnotColor(e.target.value)}
                style={{ width: "36px", height: "36px", border: "none", background: "none", cursor: "pointer", borderRadius: "50%", overflow: "hidden" }} />
              <input type="range" min="1" max="12" value={annotSize} onChange={e => setAnnotSize(parseInt(e.target.value))}
                style={{ width: "80px", accentColor: PRIMARY }} title={`Épaisseur : ${annotSize}px`} />
              <button onClick={clearAnnotCanvas} style={{ ...btn("#ffb347", "rgba(255,179,71,0.1)", "rgba(255,179,71,0.3)"), padding: "7px 12px", fontSize: "12px" }}>↩ Effacer</button>
              <button onClick={downloadAnnotation} style={{ ...btn("#4CAF50", "rgba(76,175,80,0.12)", "rgba(76,175,80,0.3)"), padding: "7px 12px", fontSize: "12px" }}>💾 Télécharger</button>
              <button onClick={() => setAnnotFile(null)} style={{ ...btn("#ff6b6b", "transparent", "rgba(255,80,80,0.2)"), padding: "7px 12px", fontSize: "12px" }}>✕</button>
            </div>
            {/* Canvas */}
            <div style={{ borderRadius: "12px", overflow: "hidden", touchAction: "none", cursor: "crosshair" }}>
              <canvas ref={annotCanvasRef}
                style={{ width: "100%", display: "block", borderRadius: "12px" }}
                onMouseDown={drawAnnotStart} onMouseMove={drawAnnotMove} onMouseUp={drawAnnotEnd} onMouseLeave={drawAnnotEnd}
                onTouchStart={drawAnnotStart} onTouchMove={drawAnnotMove} onTouchEnd={drawAnnotEnd} />
            </div>
          </>
        )}
      </div>
    );

    // ── Comparateur avant/après ─────────────────────────────────
    if (tool === "comparateur") return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          {[
            { label: "📷 Avant", key: "avant", val: compAvant, set: setCompAvant },
            { label: "📷 Après", key: "apres",  val: compApres, set: setCompApres },
          ].map(({ label, key, val, set }) => (
            <div key={key}>
              <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
              <label style={{ display: "block", background: val ? "transparent" : "rgba(255,255,255,0.04)", border: `1px dashed ${val ? PRIMARY : "rgba(255,255,255,0.2)"}`, borderRadius: "12px", cursor: "pointer", overflow: "hidden", aspectRatio: "4/3" }}>
                {val ? (
                  <img src={val} alt={key} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#556", fontSize: "28px" }}>＋</div>
                )}
                <input type="file" accept="image/*" capture="environment" hidden
                  onChange={e => { if (e.target.files[0]) set(URL.createObjectURL(e.target.files[0])); e.target.value = ""; }} />
              </label>
            </div>
          ))}
        </div>
        {(compAvant || compApres) && (
          <button onClick={() => { setCompAvant(null); setCompApres(null); }}
            style={{ ...btn("#8899aa", "transparent", "rgba(255,255,255,0.1)"), fontSize: "12px", padding: "7px 14px" }}>
            🗑️ Effacer les deux photos
          </button>
        )}
      </div>
    );

    // ── Scanner documents ───────────────────────────────────────
    if (tool === "scanner") return (
      <div style={cardS}>
        <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 16px" }}>
          📄 Photographiez vos contrats, bons de commande, factures papier ou tout document important. L'image est sauvegardée en haute résolution.
        </p>
        <label style={{ display: "block", background: "rgba(100,149,237,0.12)", border: "1.5px solid rgba(100,149,237,0.4)", borderRadius: "12px", padding: "20px", cursor: "pointer", textAlign: "center", color: "#6495ED", fontSize: "15px", fontWeight: "700", marginBottom: "12px" }}>
          📷 Scanner un document
          <input type="file" accept="image/*" capture="environment" hidden
            onChange={e => {
              if (!e.target.files[0]) return;
              const url = URL.createObjectURL(e.target.files[0]);
              const a = document.createElement("a");
              a.href = url;
              a.download = `scan-${Date.now()}.jpg`;
              a.click();
              e.target.value = "";
            }} />
        </label>
        <label style={{ display: "block", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px", cursor: "pointer", textAlign: "center", color: "#8899aa", fontSize: "13px" }}>
          📁 Importer depuis la galerie
          <input type="file" accept="image/*" hidden
            onChange={e => {
              if (!e.target.files[0]) return;
              const url = URL.createObjectURL(e.target.files[0]);
              const a = document.createElement("a");
              a.href = url;
              a.download = `scan-${Date.now()}.jpg`;
              a.click();
              e.target.value = "";
            }} />
        </label>
      </div>
    );

    // ── QR Scanner ──────────────────────────────────────────────
    if (tool === "qr-scanner") return (
      <div style={{ textAlign: "center" }}>
        <div style={cardS}>
          {qrResult ? (
            <div>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
              <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>QR Code détecté !</div>
              <div style={{ background: DARK, borderRadius: "8px", padding: "12px", wordBreak: "break-all", color: "white", fontSize: "14px", marginBottom: "14px" }}>{qrResult}</div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                {qrResult.startsWith("http") && (
                  <a href={qrResult} target="_blank" rel="noreferrer" style={{ ...btn("#6495ED", "rgba(100,149,237,0.12)", "rgba(100,149,237,0.3)"), textDecoration: "none" }}>🔗 Ouvrir</a>
                )}
                <button onClick={() => { navigator.clipboard.writeText(qrResult).catch(() => {}); }} style={{ ...btn() }}>📋 Copier</button>
                <button onClick={() => { setQrResult(""); }} style={{ ...btn("#8899aa", "transparent", "rgba(255,255,255,0.1)") }}>🔄 Rescanner</button>
              </div>
            </div>
          ) : (
            <>
              {qrScanning ? (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", marginBottom: "14px" }}>
                  <video ref={qrVideoRef} autoPlay playsInline muted style={{ width: "100%", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, border: "3px solid rgba(255,140,0,0.6)", borderRadius: "12px", pointerEvents: "none" }} />
                </div>
              ) : null}
              {qrError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{qrError}</div>}
              {!qrScanning && (
                <button onClick={startQrScan} style={{ ...btn(), width: "100%", justifyContent: "center", padding: "16px", marginBottom: "12px" }}>
                  📱 Scanner un QR Code
                </button>
              )}
              {qrScanning && (
                <button onClick={stopQrScan} style={{ ...btn("#ff6b6b", "rgba(255,80,80,0.12)", "rgba(255,80,80,0.3)"), width: "100%", justifyContent: "center" }}>
                  ✕ Arrêter
                </button>
              )}
              <div style={{ color: "#8899aa", fontSize: "11px", marginTop: "10px" }}>
                Nécessite Chrome sur Android. Pointez la caméra vers un QR code.
              </div>
            </>
          )}
        </div>
      </div>
    );

    // ── Checklist chantier ──────────────────────────────────────
    if (tool === "checklist") {
      const cl = checklists.find(c => c.id === checklistActif);
      if (cl) return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <button onClick={() => setChecklistActif(null)} style={{ ...btn("#8899aa", "transparent", "rgba(255,255,255,0.1)"), padding: "7px 12px", fontSize: "12px" }}>← Listes</button>
            <h3 style={{ color: "white", margin: 0, flex: 1, fontSize: "16px" }}>{cl.nom}</h3>
            <span style={{ color: "#8899aa", fontSize: "12px" }}>{cl.items.filter(i => i.fait).length}/{cl.items.length}</span>
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <input value={checklistNvItem} onChange={e => setChecklistNvItem(e.target.value)} onKeyDown={e => e.key === "Enter" && ajouterItem()}
              placeholder="Nouvelle tâche…" style={{ ...inp, flex: 1 }} />
            <button onClick={ajouterItem} style={{ ...btn(), padding: "10px 16px" }}>+</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cl.items.length === 0 && <div style={{ color: "#556", textAlign: "center", padding: "20px", fontStyle: "italic" }}>Aucune tâche — ajoutez-en une ci-dessus</div>}
            {cl.items.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: item.fait ? "rgba(76,175,80,0.06)" : CARD, borderRadius: "10px", padding: "12px 14px", border: `1px solid ${item.fait ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                <button onClick={() => toggleItem(cl.id, item.id)} style={{ width: "24px", height: "24px", borderRadius: "50%", background: item.fait ? "#4CAF50" : "transparent", border: `2px solid ${item.fait ? "#4CAF50" : "rgba(255,255,255,0.3)"}`, cursor: "pointer", color: "white", fontSize: "13px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.fait ? "✓" : ""}
                </button>
                <span style={{ flex: 1, color: item.fait ? "#8899aa" : "white", textDecoration: item.fait ? "line-through" : "none", fontSize: "14px" }}>{item.texte}</span>
                <button onClick={() => supprimerItem(cl.id, item.id)} style={{ background: "transparent", border: "none", color: "#556", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}>✕</button>
              </div>
            ))}
          </div>
          {cl.items.length > 0 && (
            <button onClick={() => {
              const reset = checklists.map(c => c.id === cl.id ? { ...c, items: c.items.map(i => ({ ...i, fait: false })) } : c);
              saveChecklists(reset);
            }} style={{ ...btn("#8899aa", "transparent", "rgba(255,255,255,0.08)"), fontSize: "12px", marginTop: "14px", padding: "8px 14px" }}>
              ↩ Tout décocher
            </button>
          )}
        </div>
      );
      return (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input value={checklistNvNom} onChange={e => setChecklistNvNom(e.target.value)} onKeyDown={e => e.key === "Enter" && creerChecklist()}
              placeholder="Nom de la checklist…" style={{ ...inp, flex: 1 }} />
            <button onClick={creerChecklist} style={{ ...btn(), padding: "10px 16px" }}>＋</button>
          </div>
          {checklists.length === 0 && <div style={{ ...cardS, textAlign: "center", padding: "32px", color: "#8899aa" }}>Aucune checklist. Créez-en une ci-dessus.</div>}
          {checklists.map(c => {
            const done = c.items.filter(i => i.fait).length;
            return (
              <div key={c.id} style={{ ...cardS, cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                onClick={() => setChecklistActif(c.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>{c.nom}</div>
                  <div style={{ color: "#8899aa", fontSize: "12px" }}>{done}/{c.items.length} tâche{c.items.length !== 1 ? "s" : ""}</div>
                  {c.items.length > 0 && (
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", marginTop: "8px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(done / c.items.length) * 100}%`, background: PRIMARY, borderRadius: "2px" }} />
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ color: "#8899aa", fontSize: "18px" }}>›</span>
                  <button onClick={e => { e.stopPropagation(); supprimerChecklist(c.id); }} style={{ background: "transparent", border: "none", color: "#556", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ── ID matériaux ────────────────────────────────────────────
    if (tool === "materiau") return (
      <div>
        <div style={cardS}>
          <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 14px" }}>
            📸 Photographiez un matériau de construction inconnu. L'IA l'identifie et fournit toutes les informations utiles : type, prix, conseils de pose.
          </p>
          <label style={{ display: "block", background: matAnalyzing ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.12)", border: "1.5px solid rgba(168,85,247,0.4)", borderRadius: "12px", padding: "20px", cursor: matAnalyzing ? "wait" : "pointer", textAlign: "center", color: "#a855f7", fontSize: "15px", fontWeight: "700" }}>
            {matAnalyzing ? "⏳ Identification en cours…" : "🧱 Photographier le matériau"}
            <input type="file" accept="image/*" capture="environment" hidden disabled={matAnalyzing}
              onChange={e => { if (e.target.files[0]) { setMatFile(e.target.files[0]); analyserMateriau(e.target.files[0]); } e.target.value = ""; }} />
          </label>
          {matError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginTop: "10px" }}>{matError}</div>}
        </div>
        {matResult && matResult.materiaux?.map((m, i) => (
          <div key={i} style={cardS}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ color: "white", fontWeight: "800", fontSize: "18px" }}>{m.nom}</div>
                <div style={{ color: "#8899aa", fontSize: "13px" }}>{m.type} · {m.sous_type}</div>
              </div>
              <span style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", padding: "4px 10px", color: "#a855f7", fontSize: "11px", fontWeight: "700" }}>
                {matResult.confiance === "élevée" ? "✓ Sûr" : matResult.confiance === "moyenne" ? "~ Probable" : "? Incertain"}
              </span>
            </div>
            {m.prix_moyen && <div style={{ color: PRIMARY, fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>💰 Prix moyen : {m.prix_moyen}</div>}
            {m.usage_courant && <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "8px" }}>🔧 Usage : {m.usage_courant}</div>}
            {m.caracteristiques?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                {m.caracteristiques.map((c, j) => (
                  <span key={j} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "3px 8px", color: "#ccc", fontSize: "11px" }}>{c}</span>
                ))}
              </div>
            )}
            {m.conseils_pose && <div style={{ color: "#ffb347", fontSize: "12px", marginTop: "8px" }}>📌 {m.conseils_pose}</div>}
            {matResult.recommandations && <div style={{ color: "#4CAF50", fontSize: "12px", marginTop: "8px" }}>✅ {matResult.recommandations}</div>}
          </div>
        ))}
      </div>
    );

    // ── UV · Air · Soleil ───────────────────────────────────────
    if (tool === "meteo-pro") {
      const uvInfo = uvLabel(meteoProData?.uv);
      const aqInfo = aqiLabel(meteoProData?.aqi);
      return (
        <div>
          <div style={cardS}>
            <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 14px" }}>
              Conditions de travail en extérieur : indice UV, qualité de l'air et horaires du soleil basés sur votre localisation.
            </p>
            {meteoProError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{meteoProError}</div>}
            <button onClick={loadMeteoPro} disabled={meteoProLoading} style={{ ...btn(), width: "100%", justifyContent: "center", padding: "14px" }}>
              {meteoProLoading ? "⏳ Localisation en cours…" : "📍 Obtenir les données de ma position"}
            </button>
          </div>
          {meteoProData && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {/* UV */}
                <div style={{ ...cardS, textAlign: "center" }}>
                  <div style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>☀️ Indice UV</div>
                  <div style={{ fontSize: "42px", fontWeight: "900", color: uvInfo.color, lineHeight: 1 }}>{meteoProData.uv ?? "—"}</div>
                  <div style={{ color: uvInfo.color, fontWeight: "700", marginTop: "6px" }}>{uvInfo.label}</div>
                  <div style={{ color: "#8899aa", fontSize: "11px", marginTop: "4px" }}>{uvInfo.conseil}</div>
                </div>
                {/* AQI */}
                <div style={{ ...cardS, textAlign: "center" }}>
                  <div style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>💨 Qualité air</div>
                  <div style={{ fontSize: "42px", fontWeight: "900", color: aqInfo.color, lineHeight: 1 }}>{meteoProData.aqi ?? "—"}</div>
                  <div style={{ color: aqInfo.color, fontWeight: "700", marginTop: "6px" }}>{aqInfo.label}</div>
                  {meteoProData.pm25 != null && <div style={{ color: "#8899aa", fontSize: "11px", marginTop: "4px" }}>PM2.5: {meteoProData.pm25} · PM10: {meteoProData.pm10}</div>}
                </div>
              </div>
              {/* Lever/Coucher */}
              <div style={{ ...cardS, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "28px" }}>🌅</div>
                  <div style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Lever</div>
                  <div style={{ color: "white", fontWeight: "800", fontSize: "20px" }}>{meteoProData.sunrise}</div>
                </div>
                <div style={{ width: "1px", background: "rgba(255,255,255,0.06)" }} />
                <div>
                  <div style={{ fontSize: "28px" }}>🌇</div>
                  <div style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Coucher</div>
                  <div style={{ color: "white", fontWeight: "800", fontSize: "20px" }}>{meteoProData.sunset}</div>
                </div>
                <div style={{ width: "1px", background: "rgba(255,255,255,0.06)" }} />
                <div>
                  <div style={{ fontSize: "28px" }}>⏱️</div>
                  <div style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Durée</div>
                  <div style={{ color: PRIMARY, fontWeight: "800", fontSize: "16px" }}>
                    {meteoProData.sunrise && meteoProData.sunset ? (() => {
                      const [rH, rM] = meteoProData.sunrise.split(":").map(Number);
                      const [sH, sM] = meteoProData.sunset.split(":").map(Number);
                      const mins = (sH * 60 + sM) - (rH * 60 + rM);
                      return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
                    })() : "—"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // ── SMS rapides ─────────────────────────────────────────────
    if (tool === "sms") {
      const templates = [
        { id: "retard",   emoji: "⏰", titre: "Je serai en retard",    msg: "Bonjour, je serai en retard sur le chantier d'environ 30 minutes. Toutes mes excuses." },
        { id: "termine",  emoji: "✅", titre: "Travaux terminés",      msg: "Bonjour, les travaux sont terminés. N'hésitez pas à me contacter si vous avez des questions. Cordialement." },
        { id: "facture",  emoji: "🧾", titre: "Voici votre facture",   msg: "Bonjour, je vous envoie votre facture par email. N'hésitez pas à me contacter pour tout renseignement." },
        { id: "rdv",      emoji: "📅", titre: "Rappel rendez-vous",    msg: "Bonjour, je vous rappelle notre rendez-vous demain pour les travaux. À demain !" },
        { id: "annul",    emoji: "❌", titre: "Annulation chantier",   msg: "Bonjour, je suis dans l'obligation d'annuler notre rendez-vous de demain. Je vous recontacte rapidement pour reprogrammer. Désolé pour la gêne." },
        { id: "devis",    emoji: "📝", titre: "Devis disponible",      msg: "Bonjour, votre devis est disponible. Je vous l'ai envoyé par email. N'hésitez pas à me contacter." },
        { id: "garantie", emoji: "🛡️", titre: "Garantie décennale",    msg: "Bonjour, je vous rappelle que les travaux effectués bénéficient de notre garantie décennale. Conservez votre facture précieusement." },
        { id: "meteo",    emoji: "🌧️", titre: "Intempéries",           msg: "Bonjour, en raison des conditions météo défavorables, les travaux extérieurs sont reportés. Je vous recontacte dès que possible." },
      ];
      return (
        <div>
          <div style={cardS}>
            <label style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>Numéro destinataire</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input value={smsTel} onChange={e => setSmsTel(e.target.value)} placeholder="06 00 00 00 00" type="tel" style={{ ...inp, flex: 1 }} />
            </div>
            {smsClients.length > 0 && (
              <select value={smsTel} onChange={e => setSmsTel(e.target.value)}
                style={{ ...inp, cursor: "pointer", marginBottom: "0", color: smsTel ? "white" : "#8899aa" }}>
                <option value="">— Choisir un client —</option>
                {smsClients.map(c => <option key={c.id} value={c.telephone}>{c.nom} · {c.telephone}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {templates.map(t => (
              <div key={t.id} style={{ ...cardS, padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{t.emoji} {t.titre}</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", lineHeight: "1.4" }}>{t.msg}</div>
                  </div>
                  <a href={`sms:${smsTel.replace(/\s/g, "")}?body=${encodeURIComponent(t.msg)}`}
                    style={{ ...btn(), textDecoration: "none", padding: "8px 14px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}>
                    💬 Envoyer
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── Carte de visite QR ──────────────────────────────────────
    if (tool === "carte") {
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${profil?.nom || user.email}\nORG:Artisan+\nTEL:${profil?.telephone || ""}\nADR:;;${profil?.adresse || ""};;;;\nEMAIL:${user.email}\nNOTE:SIRET: ${profil?.siret || "—"}\nEND:VCARD`;
      return (
        <div style={{ textAlign: "center" }}>
          <div style={cardS}>
            <div style={{ display: "inline-block", background: "white", padding: "16px", borderRadius: "14px", marginBottom: "16px" }}>
              <QRCodeCanvas value={vcard} size={200} bgColor="#ffffff" fgColor="#0a1628" level="M" />
            </div>
            <div style={{ color: "white", fontWeight: "800", fontSize: "18px", marginBottom: "4px" }}>{profil?.nom || user.email}</div>
            {profil?.telephone && <div style={{ color: "#8899aa", fontSize: "14px", marginBottom: "2px" }}>📞 {profil.telephone}</div>}
            {profil?.adresse && <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "2px" }}>📍 {profil.adresse}</div>}
            {profil?.siret && <div style={{ color: "#8899aa", fontSize: "12px", marginBottom: "14px" }}>SIRET: {profil.siret}</div>}
            <button onClick={() => {
              const canvas = document.querySelector("canvas");
              if (!canvas) return;
              const a = document.createElement("a");
              a.download = "carte-visite-qr.png";
              a.href = canvas.toDataURL("image/png");
              a.click();
            }} style={{ ...btn(), justifyContent: "center", width: "100%" }}>
              💾 Télécharger le QR code
            </button>
            <div style={{ color: "#556", fontSize: "11px", marginTop: "10px" }}>
              Vos clients scannent ce code et ajoutent automatiquement vos coordonnées à leurs contacts.
            </div>
          </div>
          {(!profil?.nom || !profil?.telephone) && (
            <div style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "10px", padding: "12px", color: "#ffb347", fontSize: "12px" }}>
              ⚠️ Complétez votre profil dans Paramètres pour que la carte soit complète.
            </div>
          )}
        </div>
      );
    }

    // ── Notes vocales ───────────────────────────────────────────
    if (tool === "notes-vocal") return (
      <div>
        <div style={cardS}>
          <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 16px" }}>
            Enregistrez des notes vocales directement sur le chantier. Les enregistrements sont stockés localement pour cette session.
          </p>
          {notesError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{notesError}</div>}
          <button onClick={notesRec ? stopNotesRec : startNotesRec} style={{
            ...btn(notesRec ? "#ff6b6b" : PRIMARY, notesRec ? "rgba(255,80,80,0.12)" : "rgba(255,140,0,0.12)", notesRec ? "rgba(255,80,80,0.4)" : "rgba(255,140,0,0.4)"),
            width: "100%", justifyContent: "center", padding: "18px", fontSize: "16px",
            animation: notesRec ? "pulse 1.2s ease-in-out infinite" : "none",
          }}>
            {notesRec ? "⏹ Arrêter l'enregistrement" : "🎤 Commencer l'enregistrement"}
          </button>
        </div>
        {notesRecordings.length > 0 && (
          <div style={cardS}>
            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "12px" }}>
              Enregistrements ({notesRecordings.length})
            </div>
            {notesRecordings.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#8899aa", fontSize: "12px", whiteSpace: "nowrap" }}>🎤 {r.name}</span>
                <audio src={r.url} controls style={{ flex: 1, height: "32px" }} />
                <a href={r.url} download={`note-${r.name}.webm`} style={{ ...btn("#4CAF50", "rgba(76,175,80,0.1)", "rgba(76,175,80,0.3)"), padding: "6px 10px", fontSize: "12px", textDecoration: "none" }}>💾</a>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    // ── Traduction ──────────────────────────────────────────────
    if (tool === "traduction") return (
      <div>
        <div style={cardS}>
          <label style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Langue cible</label>
          <select value={tradLangue} onChange={e => setTradLangue(e.target.value)} style={{ ...inp, cursor: "pointer", marginBottom: "14px" }}>
            {["Anglais", "Espagnol", "Portugais", "Arabe", "Roumain", "Polonais", "Turc", "Allemand", "Italien", "Néerlandais", "Français"].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <label style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Texte à traduire</label>
          <textarea value={tradTexte} onChange={e => setTradTexte(e.target.value)}
            placeholder="Entrez votre texte ici…&#10;Ex : Vérifier l'étanchéité de la toiture&#10;    Nettoyer les joints de dilatation"
            rows={4} style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: "1.5", marginBottom: "14px" }} />
          {tradError && <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{tradError}</div>}
          <button onClick={traduit} disabled={tradProcessing || !tradTexte.trim()} style={{
            ...btn(), width: "100%", justifyContent: "center", padding: "14px",
            opacity: !tradTexte.trim() ? 0.5 : 1,
          }}>
            {tradProcessing ? "⏳ Traduction en cours…" : `🌍 Traduire en ${tradLangue}`}
          </button>
        </div>
        {tradResult && (
          <div style={cardS}>
            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
              Traduction ({tradResult.langue_detectee} → {tradLangue})
            </div>
            <div style={{ background: DARK, borderRadius: "10px", padding: "14px", color: "white", fontSize: "15px", lineHeight: "1.6", marginBottom: "10px" }}>
              {tradResult.traduction}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(tradResult.traduction).catch(() => {}); }}
              style={{ ...btn(), padding: "8px 16px", fontSize: "12px" }}>
              📋 Copier
            </button>
            {tradResult.termes_techniques?.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>Termes techniques</div>
                {tradResult.termes_techniques.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "12px" }}>
                    <span style={{ color: "#8899aa", flex: 1 }}>{t.original}</span>
                    <span style={{ color: PRIMARY, fontWeight: "600", flex: 1 }}>→ {t.traduit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );

    return null;
  };

  // ═══════════════════════════════════════════════════════════════
  // GRID VIEW
  // ═══════════════════════════════════════════════════════════════

  if (!tool) {
    const categories = [
      { id: "ia",     label: "🤖 Intelligence artificielle" },
      { id: "phone",  label: "📱 Capteurs téléphone" },
      { id: "calcul", label: "🧮 Calcul" },
      { id: "photos", label: "📸 Photos & Documents" },
      { id: "outils", label: "🔧 Outils chantier" },
      { id: "env",    label: "🌍 Environnement" },
      { id: "comm",   label: "💬 Communication" },
    ];
    return (
      <div style={{ paddingBottom: "24px" }}>
        <h2 style={{ color: "white", fontSize: "22px", margin: "0 0 4px" }}>🔧 Boîte à outils</h2>
        <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "24px" }}>20 outils pour l'artisan du bâtiment</div>
        {categories.map(cat => {
          const ocat = OUTILS.filter(o => o.cat === cat.id);
          const c = CAT_COLORS[cat.id];
          return (
            <div key={cat.id} style={{ marginBottom: "24px" }}>
              <div style={{ color: c.color, fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
                {cat.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
                {ocat.map(o => (
                  <button key={o.id} onClick={() => {
                    setTool(o.id);
                    if (o.id === "loupe") setTimeout(startLoupe, 100);
                    if (o.id === "decibel") setTimeout(startDecibel, 100);
                  }} style={{
                    background: CARD, border: `1px solid ${c.border}`,
                    borderRadius: "14px", padding: "16px 14px",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = c.bg; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = CARD; e.currentTarget.style.transform = "none"; }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "6px" }}>{o.emoji}</div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "13px", marginBottom: "3px", lineHeight: "1.3" }}>{o.titre}</div>
                    <div style={{ color: "#8899aa", fontSize: "11px", lineHeight: "1.3" }}>{o.desc}</div>
                    <span style={{ display: "inline-block", marginTop: "8px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: "4px", padding: "2px 7px", color: c.color, fontSize: "10px", fontWeight: "700" }}>
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Vue outil actif ────────────────────────────────────────────
  const outil = OUTILS.find(o => o.id === tool);
  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <button onClick={() => {
          stopLampe(); stopLoupe(); stopDecibel(); stopQrScan();
          setTool(null);
        }} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "white", borderRadius: "8px", padding: "8px 16px",
          cursor: "pointer", fontSize: "14px", fontWeight: "600",
        }}>← Retour</button>
        <h2 style={{ color: "white", margin: 0, fontSize: "20px" }}>{outil?.emoji} {outil?.titre}</h2>
      </div>
      {renderToolContent()}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
