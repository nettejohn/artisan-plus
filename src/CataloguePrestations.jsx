import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

// ── Articles pré-remplis par catégorie ────────────────────────────────────────
const CATALOGUE = [
  {
    id: "maconnerie", label: "Maçonnerie", emoji: "🧱",
    articles: [
      { nom: "Pose de parpaings",           prix: 45,  unite: "m²"    },
      { nom: "Chape de béton (ép. 6 cm)",   prix: 35,  unite: "m²"    },
      { nom: "Enduit intérieur à la chaux", prix: 28,  unite: "m²"    },
      { nom: "Fondations béton armé",        prix: 280, unite: "m³"    },
      { nom: "Montage mur en briques",       prix: 55,  unite: "m²"    },
      { nom: "Ragréage sol",                 prix: 18,  unite: "m²"    },
    ],
  },
  {
    id: "plomberie", label: "Plomberie", emoji: "🔧",
    articles: [
      { nom: "Installation robinet mitigeur",         prix: 180, unite: "u." },
      { nom: "Remplacement chauffe-eau 200 L",        prix: 850, unite: "u." },
      { nom: "Débouchage canalisation",                prix: 120, unite: "h"  },
      { nom: "Pose WC suspendu avec bâti-support",    prix: 680, unite: "u." },
      { nom: "Remplacement siphon ou joint d'étanch.", prix: 65,  unite: "u." },
      { nom: "Pose lavabo + robinetterie",             prix: 320, unite: "u." },
    ],
  },
  {
    id: "electricite", label: "Électricité", emoji: "⚡",
    articles: [
      { nom: "Pose prise électrique 2P+T",          prix: 95,  unite: "u." },
      { nom: "Pose interrupteur / va-et-vient",     prix: 75,  unite: "u." },
      { nom: "Tableau électrique 12 modules",       prix: 580, unite: "u." },
      { nom: "Mise aux normes installation",        prix: 85,  unite: "h"  },
      { nom: "Pose luminaire plafonnier",           prix: 80,  unite: "u." },
      { nom: "Pose VMC simple flux",                prix: 450, unite: "u." },
    ],
  },
  {
    id: "peinture", label: "Peinture", emoji: "🎨",
    articles: [
      { nom: "Peinture murs intérieur (2 couches)", prix: 22, unite: "m²" },
      { nom: "Peinture plafond (2 couches)",        prix: 25, unite: "m²" },
      { nom: "Peinture façade",                     prix: 38, unite: "m²" },
      { nom: "Vitrification parquet",               prix: 45, unite: "m²" },
      { nom: "Enduit de lissage avant peinture",    prix: 15, unite: "m²" },
      { nom: "Pose papier peint",                   prix: 30, unite: "m²" },
    ],
  },
  {
    id: "menuiserie", label: "Menuiserie", emoji: "🪚",
    articles: [
      { nom: "Pose porte intérieure + huisserie",        prix: 450, unite: "u." },
      { nom: "Pose fenêtre PVC double vitrage",          prix: 780, unite: "u." },
      { nom: "Pose parquet flottant + sous-couche",      prix: 55,  unite: "m²" },
      { nom: "Fabrication étagères sur mesure",          prix: 220, unite: "u." },
      { nom: "Pose plan de travail stratifié",           prix: 180, unite: "ml" },
      { nom: "Remplacement porte de garage sectionnelle",prix: 1400, unite: "u."},
    ],
  },
  {
    id: "jardinage", label: "Jardinage", emoji: "🌿",
    articles: [
      { nom: "Tonte pelouse + ramassage",        prix: 45, unite: "h"  },
      { nom: "Taille de haie + évacuation",      prix: 50, unite: "h"  },
      { nom: "Création massif fleuri",           prix: 85, unite: "m²" },
      { nom: "Arrachage arbustes / souches",     prix: 60, unite: "h"  },
      { nom: "Engazonnement (semis)",            prix: 12, unite: "m²" },
      { nom: "Traitement phytosanitaire",        prix: 55, unite: "h"  },
    ],
  },
  {
    id: "toiture", label: "Toiture", emoji: "🏠",
    articles: [
      { nom: "Nettoyage toiture (HP + traitement)", prix: 18,  unite: "m²" },
      { nom: "Remplacement tuiles à l'unité",       prix: 35,  unite: "u." },
      { nom: "Pose de faîtière au mortier",         prix: 45,  unite: "ml" },
      { nom: "Réfection toiture complète",          prix: 165, unite: "m²" },
      { nom: "Réparation gouttière zinc",           prix: 85,  unite: "ml" },
      { nom: "Pose écran sous toiture",             prix: 12,  unite: "m²" },
    ],
  },
  {
    id: "nettoyage", label: "Nettoyage", emoji: "🧹",
    articles: [
      { nom: "Nettoyage haute pression",          prix: 65, unite: "h"  },
      { nom: "Démoussage + hydrofuge façade",     prix: 12, unite: "m²" },
      { nom: "Nettoyage vitres (int. + ext.)",    prix: 15, unite: "u." },
      { nom: "Remise en état locatif",            prix: 55, unite: "h"  },
      { nom: "Débarras + évacuation déchetterie", prix: 70, unite: "h"  },
      { nom: "Nettoyage après travaux",           prix: 48, unite: "h"  },
    ],
  },
  {
    id: "main_oeuvre", label: "Main d'œuvre", emoji: "👷",
    articles: [
      { nom: "Main d'œuvre qualifiée",   prix: 55,  unite: "h"    },
      { nom: "Main d'œuvre compagnon",   prix: 45,  unite: "h"    },
      { nom: "Forfait déplacement",      prix: 30,  unite: "u."   },
      { nom: "Forfait journalier",       prix: 380, unite: "jour" },
      { nom: "Heure supplémentaire",     prix: 70,  unite: "h"    },
      { nom: "Chef de chantier",         prix: 70,  unite: "h"    },
    ],
  },
];

