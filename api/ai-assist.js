/**
 * POST /api/ai-assist
 * Endpoint unifié pour les assistants IA textuels (sans vision).
 * Remplace generate-recap et analyze-agenda.
 * Champ `type` : "recap" | "agenda"
 * Modèle : claude-opus-4-5
 */
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://artisan-plus.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ ok: false, error: "Corps invalide" }); }

  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const { type } = body;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── RÉCAP MENSUEL ──────────────────────────────────────────────────────────
  if (type === "recap") {
    const { mois, annee, prenom, caPaye, caTotal, facturesPayees, facturesEnvoyees,
      devisCreés, devisAcceptes, tauxAcceptation, nouveauxClients, nbChantiers,
      caPayePrev, tauxAcceptationPrev, nouveauxClientsPrev } = body;

    const progression = caPaye > (caPayePrev || 0) ? "en hausse" : caPaye < (caPayePrev || 0) ? "en baisse" : "stable";

    try {
      const msg = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `Tu es un coach bienveillant pour artisans français. Génère un message d'encouragement chaleureux et personnalisé (3-4 phrases max, 80 mots max) pour ${prenom || "l'artisan"} basé sur son récap du mois de ${mois} ${annee}.

Données du mois :
- CA encaissé : ${(caPaye||0).toFixed(0)} € (${progression} vs mois précédent)
- Factures payées : ${facturesPayees}/${facturesEnvoyees}
- Devis signés : ${devisAcceptes}/${devisCreés} (taux : ${tauxAcceptation}%)
- Nouveaux clients : ${nouveauxClients}
- Chantiers : ${nbChantiers}

Règles :
- Sois précis et utilise les vrais chiffres
- Mentionne 1-2 points forts
- Si progression → encourage à continuer
- Si baisse → sois positif, parle de rebond possible
- Termine par un call-to-action court pour le mois suivant
- Ton professionnel mais humain, jamais condescendant
- Ne commence pas par "Bravo" si les résultats sont mauvais
Réponds UNIQUEMENT avec le texte du message, sans guillemets ni explication.`
        }]
      });

      const message = (msg.content[0]?.text || "").trim();
      return res.json({ ok: true, message });
    } catch (e) {
      console.error("[ai-assist/recap]", e.message);
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── ANALYSE AGENDA ─────────────────────────────────────────────────────────
  if (type === "agenda") {
    const { evenements, chantiers, devisExpirants, dateAujourdhui } = body;

    try {
      const msg = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `Tu es un assistant planning expert pour artisans du bâtiment français. Analyse ce planning et génère des suggestions intelligentes et prioritaires.

Date d'aujourd'hui : ${dateAujourdhui}

Événements des 14 prochains jours :
${JSON.stringify(evenements || [], null, 2)}

Chantiers en cours :
${JSON.stringify(chantiers || [], null, 2)}

Devis qui expirent bientôt :
${JSON.stringify(devisExpirants || [], null, 2)}

Génère 3 à 5 suggestions concrètes et utiles. Réponds UNIQUEMENT avec ce JSON valide :
{
  "suggestions": [
    {
      "type": "alerte|conseil|rappel|optimisation",
      "priorite": "haute|moyenne|basse",
      "emoji": "string",
      "titre": "string",
      "message": "string",
      "action": "string ou null"
    }
  ]
}

Types de suggestions possibles :
- "alerte" : urgent (devis expire demain, conflit planning, météo mauvaise)
- "rappel" : important (relancer client, préparer chantier)
- "conseil" : optimisation (regrouper déplacements, journée libre bien utilisée)
- "optimisation" : suggestion de réorganisation

Sois concis, pratique, et utilise les vrais noms/dates des éléments.`
        }]
      });

      const raw = (msg.content[0]?.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return res.json({ ok: false, error: "Format inattendu" });
      return res.json({ ok: true, ...JSON.parse(match[0]) });
    } catch (e) {
      console.error("[ai-assist/agenda]", e.message);
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(400).json({ ok: false, error: `Type inconnu : ${type}. Valeurs acceptées : recap, agenda` });
}
