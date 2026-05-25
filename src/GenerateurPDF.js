import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const THEMES = {
  classique: {
    headerBg: [30, 30, 30],
    headerText: [255, 255, 255],
    accent: [30, 30, 30],
    tableBg: [245, 245, 245],
    textColor: [30, 30, 30],
    grayColor: [100, 100, 100],
    metier: "FACTURE",
    emoji: ""
  },
  moderne: {
    headerBg: [255, 140, 0],
    headerText: [255, 255, 255],
    accent: [255, 140, 0],
    tableBg: [255, 245, 230],
    textColor: [30, 30, 30],
    grayColor: [120, 120, 120],
    metier: "FACTURE",
    emoji: ""
  },
  couvreur: {
    headerBg: [74, 54, 35],
    headerText: [255, 255, 255],
    accent: [139, 90, 43],
    tableBg: [245, 235, 220],
    textColor: [50, 30, 10],
    grayColor: [120, 100, 80],
    metier: "COUVERTURE & TOITURE",
    emoji: "TOITURE"
  },
  paysagiste: {
    headerBg: [27, 94, 32],
    headerText: [255, 255, 255],
    accent: [46, 125, 50],
    tableBg: [232, 245, 233],
    textColor: [20, 60, 20],
    grayColor: [80, 120, 80],
    metier: "ESPACES VERTS & PAYSAGISME",
    emoji: "JARDINAGE"
  },
  traitement: {
    headerBg: [13, 71, 161],
    headerText: [255, 255, 255],
    accent: [21, 101, 192],
    tableBg: [227, 242, 253],
    textColor: [10, 40, 80],
    grayColor: [80, 100, 140],
    metier: "TRAITEMENT & NETTOYAGE TOITURE",
    emoji: "NETTOYAGE"
  }
};

function dessinerDecoration(doc, theme, style) {
  // Décoration selon le métier
  if (style === "couvreur") {
    // Dessin simplifié d'un toit
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.5);
    doc.line(155, 35, 170, 20);
    doc.line(170, 20, 185, 35);
    doc.line(155, 35, 185, 35);
    // Cheminée
    doc.setFillColor(255, 255, 255);
    doc.rect(175, 22, 5, 8, "F");
    // Tuiles
    doc.setLineWidth(0.5);
    doc.line(158, 32, 165, 25);
    doc.line(163, 32, 170, 25);
    doc.line(168, 32, 175, 25);
  } else if (style === "paysagiste") {
    // Dessin d'un arbre simple
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    // Tronc
    doc.rect(169, 33, 4, 8, "F");
    // Feuillage cercles
    doc.circle(171, 28, 7, "F");
    doc.circle(165, 30, 5, "F");
    doc.circle(177, 30, 5, "F");
    // Herbe
    doc.setLineWidth(1);
    doc.line(155, 41, 190, 41);
  } else if (style === "traitement") {
    // Dessin d'un pulvérisateur simple
    doc.setDrawColor(255, 255, 255);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(1.5);
    // Corps du pulvérisateur
    doc.rect(160, 25, 20, 14, "S");
    // Lance
    doc.line(180, 30, 193, 24);
    // Gouttes
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("~ ~ ~", 183, 22);
    // Poignée
    doc.line(163, 39, 163, 43);
    doc.line(160, 43, 170, 43);
  }
}