// ── Composant principal ───────────────────────────────────────────────────────
export default function CataloguePrestations({ user, onSelectArticle, onClose }) {
  const [search,          setSearch]          = useState("");
  const [categorieActive, setCategorieActive] = useState("tous");
  const [articlesPerso,   setArticlesPerso]   = useState([]);
  const [showAddForm,     setShowAddForm]     = useState(false);
  const [formPerso, setFormPerso] = useState({ nom: "", description: "", prix_unitaire: "", categorie: "Maçonnerie" });
  const [savingPerso, setSavingPerso] = useState(false);
  const [hoveredId,   setHoveredId]   = useState(null);

  useEffect(() => { chargerArticlesPerso(); }, []);

  const chargerArticlesPerso = async () => {
    const { data } = await supabase
      .from("articles_perso")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setArticlesPerso(data);
  };

  const sauvegarderArticlePerso = async () => {
    if (!formPerso.nom.trim()) return;
    setSavingPerso(true);
    const { error } = await supabase.from("articles_perso").insert({
      user_id:       user.id,
      nom:           formPerso.nom.trim(),
      description:   formPerso.description.trim() || null,
      prix_unitaire: parseFloat(formPerso.prix_unitaire) || 0,
      categorie:     formPerso.categorie,
    });
    setSavingPerso(false);
    if (!error) {
      setFormPerso({ nom: "", description: "", prix_unitaire: "", categorie: "Maçonnerie" });
      setShowAddForm(false);
      chargerArticlesPerso();
    }
  };

  const supprimerArticlePerso = async (id) => {
    await supabase.from("articles_perso").delete().eq("id", id);
    setArticlesPerso(prev => prev.filter(a => a.id !== id));
  };

  const choisir = (description, prix) => {
    onSelectArticle(description, prix);
    onClose();
  };

  // ── Filtres ─────────────────────────────────────────────────────────────────
  const terme = search.toLowerCase();

  const articlesCatalogueFiltrés = CATALOGUE.flatMap(cat =>
    cat.articles.map(a => ({ ...a, catId: cat.id, catLabel: cat.label, catEmoji: cat.emoji }))
  ).filter(a => {
    const okCat    = categorieActive === "tous" || a.catId === categorieActive;
    const okSearch = !terme || a.nom.toLowerCase().includes(terme);
    return okCat && okSearch;
  });

  const articlesPersoFiltrés = articlesPerso.filter(a => {
    const okCat    = categorieActive === "tous" || categorieActive === "mes_articles";
    const okSearch = !terme || a.nom.toLowerCase().includes(terme) || (a.description || "").toLowerCase().includes(terme);
    return okCat && okSearch;
  });

  const showCatalogue = categorieActive !== "mes_articles";
  const showPerso     = categorieActive === "tous" || categorieActive === "mes_articles";

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: DARK, width: "100%", maxWidth: "680px", maxHeight: "88vh",
        borderRadius: "20px", display: "flex", flexDirection: "column",
        border: "1px solid rgba(255,140,0,0.25)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}>

        {/* ── En-tête fixe ───────────────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 0", flexShrink: 0, background: DARK }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h2 style={{ color: "white", margin: 0, fontSize: "19px", fontWeight: "800" }}>
              📚 Catalogue de prestations
            </h2>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >✕</button>
          </div>

          {/* Recherche */}
          <input
            autoFocus
            placeholder="🔍 Rechercher une prestation…"
            value={search}
            onChange={e => { setSearch(e.target.value); if (e.target.value) setCategorieActive("tous"); }}
            style={{ background: CARD, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "11px 16px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", marginBottom: "12px" }}
          />

          {/* Catégories */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "14px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {[
              { id: "tous",        label: "Tous",          emoji: "📋" },
              ...CATALOGUE.map(c => ({ id: c.id, label: c.label, emoji: c.emoji })),
              { id: "mes_articles",label: "Mes articles",  emoji: "⭐" },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategorieActive(cat.id)}
                style={{
                  background: categorieActive === cat.id ? "rgba(255,140,0,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${categorieActive === cat.id ? PRIMARY : "rgba(255,255,255,0.08)"}`,
                  color: categorieActive === cat.id ? PRIMARY : "#8899aa",
                  borderRadius: "10px", padding: "7px 12px",
                  fontSize: "12px", fontWeight: "700",
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0,
                }}
              >{cat.emoji} {cat.label}</button>
            ))}
          </div>
        </div>

        {/* ── Corps scrollable ───────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>

          {/* Mes articles personnalisés — EN PREMIER */}
          {showPerso && (
            <div style={{ marginBottom: showCatalogue ? "24px" : "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", marginTop: "8px" }}>
                <div style={{ color: PRIMARY, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                  ⭐ Mes articles ({articlesPersoFiltrés.length})
                </div>
                <button
                  onClick={() => setShowAddForm(v => !v)}
                  style={{ background: showAddForm ? "rgba(255,100,100,0.1)" : "rgba(255,140,0,0.12)", border: `1px solid ${showAddForm ? "rgba(255,100,100,0.3)" : "rgba(255,140,0,0.3)"}`, color: showAddForm ? "#ff6b6b" : PRIMARY, borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  {showAddForm ? "✕ Annuler" : "+ Ajouter un article"}
                </button>
              </div>

              {/* Formulaire ajout article perso */}
              {showAddForm && (
                <div style={{ background: CARD, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input
                      placeholder="Nom de l'article *"
                      value={formPerso.nom}
                      onChange={e => setFormPerso(p => ({ ...p, nom: e.target.value }))}
                      style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    <input
                      placeholder="Description courte (optionnel)"
                      value={formPerso.description}
                      onChange={e => setFormPerso(p => ({ ...p, description: e.target.value }))}
                      style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input
                        type="number"
                        placeholder="Prix unitaire HT (€)"
                        value={formPerso.prix_unitaire}
                        onChange={e => setFormPerso(p => ({ ...p, prix_unitaire: e.target.value }))}
                        style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }}
                      />
                      <select
                        value={formPerso.categorie}
                        onChange={e => setFormPerso(p => ({ ...p, categorie: e.target.value }))}
                        style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", cursor: "pointer" }}
                      >
                        {CATALOGUE.map(c => <option key={c.id} value={c.label}>{c.emoji} {c.label}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={sauvegarderArticlePerso}
                      disabled={savingPerso || !formPerso.nom.trim()}
                      style={{ background: savingPerso || !formPerso.nom.trim() ? "#444" : PRIMARY, color: "white", border: "none", borderRadius: "9px", padding: "11px", fontSize: "14px", fontWeight: "700", cursor: savingPerso || !formPerso.nom.trim() ? "not-allowed" : "pointer" }}
                    >
                      {savingPerso ? "⏳ Sauvegarde…" : "💾 Sauvegarder dans mes articles"}
                    </button>
                  </div>
                </div>
              )}

              {/* Liste articles perso */}
              {articlesPersoFiltrés.length === 0 && !showAddForm ? (
                <div style={{ textAlign: "center", color: "#555", padding: "28px 20px", fontSize: "13px", fontStyle: "italic", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.07)" }}>
                  Aucun article sauvegardé — cliquez sur "+ Ajouter un article" pour créer vos propres prestations avec vos prix.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
                  {articlesPersoFiltrés.map(a => (
                    <ArticleCardPerso key={a.id} a={a} hoveredId={hoveredId} setHoveredId={setHoveredId} onChoisir={choisir} onSupprimer={supprimerArticlePerso} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Articles catalogue — EN DESSOUS des articles personnels */}
          {showCatalogue && (
            <>
              {/* Vue groupée par catégorie quand "Tous" sans recherche */}
              {categorieActive === "tous" && !terme ? (
                CATALOGUE.map(cat => (
                  <div key={cat.id} style={{ marginBottom: "18px" }}>
                    <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "14px 0 8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{cat.emoji}</span> {cat.label}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
                      {cat.articles.map((a, i) => (
                        <ArticleCard key={i} a={a} id={`${cat.id}-${i}`} hoveredId={hoveredId} setHoveredId={setHoveredId} onChoisir={choisir} />
                      ))}
                    </div>
                  </div>
                ))
              ) : articlesCatalogueFiltrés.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px", marginTop: "8px" }}>
                  {articlesCatalogueFiltrés.map((a, i) => (
                    <ArticleCard key={i} a={a} id={`flat-${i}`} hoveredId={hoveredId} setHoveredId={setHoveredId} onChoisir={choisir} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#555", padding: "40px 20px", fontSize: "13px" }}>
                  Aucun article trouvé pour « {search} »
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Pied fixe ──────────────────────────────────────────────────── */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,140,0,0.1)", background: DARK, flexShrink: 0 }}>
          <p style={{ color: "#555", fontSize: "12px", margin: 0, textAlign: "center" }}>
            Cliquez sur un article pour remplir automatiquement la ligne · Prix indicatifs HT
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Carte article catalogue ───────────────────────────────────────────────────
function ArticleCard({ a, id, hoveredId, setHoveredId, onChoisir }) {
  const hovered = hoveredId === id;
  return (
    <div
      onClick={() => onChoisir(a.nom, a.prix)}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      style={{
        background: hovered ? "rgba(255,140,0,0.1)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,140,0,0.4)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "10px", padding: "12px 14px", cursor: "pointer",
        transition: "all 0.12s", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px",
      }}
    >
      <span style={{ color: hovered ? "white" : "#ccc", fontSize: "13px", fontWeight: "600", flex: 1, minWidth: 0 }}>{a.nom}</span>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ color: PRIMARY, fontWeight: "800", fontSize: "14px" }}>{a.prix} €</div>
        <div style={{ color: "#555", fontSize: "10px" }}>/{a.unite}</div>
      </div>
    </div>
  );
}

// ── Carte article personnalisé ────────────────────────────────────────────────
function ArticleCardPerso({ a, hoveredId, setHoveredId, onChoisir, onSupprimer }) {
  const id = "perso-" + a.id;
  const hovered = hoveredId === id;
  return (
    <div
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      style={{
        background: hovered ? "rgba(255,140,0,0.1)" : "rgba(255,140,0,0.04)",
        border: `1px solid ${hovered ? "rgba(255,140,0,0.4)" : "rgba(255,140,0,0.15)"}`,
        borderRadius: "10px", padding: "12px 14px",
        transition: "all 0.12s", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px",
      }}
    >
      <div
        onClick={() => onChoisir(a.nom, a.prix_unitaire)}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
      >
        <div style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>{a.nom}</div>
        {a.description && <div style={{ color: "#8899aa", fontSize: "11px", marginTop: "2px" }}>{a.description}</div>}
        <div style={{ color: "#555", fontSize: "10px", marginTop: "3px" }}>{a.categorie}</div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: PRIMARY, fontWeight: "800", fontSize: "14px", cursor: "pointer" }} onClick={() => onChoisir(a.nom, a.prix_unitaire)}>
            {parseFloat(a.prix_unitaire).toFixed(2)} €
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSupprimer(a.id); }}
          title="Supprimer"
          style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.25)", color: "#ff6b6b", borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >🗑️</button>
      </div>
    </div>
  );
}
