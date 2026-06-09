import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fr as frPDF } from "./locales/fr";
import { en as enPDF } from "./locales/en";

function getPDFLabels(lang) {
  return lang === "en" ? enPDF.pdf : frPDF.pdf;
}

const THEMES = {
  classique: {
    headerBg: [30, 30, 30],
    headerText: [255, 255, 255],
    accent: [30, 30, 30],
    tableBg: [245, 245, 245],
    textColor: [30, 30, 30],
    grayColor: [100, 100, 100],
    metier: ""
  },
  moderne: {
    headerBg: [255, 140, 0],
    headerText: [255, 255, 255],
    accent: [255, 140, 0],
    tableBg: [255, 245, 230],
    textColor: [30, 30, 30],
    grayColor: [120, 120, 120],
    metier: ""
  },
  couvreur: {
    headerBg: [74, 54, 35],
    headerText: [255, 255, 255],
    accent: [139, 90, 43],
    tableBg: [245, 235, 220],
    textColor: [50, 30, 10],
    grayColor: [120, 100, 80],
    metier: "COUVERTURE & TOITURE"
  },
  paysagiste: {
    headerBg: [27, 94, 32],
    headerText: [255, 255, 255],
    accent: [46, 125, 50],
    tableBg: [232, 245, 233],
    textColor: [20, 60, 20],
    grayColor: [80, 120, 80],
    metier: "ESPACES VERTS & PAYSAGISME"
  },
  traitement: {
    headerBg: [13, 71, 161],
    headerText: [255, 255, 255],
    accent: [21, 101, 192],
    tableBg: [227, 242, 253],
    textColor: [10, 40, 80],
    grayColor: [80, 100, 140],
    metier: "TRAITEMENT & NETTOYAGE TOITURE"
  }
};

function dessinerDecoration(doc, style) {
  if (style === "couvreur") {
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.5);
    doc.line(155, 35, 170, 20);
    doc.line(170, 20, 185, 35);
    doc.line(155, 35, 185, 35);
    doc.setFillColor(255, 255, 255);
    doc.rect(175, 22, 5, 8, "F");
    doc.setLineWidth(0.5);
    doc.line(158, 32, 165, 25);
    doc.line(163, 32, 170, 25);
    doc.line(168, 32, 175, 25);
  } else if (style === "paysagiste") {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    doc.rect(169, 33, 4, 8, "F");
    doc.circle(171, 28, 7, "F");
    doc.circle(165, 30, 5, "F");
    doc.circle(177, 30, 5, "F");
    doc.setLineWidth(1);
    doc.line(155, 41, 190, 41);
  } else if (style === "traitement") {
    doc.setDrawColor(255, 255, 255);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(1.5);
    doc.rect(160, 25, 20, 14, "S");
    doc.line(180, 30, 193, 24);
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("~ ~ ~", 183, 22);
    doc.line(163, 39, 163, 43);
    doc.line(160, 43, 170, 43);
  }
}

/**
 * Construit le document jsPDF et le retourne sans le sauvegarder.
 * @param {object} options.signatureImage  – data URI de la signature dessinée (optionnel)
 * @param {string} options.nomSignataire   – nom du signataire (optionnel)
 */
