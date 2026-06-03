/**
 * POST /api/process-vocal-devis
 * Transforme une transcription vocale en devis structuré.
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

  const { transcription } = body;
  if (!transcription) return res.status(400).json({ ok: false, error: "transcription requise" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Tu es un assistant expert pour artisans du bâtiment français. Analyse cette dictée vocale et extrais les informations pour créer un devis structuré.
Dictée : "${transcription}"
Règles :
- Extrais le nom du client, son téléphone, son adresse si mentionnés
- Décompose les travaux en lignes distinctes avec quantité et prix estimé
- Infère les prix unitaires réalistes (tarifs français BTP 2024) si non mentionnés
- Le taux TVA est 20% par défaut (10% pour rénovation résidentielle)
- Mets les éléments manquants importants dans elements_manquants
Réponds UNIQUEMENT avec ce JSON valide (sans markdown ni explication) :
{
  "client_nom": "string ou null",
  "client_telephone": "string ou null",
  "client_adresse": "string ou null",
  "lignes": [
    {"description": "string", "quantite": number, "unite": "m²|m³|ml|u|h|forfait", "prix_unitaire": number}
  ],
  "notes": "string ou null",
  "tva": 20,
  "appliquer_tva": true,
  "confiance": "faible|moyenne|élevée",
  "elements_manquants": ["string"]
}`
      }]
    });

    const raw = (msg.content[0]?.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ok: false, error: "Format inattendu" });
    return res.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (e) {
    console.error("[process-vocal-devis]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
