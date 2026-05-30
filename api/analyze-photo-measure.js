/**
 * POST /api/analyze-photo-measure
 * Analyse une photo et estime les surfaces, dimensions, volumes visibles.
 * Modèle : claude-opus-4-5 (vision)
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

  const { imageBase64, mimeType = "image/jpeg", objet_reference = "" } = body;
  if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
          {
            type: "text",
            text: `Tu es un expert en métrés bâtiment (maçonnerie, menuiserie, peinture, carrelage). Analyse cette photo et estime toutes les surfaces, dimensions et longueurs visibles.
${objet_reference ? `Objet de référence visible dans l'image pour calibrer l'échelle : ${objet_reference}` : ""}
Réponds UNIQUEMENT avec ce JSON valide (sans markdown ni explication) :
{
  "surfaces": [{"nom": "string", "surface_m2": number, "longueur_m": number, "largeur_m": number}],
  "lineaires": [{"nom": "string", "longueur_ml": number}],
  "volumes": [{"nom": "string", "volume_m3": number}],
  "total_m2": number,
  "precision": "faible|moyenne|bonne",
  "notes": "string",
  "conseils": "string"
}
Si tu ne peux pas estimer les dimensions faute de référence, indique-le dans notes et mets precision=faible.`
          }
        ]
      }]
    });

    const raw = (msg.content[0]?.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ok: false, error: "Format de réponse inattendu", raw: raw.slice(0, 200) });
    return res.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (e) {
    console.error("[analyze-photo-measure]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