function construireDoc(document, client, lignes, artisan, estDevis = false, options = {}) {
  const { signatureImage = null, nomSignataire = "", lang = "fr" } = options;
  const lbl = getPDFLabels(lang);
  const locale = lang === "en" ? "en-GB" : "fr-FR";

  const doc = new jsPDF();
  const style = document.style || "classique";
  const theme = THEMES[style] || THEMES.classique;
  const appliquerTva = document.tva > 0;
  const typeDoc = estDevis ? "DEVIS" : "FACTURE";

  // Fond blanc
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");

  // HEADER
  doc.setFillColor(...theme.headerBg);
  doc.rect(0, 0, 210, 50, "F");

  // Bande décorative
  doc.setFillColor(...theme.accent);
  doc.rect(0, 48, 210, 4, "F");

  // Décoration métier
  dessinerDecoration(doc, style);

  // Métier (centré verticalement dans le header de 50px)
  if (theme.metier) {
    doc.setTextColor(...theme.headerText);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(theme.metier, 15, 28);
  }

  // Numéro + type document
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(document.numero, 195, 18, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(lbl.dateLabel + new Date(document.created_at).toLocaleDateString(locale), 195, 26, { align: "right" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(typeDoc, 195, 36, { align: "right" });

  // Date validité pour devis
  if (estDevis && document.date_validite) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(lbl.validUntil + new Date(document.date_validite).toLocaleDateString(locale), 195, 44, { align: "right" });
  }

  // INFOS ARTISAN
  doc.setTextColor(...theme.grayColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(lbl.from, 15, 62);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...theme.textColor);
  doc.setFontSize(11);
  doc.text(artisan.nom || "Votre nom", 15, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...theme.grayColor);
  let yArtisan = 77;
  if (artisan.adresse) { doc.text(artisan.adresse, 15, yArtisan); yArtisan += 7; }
  if (artisan.telephone) { doc.text(lbl.tel + artisan.telephone, 15, yArtisan); yArtisan += 7; }
  if (artisan.siret) { doc.text(lbl.siret + artisan.siret, 15, yArtisan); }

  // INFOS CLIENT
  doc.setFillColor(...theme.tableBg);
  doc.roundedRect(115, 56, 80, 40, 3, 3, "F");
  doc.setTextColor(...theme.grayColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(estDevis ? lbl.toDevis : lbl.to, 120, 63);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...theme.textColor);
  doc.setFontSize(11);
  doc.text(client?.nom || "", 120, 71);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...theme.grayColor);
  let yClient = 78;
  if (client?.adresse) { doc.text(client.adresse, 120, yClient); yClient += 7; }
  if (client?.email) { doc.text(client.email, 120, yClient); yClient += 7; }
  if (client?.telephone) { doc.text(lbl.tel + client.telephone, 120, yClient); }

  // LIGNE SÉPARATRICE
  doc.setDrawColor(...theme.accent);
  doc.setLineWidth(1);
  doc.line(15, 102, 195, 102);

  // TABLEAU
  const tableData = lignes.map(l => [
    l.description,
    l.quantite.toString(),
    l.prix_unitaire.toFixed(2) + " €",
    (l.quantite * l.prix_unitaire).toFixed(2) + " €"
  ]);

  autoTable(doc, {
    startY: 107,
    head: [[lbl.description, lbl.qty, lbl.unitPriceHT, lbl.totalHT]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: theme.headerBg,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10
    },
    bodyStyles: { fontSize: 9, textColor: theme.textColor },
    alternateRowStyles: { fillColor: theme.tableBg },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 30, halign: "right" }
    },
    margin: { left: 15, right: 15 }
  });

  // TOTAUX
  const finalY = doc.lastAutoTable.finalY + 10;
  const totalHT = lignes.reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0);
  const montantTVA = appliquerTva ? totalHT * (document.tva / 100) : 0;
  const totalFinal = totalHT + montantTVA;

  doc.setFillColor(...theme.tableBg);
  doc.roundedRect(120, finalY - 5, 75, appliquerTva ? 40 : 25, 3, 3, "F");

  doc.setTextColor(...theme.grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(lbl.totalHTLabel, 125, finalY + 5);
  doc.setTextColor(...theme.textColor);
  doc.text(totalHT.toFixed(2) + " €", 192, finalY + 5, { align: "right" });

  if (appliquerTva) {
    doc.setTextColor(...theme.grayColor);
    doc.text(`${lbl.vatLabel} (${document.tva}%) :`, 125, finalY + 14);
    doc.setTextColor(...theme.textColor);
    doc.text(montantTVA.toFixed(2) + " €", 192, finalY + 14, { align: "right" });
    doc.setDrawColor(...theme.accent);
    doc.setLineWidth(0.5);
    doc.line(125, finalY + 18, 192, finalY + 18);
    doc.setTextColor(...theme.accent);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(lbl.totalTTC, 125, finalY + 27);
    doc.text(totalFinal.toFixed(2) + " €", 192, finalY + 27, { align: "right" });
  } else {
    doc.setDrawColor(...theme.accent);
    doc.setLineWidth(0.5);
    doc.line(125, finalY + 9, 192, finalY + 9);
    doc.setTextColor(...theme.accent);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(lbl.total, 125, finalY + 18);
    doc.text(totalFinal.toFixed(2) + " €", 192, finalY + 18, { align: "right" });
  }

  if (!appliquerTva) {
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(lbl.vatExempt, 15, finalY + 18);
  }

  // NATURE DE L'OPÉRATION (boîte à gauche du bloc totaux)
  if (document.nature_operation) {
    doc.setFillColor(...theme.tableBg);
    doc.roundedRect(15, finalY - 5, 90, 20, 3, 3, "F");
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(lbl.operation, 20, finalY + 3);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...theme.textColor);
    doc.setFontSize(9);
    doc.text(document.nature_operation, 20, finalY + 11);
  }

  // ZONE SIGNATURE pour devis
  if (estDevis) {
    const sigY = finalY + (appliquerTva ? 50 : 35);
    doc.setDrawColor(...theme.accent);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, sigY, 85, 38, 3, 3, "S");
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(lbl.signature, 18, sigY + 7);
    doc.setFont("helvetica", "normal");

    if (signatureImage && nomSignataire) {
      // Devis signé : on intègre les données réelles
      const dateSig = new Date().toLocaleDateString(locale);
      doc.text(lbl.date + dateSig, 18, sigY + 15);
      doc.text(lbl.name + nomSignataire, 18, sigY + 22);
      try {
        doc.addImage(signatureImage, "PNG", 18, sigY + 24, 60, 12);
      } catch (_) { /* ignore si l'image est invalide */ }
    } else {
      // Devis non encore signé : cases vides
      doc.text(lbl.dateEmpty, 18, sigY + 15);
      doc.text(lbl.nameEmpty, 18, sigY + 22);
      doc.line(18, sigY + 35, 95, sigY + 35);
      doc.text(lbl.signatureLabel, 18, sigY + 33);
    }
  }

  // NOTES
  if (document.notes && document.notes.trim()) {
    const notesY = finalY + (appliquerTva ? 45 : 35);
    doc.setFillColor(...theme.tableBg);
    doc.roundedRect(estDevis ? 105 : 15, notesY - 5, 85, 20, 3, 3, "F");
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(lbl.notes, estDevis ? 110 : 20, notesY + 2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...theme.textColor);
    const lignesNotes = doc.splitTextToSize(document.notes, 75);
    doc.text(lignesNotes, estDevis ? 110 : 20, notesY + 9);
  }

  // ── MENTIONS LÉGALES & IBAN ────────────────────────────────────────────────
  let yMentions = finalY + (appliquerTva ? 72 : 62);

  if (artisan.iban && !estDevis) {
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(lbl.bankTransfer + " " + artisan.iban, 15, yMentions);
    yMentions += 7;
  }

  if (document.tva_sur_debits && !estDevis) {
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(lbl.vatOnDebits, 15, yMentions);
    yMentions += 7;
  }

  // FOOTER
  doc.setFillColor(...theme.headerBg);
  doc.rect(0, 280, 210, 17, "F");
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("artisan-plus.fr", 105, 290, { align: "center" });

  return doc;
}

