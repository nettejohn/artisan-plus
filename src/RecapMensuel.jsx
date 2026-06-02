import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import jsPDF from "jspdf";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";
const API_URL = import.meta.env.VITE_API_URL || "https://artisan-plus.vercel.app";

const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin",
                 "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const euros = v => (parseFloat(v)||0).toLocaleString("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}) + " €";

function joursMois(annee, mois) {
  const debut = `${annee}-${String(mois+1).padStart(2,"0")}-01`;
  const fin   = `${annee}-${String(mois+1).padStart(2,"0")}-${new Date(annee,mois+1,0).getDate()}`;
  return { debut, fin };
}

async function fetchStats(userId, annee, mois) {
  const { debut, fin } = joursMois(annee, mois);
  const [
    { data: factures },
    { data: devis },
    { data: clients },
    { data: chantiers },
  ] = await Promise.all([
    supabase.from("factures").select("id,total_ttc,statut").eq("user_id",userId).gte("date_emission",debut).lte("date_emission",fin),
    supabase.from("devis").select("id,total_ttc,statut").eq("user_id",userId).gte("date_emission",debut).lte("date_emission",fin),
    supabase.from("clients").select("id").eq("user_id",userId).gte("created_at",debut+"T00:00:00").lte("created_at",fin+"T23:59:59"),
    supabase.from("chantiers").select("id,nom,prix_chantier,statut").eq("user_id",userId).gte("date_debut",debut).lte("date_debut",fin),
  ]);

  const F = factures||[], D = devis||[], C = clients||[], CH = chantiers||[];
  const caPaye       = F.filter(f=>f.statut==="payee").reduce((s,f)=>s+(f.total_ttc||0),0);
  const caTotal      = F.reduce((s,f)=>s+(f.total_ttc||0),0);
  const facPayees    = F.filter(f=>f.statut==="payee").length;
  const facEnvoyees  = F.length;
  const devisCreés   = D.length;
  const devisSign    = D.filter(d=>d.statut==="accepte").length;
  const taux         = devisCreés > 0 ? Math.round((devisSign/devisCreés)*100) : 0;
  const nouveauxCli  = C.length;
  const bestCh       = CH.sort((a,b)=>(b.prix_chantier||0)-(a.prix_chantier||0))[0]||null;
  return { caPaye, caTotal, facPayees, facEnvoyees, devisCreés, devisSign, taux, nouveauxCli, bestCh, nbCh: CH.length };
}

function Delta({ val, prev, suffix="" }) {
  if (prev == null || prev === undefined) return null;
  const diff = val - prev;
  if (diff === 0) return <span style={{color:"#8899aa",fontSize:"12px"}}>→ stable</span>;
  const up = diff > 0;
  const pct = prev > 0 ? Math.abs(Math.round((diff/prev)*100)) : null;
  return (
    <span style={{color: up?"#4CAF50":"#ff6b6b", fontSize:"12px", fontWeight:"700"}}>
      {up?"▲":"▼"} {pct != null ? `${pct}%` : Math.abs(diff)+suffix}
    </span>
  );
}

function StatCard({ emoji, label, val, prev, suffix="", color }) {
  return (
    <div style={{background:DARK, borderRadius:"12px", padding:"16px", display:"flex", flexDirection:"column", gap:"6px"}}>
      <div style={{color:"#8899aa", fontSize:"11px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px"}}>{emoji} {label}</div>
      <div style={{color: color||"white", fontSize:"22px", fontWeight:"800"}}>{val}</div>
      <Delta val={typeof val==="string"?parseFloat(val.replace(/[^\d.-]/g,""))||0:val} prev={prev} suffix={suffix} />
    </div>
  );
}