export function genererFacturePDF(facture, client, lignes, artisan) {
  const doc = new jsPDF();
  const style = facture.style || "classique";
  const theme = THEMES[style] || THEMES.classique;
  const appliquerTva = facture.tva > 0;

  // Fond blanc
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");

  // HEADER principal
  doc.setFillColor(...theme.headerBg);
  doc.rect(0, 0, 210, 50, "F");

  // Bande décorative en bas du header
  doc.setFillColor(...theme.accent);
  doc.rect(0, 48, 210, 4, "F");

  // Décoration métier
  dessinerDecoration(doc, theme, style);

  // Nom app
  doc.setTextColor(...theme.headerText);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Artisan+", 15, 24);

  // Métier
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(theme.metier, 15, 34);

  // Numéro facture
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(facture.numero, 195, 18, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Date : " + new Date(facture.created_at).toLocaleDateString("fr-FR"), 195, 26, { align: "right" });
  doc.text("FACTURE", 195, 34, { align: "right" });

  // INFOS ARTISAN
  doc.setTextColor(...theme.grayColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DE", 15, 62);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...theme.textColor);
  doc.setFontSize(11);
  doc.text(artisan.nom || "Votre nom", 15, 70);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...theme.grayColor);
  let yArtisan = 77;
  if (artisan.adresse) { doc.text(artisan.adresse, 15, yArtisan); yArtisan += 7; }
  if (artisan.telephone) { doc.text("Tél : " + artisan.telephone, 15, yArtisan); yArtisan += 7; }
  if (artisan.siret) { doc.text("SIRET : " + artisan.siret, 15, yArtisan); }

  // INFOS CLIENT
  doc.setFillColor(...theme.tableBg);
  doc.roundedRect(115, 56, 80, 40, 3, 3, "F");

  doc.setTextColor(...theme.grayColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURÉ À", 120, 63);

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
  if (client?.telephone) { doc.text("Tél : " + client.telephone, 120, yClient); }

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
    head: [["Description", "Qté", "Prix unitaire HT", "Total HT"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: theme.headerBg,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: theme.textColor
    },
    alternateRowStyles: {
      fillColor: theme.tableBg
    },
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
  const montantTVA = appliquerTva ? totalHT * (facture.tva / 100) : 0;
  const totalFinal = totalHT + montantTVA;

  // Fond totaux
  doc.setFillColor(...theme.tableBg);
  doc.roundedRect(120, finalY - 5, 75, appliquerTva ? 40 : 25, 3, 3, "F");

  doc.setTextColor(...theme.grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Total HT :", 125, finalY + 5);
  doc.setTextColor(...theme.textColor);
  doc.text(totalHT.toFixed(2) + " €", 192, finalY + 5, { align: "right" });

  if (appliquerTva) {
    doc.setTextColor(...theme.grayColor);
    doc.text(`TVA (${facture.tva}%) :`, 125, finalY + 14);
    doc.setTextColor(...theme.textColor);
    doc.text(montantTVA.toFixed(2) + " €", 192, finalY + 14, { align: "right" });

    doc.setDrawColor(...theme.accent);
    doc.setLineWidth(0.5);
    doc.line(125, finalY + 18, 192, finalY + 18);

    doc.setTextColor(...theme.accent);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total TTC :", 125, finalY + 27);
    doc.text(totalFinal.toFixed(2) + " €", 192, finalY + 27, { align: "right" });
  } else {
    doc.setDrawColor(...theme.accent);
    doc.setLineWidth(0.5);
    doc.line(125, finalY + 9, 192, finalY + 9);

    doc.setTextColor(...theme.accent);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total :", 125, finalY + 18);
    doc.text(totalFinal.toFixed(2) + " €", 192, finalY + 18, { align: "right" });
  }

  // MENTION TVA NON APPLICABLE
  if (!appliquerTva) {
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("TVA non applicable, art. 293 B du CGI", 15, finalY + 18);
  }

  // NOTES
  if (facture.notes && facture.notes.trim()) {
    const notesY = finalY + (appliquerTva ? 45 : 35);
    doc.setFillColor(...theme.tableBg);
    doc.roundedRect(15, notesY - 5, 90, 20, 3, 3, "F");
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", 20, notesY + 2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...theme.textColor);
    const lignesNotes = doc.splitTextToSize(facture.notes, 80);
    doc.text(lignesNotes, 20, notesY + 9);
  }

  // IBAN
  if (artisan.iban) {
    const ibanY = finalY + (appliquerTva ? 70 : 60);
    doc.setTextColor(...theme.grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Règlement par virement : " + artisan.iban, 15, ibanY);
  }

  // FOOTER
  doc.setFillColor(...theme.headerBg);
  doc.rect(0, 280, 210, 17, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Généré avec Artisan+ — artisan-plus.vercel.app", 105, 290, { align: "center" });

  doc.save(facture.numero + ".pdf");
}