/**
 * Télécharge le PDF directement.
 * @param {object} options.signatureImage  – data URI de la signature (optionnel)
 * @param {string} options.nomSignataire   – nom du signataire (optionnel)
 */
export function genererFacturePDF(document, client, lignes, artisan, estDevis = false, options = {}) {
  const doc = construireDoc(document, client, lignes, artisan, estDevis, options);
  doc.save(document.numero + ".pdf");
}

// Alias avec paramètre lang explicite pour les appelants qui le passent séparément
export function genererFacturePDFLang(document, client, lignes, artisan, estDevis, options, lang) {
  return genererFacturePDF(document, client, lignes, artisan, estDevis, { ...options, lang });
}

/**
 * Retourne le PDF en base64 data URI (pour l'envoi email).
 * @param {object} options.signatureImage  – data URI canvas (optionnel)
 * @param {string} options.nomSignataire   – nom du signataire (optionnel)
 */
export function genererPDFBase64(document, client, lignes, artisan, estDevis = false, options = {}) {
  const doc = construireDoc(document, client, lignes, artisan, estDevis, options);
  return doc.output("datauristring"); // "data:application/pdf;base64,..."
}

export function genererPDFBase64Lang(document, client, lignes, artisan, estDevis, options, lang) {
  return genererPDFBase64(document, client, lignes, artisan, estDevis, { ...options, lang });
}

// ── Factur-X XML — facturation électronique structurée (EN 16931) ─────────────
// Obligatoire en France pour la réception dès sept. 2026, émission dès sept. 2027

function escapeXml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function fxDate(dateStr) {
  const d = new Date(dateStr || Date.now());
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}

