/**
 * POST /api/analyze-agenda
 * Analyse le planning de l'artisan et génère des suggestions intelligentes.
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

  const { evenements, chantiers, devisExpirants, dateAujourdhui } = body;
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    console.error("[analyze-agenda]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
