/**
 * POST /api/translate-text
 * Traduction professionnelle dans le contexte BTP.
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

  const { texte, langue_cible, langue_source = "auto" } = body;
  if (!texte || !langue_cible) return res.status(400).json({ ok: false, error: "texte et langue_cible requis" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Tu es un traducteur professionnel expert dans le secteur du BTP (bâtiment, travaux publics, artisanat). Tu maîtrises parfaitement le vocabulaire technique : maçonnerie, électricité, plomberie, menuiserie, peinture, carrelage, toiture, isolation, etc.
${langue_source !== "auto" ? `Langue source : ${langue_source}` : "Détecte automatiquement la langue source."}
Langue cible : ${langue_cible}
Texte à traduire : "${texte}"
Réponds UNIQUEMENT avec ce JSON valide (sans markdown ni explication) :
{
  "traduction": "string",
  "langue_detectee": "string",
  "registre": "formel|informel|technique",
  "termes_techniques": [{"original": "string", "traduit": "string", "note": "string"}],
  "notes_traducteur": "string"
}`
      }]
    });

    const raw = (msg.content[0]?.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ok: false, error: "Format inattendu" });
    return res.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (e) {
    console.error("[translate-text]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