/**
 * Génère le XML Factur-X conforme EN 16931 / MINIMUM.
 * Profil EN16931 si TVA applicable, profil MINIMUM pour les micro-entreprises sans TVA.
 * Ce format est la norme française de facturation électronique structurée,
 * compatible avec toutes les plateformes de dématérialisation partenaires (PDP).
 */
export function genererFactureXML(facture, client, lignes, artisan) {
  const ht      = parseFloat(facture.total_ht) || 0;
  const taux    = parseFloat(facture.tva)      || 0;
  const hasTVA  = taux > 0;
  const tvaAmt  = hasTVA ? ht * (taux / 100) : 0;
  const ttc     = ht + tvaAmt;
  const dateF   = fxDate(facture.created_at);
  const profil  = hasTVA
    ? "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931"
    : "urn:factur-x.eu:1p0:minimum";
  const catCode = hasTVA ? "S" : "E";
  const exRaisonXml = hasTVA ? "" : "<ram:ExemptionReason>Article 293 B du CGI - TVA non applicable</ram:ExemptionReason>";

  const linesXml = (lignes || []).map((l, i) => {
    const lineHT = (parseFloat(l.quantite) * parseFloat(l.prix_unitaire)).toFixed(2);
    return `  <ram:IncludedSupplyChainTradeLineItem>
    <ram:AssociatedDocumentLineDocument><ram:LineID>${i+1}</ram:LineID></ram:AssociatedDocumentLineDocument>
    <ram:SpecifiedTradeProduct><ram:Name>${escapeXml(l.description)}</ram:Name></ram:SpecifiedTradeProduct>
    <ram:SpecifiedLineTradeAgreement>
      <ram:NetPriceProductTradePrice><ram:ChargeAmount>${parseFloat(l.prix_unitaire).toFixed(2)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
    </ram:SpecifiedLineTradeAgreement>
    <ram:SpecifiedLineTradeDelivery>
      <ram:BilledQuantity unitCode="C62">${parseFloat(l.quantite).toFixed(2)}</ram:BilledQuantity>
    </ram:SpecifiedLineTradeDelivery>
    <ram:SpecifiedLineTradeSettlement>
      <ram:ApplicableTradeTax>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CategoryCode>${catCode}</ram:CategoryCode>
        ${hasTVA ? `<ram:RateApplicablePercent>${taux}</ram:RateApplicablePercent>` : ""}
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${lineHT}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
    </ram:SpecifiedLineTradeSettlement>
  </ram:IncludedSupplyChainTradeLineItem>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${profil}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(facture.numero)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${dateF}</udt:DateTimeString></ram:IssueDateTime>
    ${facture.notes ? `<ram:IncludedNote><ram:Content>${escapeXml(facture.notes)}</ram:Content></ram:IncludedNote>` : ""}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${linesXml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(artisan.nom || "")}</ram:Name>
        ${artisan.siret ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(artisan.siret)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}
        <ram:PostalTradeAddress>${artisan.adresse ? `<ram:LineOne>${escapeXml(artisan.adresse)}</ram:LineOne>` : ""}<ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>
        ${artisan.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${escapeXml(artisan.email)}</ram:URIID></ram:URIUniversalCommunication>` : ""}
        ${artisan.siret ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${escapeXml(artisan.siret)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(client?.nom || "")}</ram:Name>
        ${client?.adresse ? `<ram:PostalTradeAddress><ram:LineOne>${escapeXml(client.adresse)}</ram:LineOne><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>` : ""}
        ${client?.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${escapeXml(client.email)}</ram:URIID></ram:URIUniversalCommunication>` : ""}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${tvaAmt.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        ${exRaisonXml}
        <ram:BasisAmount>${ht.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${catCode}</ram:CategoryCode>
        ${hasTVA ? `<ram:RateApplicablePercent>${taux}</ram:RateApplicablePercent>` : ""}
      </ram:ApplicableTradeTax>
      ${artisan.iban ? `<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>30</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${escapeXml(artisan.iban)}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount></ram:SpecifiedTradeSettlementPaymentMeans>` : ""}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${ht.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${ht.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${tvaAmt.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${ttc.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${ttc.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/**
 * Déclenche le téléchargement du fichier Factur-X XML.
 * Nommage : {numero}-facturx.xml
 */
export function telechargerFactureXML(facture, client, lignes, artisan) {
  const xml  = genererFactureXML(facture, client, lignes, artisan);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = facture.numero + "-facturx.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
