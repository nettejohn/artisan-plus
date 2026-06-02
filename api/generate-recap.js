/**
 * POST /api/generate-recap
 * Génère des mots d'encouragement personnalisés pour le récap mensuel.
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

  const { mois, annee, prenom, caPaye, caTotal, facturesPayees, facturesEnvoyees,
    devisCreés, devisAcceptes, tauxAcceptation, nouveauxClients, nbChantiers,
    caPayePrev, tauxAcceptationPrev, nouveauxClientsPrev } = body;

  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    console.error("[generate-recap]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