export default function RecapMensuel({ user, profil, onClose }) {
  const now     = new Date();
  // Récap du mois précédent
  const moisRecap  = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const moisLabel  = MOIS_FR[moisRecap.getMonth()] + " " + moisRecap.getFullYear();
  const prevMois   = new Date(moisRecap.getFullYear(), moisRecap.getMonth()-1, 1);

  const [stats,      setStats]      = useState(null);
  const [prev,       setPrev]       = useState(null);
  const [texteIA,    setTexteIA]    = useState("");
  const [loading,    setLoading]    = useState(true);
  const [loadingIA,  setLoadingIA]  = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      fetchStats(user.id, moisRecap.getFullYear(), moisRecap.getMonth()),
      fetchStats(user.id, prevMois.getFullYear(),  prevMois.getMonth()),
    ]);
    setStats(s); setPrev(p);
    setLoading(false);
    genererIA(s);
  };

  const genererIA = async (s) => {
    setLoadingIA(true);
    try {
      const r = await fetch(`${API_URL}/api/generate-recap`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          mois: MOIS_FR[moisRecap.getMonth()],
          annee: moisRecap.getFullYear(),
          prenom: profil?.nom?.split(" ")[0] || "Artisan",
          caPaye:    s.caPaye,    caTotal:   s.caTotal,
          facturesPayees: s.facPayees, facturesEnvoyees: s.facEnvoyees,
          devisCreés: s.devisCreés, devisAcceptes: s.devisSign,
          tauxAcceptation: s.taux, nouveauxClients: s.nouveauxCli, nbChantiers: s.nbCh,
        }),
      });
      const j = await r.json();
      if (j.ok) setTexteIA(j.message);
      else setTexteIA("Excellent travail ce mois-ci ! Continuez sur cette lancée pour le mois prochain. 🚀");
    } catch { setTexteIA("Excellent travail ce mois-ci ! Continuez sur cette lancée pour le mois prochain. 🚀"); }
    setLoadingIA(false);
  };

  const telechargerPDF = async () => {
    if (!stats) return;
    setPdfLoading(true);
    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const W = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(255,140,0);
    doc.rect(0,0,W,38,"F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(22); doc.setFont("helvetica","bold");
    doc.text("Artisan+", 14, 16);
    doc.setFontSize(12); doc.setFont("helvetica","normal");
    doc.text(`Récap mensuel — ${moisLabel}`, 14, 26);
    if (profil?.nom) { doc.setFontSize(10); doc.text(profil.nom, 14, 33); }

    // IA text
    doc.setTextColor(10,22,40);
    doc.setFillColor(255,245,220);
    doc.roundedRect(10, 44, W-20, 28, 3, 3, "F");
    doc.setFontSize(10); doc.setFont("helvetica","italic");
    if (texteIA) {
      const lines = doc.splitTextToSize(texteIA, W-28);
      doc.text(lines, 14, 52);
    }

    let y = 80;

    // Stats grid
    const drawStat = (label, val, x, yy, w=88) => {
      doc.setFillColor(17,30,53);
      doc.roundedRect(x, yy, w, 22, 2, 2, "F");
      doc.setTextColor(136,153,170); doc.setFontSize(8); doc.setFont("helvetica","normal");
      doc.text(label, x+4, yy+8);
      doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont("helvetica","bold");
      doc.text(String(val), x+4, yy+18);
    };
    const drawStatDelta = (label, val, prevVal, x, yy, w=88) => {
      drawStat(label, val, x, yy, w);
      if (prevVal != null) {
        const numVal = parseFloat(String(val).replace(/[^\d.-]/g,""))||0;
        const numPrev = parseFloat(String(prevVal).replace(/[^\d.-]/g,""))||0;
        const up = numVal >= numPrev;
        doc.setTextColor(up?76:255, up?175:107, up?80:107);
        doc.setFontSize(8); doc.setFont("helvetica","bold");
        const diff = numVal - numPrev;
        const pct = numPrev > 0 ? Math.abs(Math.round((diff/numPrev)*100))+"%" : "";
        doc.text((up?"▲ ":"▼ ") + pct, x+w-20, yy+18);
      }
    };

    drawStatDelta("💰 CA encaissé", euros(stats.caPaye),  prev?.caPaye,        10, y);
    drawStatDelta("📊 CA généré",   euros(stats.caTotal), prev?.caTotal,       108, y);
    y += 28;
    drawStatDelta("📝 Devis créés",  stats.devisCreés,     prev?.devisCreés,    10, y);
    drawStatDelta("✅ Devis signés", stats.devisSign,      prev?.devisSign,    108, y);
    y += 28;
    drawStatDelta("📄 Factures",     stats.facEnvoyees,    prev?.facEnvoyees,   10, y);
    drawStatDelta("💚 Payées",       stats.facPayees,      prev?.facPayees,    108, y);
    y += 28;
    drawStatDelta("👥 Nvx clients",  stats.nouveauxCli,    prev?.nouveauxCli,   10, y);
    drawStatDelta("🎯 Taux accept.", stats.taux+"%",       null,              108, y);
    y += 32;

    // Best chantier
    if (stats.bestCh) {
      doc.setFillColor(255,140,0);
      doc.roundedRect(10, y, W-20, 18, 2, 2, "F");
      doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(`🏆 Chantier le plus rentable : ${stats.bestCh.nom} — ${euros(stats.bestCh.prix_chantier)}`, 14, y+11);
      y += 24;
    }

    // Footer
    doc.setDrawColor(255,140,0); doc.setLineWidth(0.5);
    doc.line(10, 280, W-10, 280);
    doc.setTextColor(136,153,170); doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text(`Généré par Artisan+ — ${new Date().toLocaleDateString("fr-FR")}`, 14, 286);

    doc.save(`recap-${moisLabel.toLowerCase().replace(" ","-")}.pdf`);
    setPdfLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:DARK, color:"white", fontFamily:"system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background:CARD, borderBottom:"1px solid rgba(255,140,0,0.2)", padding:"16px 20px",
        display:"flex", alignItems:"center", gap:"12px", position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose}
          style={{ background:"transparent", border:"none", color:"white", fontSize:"22px", cursor:"pointer", padding:"0 4px" }}>
          ←
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:"800", fontSize:"18px" }}>📊 Récap {moisLabel}</div>
          <div style={{ color:"#8899aa", fontSize:"12px" }}>Bilan mensuel de votre activité</div>
        </div>
        <button onClick={telechargerPDF} disabled={pdfLoading||loading||!stats}
          style={{ background:PRIMARY, border:"none", color:"white", borderRadius:"9px",
            padding:"9px 16px", fontSize:"13px", fontWeight:"700", cursor:loading?"default":"pointer",
            opacity: loading ? 0.5 : 1, display:"flex", alignItems:"center", gap:"6px" }}>
          {pdfLoading ? "⏳" : "📥"} PDF
        </button>
      </div>

      <div style={{ padding:"20px", maxWidth:"700px", margin:"0 auto" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#8899aa" }}>
            <div style={{ fontSize:"32px", marginBottom:"12px" }}>⏳</div>
            <div>Chargement de votre récap…</div>
          </div>
        ) : stats && (
          <>
            {/* Message IA */}
            <div style={{ background:"rgba(255,140,0,0.1)", border:"1.5px solid rgba(255,140,0,0.3)",
              borderRadius:"14px", padding:"20px", marginBottom:"24px" }}>
              <div style={{ fontSize:"11px", color:PRIMARY, fontWeight:"700", textTransform:"uppercase",
                letterSpacing:"0.5px", marginBottom:"10px" }}>🤖 Message personnalisé</div>
              {loadingIA ? (
                <div style={{ color:"#8899aa", fontSize:"14px", fontStyle:"italic" }}>
                  L'IA rédige vos encouragements…
                </div>
              ) : (
                <div style={{ fontSize:"15px", lineHeight:"1.7", color:"#e8e8e8" }}>{texteIA || "Bon travail ce mois-ci !"}</div>
              )}
            </div>

            {/* Titre comparaison */}
            <div style={{ color:"#8899aa", fontSize:"11px", fontWeight:"700", textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:"12px" }}>
              📈 Comparaison vs {MOIS_FR[prevMois.getMonth()]}
            </div>

            {/* Grid stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px", marginBottom:"24px" }}>
              <StatCard emoji="💰" label="CA encaissé"   val={euros(stats.caPaye)}     prev={prev?.caPaye}     color={PRIMARY} />
              <StatCard emoji="📊" label="CA généré"     val={euros(stats.caTotal)}    prev={prev?.caTotal} />
              <StatCard emoji="📝" label="Devis créés"   val={stats.devisCreés}        prev={prev?.devisCreés} />
              <StatCard emoji="✅" label="Devis signés"  val={stats.devisSign}         prev={prev?.devisSign} />
              <StatCard emoji="📄" label="Factures"      val={stats.facEnvoyees}       prev={prev?.facEnvoyees} />
              <StatCard emoji="💚" label="Payées"        val={stats.facPayees}         prev={prev?.facPayees} />
              <StatCard emoji="👥" label="Nvx clients"   val={stats.nouveauxCli}       prev={prev?.nouveauxCli} />
              <div style={{ background:DARK, borderRadius:"12px", padding:"16px", display:"flex", flexDirection:"column", gap:"6px" }}>
                <div style={{ color:"#8899aa", fontSize:"11px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                  🎯 Taux d'acceptation
                </div>
                <div style={{ color:"white", fontSize:"22px", fontWeight:"800" }}>{stats.taux}%</div>
                <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"20px", height:"6px", overflow:"hidden" }}>
                  <div style={{ background:PRIMARY, height:"100%", width:`${Math.min(100,stats.taux)}%`, borderRadius:"20px", transition:"width 0.6s" }} />
                </div>
              </div>
            </div>

            {/* Chantier le plus rentable */}
            {stats.bestCh && (
              <div style={{ background:`linear-gradient(135deg, rgba(255,140,0,0.15), rgba(255,140,0,0.05))`,
                border:"1.5px solid rgba(255,140,0,0.3)", borderRadius:"14px", padding:"16px 20px",
                marginBottom:"20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ color:PRIMARY, fontSize:"11px", fontWeight:"700", textTransform:"uppercase",
                    letterSpacing:"0.5px", marginBottom:"6px" }}>🏆 Chantier le plus rentable</div>
                  <div style={{ fontWeight:"800", fontSize:"16px" }}>{stats.bestCh.nom}</div>
                </div>
                <div style={{ color:PRIMARY, fontWeight:"800", fontSize:"20px" }}>
                  {euros(stats.bestCh.prix_chantier)}
                </div>
              </div>
            )}

            {/* Chiffres clés résumé */}
            <div style={{ background:CARD, borderRadius:"14px", padding:"16px 20px" }}>
              <div style={{ color:"#8899aa", fontSize:"11px", fontWeight:"700", textTransform:"uppercase",
                letterSpacing:"0.5px", marginBottom:"14px" }}>📋 Résumé du mois</div>
              {[
                { label:"Chantiers", val:`${stats.nbCh} chantier${stats.nbCh!==1?"s":""}` },
                { label:"Factures en attente", val:euros(stats.caTotal-stats.caPaye) },
                { label:"Taux de paiement", val: stats.facEnvoyees>0 ? Math.round((stats.facPayees/stats.facEnvoyees)*100)+"%" : "—" },
              ].map(({ label, val }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color:"#8899aa", fontSize:"13px" }}>{label}</span>
                  <span style={{ color:"white", fontWeight:"700", fontSize:"13px" }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign:"center", marginTop:"24px", marginBottom:"8px" }}>
              <button onClick={onClose}
                style={{ background:"transparent", border:"1.5px solid rgba(255,255,255,0.15)",
                  color:"#8899aa", borderRadius:"9px", padding:"10px 24px", fontSize:"14px",
                  cursor:"pointer", fontWeight:"600" }}>
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
