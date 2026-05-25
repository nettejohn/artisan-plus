import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function genererFacturePDF(facture, client, lignes, artisan) {
  const doc = new jsPDF();
  const style = facture.style || "classique";

  // Couleurs selon le style
  const couleurs = {
    classique: { primary: [0, 0, 0], secondary: [100, 100, 100], bg: [255, 255, 255] },
    moderne: { primary: [255, 140, 0], secondary: [150, 150, 150], bg: [10, 22, 40] },
    colore: { primary: [255, 140, 0], secondary: [66, 133, 244], bg: [255, 255, 255] }
  };

  const c = couleurs[style] || couleurs.classique;

  // Fond
  if (style === "moderne") {
    doc.setFillColor(...c.bg);
    doc.rect(0, 0, 210, 297, "F");
  }

  const textColor = style === "moderne" ? [255, 255, 255] : [0, 0, 0];
  const grayColor = style === "moderne" ? [150, 150, 150] : [100, 100, 100];

  // HEADER
  doc.setFillColor(...c.primary);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Artisan+", 15, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Gérez votre activité simplement", 15, 32);

  // Numéro de facture
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(facture.numero, 195, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(facture.created_at).toLocaleDateString("fr-FR"), 195, 26, { align: "right" });

  // INFOS ARTISAN
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("De :", 15, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(artisan.nom || "Votre nom", 15, 62);
  if (artisan.adresse) doc.text(artisan.adresse, 15, 68);
  if (artisan.siret) doc.text("SIRET : " + artisan.siret, 15, 74);
  if (artisan.telephone) doc.text("Tél : " + artisan.telephone, 15, 80);

  // INFOS CLIENT
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Facturé à :", 120, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(client.nom || "", 120, 62);
  if (client.adresse) doc.text(client.adresse, 120, 68);
  if (client.email) doc.text(client.email, 120, 74);
  if (client.telephone) doc.text("Tél : " + client.telephone, 120, 80);

  // LIGNE SÉPARATRICE
  doc.setDrawColor(...c.primary);
  doc.setLineWidth(0.5);
  doc.line(15, 90, 195, 90);

  // TABLEAU DES PRESTATIONS
  const tableData = lignes.map(l => [
    l.description,
    l.quantite.toString(),
    l.prix_unitaire.toFixed(2) + " €",
    (l.quantite * l.prix_unitaire).toFixed(2) + " €"
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Description", "Qté", "Prix unitaire HT", "Total HT"]],
    body: tableData,
    theme: style === "moderne" ? "dark" : "striped",
    headStyles: {
      fillColor: c.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: style === "moderne" ? [200, 200, 200] : [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: style === "moderne" ? [20, 35, 55] : [245, 245, 245]
    },
    margin: { left: 15, right: 15 }
  });

  // TOTAUX
  const finalY = doc.lastAutoTable.finalY + 10;
  const totalHT = lignes.reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0);
  const montantTVA = totalHT * (facture.tva / 100);
  const totalTTC = totalHT + montantTVA;

  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text("Total HT :", 140, finalY);
  doc.setTextColor(...textColor);
  doc.text(totalHT.toFixed(2) + " €", 195, finalY, { align: "right" });

  doc.setTextColor(...grayColor);
  doc.text(`TVA (${facture.tva}%) :`, 140, finalY + 8);
  doc.setTextColor(...textColor);
  doc.text(montantTVA.toFixed(2) + " €", 195, finalY + 8, { align: "right" });

  doc.setDrawColor(...c.primary);
  doc.line(140, finalY + 12, 195, finalY + 12);

  doc.setTextColor(...c.primary);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Total TTC :", 140, finalY + 20);
  doc.text(totalTTC.toFixed(2) + " €", 195, finalY + 20, { align: "right" });

  // NOTES
  if (facture.notes) {
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Notes : " + facture.notes, 15, finalY + 35);
  }

  // FOOTER
  doc.setFillColor(...c.primary);
  doc.rect(0, 280, 210, 17, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Généré avec Artisan+ — artisan-plus.vercel.app", 105, 290, { align: "center" });

  // Télécharger
  doc.save(facture.numero + ".pdf");
}
