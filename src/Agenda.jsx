import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import ProGate from "./ProGate";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";
const API_URL = import.meta.env.VITE_API_URL || "";

const JOURS   = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin",
                 "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const TYPE_CONFIG = {
  rdv:      { label:"Rendez-vous", color:"#4FC3F7", emoji:"📅" },
  rappel:   { label:"Rappel",      color:"#FFB74D", emoji:"⏰" },
  chantier: { label:"Chantier",    color:"#FF8C00", emoji:"🏗️" },
  devis:    { label:"Devis",       color:"#81C784", emoji:"📝" },
  note:     { label:"Note",        color:"#CE93D8", emoji:"📌" },
};

/* ────────── Jours fériés français (algorithme de Butcher pour Pâques) ────── */
function calculerFeries(annee) {
  const a=annee%19, b=Math.floor(annee/100), c=annee%100,
    d=Math.floor(b/4), e=b%4, f=Math.floor((b+8)/25),
    g=Math.floor((b-f+1)/3), h=(19*a+b-d-g+15)%30,
    i=Math.floor(c/4), k=c%4, l=(32+2*e+2*i-h-k)%7,
    m=Math.floor((a+11*h+22*l)/451),
    month=Math.floor((h+l-7*m+114)/31), day=((h+l-7*m+114)%31)+1;
  const paques = new Date(annee, month-1, day);
  const aj = (d,n) => new Date(d.getTime()+n*864e5);
  return [
    { date: new Date(annee,0,1),    nom:"Jour de l'An" },
    { date: aj(paques,1),           nom:"Lundi de Pâques" },
    { date: new Date(annee,4,1),    nom:"Fête du Travail" },
    { date: new Date(annee,4,8),    nom:"Victoire 1945" },
    { date: aj(paques,39),          nom:"Ascension" },
    { date: aj(paques,50),          nom:"Lundi de Pentecôte" },
    { date: new Date(annee,6,14),   nom:"Fête Nationale" },
    { date: new Date(annee,7,15),   nom:"Assomption" },
    { date: new Date(annee,10,1),   nom:"Toussaint" },
    { date: new Date(annee,10,11),  nom:"Armistice" },
    { date: new Date(annee,11,25),  nom:"Noël" },
  ].map(f => ({ ...f, key: f.date.toISOString().slice(0,10) }));
}

