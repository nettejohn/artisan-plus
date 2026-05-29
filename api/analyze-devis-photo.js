/**
 * POST /api/analyze-devis-photo
 * Analyse une photo de devis papier avec Claude Vision et retourne les champs extraits.
 * Body : { imageBase64: string, mimeType: string }
 */

import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://artisan-plus.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: "Corps de requête invalide" });
  }

  const { imageBase64, mimeType = "image/jpeg" } = body;
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 requis" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY non configurée" });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Tu es un assistant expert en lecture de devis artisanaux français.

Analyse cette image de devis ou document de travaux et extrais les informations en JSON.

Réponds UNIQUEMENT avec ce JSON valide (sans markdown, sans \`\`\`, sans explication) :
{
  "client_nom": "nom complet du client ou entreprise (string vide si absent)",
  "client_telephone": "numéro de téléphone du client (string vide si absent)",
  "client_adresse": "adresse complète du client (string vide si absent)",
  "lignes": [
    { "description": "description de la prestation ou fourniture", "quantite": 1, "prix_unitaire": 0.00 }
  ],
  "tva": 20,
  "appliquer_tva": true,
  "notes": "notes ou conditions particulières (string vide si absent)"
}

Règles importantes :
- Si le document montre un montant global sans détail de lignes, crée une seule ligne avec description "Travaux" et le montant HT en prix_unitaire
- Les prix sont des nombres (ex: 1500.00), jamais de symbole € ni de virgule décimale → utilise le point
- TVA : si le taux est indiqué, utilise-le (10 ou 20) ; sinon mets 20 et appliquer_tva: false
- Si le document est illisible ou n'est pas un devis, retourne des champs vides avec une ligne vide`
          }
        ]
      }]
    });

    const text = message.content[0].text.trim();
    // Nettoyer les éventuels blocs markdown
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    try {
      const data = JSON.parse(clean);
      return res.status(200).json({ ok: true, data });
    } catch {
      console.error("[analyze-devis-photo] JSON parse error:", clean.slice(0, 200));
      return res.status(200).json({ ok: false, raw: clean });
    }
  } catch (err) {
    console.error("[analyze-devis-photo] Erreur Claude:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
