/**
 * POST /api/analyze-facture-fournisseur
 * Analyse une facture fournisseur (Leroy Merlin, Brico Dépôt, etc.)
 * et extrait les articles, quantités et prix pour les ajouter aux matériaux du chantier.
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

  const { imageBase64, mimeType = "image/jpeg" } = body;
  if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
          {
            type: "text",
            text: `Tu es un expert comptable spécialisé dans le BTP français. Analyse cette facture fournisseur (ticket de caisse, facture Leroy Merlin, Brico Dépôt, Point.P, etc.) et extrais TOUS les articles achetés avec leurs prix.

Réponds UNIQUEMENT avec ce JSON valide (sans markdown ni explication) :
{
  "fournisseur": "string (nom du magasin/fournisseur)",
  "date": "string (date de la facture au format YYYY-MM-DD ou null)",
  "numero_facture": "string ou null",
  "articles": [
    {
      "nom": "string (description courte du produit, 2-5 mots)",
      "quantite": number,
      "unite": "u|m²|m|kg|L|sac|rouleau|boîte|palette",
      "prix_unitaire": number (prix HT par unité),
      "prix_total_ht": number
    }
  ],
  "total_ht": number,
  "tva": number (taux TVA en %, ex: 20),
  "total_ttc": number,
  "lisible": true|false,
  "observations": "string ou null"
}

Règles importantes :
- Extrais CHAQUE article séparément, même s'il y en a beaucoup
- Les prix doivent être en HT (hors TVA). Si uniquement TTC visible, déduis le HT (TVA 20% standard BTP)
- Groupe les articles identiques (même nom, même prix) si répétés
- Pour les noms d'articles : utilise des noms courts et descriptifs (ex: "Carrelage gris 60x60", "Sac ciment CEM II", "Chevron 63x38 3m")
- Si la facture est illisible ou n'est pas une facture, mets lisible=false et observations expliquant pourquoi`
          }
        ]
      }]
    });

    const raw = (msg.content[0]?.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ok: false, error: "Format inattendu", raw: raw.slice(0, 200) });
    return res.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (e) {
    console.error("[analyze-facture-fournisseur]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