function sameDay(a,b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function dateStr(d) { return d.toISOString().slice(0,10); }

function isoToLocal(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

/* ────────── Formulaire modal ──────────────────────────────────────────────── */
const FORM_VIDE = {
  titre:"", description:"", date_debut:"", heure_debut:"09:00",
  date_fin:"", heure_fin:"10:00", type:"rdv", client_id:"",
  lieu:"", journee_entiere:false,
};

export default function Agenda({ user, profil, clients = [], chantiers = [], isPro = true, onUpgrade }) {
  const [vue,       setVue]       = useState("mois");
  const [dateRef,   setDateRef]   = useState(new Date());
  const [evts,      setEvts]      = useState([]);
  const [devis,     setDevis]     = useState([]);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(FORM_VIDE);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [jourSel,   setJourSel]   = useState(null); // date selected in month view
  const [suggs,     setSuggs]     = useState([]);
  const [loadIA,    setLoadIA]    = useState(false);
  const [meteo,     setMeteo]     = useState({});

  const feries = calculerFeries(dateRef.getFullYear());
  const feriesNext = calculerFeries(dateRef.getFullYear()+1);
  const feriesMap = Object.fromEntries([...feries,...feriesNext].map(f=>[f.key,f.nom]));

  useEffect(() => {
    chargerEvts();
    chargerDevis();
  }, []);

  const chargerEvts = async () => {
    const { data } = await supabase.from("evenements")
      .select("*").eq("user_id", user.id).order("date_debut", { ascending: true });
    if (data) setEvts(data);
  };

  const chargerDevis = async () => {
    const { data } = await supabase.from("devis")
      .select("id,numero,date_validite,statut,total_ttc,client_id")
      .eq("user_id", user.id)
      .in("statut",["en_attente","envoye"])
      .not("date_validite","is",null);
    if (data) setDevis(data);
  };

  /* Événements virtuels depuis chantiers */
  const evtsChantiers = chantiers
    .filter(c => c.date_debut)
    .map(c => ({
      id: "ch-"+c.id,
      titre: c.nom,
      date_debut: c.date_debut+"T08:00:00",
      date_fin:   c.date_fin_prevue ? c.date_fin_prevue+"T18:00:00" : null,
      type: "chantier",
      couleur: "#FF8C00",
      _virtuel: true,
    }));

  /* Fusion tous événements */
  const tousEvts = [...evts, ...evtsChantiers];

  /* ──── Suggestions auto (calculées localement) ─────────────────── */
  const suggestions = useCallback(() => {
    const sgs = [];
    const now = new Date();
    const dans7 = new Date(now.getTime() + 7*864e5);

    // Devis expirant dans 7 jours
    devis.forEach(d => {
      if (!d.date_validite) return;
      const exp = new Date(d.date_validite);
      if (exp >= now && exp <= dans7) {
        const jours = Math.ceil((exp-now)/864e5);
        sgs.push({
          type:"alerte", priorite:"haute", emoji:"⏰",
          titre:`Devis ${d.numero} expire dans ${jours} jour${jours>1?"s":""}`,
          message:`Relancez votre client avant le ${exp.toLocaleDateString("fr-FR")} pour ne pas perdre ce devis.`,
        });
      }
    });

    // Chantiers dans les 3 prochains jours
    chantiers.filter(c=>c.date_debut).forEach(c=>{
      const d = new Date(c.date_debut);
      const diff = Math.ceil((d-now)/864e5);
      if (diff >= 0 && diff <= 3) {
        sgs.push({
          type:"rappel", priorite:"moyenne", emoji:"🏗️",
          titre:`Chantier "${c.nom}" dans ${diff===0?"aujourd'hui":diff+" jour"+(diff>1?"s":"")}`,
          message:"Vérifiez que tout le matériel est prêt et que le client est confirmé.",
        });
      }
    });

    // Jour férié demain
    const demain = new Date(now.getTime()+864e5);
    const ferDemain = feriesMap[dateStr(demain)];
    if (ferDemain) {
      sgs.push({
        type:"conseil", priorite:"basse", emoji:"🎉",
        titre:`Demain : ${ferDemain}`,
        message:"Jour férié demain. Pensez à prévenir vos clients si vous avez des rendez-vous prévus.",
      });
    }

    // Semaine surchargée
    const lundi = new Date(now);
    lundi.setDate(lundi.getDate() - (lundi.getDay()||7)+1);
    const dim = new Date(lundi.getTime()+6*864e5);
    const evtsSem = tousEvts.filter(e=>{
      const d=isoToLocal(e.date_debut);
      return d && d>=lundi && d<=dim;
    });
    if (evtsSem.length >= 6) {
      sgs.push({
        type:"optimisation", priorite:"basse", emoji:"📊",
        titre:"Semaine chargée",
        message:`Vous avez ${evtsSem.length} événements cette semaine. Pensez à bien prioriser vos tâches.`,
      });
    }

    return sgs.slice(0, 5);
  }, [devis, chantiers, tousEvts, feriesMap]);

  /* ──── Analyse IA ───────────────────────────────────────────────── */
  const analyserIA = async () => {
    setLoadIA(true);
    const now = new Date();
    const dans14 = new Date(now.getTime()+14*864e5);
    const prochains = tousEvts.filter(e=>{
      const d=isoToLocal(e.date_debut);
      return d && d>=now && d<=dans14;
    }).map(e=>({ titre:e.titre, date:e.date_debut, type:e.type }));

    const devisExp = devis.filter(d=>{
      if(!d.date_validite) return false;
      const exp=new Date(d.date_validite);
      return exp>=now && exp<=dans14;
    }).map(d=>({ numero:d.numero, expire:d.date_validite, montant:d.total_ttc }));

    try {
      const r = await fetch(`${API_URL}/api/ai-assist`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          type: "agenda",
          dateAujourdhui: now.toISOString().slice(0,10),
          evenements: prochains,
          chantiers: chantiers.filter(c=>c.statut==="en_cours").map(c=>({ nom:c.nom, debut:c.date_debut })),
          devisExpirants: devisExp,
        }),
      });
      const j = await r.json();
      if (j.ok && j.suggestions) setSuggs(j.suggestions);
    } catch { /* noop */ }
    setLoadIA(false);
  };

  /* ──── Météo pour chantiers (Open-Meteo) ───────────────────────── */
  const fetchMeteoChantier = async (chantier) => {
    if (!chantier?.adresse) return;
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(chantier.adresse)}&format=json&limit=1`).then(r=>r.json());
      if (!geo[0]) return;
      const { lat, lon } = geo[0];
      const date = chantier.date_debut;
      if (!date) return;
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum,weathercode&timezone=Europe%2FParis&start_date=${date}&end_date=${date}`).then(r=>r.json());
      if (r.daily?.temperature_2m_max?.[0] != null) {
        setMeteo(prev => ({ ...prev, [chantier.id]: {
          temp: r.daily.temperature_2m_max[0],
          pluie: r.daily.precipitation_sum[0],
          code: r.daily.weathercode[0],
        }}));
      }
    } catch { /* noop */ }
  };

  useEffect(() => {
    chantiers.filter(c=>c.date_debut && c.adresse).forEach(fetchMeteoChantier);
  }, [chantiers]);

  /* ──── CRUD événements ─────────────────────────────────────────── */
  const ouvrirModal = (dateDefaut = null, evtExistant = null) => {
    if (evtExistant && evtExistant._virtuel) return; // pas éditer les virtuels
    if (evtExistant) {
      const d = isoToLocal(evtExistant.date_debut);
      const df = isoToLocal(evtExistant.date_fin);
      setForm({
        titre: evtExistant.titre||"",
        description: evtExistant.description||"",
        date_debut: d ? dateStr(d) : "",
        heure_debut: d ? d.toTimeString().slice(0,5) : "09:00",
        date_fin: df ? dateStr(df) : "",
        heure_fin: df ? df.toTimeString().slice(0,5) : "10:00",
        type: evtExistant.type||"rdv",
        client_id: evtExistant.client_id||"",
        lieu: evtExistant.lieu||"",
        journee_entiere: evtExistant.journee_entiere||false,
      });
      setEditId(evtExistant.id);
    } else {
      const ds = dateDefaut ? dateStr(dateDefaut) : dateStr(new Date());
      setForm({ ...FORM_VIDE, date_debut: ds, date_fin: ds });
      setEditId(null);
    }
    setModal(true);
  };

  const fermerModal = () => { setModal(false); setEditId(null); setForm(FORM_VIDE); };

  const sauvegarder = async () => {
    if (!form.titre.trim() || !form.date_debut) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      titre: form.titre.trim(),
      description: form.description||null,
      date_debut: form.journee_entiere
        ? form.date_debut+"T00:00:00"
        : form.date_debut+"T"+form.heure_debut+":00",
      date_fin: form.date_fin
        ? (form.journee_entiere ? form.date_fin+"T23:59:59" : form.date_fin+"T"+form.heure_fin+":00")
        : null,
      type: form.type,
      couleur: TYPE_CONFIG[form.type]?.color || PRIMARY,
      client_id: form.client_id||null,
      lieu: form.lieu||null,
      journee_entiere: form.journee_entiere,
    };
    if (editId) {
      const { error } = await supabase.from("evenements").update(payload).eq("id",editId);
      if (!error) setEvts(prev => prev.map(e => e.id===editId ? { ...e, ...payload, id:editId } : e));
    } else {
      const { data, error } = await supabase.from("evenements").insert(payload).select().single();
      if (!error && data) setEvts(prev => [...prev, data]);
    }
    setSaving(false);
    fermerModal();
  };

  const supprimerEvt = async (id) => {
    if (!window.confirm("Supprimer cet événement ?")) return;
    await supabase.from("evenements").delete().eq("id",id);
    setEvts(prev => prev.filter(e=>e.id!==id));
    fermerModal();
  };

  /* ──── Navigation ──────────────────────────────────────────────── */
  const nav = (delta) => {
    const d = new Date(dateRef);
    if (vue==="mois")    d.setMonth(d.getMonth()+delta);
    else if (vue==="semaine") d.setDate(d.getDate()+delta*7);
    else d.setDate(d.getDate()+delta);
    setDateRef(d);
  };

  const today = new Date();

  /* ──── VUE MOIS ────────────────────────────────────────────────── */
  const renderMois = () => {
    const an = dateRef.getFullYear(), mo = dateRef.getMonth();
    const premier = new Date(an, mo, 1);
    const startDow = (premier.getDay()+6)%7; // 0=Lun
    const nbJours = new Date(an, mo+1, 0).getDate();
    const cells = [];

    // Jours mois précédent
    for (let i=0; i<startDow; i++) {
      const d = new Date(an, mo, -startDow+i+1);
      cells.push({ date: d, autremois: true });
    }
    for (let j=1; j<=nbJours; j++) cells.push({ date: new Date(an,mo,j), autremois:false });
    // Remplir jusqu'à 42 cellules
    while (cells.length < 42) {
      const last = cells[cells.length-1].date;
      cells.push({ date: new Date(last.getTime()+864e5), autremois:true });
    }

    const evtsJour = (d) => tousEvts.filter(e => {
      const dd = isoToLocal(e.date_debut);
      const df = isoToLocal(e.date_fin);
      if (!dd) return false;
      if (df) {
        // Événement multi-jour
        return d >= new Date(dateStr(dd)) && d <= new Date(dateStr(df));
      }
      return sameDay(dd, d);
    });

    return (
      <div>
        {/* Jours de la semaine header */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"1px", marginBottom:"2px" }}>
          {JOURS.map(j => (
            <div key={j} style={{ textAlign:"center", fontSize:"11px", fontWeight:"700",
              color:"#8899aa", textTransform:"uppercase", letterSpacing:"0.5px", padding:"6px 0" }}>
              {j}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"1px" }}>
          {cells.map((cell, idx) => {
            const ds = dateStr(cell.date);
            const ferie = feriesMap[ds];
            const isToday = sameDay(cell.date, today);
            const isSel = jourSel && sameDay(cell.date, jourSel);
            const evtsDuJour = evtsJour(cell.date);

            return (
              <div key={idx}
                onClick={() => { setJourSel(cell.date); }}
                onDoubleClick={() => ouvrirModal(cell.date)}
                style={{
                  minHeight:"80px", background: isSel?"rgba(255,140,0,0.12)":cell.autremois?"rgba(255,255,255,0.02)":CARD,
                  borderRadius:"6px", padding:"4px 5px", cursor:"pointer",
                  border: isToday ? `1.5px solid ${PRIMARY}` : "1.5px solid transparent",
                  transition:"all 0.1s",
                }}>
                {/* Numéro du jour */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                  <span style={{
                    fontSize:"12px", fontWeight: isToday?"800":"600",
                    color: isToday ? PRIMARY : cell.autremois ? "#444" : "white",
                    background: isToday?"rgba(255,140,0,0.18)":"transparent",
                    borderRadius:"50%", width:"20px", height:"20px",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{cell.date.getDate()}</span>
                </div>

                {/* Jour férié */}
                {ferie && <div style={{ fontSize:"9px", color:"#FFB74D", fontStyle:"italic",
                  lineHeight:"1.2", marginBottom:"2px", whiteSpace:"nowrap", overflow:"hidden",
                  textOverflow:"ellipsis" }}>{ferie}</div>}

                {/* Événements */}
                {evtsDuJour.slice(0,3).map((e,i) => {
                  const cfg = TYPE_CONFIG[e.type]||TYPE_CONFIG.rdv;
                  return (
                    <div key={i}
                      onClick={ev => { ev.stopPropagation(); ouvrirModal(null, e); }}
                      style={{
                        background:`${e.couleur||cfg.color}22`,
                        border:`1px solid ${e.couleur||cfg.color}66`,
                        borderLeft:`3px solid ${e.couleur||cfg.color}`,
                        borderRadius:"3px", padding:"1px 4px",
                        fontSize:"10px", fontWeight:"600", color:"white",
                        marginBottom:"2px", lineHeight:"1.4",
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                        cursor: e._virtuel ? "default":"pointer",
                      }}>
                      {cfg.emoji} {e.titre}
                    </div>
                  );
                })}
                {evtsDuJour.length > 3 && (
                  <div style={{ fontSize:"10px", color:PRIMARY, fontWeight:"700" }}>
                    +{evtsDuJour.length-3} autres
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ──── VUE SEMAINE ─────────────────────────────────────────────── */
  const renderSemaine = () => {
    const lundi = new Date(dateRef);
    lundi.setDate(lundi.getDate() - (lundi.getDay()||7) + 1);
    const jours = Array.from({length:7}, (_,i) => new Date(lundi.getTime()+i*864e5));

    return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"6px" }}>
        {jours.map((jour, idx) => {
          const ds = dateStr(jour);
          const ferie = feriesMap[ds];
          const isToday = sameDay(jour, today);
          const evtsDuJour = tousEvts.filter(e => {
            const d = isoToLocal(e.date_debut);
            return d && sameDay(d, jour);
          }).sort((a,b) => (a.date_debut||"") < (b.date_debut||"") ? -1 : 1);

          return (
            <div key={idx} style={{ background:CARD, borderRadius:"10px", padding:"10px 8px",
              border: isToday ? `1.5px solid ${PRIMARY}` : "1.5px solid transparent" }}>
              <div style={{ marginBottom:"8px", textAlign:"center" }}>
                <div style={{ fontSize:"10px", color:"#8899aa", textTransform:"uppercase", fontWeight:"700" }}>
                  {JOURS[idx]}
                </div>
                <div style={{ fontSize:"18px", fontWeight:"800",
                  color: isToday ? PRIMARY : "white" }}>
                  {jour.getDate()}
                </div>
                {ferie && <div style={{ fontSize:"9px", color:"#FFB74D", fontStyle:"italic" }}>{ferie}</div>}
              </div>

              {evtsDuJour.length === 0 && (
                <div style={{ textAlign:"center", color:"#333", fontSize:"11px", padding:"8px 0",
                  cursor:"pointer" }} onClick={()=>ouvrirModal(jour)}>
                  + Ajouter
                </div>
              )}

              {evtsDuJour.map((e,i) => {
                const cfg = TYPE_CONFIG[e.type]||TYPE_CONFIG.rdv;
                const d = isoToLocal(e.date_debut);
                return (
                  <div key={i} onClick={()=>ouvrirModal(null,e)}
                    style={{
                      background:`${e.couleur||cfg.color}20`,
                      borderLeft:`3px solid ${e.couleur||cfg.color}`,
                      borderRadius:"4px", padding:"5px 6px", marginBottom:"4px",
                      cursor: e._virtuel?"default":"pointer",
                    }}>
                    <div style={{ fontSize:"10px", color:"#8899aa" }}>
                      {d && !e.journee_entiere ? d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : "Toute la journée"}
                    </div>
                    <div style={{ fontSize:"11px", fontWeight:"700", color:"white", lineHeight:"1.3" }}>
                      {cfg.emoji} {e.titre}
                    </div>
                  </div>
                );
              })}

              {evtsDuJour.length > 0 && (
                <div style={{ textAlign:"center", marginTop:"4px" }}>
                  <span onClick={()=>ouvrirModal(jour)}
                    style={{ fontSize:"10px", color:PRIMARY, cursor:"pointer", fontWeight:"700" }}>+ Ajouter</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ──── VUE JOUR ────────────────────────────────────────────────── */
  const renderJour = () => {
    const ds = dateStr(dateRef);
    const ferie = feriesMap[ds];
    const isToday = sameDay(dateRef, today);
    const evtsDuJour = tousEvts.filter(e => {
      const d = isoToLocal(e.date_debut);
      return d && sameDay(d, dateRef);
    }).sort((a,b) => (a.date_debut||"")<(b.date_debut||"")?-1:1);

    const heures = Array.from({length:15}, (_,i) => i+7); // 7h-21h

    return (
      <div>
        <div style={{ textAlign:"center", marginBottom:"20px" }}>
          <div style={{ fontSize:"28px", fontWeight:"800", color: isToday?PRIMARY:"white" }}>
            {dateRef.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
          </div>
          {ferie && <div style={{ color:"#FFB74D", fontStyle:"italic", fontSize:"14px" }}>{ferie}</div>}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"48px 1fr", gap:"0" }}>
          {heures.map(h => {
            const evtsHeure = evtsDuJour.filter(e => {
              const d = isoToLocal(e.date_debut);
              return d && d.getHours() === h;
            });
            return (
              <>
                <div key={"h"+h} style={{ color:"#555", fontSize:"11px", fontWeight:"600",
                  paddingTop:"12px", textAlign:"right", paddingRight:"10px" }}>
                  {String(h).padStart(2,"0")}h
                </div>
                <div key={"c"+h}
                  onClick={() => {
                    const d = new Date(dateRef);
                    d.setHours(h,0,0,0);
                    ouvrirModal(d);
                  }}
                  style={{
                    borderTop:"1px solid rgba(255,255,255,0.05)", minHeight:"48px",
                    padding:"4px 8px", cursor:"pointer",
                    transition:"background 0.1s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,140,0,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  {evtsHeure.map((e,i) => {
                    const cfg = TYPE_CONFIG[e.type]||TYPE_CONFIG.rdv;
                    return (
                      <div key={i} onClick={ev=>{ev.stopPropagation();ouvrirModal(null,e);}}
                        style={{
                          background:`${e.couleur||cfg.color}20`,
                          borderLeft:`3px solid ${e.couleur||cfg.color}`,
                          borderRadius:"6px", padding:"8px 10px", marginBottom:"4px",
                          cursor:e._virtuel?"default":"pointer",
                        }}>
                        <div style={{fontWeight:"700", fontSize:"13px",color:"white"}}>
                          {cfg.emoji} {e.titre}
                        </div>
                        {e.lieu && <div style={{fontSize:"11px",color:"#8899aa"}}>📍 {e.lieu}</div>}
                        {e.description && <div style={{fontSize:"11px",color:"#8899aa",marginTop:"2px"}}>{e.description}</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })}
        </div>
      </div>
    );
  };

  /* ──── PANEL SUGGESTIONS ───────────────────────────────────────── */
  const suggsAuto = suggestions();
  const allSuggs = [...suggsAuto, ...suggs];

  const prioriteColor = { haute:"#ff6b6b", moyenne:"#FFB74D", basse:"#4FC3F7" };

  /* ──── TITRE DE NAVIGATION ─────────────────────────────────────── */
  const titreNav = () => {
    if (vue==="mois") return MOIS_FR[dateRef.getMonth()]+" "+dateRef.getFullYear();
    if (vue==="semaine") {
      const lundi = new Date(dateRef);
      lundi.setDate(lundi.getDate()-(lundi.getDay()||7)+1);
      const dim = new Date(lundi.getTime()+6*864e5);
      return `${lundi.getDate()} – ${dim.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})} ${dim.getFullYear()}`;
    }
    return dateRef.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  };

  /* ──── GATE PRO ─────────────────────────────────────────────── */
  if (!isPro) {
    return (
      <ProGate
        featureKey="agenda"
        mode="page"
        onUpgrade={onUpgrade}
        onDismiss={null}
      />
    );
  }

  /* ──── RENDER ──────────────────────────────────────────────────── */
  return (
    <div style={{ color:"white", fontFamily:"system-ui,sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"20px", flexWrap:"wrap" }}>
        {/* Vue selector */}
        <div style={{ display:"flex", gap:"4px", background:CARD, borderRadius:"10px", padding:"4px" }}>
          {[{id:"mois",l:"Mois"},{id:"semaine",l:"Semaine"},{id:"jour",l:"Jour"}].map(v=>(
            <button key={v.id} onClick={()=>setVue(v.id)}
              style={{ background:vue===v.id?"rgba(255,140,0,0.2)":"transparent",
                border:`1px solid ${vue===v.id?"rgba(255,140,0,0.4)":"transparent"}`,
                color:vue===v.id?PRIMARY:"#8899aa", borderRadius:"7px",
                padding:"6px 14px", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
              {v.l}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <button onClick={()=>nav(-1)}
            style={{ background:CARD, border:"1px solid rgba(255,255,255,0.1)", color:"white",
              borderRadius:"8px", width:"32px", height:"32px", cursor:"pointer", fontSize:"14px" }}>←</button>
          <span style={{ fontWeight:"700", fontSize:"14px", minWidth:"200px", textAlign:"center" }}>{titreNav()}</span>
          <button onClick={()=>nav(1)}
            style={{ background:CARD, border:"1px solid rgba(255,255,255,0.1)", color:"white",
              borderRadius:"8px", width:"32px", height:"32px", cursor:"pointer", fontSize:"14px" }}>→</button>
          <button onClick={()=>setDateRef(new Date())}
            style={{ background:"rgba(255,140,0,0.12)", border:"1px solid rgba(255,140,0,0.3)",
              color:PRIMARY, borderRadius:"8px", padding:"6px 12px", fontSize:"12px",
              fontWeight:"700", cursor:"pointer" }}>Aujourd'hui</button>
        </div>

        <div style={{ marginLeft:"auto" }}>
          <button onClick={()=>ouvrirModal()}
            style={{ background:PRIMARY, border:"none", color:"white", borderRadius:"9px",
              padding:"8px 16px", fontSize:"13px", fontWeight:"700", cursor:"pointer",
              display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{fontSize:"16px"}}>＋</span> Nouveau
          </button>
        </div>
      </div>

      {/* ── CALENDRIER ── */}
      <div style={{ display:"grid", gridTemplateColumns: allSuggs.length?"1fr 280px":"1fr", gap:"20px" }}>
        <div>
          {vue==="mois"    && renderMois()}
          {vue==="semaine" && renderSemaine()}
          {vue==="jour"    && renderJour()}
        </div>

        {/* ── PANEL DROIT ── */}
        <div>
          {/* Détail jour sélectionné (mois) */}
          {vue==="mois" && jourSel && (() => {
            const evtsDuJour = tousEvts.filter(e => {
              const d=isoToLocal(e.date_debut);
              const df=isoToLocal(e.date_fin);
              if(!d) return false;
              if(df) return jourSel>=new Date(dateStr(d)) && jourSel<=new Date(dateStr(df));
              return sameDay(d,jourSel);
            });
            const ds = dateStr(jourSel);
            const ferie = feriesMap[ds];
            return (
              <div style={{ background:CARD, borderRadius:"14px", padding:"16px", marginBottom:"16px" }}>
                <div style={{ fontWeight:"700", marginBottom:"12px", fontSize:"14px" }}>
                  {jourSel.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
                  {ferie && <span style={{color:"#FFB74D",fontSize:"11px",marginLeft:"8px"}}>• {ferie}</span>}
                </div>
                {evtsDuJour.length===0 ? (
                  <div style={{color:"#555",fontSize:"12px",fontStyle:"italic",textAlign:"center",padding:"10px 0"}}>
                    Aucun événement
                  </div>
                ) : evtsDuJour.map((e,i) => {
                  const cfg=TYPE_CONFIG[e.type]||TYPE_CONFIG.rdv;
                  const d=isoToLocal(e.date_debut);
                  const cl = clients.find(c=>c.id===e.client_id);
                  return (
                    <div key={i} onClick={()=>ouvrirModal(null,e)}
                      style={{ borderLeft:`3px solid ${e.couleur||cfg.color}`,
                        padding:"8px 10px", marginBottom:"8px", background:`${e.couleur||cfg.color}12`,
                        borderRadius:"0 6px 6px 0", cursor:e._virtuel?"default":"pointer" }}>
                      <div style={{fontWeight:"700",fontSize:"13px"}}>{cfg.emoji} {e.titre}</div>
                      {d && !e.journee_entiere && <div style={{fontSize:"11px",color:"#8899aa"}}>
                        {d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                      </div>}
                      {cl && <div style={{fontSize:"11px",color:"#8899aa"}}>👤 {cl.nom}</div>}
                      {e.lieu && <div style={{fontSize:"11px",color:"#8899aa"}}>📍 {e.lieu}</div>}
                    </div>
                  );
                })}
                <button onClick={()=>ouvrirModal(jourSel)}
                  style={{ width:"100%", background:"rgba(255,140,0,0.1)", border:"1px dashed rgba(255,140,0,0.3)",
                    color:PRIMARY, borderRadius:"7px", padding:"7px", fontSize:"12px",
                    fontWeight:"700", cursor:"pointer", marginTop:"4px" }}>
                  + Ajouter un événement
                </button>
              </div>
            );
          })()}

          {/* Suggestions */}
          <div style={{ background:CARD, borderRadius:"14px", padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div style={{ fontWeight:"700", fontSize:"14px" }}>💡 Suggestions IA</div>
              <button onClick={analyserIA} disabled={loadIA}
                style={{ background:"rgba(255,140,0,0.12)", border:"1px solid rgba(255,140,0,0.3)",
                  color:PRIMARY, borderRadius:"7px", padding:"4px 10px", fontSize:"11px",
                  fontWeight:"700", cursor:"pointer", opacity:loadIA?0.7:1 }}>
                {loadIA?"⏳":"🤖"} Analyser
              </button>
            </div>

            {allSuggs.length === 0 ? (
              <div style={{color:"#555",fontSize:"12px",fontStyle:"italic",textAlign:"center",padding:"10px 0"}}>
                Aucune suggestion pour l'instant
              </div>
            ) : allSuggs.map((s,i) => (
              <div key={i} style={{ borderLeft:`3px solid ${prioriteColor[s.priorite]||"#8899aa"}`,
                padding:"8px 10px", marginBottom:"8px", background:`${prioriteColor[s.priorite]||"#8899aa"}10`,
                borderRadius:"0 6px 6px 0" }}>
                <div style={{fontWeight:"700",fontSize:"12px",color:"white"}}>{s.emoji} {s.titre}</div>
                <div style={{fontSize:"11px",color:"#8899aa",lineHeight:"1.4",marginTop:"3px"}}>{s.message}</div>
              </div>
            ))}
          </div>

          {/* Légende */}
          <div style={{ background:CARD, borderRadius:"14px", padding:"14px", marginTop:"14px" }}>
            <div style={{ fontWeight:"700", fontSize:"12px", color:"#8899aa", marginBottom:"10px", textTransform:"uppercase" }}>Légende</div>
            {Object.entries(TYPE_CONFIG).map(([k,v]) => (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
                <div style={{ width:"12px", height:"12px", borderRadius:"3px", background:v.color, flexShrink:0 }} />
                <span style={{ fontSize:"12px", color:"#ccc" }}>{v.emoji} {v.label}</span>
              </div>
            ))}
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"6px" }}>
              <div style={{ width:"12px", height:"12px", borderRadius:"3px", background:"#FFB74D", flexShrink:0 }} />
              <span style={{ fontSize:"12px", color:"#FFB74D", fontStyle:"italic" }}>Jour férié</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL ÉVÉNEMENT ─────────────────────────────────────────── */}
      {modal && (
        <>
          <div style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)" }}
            onClick={fermerModal} />
          <div style={{
            position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            zIndex:501, background:CARD, borderRadius:"18px", padding:"24px",
            width:"min(460px,95vw)", maxHeight:"90vh", overflowY:"auto",
            boxShadow:"0 20px 80px rgba(0,0,0,0.7)",
            border:"1px solid rgba(255,140,0,0.2)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <div style={{ fontWeight:"800", fontSize:"17px" }}>
                {editId ? "✏️ Modifier" : "➕ Nouvel événement"}
              </div>
              <button onClick={fermerModal}
                style={{ background:"transparent",border:"none",color:"#8899aa",fontSize:"20px",cursor:"pointer" }}>✕</button>
            </div>

            {/* Titre */}
            <div style={{ marginBottom:"14px" }}>
              <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",textTransform:"uppercase",display:"block",marginBottom:"6px" }}>Titre *</label>
              <input value={form.titre} onChange={e=>setForm(p=>({...p,titre:e.target.value}))}
                placeholder="Ex: Visite chantier Dupont"
                style={{ width:"100%",boxSizing:"border-box",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                  color:"white",borderRadius:"9px",padding:"10px 12px",fontSize:"14px",outline:"none" }} />
            </div>

            {/* Type */}
            <div style={{ marginBottom:"14px" }}>
              <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",textTransform:"uppercase",display:"block",marginBottom:"6px" }}>Type</label>
              <div style={{ display:"flex",gap:"6px",flexWrap:"wrap" }}>
                {Object.entries(TYPE_CONFIG).filter(([k])=>k!=="chantier").map(([k,v])=>(
                  <button key={k} onClick={()=>setForm(p=>({...p,type:k}))}
                    style={{ background:form.type===k?`${v.color}25`:"rgba(255,255,255,0.04)",
                      border:`1.5px solid ${form.type===k?v.color:"rgba(255,255,255,0.1)"}`,
                      color:form.type===k?v.color:"#8899aa",borderRadius:"8px",
                      padding:"6px 12px",fontSize:"12px",fontWeight:"700",cursor:"pointer" }}>
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Journée entière */}
            <div style={{ marginBottom:"14px",display:"flex",alignItems:"center",gap:"10px" }}>
              <input type="checkbox" id="je" checked={form.journee_entiere}
                onChange={e=>setForm(p=>({...p,journee_entiere:e.target.checked}))} />
              <label htmlFor="je" style={{ color:"#ccc",fontSize:"13px",cursor:"pointer" }}>Journée entière</label>
            </div>

            {/* Dates */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px" }}>
              <div>
                <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px" }}>Date début *</label>
                <input type="date" value={form.date_debut} onChange={e=>setForm(p=>({...p,date_debut:e.target.value}))}
                  style={{ width:"100%",boxSizing:"border-box",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                    color:"white",borderRadius:"9px",padding:"9px 10px",fontSize:"13px",outline:"none" }} />
              </div>
              {!form.journee_entiere && (
                <div>
                  <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px" }}>Heure</label>
                  <input type="time" value={form.heure_debut} onChange={e=>setForm(p=>({...p,heure_debut:e.target.value}))}
                    style={{ width:"100%",boxSizing:"border-box",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                      color:"white",borderRadius:"9px",padding:"9px 10px",fontSize:"13px",outline:"none" }} />
                </div>
              )}
              <div>
                <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px" }}>Date fin</label>
                <input type="date" value={form.date_fin} onChange={e=>setForm(p=>({...p,date_fin:e.target.value}))}
                  style={{ width:"100%",boxSizing:"border-box",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                    color:"white",borderRadius:"9px",padding:"9px 10px",fontSize:"13px",outline:"none" }} />
              </div>
              {!form.journee_entiere && (
                <div>
                  <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px" }}>Heure fin</label>
                  <input type="time" value={form.heure_fin} onChange={e=>setForm(p=>({...p,heure_fin:e.target.value}))}
                    style={{ width:"100%",boxSizing:"border-box",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                      color:"white",borderRadius:"9px",padding:"9px 10px",fontSize:"13px",outline:"none" }} />
                </div>
              )}
            </div>

            {/* Client */}
            {clients.length > 0 && (
              <div style={{ marginBottom:"14px" }}>
                <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",textTransform:"uppercase",display:"block",marginBottom:"6px" }}>Client</label>
                <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}
                  style={{ width:"100%",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                    color:form.client_id?"white":"#8899aa",borderRadius:"9px",padding:"10px 12px",fontSize:"13px",outline:"none" }}>
                  <option value="">-- Aucun client --</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
            )}

            {/* Lieu */}
            <div style={{ marginBottom:"14px" }}>
              <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",textTransform:"uppercase",display:"block",marginBottom:"6px" }}>Lieu</label>
              <input value={form.lieu} onChange={e=>setForm(p=>({...p,lieu:e.target.value}))}
                placeholder="Adresse ou lieu du rendez-vous"
                style={{ width:"100%",boxSizing:"border-box",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                  color:"white",borderRadius:"9px",padding:"10px 12px",fontSize:"13px",outline:"none" }} />
            </div>

            {/* Description */}
            <div style={{ marginBottom:"20px" }}>
              <label style={{ color:"#8899aa",fontSize:"11px",fontWeight:"700",textTransform:"uppercase",display:"block",marginBottom:"6px" }}>Notes</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                rows={3} placeholder="Informations complémentaires…"
                style={{ width:"100%",boxSizing:"border-box",background:DARK,border:"1px solid rgba(255,255,255,0.1)",
                  color:"white",borderRadius:"9px",padding:"10px 12px",fontSize:"13px",
                  outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:"1.5" }} />
            </div>

            {/* Actions */}
            <div style={{ display:"flex",gap:"10px",justifyContent:"flex-end" }}>
              {editId && (
                <button onClick={()=>supprimerEvt(editId)}
                  style={{ background:"transparent",border:"1.5px solid rgba(255,107,107,0.4)",
                    color:"#ff6b6b",borderRadius:"9px",padding:"10px 16px",fontSize:"13px",
                    fontWeight:"700",cursor:"pointer" }}>
                  🗑️ Supprimer
                </button>
              )}
              <button onClick={fermerModal}
                style={{ background:"transparent",border:"1.5px solid rgba(255,255,255,0.1)",
                  color:"#8899aa",borderRadius:"9px",padding:"10px 16px",fontSize:"13px",
                  fontWeight:"700",cursor:"pointer" }}>
                Annuler
              </button>
              <button onClick={sauvegarder} disabled={saving||!form.titre.trim()||!form.date_debut}
                style={{ background:PRIMARY,border:"none",color:"white",borderRadius:"9px",
                  padding:"10px 20px",fontSize:"13px",fontWeight:"700",cursor:"pointer",
                  opacity:saving||!form.titre.trim()||!form.date_debut?0.6:1 }}>
                {saving?"⏳ Enregistrement…":"💾 Enregistrer"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
