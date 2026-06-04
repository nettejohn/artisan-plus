import { genererPDFBase64 } from "./GenerateurPDF";

/**
 * Envoie les emails de confirmation après signature d'un devis.
 * Délègue l'appel Resend à l'API serverless /api/send-email (clé côté serveur).
 *
 * @returns {{ success: boolean, artisanEnvoye: boolean, clientEnvoye: boolean, erreurs: string[] }}
 */
export async function envoyerEmailsSignature({
  devis,
  client,
  lignes,
  artisan,
  nomSignataire,
  signatureImage,
}) {
  // Générer le PDF signé en base64 (côté navigateur — jsPDF)
  let pdfBase64 = "";
  try {
    const dataUri = genererPDFBase64(devis, client, lignes, artisan, true, {
      signatureImage,
      nomSignataire,
    });
    pdfBase64 = dataUri.split(",")[1];
  } catch (err) {
    console.error("[emailService] Erreur génération PDF :", err);
    return { success: false, artisanEnvoye: false, clientEnvoye: false, erreurs: ["Erreur génération PDF"] };
  }

  // Appel API serverless — la clé Resend reste côté serveur
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailArtisan:  artisan?.email   || null,
        emailClient:   client?.email    || null,
        nomArtisan:    artisan?.nom     || "",
        nomClient:     client?.nom      || nomSignataire || "",
        numeroDevis:   devis.numero,
        montantTTC:    devis.total_ttc  ?? null,
        pdfBase64,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok && res.status !== 207) {
      return {
        success: false,
        artisanEnvoye: false,
        clientEnvoye: false,
        erreurs: [data.error || `Erreur serveur (${res.status})`],
      };
    }

    return {
      success:       data.success       ?? false,
      artisanEnvoye: data.artisanEnvoye ?? false,
      clientEnvoye:  data.clientEnvoye  ?? false,
      erreurs:       data.erreurs       ?? [],
    };
  } catch (err) {
    console.error("[emailService] Erreur appel /api/send-email :", err);
    return { success: false, artisanEnvoye: false, clientEnvoye: false, erreurs: [err.message] };
  }
}
