/**
 * Blog SEO Artisan+ — 82 articles optimisés pour le référencement Google
 * Routes : /blog, /blog/:slug
 */
import { useState, useEffect } from "react";

const P  = "#FF8C00";
const D  = "#0a1628";
const C  = "#111e35";
const G  = "#8899aa";
const BASE = "https://www.artisan-plus.fr";

function navigate(to) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setPageMeta(title, description, canonical) {
  document.title = title;
  const up = (sel, attr, name, content) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  };
  up('meta[name="description"]',   "name",     "description",   description);
  up('meta[property="og:title"]',  "property", "og:title",      title);
  up('meta[property="og:description"]',"property","og:description",description);
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = canonical;
}

// ── DONNÉES ARTICLES ──────────────────────────────────────────────────────────
export const ARTICLES = [
  /* ── Dévis & facturation générale ───────────────────────────────────── */
  { slug:"comment-faire-devis-artisan",             titre:"Comment faire un devis artisan professionnel ? Guide complet 2025",      cat:"Gestion",    emoji:"📄", metier:null,          sujet:"devis",    date:"2025-11-15", lecture:6 },
  { slug:"logiciel-devis-facture-artisan-gratuit",  titre:"Meilleur logiciel devis facture artisan gratuit en 2025",                cat:"Gestion",    emoji:"💻", metier:null,          sujet:"logiciel", date:"2025-11-10", lecture:5 },
  { slug:"mentions-obligatoires-devis",             titre:"Mentions obligatoires sur un devis artisan : liste complète 2025",       cat:"Gestion",    emoji:"📋", metier:null,          sujet:"legal",    date:"2025-10-28", lecture:4 },
  { slug:"signature-electronique-devis-legal",      titre:"Signature électronique devis artisan : est-ce légalement valide ?",      cat:"Gestion",    emoji:"✍️", metier:null,          sujet:"legal",    date:"2025-10-20", lecture:5 },
  { slug:"paiement-en-ligne-artisan",               titre:"Paiement en ligne pour artisan : guide complet 2025",                    cat:"Gestion",    emoji:"💶", metier:null,          sujet:"paiement", date:"2025-10-12", lecture:5 },
  { slug:"relance-facture-impayee",                 titre:"Comment relancer une facture impayée artisan ? Templates gratuits",      cat:"Gestion",    emoji:"📨", metier:null,          sujet:"facture",  date:"2025-09-30", lecture:4 },
  { slug:"tva-artisan-auto-entrepreneur",           titre:"TVA artisan et auto-entrepreneur : tout comprendre en 2025",             cat:"Comptabilité",emoji:"🧾",metier:null,          sujet:"tva",      date:"2025-09-18", lecture:6 },
  { slug:"urssaf-auto-entrepreneur-artisan",        titre:"URSSAF auto-entrepreneur artisan : cotisations, déclarations 2025",      cat:"Comptabilité",emoji:"📊",metier:null,          sujet:"urssaf",   date:"2025-09-05", lecture:5 },
  { slug:"site-web-artisan-gratuit",                titre:"Comment créer un site web artisan gratuit en 2025 ?",                    cat:"Marketing",  emoji:"🌐", metier:null,          sujet:"site",     date:"2025-08-20", lecture:5 },
  { slug:"application-chantier-smartphone",         titre:"Meilleure application chantier sur smartphone en 2025",                  cat:"Gestion",    emoji:"📱", metier:null,          sujet:"appli",    date:"2025-08-08", lecture:4 },
  /* ── Plomberie ───────────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-plombier",            titre:"Comment faire un devis plombier professionnel ? Modèle gratuit",        cat:"Plomberie",  emoji:"🔧", metier:"plombier",    sujet:"devis",    date:"2025-11-20", lecture:6 },
  { slug:"logiciel-facture-plombier-gratuit",       titre:"Logiciel facture plombier gratuit : comparatif 2025",                   cat:"Plomberie",  emoji:"🔧", metier:"plombier",    sujet:"logiciel", date:"2025-11-08", lecture:5 },
  { slug:"tarif-plombier-2025",                     titre:"Tarif plombier 2025 : grille de prix complète",                         cat:"Plomberie",  emoji:"🔧", metier:"plombier",    sujet:"tarif",    date:"2025-10-25", lecture:5 },
  { slug:"devis-installation-chauffe-eau",          titre:"Devis installation chauffe-eau : prix et modèle 2025",                  cat:"Plomberie",  emoji:"🔧", metier:"plombier",    sujet:"chantier", date:"2025-10-10", lecture:4 },
  { slug:"application-devis-plombier",              titre:"Application devis plombier iPhone Android : les meilleures en 2025",    cat:"Plomberie",  emoji:"🔧", metier:"plombier",    sujet:"appli",    date:"2025-09-22", lecture:4 },
  { slug:"devis-debouchage-canalisation",           titre:"Devis débouchage canalisation : prix et que doit-il contenir ?",        cat:"Plomberie",  emoji:"🔧", metier:"plombier",    sujet:"chantier", date:"2025-09-08", lecture:3 },
  /* ── Électricité ─────────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-electricien",         titre:"Comment faire un devis électricien professionnel ? Guide 2025",         cat:"Électricité",emoji:"⚡", metier:"électricien", sujet:"devis",    date:"2025-11-18", lecture:6 },
  { slug:"logiciel-facture-electricien-gratuit",    titre:"Logiciel facture électricien gratuit : quel outil choisir ?",           cat:"Électricité",emoji:"⚡", metier:"électricien", sujet:"logiciel", date:"2025-11-05", lecture:5 },
  { slug:"tarif-electricien-2025",                  titre:"Tarif électricien 2025 : prix horaire et grille complète",              cat:"Électricité",emoji:"⚡", metier:"électricien", sujet:"tarif",    date:"2025-10-22", lecture:5 },
  { slug:"devis-installation-electrique-maison",    titre:"Devis installation électrique maison : prix et modèle",                 cat:"Électricité",emoji:"⚡", metier:"électricien", sujet:"chantier", date:"2025-10-08", lecture:4 },
  { slug:"application-devis-electricien",           titre:"Application devis électricien : la meilleure app en 2025",              cat:"Électricité",emoji:"⚡", metier:"électricien", sujet:"appli",    date:"2025-09-20", lecture:4 },
  { slug:"devis-tableau-electrique",                titre:"Devis remplacement tableau électrique : prix 2025",                     cat:"Électricité",emoji:"⚡", metier:"électricien", sujet:"chantier", date:"2025-09-06", lecture:3 },
  /* ── Maçonnerie ──────────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-macon",               titre:"Comment faire un devis maçon ? Guide complet et modèle gratuit",        cat:"Maçonnerie", emoji:"🧱", metier:"maçon",       sujet:"devis",    date:"2025-11-12", lecture:5 },
  { slug:"logiciel-facture-macon",                  titre:"Logiciel facture maçon gratuit : comparatif et guide 2025",             cat:"Maçonnerie", emoji:"🧱", metier:"maçon",       sujet:"logiciel", date:"2025-10-30", lecture:5 },
  { slug:"tarif-macon-2025",                        titre:"Tarif maçon 2025 : prix au m² et par type de travaux",                  cat:"Maçonnerie", emoji:"🧱", metier:"maçon",       sujet:"tarif",    date:"2025-10-15", lecture:4 },
  { slug:"devis-renovation-maison-macon",           titre:"Devis rénovation maison : que doit contenir le devis d'un maçon ?",     cat:"Maçonnerie", emoji:"🧱", metier:"maçon",       sujet:"chantier", date:"2025-09-28", lecture:4 },
  /* ── Carrelage ───────────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-carreleur",           titre:"Comment faire un devis carreleur professionnel ? Modèle 2025",         cat:"Carrelage",  emoji:"🏠", metier:"carreleur",   sujet:"devis",    date:"2025-11-06", lecture:5 },
  { slug:"logiciel-facture-carreleur",              titre:"Logiciel facture carreleur : quel outil pour les pros ?",               cat:"Carrelage",  emoji:"🏠", metier:"carreleur",   sujet:"logiciel", date:"2025-10-18", lecture:4 },
  { slug:"tarif-carreleur-2025",                    titre:"Tarif carreleur 2025 : prix pose au m² par type de carrelage",          cat:"Carrelage",  emoji:"🏠", metier:"carreleur",   sujet:"tarif",    date:"2025-10-02", lecture:4 },
  /* ── Peinture ────────────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-peintre",             titre:"Comment faire un devis peintre ? Modèle gratuit et guide",              cat:"Peinture",   emoji:"🎨", metier:"peintre",     sujet:"devis",    date:"2025-11-14", lecture:5 },
  { slug:"logiciel-facture-peintre",                titre:"Logiciel facture peintre gratuit : le meilleur en 2025",                cat:"Peinture",   emoji:"🎨", metier:"peintre",     sujet:"logiciel", date:"2025-10-26", lecture:4 },
  { slug:"tarif-peintre-2025",                      titre:"Tarif peintre 2025 : prix au m² intérieur et extérieur",               cat:"Peinture",   emoji:"🎨", metier:"peintre",     sujet:"tarif",    date:"2025-10-06", lecture:4 },
  { slug:"devis-peinture-maison-interieur",         titre:"Devis peinture maison intérieur : prix et conseils 2025",              cat:"Peinture",   emoji:"🎨", metier:"peintre",     sujet:"chantier", date:"2025-09-24", lecture:4 },
  /* ── Menuiserie ──────────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-menuisier",           titre:"Comment faire un devis menuisier professionnel ? Guide 2025",          cat:"Menuiserie", emoji:"🪚", metier:"menuisier",   sujet:"devis",    date:"2025-11-16", lecture:5 },
  { slug:"logiciel-facture-menuisier",              titre:"Logiciel facture menuisier gratuit : quel choix en 2025 ?",             cat:"Menuiserie", emoji:"🪚", metier:"menuisier",   sujet:"logiciel", date:"2025-11-02", lecture:4 },
  { slug:"tarif-menuisier-2025",                    titre:"Tarif menuisier 2025 : prix pose fenêtre, porte, parquet",             cat:"Menuiserie", emoji:"🪚", metier:"menuisier",   sujet:"tarif",    date:"2025-10-14", lecture:4 },
  { slug:"devis-fenetre-double-vitrage",            titre:"Devis fenêtre double vitrage : prix et ce que doit contenir le devis", cat:"Menuiserie", emoji:"🪚", metier:"menuisier",   sujet:"chantier", date:"2025-09-26", lecture:4 },
  /* ── Couverture/Toiture ──────────────────────────────────────────────── */
  { slug:"comment-faire-devis-couvreur",            titre:"Comment faire un devis couvreur professionnel ? Modèle 2025",         cat:"Toiture",    emoji:"🏠", metier:"couvreur",    sujet:"devis",    date:"2025-11-19", lecture:6 },
  { slug:"logiciel-facture-couvreur",               titre:"Logiciel facture couvreur : quel outil choisir en 2025 ?",             cat:"Toiture",    emoji:"🏠", metier:"couvreur",    sujet:"logiciel", date:"2025-11-07", lecture:5 },
  { slug:"tarif-couvreur-2025",                     titre:"Tarif couvreur 2025 : prix toiture au m² par matériau",               cat:"Toiture",    emoji:"🏠", metier:"couvreur",    sujet:"tarif",    date:"2025-10-24", lecture:5 },
  { slug:"devis-refection-toiture-complete",        titre:"Devis réfection toiture complète : prix et modèle 2025",              cat:"Toiture",    emoji:"🏠", metier:"couvreur",    sujet:"chantier", date:"2025-10-09", lecture:5 },
  { slug:"application-devis-couvreur",              titre:"Application devis couvreur : les meilleures apps 2025",               cat:"Toiture",    emoji:"🏠", metier:"couvreur",    sujet:"appli",    date:"2025-09-25", lecture:4 },
  { slug:"devis-nettoyage-toiture-antimousse",      titre:"Devis nettoyage toiture anti-mousse : prix et guide 2025",            cat:"Toiture",    emoji:"🏠", metier:"couvreur",    sujet:"chantier", date:"2025-09-12", lecture:4 },
  /* ── Chauffage/Clim ──────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-chauffagiste",        titre:"Comment faire un devis chauffagiste ? Guide et modèle 2025",          cat:"Chauffage",  emoji:"🔥", metier:"chauffagiste",sujet:"devis",    date:"2025-11-17", lecture:5 },
  { slug:"logiciel-facture-chauffagiste",           titre:"Logiciel facture chauffagiste gratuit : comparatif 2025",             cat:"Chauffage",  emoji:"🔥", metier:"chauffagiste",sujet:"logiciel", date:"2025-11-03", lecture:4 },
  { slug:"tarif-chauffagiste-2025",                 titre:"Tarif chauffagiste 2025 : prix installation et entretien",            cat:"Chauffage",  emoji:"🔥", metier:"chauffagiste",sujet:"tarif",    date:"2025-10-16", lecture:4 },
  { slug:"devis-pompe-chaleur-2025",                titre:"Devis pompe à chaleur 2025 : prix, aides et comparatifs",            cat:"Chauffage",  emoji:"🔥", metier:"chauffagiste",sujet:"chantier", date:"2025-10-01", lecture:6 },
  { slug:"devis-installation-climatisation",        titre:"Devis installation climatisation : prix et modèle 2025",             cat:"Chauffage",  emoji:"🔥", metier:"chauffagiste",sujet:"chantier", date:"2025-09-15", lecture:5 },
  /* ── Serrurerie ──────────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-serrurier",           titre:"Comment faire un devis serrurier professionnel ? Guide 2025",        cat:"Serrurerie", emoji:"🔑", metier:"serrurier",   sujet:"devis",    date:"2025-11-11", lecture:5 },
  { slug:"logiciel-facture-serrurier",              titre:"Logiciel facture serrurier : quel outil pour les serruriers ?",       cat:"Serrurerie", emoji:"🔑", metier:"serrurier",   sujet:"logiciel", date:"2025-10-27", lecture:4 },
  { slug:"tarif-serrurier-2025",                    titre:"Tarif serrurier 2025 : prix ouverture de porte et remplacement",     cat:"Serrurerie", emoji:"🔑", metier:"serrurier",   sujet:"tarif",    date:"2025-10-11", lecture:4 },
  /* ── Jardinage/Paysagisme ────────────────────────────────────────────── */
  { slug:"comment-faire-devis-jardinier",           titre:"Comment faire un devis jardinier/paysagiste ? Modèle 2025",          cat:"Jardinage",  emoji:"🌿", metier:"jardinier",   sujet:"devis",    date:"2025-11-13", lecture:5 },
  { slug:"logiciel-facture-jardinier",              titre:"Logiciel facture jardinier gratuit : les meilleurs en 2025",         cat:"Jardinage",  emoji:"🌿", metier:"jardinier",   sujet:"logiciel", date:"2025-10-29", lecture:4 },
  { slug:"tarif-jardinier-2025",                    titre:"Tarif jardinier 2025 : prix tonte, taille, entretien",              cat:"Jardinage",  emoji:"🌿", metier:"jardinier",   sujet:"tarif",    date:"2025-10-13", lecture:4 },
  { slug:"devis-amenagement-jardin",                titre:"Devis aménagement jardin : prix et que doit-il contenir ?",         cat:"Jardinage",  emoji:"🌿", metier:"jardinier",   sujet:"chantier", date:"2025-09-27", lecture:4 },
  { slug:"application-devis-paysagiste",            titre:"Application devis paysagiste : les meilleures apps 2025",           cat:"Jardinage",  emoji:"🌿", metier:"jardinier",   sujet:"appli",    date:"2025-09-13", lecture:4 },
  /* ── Charpente ───────────────────────────────────────────────────────── */
  { slug:"devis-charpente-bois",                    titre:"Devis charpente bois : prix et modèle 2025",                        cat:"Charpente",  emoji:"🌲", metier:"charpentier", sujet:"chantier", date:"2025-10-17", lecture:4 },
  { slug:"logiciel-facture-charpentier",            titre:"Logiciel facture charpentier : quel outil choisir ?",               cat:"Charpente",  emoji:"🌲", metier:"charpentier", sujet:"logiciel", date:"2025-10-03", lecture:4 },
  /* ── Plaquisterie/Façade ─────────────────────────────────────────────── */
  { slug:"devis-pose-plaquiste",                    titre:"Devis plaquiste/plâtrier : prix et modèle 2025",                    cat:"Plaquisterie",emoji:"🏗️",metier:"plaquiste",   sujet:"chantier", date:"2025-10-19", lecture:4 },
  { slug:"logiciel-facture-plaquiste",              titre:"Logiciel facture plaquiste gratuit : comparatif 2025",              cat:"Plaquisterie",emoji:"🏗️",metier:"plaquiste",   sujet:"logiciel", date:"2025-10-05", lecture:4 },
  { slug:"devis-ravalement-facade",                 titre:"Devis ravalement de façade : prix au m² et modèle 2025",           cat:"Façade",     emoji:"🏢", metier:"façadier",    sujet:"chantier", date:"2025-10-21", lecture:5 },
  { slug:"logiciel-facture-facadier",               titre:"Logiciel facture façadier : l'outil idéal en 2025",                cat:"Façade",     emoji:"🏢", metier:"façadier",    sujet:"logiciel", date:"2025-10-07", lecture:4 },
  /* ── Nettoyage ───────────────────────────────────────────────────────── */
  { slug:"devis-nettoyage-facade-maison",           titre:"Devis nettoyage façade maison : prix et guide 2025",               cat:"Nettoyage",  emoji:"🧹", metier:"nettoyeur",   sujet:"chantier", date:"2025-10-23", lecture:4 },
  { slug:"logiciel-facture-nettoyage",              titre:"Logiciel facture nettoyage professionnel : comparatif 2025",       cat:"Nettoyage",  emoji:"🧹", metier:"nettoyeur",   sujet:"logiciel", date:"2025-09-29", lecture:4 },
  { slug:"devis-laveur-vitres",                     titre:"Devis laveur de vitres professionnel : prix 2025",                 cat:"Nettoyage",  emoji:"🪟", metier:"laveur de vitres",sujet:"chantier",date:"2025-09-17",lecture:3 },
  /* ── Solaire ─────────────────────────────────────────────────────────── */
  { slug:"devis-panneaux-solaires-2025",            titre:"Devis panneaux solaires photovoltaïques 2025 : prix et aides",     cat:"Solaire",    emoji:"☀️", metier:"installateur solaire",sujet:"chantier",date:"2025-11-09",lecture:6 },
  { slug:"logiciel-facture-installateur-solaire",   titre:"Logiciel facture installateur solaire : quel outil ?",             cat:"Solaire",    emoji:"☀️", metier:"installateur solaire",sujet:"logiciel",date:"2025-10-31",lecture:4 },
  /* ── Piscinerie ──────────────────────────────────────────────────────── */
  { slug:"devis-piscine-2025",                      titre:"Devis piscine 2025 : prix construction et entretien",              cat:"Piscinerie", emoji:"🏊", metier:"pisciniste",  sujet:"chantier", date:"2025-10-20", lecture:5 },
  { slug:"logiciel-facture-pisciniste",             titre:"Logiciel facture pisciniste : l'outil idéal pour les pros",       cat:"Piscinerie", emoji:"🏊", metier:"pisciniste",  sujet:"logiciel", date:"2025-10-04", lecture:4 },
  /* ── Autres métiers ──────────────────────────────────────────────────── */
  { slug:"devis-ramonage-cheminee",                 titre:"Devis ramonage cheminée : prix et obligations légales 2025",       cat:"Ramonage",   emoji:"🏠", metier:"ramoneur",    sujet:"chantier", date:"2025-09-23", lecture:3 },
  { slug:"logiciel-facture-metallier-soudeur",      titre:"Logiciel facture métallier et soudeur : comparatif 2025",         cat:"Métallerie", emoji:"⚙️", metier:"métallier",   sujet:"logiciel", date:"2025-09-10", lecture:4 },
  { slug:"logiciel-facture-elagueur",               titre:"Logiciel facture élagueur : quel outil pour les arboristes ?",    cat:"Élagage",    emoji:"🌳", metier:"élagueur",    sujet:"logiciel", date:"2025-09-03", lecture:4 },
  { slug:"devis-anti-mousse-toiture",               titre:"Devis traitement anti-mousse toiture : prix et guide 2025",       cat:"Nettoyage",  emoji:"🏠", metier:"couvreur",    sujet:"chantier", date:"2025-08-28", lecture:3 },
  { slug:"logiciel-facture-ramoneur",               titre:"Logiciel facture ramoneur : l'outil pour les ramoneurs",          cat:"Ramonage",   emoji:"🏠", metier:"ramoneur",    sujet:"logiciel", date:"2025-08-22", lecture:4 },
  /* ── Gestion & outils ────────────────────────────────────────────────── */
  { slug:"gestion-chantier-logiciel-artisan",       titre:"Logiciel gestion de chantier artisan : comparatif 2025",          cat:"Gestion",    emoji:"🏗️", metier:null,          sujet:"chantier", date:"2025-11-01", lecture:5 },
  { slug:"auto-entrepreneur-artisan-logiciel",      titre:"Logiciel auto-entrepreneur artisan : lequel choisir en 2025 ?",   cat:"Gestion",    emoji:"🧾", metier:null,          sujet:"logiciel", date:"2025-10-28", lecture:5 },
  { slug:"suivi-clients-artisan-conseils",          titre:"Suivi clients artisan : les meilleures pratiques en 2025",        cat:"Marketing",  emoji:"👥", metier:null,          sujet:"clients",  date:"2025-10-11", lecture:4 },
  { slug:"artisan-micro-entrepreneur-obligations",  titre:"Artisan micro-entrepreneur : obligations légales et fiscales 2025",cat:"Comptabilité",emoji:"📊",metier:null,          sujet:"legal",    date:"2025-09-16", lecture:6 },
  /* ── Articles supplémentaires Phase 1 ──────────────────────────────────── */
  { slug:"devis-isolation-thermique",              titre:"Devis isolation thermique extérieure (ITE) : prix et aides 2025",  cat:"Gestion",     emoji:"🏠", metier:"isolateur",   sujet:"chantier", date:"2025-11-22", lecture:5 },
  { slug:"devis-terrassement-2025",               titre:"Devis terrassement et VRD : prix au m³ et modèle 2025",            cat:"Gestion",     emoji:"🚜", metier:"terrassier",  sujet:"chantier", date:"2025-11-21", lecture:4 },
  { slug:"application-devis-artisan-iphone",      titre:"Meilleure application devis artisan iPhone et Android 2025",       cat:"Gestion",     emoji:"📱", metier:null,          sujet:"appli",    date:"2025-11-04", lecture:4 },
  { slug:"facturer-acompte-artisan",              titre:"Comment facturer un acompte artisan ? Guide pratique 2025",        cat:"Gestion",     emoji:"💶", metier:null,          sujet:"facture",  date:"2025-10-09", lecture:4 },
  /* ── Nouveaux métiers : guides ──────────────────────────────────────────── */
  { slug:"comment-faire-devis-charpentier",       titre:"Comment faire un devis charpentier ? Modèle et guide 2025",        cat:"Charpente",   emoji:"🌲", metier:"charpentier", sujet:"devis",    date:"2025-11-25", lecture:5 },
  { slug:"logiciel-facture-charpentier-pro",      titre:"Logiciel facture charpentier pro : quel outil choisir ?",          cat:"Charpente",   emoji:"🌲", metier:"charpentier", sujet:"logiciel", date:"2025-11-12", lecture:4 },
  { slug:"comment-faire-devis-plaquiste",         titre:"Comment faire un devis plaquiste/plâtrier ? Modèle 2025",          cat:"Plaquisterie",emoji:"🏗️", metier:"plaquiste",   sujet:"devis",    date:"2025-11-23", lecture:5 },
  { slug:"tarif-plaquiste-2025",                  titre:"Tarif plaquiste 2025 : prix pose plaques de plâtre au m²",         cat:"Plaquisterie",emoji:"🏗️", metier:"plaquiste",   sujet:"tarif",    date:"2025-11-10", lecture:4 },
  { slug:"comment-faire-devis-facadier",          titre:"Comment faire un devis façadier/ravalement ? Guide 2025",          cat:"Façade",      emoji:"🏢", metier:"façadier",    sujet:"devis",    date:"2025-11-24", lecture:5 },
  { slug:"tarif-ravalement-facade-2025",          titre:"Tarif ravalement de façade 2025 : prix au m² selon matériau",      cat:"Façade",      emoji:"🏢", metier:"façadier",    sujet:"tarif",    date:"2025-11-11", lecture:5 },
  { slug:"comment-faire-devis-climaticien",       titre:"Comment faire un devis climatisation ? Guide et modèle 2025",      cat:"Chauffage",   emoji:"❄️", metier:"climaticien", sujet:"devis",    date:"2025-11-26", lecture:5 },
  { slug:"tarif-climatisation-maison-2025",       titre:"Tarif installation climatisation maison 2025 : prix complet",      cat:"Chauffage",   emoji:"❄️", metier:"climaticien", sujet:"tarif",    date:"2025-11-13", lecture:5 },
  { slug:"logiciel-facture-climaticien",          titre:"Logiciel facture climaticien : l'outil idéal en 2025",             cat:"Chauffage",   emoji:"❄️", metier:"climaticien", sujet:"logiciel", date:"2025-10-31", lecture:4 },
  { slug:"tarif-elagueur-2025",                   titre:"Tarif élagueur 2025 : prix élagage et abattage d'arbres",          cat:"Jardinage",   emoji:"🌳", metier:"élagueur",    sujet:"tarif",    date:"2025-11-08", lecture:4 },
  { slug:"comment-faire-devis-paysagiste",        titre:"Comment faire un devis paysagiste ? Modèle complet 2025",          cat:"Jardinage",   emoji:"🌿", metier:"paysagiste",  sujet:"devis",    date:"2025-11-27", lecture:5 },
  { slug:"tarif-paysagiste-2025",                 titre:"Tarif paysagiste 2025 : prix aménagement paysager",                cat:"Jardinage",   emoji:"🌿", metier:"paysagiste",  sujet:"tarif",    date:"2025-11-14", lecture:4 },
  { slug:"comment-faire-devis-terrassier",        titre:"Comment faire un devis terrassement ? Guide 2025",                 cat:"Gestion",     emoji:"🚜", metier:"terrassier",  sujet:"devis",    date:"2025-11-28", lecture:4 },
  { slug:"tarif-vitrier-2025",                    titre:"Tarif vitrier 2025 : prix remplacement vitrage double vitrage",     cat:"Menuiserie",  emoji:"🪟", metier:"vitrier",     sujet:"tarif",    date:"2025-11-09", lecture:4 },
  { slug:"logiciel-facture-vitrier",              titre:"Logiciel facture vitrier gratuit : quel outil choisir ?",           cat:"Menuiserie",  emoji:"🪟", metier:"vitrier",     sujet:"logiciel", date:"2025-10-25", lecture:4 },
  { slug:"devis-installation-alarme-maison",      titre:"Devis installation alarme maison : prix et que contenir ?",        cat:"Sécurité",    emoji:"🔒", metier:"installateur alarme",sujet:"chantier",date:"2025-11-15",lecture:4 },
  { slug:"logiciel-facture-installateur-alarme",  titre:"Logiciel facture installateur alarme : l'outil idéal",             cat:"Sécurité",    emoji:"🔒", metier:"installateur alarme",sujet:"logiciel",date:"2025-10-22",lecture:4 },
  { slug:"devis-pose-parquet-2025",               titre:"Devis pose parquet 2025 : prix au m² selon type de parquet",       cat:"Menuiserie",  emoji:"🪵", metier:"poseur de parquet",sujet:"chantier",date:"2025-11-16",lecture:4 },
  { slug:"logiciel-facture-poseur-parquet",       titre:"Logiciel facture poseur de parquet : quel outil ?",                cat:"Menuiserie",  emoji:"🪵", metier:"poseur de parquet",sujet:"logiciel",date:"2025-10-23",lecture:4 },
  { slug:"devis-installation-domotique",          titre:"Devis installation domotique maison 2025 : prix et guide",         cat:"Domotique",   emoji:"🏠", metier:"domoticien",  sujet:"chantier", date:"2025-11-17", lecture:5 },
  { slug:"logiciel-facture-domoticien",           titre:"Logiciel facture domoticien : l'application idéale 2025",          cat:"Domotique",   emoji:"🏠", metier:"domoticien",  sujet:"logiciel", date:"2025-10-24", lecture:4 },
  /* ── Articles prix par ville ────────────────────────────────────────────── */
  { slug:"prix-plombier-paris-2025",              titre:"Prix plombier à Paris 2025 : tarifs, grille et comparatif",        cat:"Plomberie",   emoji:"🔧", metier:"plombier",    sujet:"tarif",    date:"2025-12-01", lecture:5 },
  { slug:"prix-electricien-lyon-2025",            titre:"Prix électricien à Lyon 2025 : tarif horaire et devis",            cat:"Électricité", emoji:"⚡", metier:"électricien", sujet:"tarif",    date:"2025-12-02", lecture:5 },
  { slug:"prix-macon-marseille-2025",             titre:"Prix maçon à Marseille 2025 : tarifs et devis gratuit",            cat:"Maçonnerie",  emoji:"🧱", metier:"maçon",       sujet:"tarif",    date:"2025-12-03", lecture:5 },
  { slug:"tarif-couvreur-toulouse-2025",          titre:"Tarif couvreur à Toulouse 2025 : prix toiture et devis",           cat:"Toiture",     emoji:"🏗️", metier:"couvreur",    sujet:"tarif",    date:"2025-12-04", lecture:5 },
  { slug:"prix-peintre-bordeaux-2025",            titre:"Prix peintre à Bordeaux 2025 : tarif horaire et au m²",            cat:"Peinture",    emoji:"🎨", metier:"peintre",     sujet:"tarif",    date:"2025-12-05", lecture:4 },
  { slug:"tarif-menuisier-lille-2025",            titre:"Tarif menuisier à Lille 2025 : prix pose fenêtres, portes",        cat:"Menuiserie",  emoji:"🪚", metier:"menuisier",   sujet:"tarif",    date:"2025-12-06", lecture:4 },
  { slug:"prix-chauffagiste-nantes-2025",         titre:"Prix chauffagiste à Nantes 2025 : tarif intervention et devis",    cat:"Chauffage",   emoji:"🔥", metier:"chauffagiste",sujet:"tarif",    date:"2025-12-07", lecture:4 },
  { slug:"tarif-serrurier-strasbourg-2025",       titre:"Tarif serrurier à Strasbourg 2025 : prix ouverture de porte",      cat:"Serrurerie",  emoji:"🔑", metier:"serrurier",   sujet:"tarif",    date:"2025-12-08", lecture:4 },
  { slug:"prix-carreleur-montpellier-2025",       titre:"Prix carreleur à Montpellier 2025 : tarif pose au m²",             cat:"Carrelage",   emoji:"🏠", metier:"carreleur",   sujet:"tarif",    date:"2025-12-09", lecture:4 },
  { slug:"tarif-jardinier-nice-2025",             titre:"Tarif jardinier à Nice 2025 : prix entretien et aménagement",      cat:"Jardinage",   emoji:"🌿", metier:"jardinier",   sujet:"tarif",    date:"2025-12-10", lecture:4 },
  { slug:"prix-plombier-lyon-2025",               titre:"Prix plombier à Lyon 2025 : tarif intervention et urgence",        cat:"Plomberie",   emoji:"🔧", metier:"plombier",    sujet:"tarif",    date:"2025-12-11", lecture:4 },
  { slug:"tarif-electricien-paris-2025",          titre:"Tarif électricien à Paris 2025 : prix horaire et forfait",         cat:"Électricité", emoji:"⚡", metier:"électricien", sujet:"tarif",    date:"2025-12-12", lecture:4 },
  { slug:"prix-couvreur-paris-2025",              titre:"Prix couvreur à Paris 2025 : tarif réfection et réparation",       cat:"Toiture",     emoji:"🏗️", metier:"couvreur",    sujet:"tarif",    date:"2025-12-13", lecture:4 },
  { slug:"tarif-macon-lyon-2025",                 titre:"Tarif maçon à Lyon 2025 : prix travaux gros œuvre",                cat:"Maçonnerie",  emoji:"🧱", metier:"maçon",       sujet:"tarif",    date:"2025-12-14", lecture:4 },
  { slug:"prix-peintre-paris-2025",               titre:"Prix peintre en bâtiment à Paris 2025 : tarif au m²",              cat:"Peinture",    emoji:"🎨", metier:"peintre",     sujet:"tarif",    date:"2025-12-15", lecture:4 },
  { slug:"tarif-chauffagiste-marseille-2025",     titre:"Tarif chauffagiste à Marseille 2025 : prix chaudière et PAC",      cat:"Chauffage",   emoji:"🔥", metier:"chauffagiste",sujet:"tarif",    date:"2025-12-16", lecture:4 },
  { slug:"prix-plombier-marseille-2025",          titre:"Prix plombier à Marseille 2025 : tarifs interventions",            cat:"Plomberie",   emoji:"🔧", metier:"plombier",    sujet:"tarif",    date:"2025-12-17", lecture:4 },
  { slug:"tarif-electricien-marseille-2025",      titre:"Tarif électricien à Marseille 2025 : prix mise aux normes",        cat:"Électricité", emoji:"⚡", metier:"électricien", sujet:"tarif",    date:"2025-12-18", lecture:4 },
  { slug:"prix-carreleur-paris-2025",             titre:"Prix carreleur à Paris 2025 : tarif pose carrelage",               cat:"Carrelage",   emoji:"🏠", metier:"carreleur",   sujet:"tarif",    date:"2025-12-19", lecture:4 },
  { slug:"tarif-menuisier-paris-2025",            titre:"Tarif menuisier à Paris 2025 : prix fenêtres et parquet",          cat:"Menuiserie",  emoji:"🪚", metier:"menuisier",   sujet:"tarif",    date:"2025-12-20", lecture:4 },
  /* ── Guides pratiques artisan ───────────────────────────────────────────── */
  { slug:"comment-creer-mini-site-artisan",       titre:"Comment créer son mini-site artisan gratuit ? Guide 2025",         cat:"Marketing",   emoji:"🌐", metier:null,          sujet:"site",     date:"2025-12-21", lecture:5 },
  { slug:"assurance-decennale-artisan-guide",     titre:"Assurance décennale artisan : obligation, coût et souscription",   cat:"Gestion",     emoji:"🛡️", metier:null,          sujet:"legal",    date:"2025-12-22", lecture:6 },
  { slug:"acompte-devis-artisan-combien",         titre:"Acompte sur devis artisan : quel pourcentage demander ?",          cat:"Gestion",     emoji:"💶", metier:null,          sujet:"facture",  date:"2025-12-23", lecture:4 },
  { slug:"planning-chantier-artisan-guide",       titre:"Planifier ses chantiers d'artisan : méthode et outils 2025",       cat:"Gestion",     emoji:"📅", metier:null,          sujet:"chantier", date:"2025-12-24", lecture:5 },
  { slug:"photos-chantier-client-guide",          titre:"Photos de chantier : comment les partager avec vos clients ?",     cat:"Gestion",     emoji:"📸", metier:null,          sujet:"chantier", date:"2025-12-25", lecture:4 },
  { slug:"retenue-garantie-artisan",              titre:"Retenue de garantie artisan : calcul, durée et remboursement",     cat:"Comptabilité",emoji:"📊", metier:null,          sujet:"legal",    date:"2025-12-26", lecture:5 },
  { slug:"note-de-frais-artisan-auto-entrepreneur",titre:"Note de frais artisan auto-entrepreneur : comment les déduire ?", cat:"Comptabilité",emoji:"🧾", metier:null,          sujet:"urssaf",   date:"2025-12-27", lecture:5 },
  { slug:"sous-traitance-artisan-guide",          titre:"Sous-traitance artisan : cadre légal, contrat et facturation",     cat:"Gestion",     emoji:"🤝", metier:null,          sujet:"legal",    date:"2025-12-28", lecture:5 },
  { slug:"facture-situations-travaux-artisan",    titre:"Factures de situations de travaux : guide complet artisan",        cat:"Gestion",     emoji:"📄", metier:null,          sujet:"facture",  date:"2025-12-29", lecture:5 },
  { slug:"gestion-equipe-artisan-ouvriers",       titre:"Gérer ses ouvriers et sous-traitants avec une app artisan",        cat:"Gestion",     emoji:"👷", metier:null,          sujet:"chantier", date:"2025-12-30", lecture:4 },
  { slug:"responsabilite-civile-pro-artisan",     titre:"RC Pro artisan : pourquoi c'est indispensable en 2025 ?",          cat:"Gestion",     emoji:"🛡️", metier:null,          sujet:"legal",    date:"2026-01-02", lecture:4 },
  { slug:"kbis-siret-artisan-obtenir",            titre:"KBIS et SIRET artisan : comment les obtenir et à quoi servent-ils",cat:"Gestion",     emoji:"📋", metier:null,          sujet:"legal",    date:"2026-01-03", lecture:4 },
  { slug:"devis-gratuit-obligatoire-artisan",     titre:"Le devis est-il obligatoire pour un artisan ? Règles 2025",        cat:"Gestion",     emoji:"📄", metier:null,          sujet:"legal",    date:"2026-01-04", lecture:4 },
  { slug:"relance-client-artisan-astuces",        titre:"Relancer ses clients artisan efficacement : emails et SMS",        cat:"Marketing",   emoji:"📨", metier:null,          sujet:"clients",  date:"2026-01-05", lecture:4 },
  { slug:"avis-clients-artisan-google",           titre:"Obtenir des avis clients 5 étoiles sur Google : guide artisan",   cat:"Marketing",   emoji:"⭐", metier:null,          sujet:"clients",  date:"2026-01-06", lecture:4 },
  { slug:"paiement-stripe-artisan-guide",         titre:"Accepter les paiements en ligne avec Stripe : guide artisan",     cat:"Gestion",     emoji:"💳", metier:null,          sujet:"paiement", date:"2026-01-07", lecture:5 },
  /* ── Applications et logiciels spécialisés ──────────────────────────────── */
  { slug:"application-devis-charpentier",         titre:"Application devis charpentier : les meilleures apps 2025",        cat:"Charpente",   emoji:"🌲", metier:"charpentier", sujet:"appli",    date:"2026-01-08", lecture:4 },
  { slug:"logiciel-facture-frigoriste",           titre:"Logiciel facture frigoriste : quel outil en 2025 ?",               cat:"Froid",       emoji:"❄️", metier:"frigoriste",  sujet:"logiciel", date:"2026-01-09", lecture:4 },
  { slug:"application-devis-pisciniste-pro",      titre:"Application devis pisciniste professionnel 2025",                  cat:"Piscinerie",  emoji:"🏊", metier:"pisciniste",  sujet:"appli",    date:"2026-01-10", lecture:4 },
  { slug:"logiciel-facture-paveur",               titre:"Logiciel facture paveur et dalleur : comparatif 2025",             cat:"Maçonnerie",  emoji:"🧱", metier:"paveur",      sujet:"logiciel", date:"2026-01-11", lecture:4 },
  { slug:"logiciel-facture-marbrier",             titre:"Logiciel facture marbrier : l'outil pour les marbriers",           cat:"Marbrerie",   emoji:"🪨", metier:"marbrier",    sujet:"logiciel", date:"2026-01-12", lecture:4 },
  { slug:"application-devis-terrassier",          titre:"Application devis terrassier : les meilleures apps 2025",          cat:"Gestion",     emoji:"🚜", metier:"terrassier",  sujet:"appli",    date:"2026-01-13", lecture:4 },
  { slug:"logiciel-facture-laveur-vitres",        titre:"Logiciel facture laveur de vitres : quel outil choisir ?",         cat:"Nettoyage",   emoji:"🪟", metier:"laveur de vitres",sujet:"logiciel",date:"2026-01-14",lecture:4 },
  { slug:"application-devis-climaticien",         titre:"Application devis climaticien : top outils 2025",                  cat:"Chauffage",   emoji:"❄️", metier:"climaticien", sujet:"appli",    date:"2026-01-15", lecture:4 },
  { slug:"logiciel-facture-installateur-pac",     titre:"Logiciel facture installateur pompe à chaleur 2025",               cat:"Chauffage",   emoji:"♨️", metier:"installateur PAC",sujet:"logiciel",date:"2026-01-16",lecture:4 },
  { slug:"application-devis-deboucheur",          titre:"Application devis déboucheur : les meilleures apps 2025",          cat:"Plomberie",   emoji:"🔧", metier:"déboucheur",  sujet:"appli",    date:"2026-01-17", lecture:4 },
  { slug:"logiciel-facture-technicien-fibre",     titre:"Logiciel facture technicien fibre : quel outil en 2025 ?",         cat:"Réseaux",     emoji:"📡", metier:"technicien fibre",sujet:"logiciel",date:"2026-01-18",lecture:4 },
  { slug:"application-devis-elagueur-pro",        titre:"Application devis élagueur professionnel 2025",                    cat:"Jardinage",   emoji:"🌳", metier:"élagueur",    sujet:"appli",    date:"2026-01-19", lecture:4 },
  { slug:"logiciel-facture-staffeur",             titre:"Logiciel facture staffeur : l'outil pour les décorateurs",         cat:"Décoration",  emoji:"🏛️", metier:"staffeur",    sujet:"logiciel", date:"2026-01-20", lecture:4 },
  { slug:"logiciel-facture-debarrasseur",         titre:"Logiciel facture débarrasseur : gérez vos prestations facilement", cat:"Gestion",     emoji:"📦", metier:"débarrasseur",sujet:"logiciel", date:"2026-01-21", lecture:4 },
  { slug:"logiciel-facture-desinsectiseur",       titre:"Logiciel facture désinsectiseur : quel outil en 2025 ?",           cat:"Nuisibles",   emoji:"🐛", metier:"désinsectiseur",sujet:"logiciel",date:"2026-01-22",lecture:4 },
  { slug:"logiciel-devis-isolateur-thermique",    titre:"Logiciel devis isolateur thermique : comparatif 2025",             cat:"Isolation",   emoji:"🏠", metier:"isolateur",   sujet:"logiciel", date:"2026-01-23", lecture:4 },
  { slug:"application-devis-paysagiste-2025",     titre:"Application devis paysagiste et jardinier paysager 2025",          cat:"Jardinage",   emoji:"🌿", metier:"paysagiste",  sujet:"appli",    date:"2026-01-24", lecture:4 },
  { slug:"logiciel-facture-echafaudeur",          titre:"Logiciel facture échafaudeur : gérez vos locations facilement",    cat:"Gestion",     emoji:"🏗️", metier:"échafaudeur", sujet:"logiciel", date:"2026-01-25", lecture:4 },
  /* ── Comparatifs et guides logiciels ────────────────────────────────────── */
  { slug:"meilleur-logiciel-devis-artisan-2025",  titre:"Meilleur logiciel de devis artisan 2025 : comparatif complet",    cat:"Gestion",     emoji:"💻", metier:null,          sujet:"logiciel", date:"2026-01-26", lecture:7 },
  { slug:"artisan-plus-vs-tolteck-comparatif",    titre:"Artisan+ vs Tolteck : comparatif complet 2025",                   cat:"Gestion",     emoji:"⚖️", metier:null,          sujet:"logiciel", date:"2026-01-27", lecture:5 },
  { slug:"artisan-plus-vs-obat-comparatif",       titre:"Artisan+ vs Obat : quel logiciel artisan choisir en 2025 ?",      cat:"Gestion",     emoji:"⚖️", metier:null,          sujet:"logiciel", date:"2026-01-28", lecture:5 },
  { slug:"logiciel-facturation-auto-entrepreneur-btp",titre:"Logiciel facturation auto-entrepreneur BTP : top 5 en 2025",  cat:"Gestion",     emoji:"🧾", metier:null,          sujet:"logiciel", date:"2026-01-29", lecture:5 },
  { slug:"application-gestion-artisan-gratuite",  titre:"Application gestion artisan gratuite : quelles options en 2025 ?",cat:"Gestion",     emoji:"📱", metier:null,          sujet:"appli",    date:"2026-01-30", lecture:5 },
  /* ── Guides légaux et fiscaux ───────────────────────────────────────────── */
  { slug:"auto-liquidation-tva-sous-traitant",    titre:"Auto-liquidation TVA sous-traitant BTP : guide artisan 2025",     cat:"Comptabilité",emoji:"📊", metier:null,          sujet:"tva",      date:"2026-02-01", lecture:5 },
  { slug:"declaration-revenus-artisan-2025",      titre:"Déclaration revenus artisan auto-entrepreneur 2025 : guide",       cat:"Comptabilité",emoji:"📊", metier:null,          sujet:"urssaf",   date:"2026-02-02", lecture:5 },
  { slug:"compte-bancaire-pro-artisan",           titre:"Compte bancaire professionnel artisan : obligatoire ou pas ?",     cat:"Gestion",     emoji:"🏦", metier:null,          sujet:"legal",    date:"2026-02-03", lecture:4 },
  { slug:"mention-rge-artisan-devis-facture",     titre:"Mention RGE sur devis et factures artisan : guide complet",        cat:"Gestion",     emoji:"♻️", metier:null,          sujet:"legal",    date:"2026-02-04", lecture:4 },
  { slug:"artisan-formation-professionnelle",     titre:"Formation professionnelle artisan : quelles aides en 2025 ?",      cat:"Gestion",     emoji:"🎓", metier:null,          sujet:"legal",    date:"2026-02-05", lecture:5 },
  /* ── Nouveaux métiers : tarifs spécialisés ──────────────────────────────── */
  { slug:"tarif-pisciniste-construction-2025",    titre:"Tarif pisciniste 2025 : prix construction et rénovation piscine",  cat:"Piscinerie",  emoji:"🏊", metier:"pisciniste",  sujet:"tarif",    date:"2026-02-06", lecture:5 },
  { slug:"tarif-installateur-solaire-2025",       titre:"Tarif installateur solaire 2025 : prix panneaux et installation",  cat:"Solaire",     emoji:"☀️", metier:"installateur solaire",sujet:"tarif",date:"2026-02-07",lecture:5 },
  { slug:"tarif-charpentier-2025",                titre:"Tarif charpentier 2025 : prix charpente bois et ossature",         cat:"Charpente",   emoji:"🌲", metier:"charpentier", sujet:"tarif",    date:"2026-02-08", lecture:4 },
  { slug:"tarif-terrassement-2025",               titre:"Tarif terrassement 2025 : prix au m³ selon type de terrain",       cat:"Gestion",     emoji:"🚜", metier:"terrassier",  sujet:"tarif",    date:"2026-02-09", lecture:4 },
  { slug:"tarif-domotique-maison-2025",           titre:"Tarif installation domotique maison 2025 : prix budget complet",   cat:"Domotique",   emoji:"🏠", metier:"domoticien",  sujet:"tarif",    date:"2026-02-10", lecture:5 },
  { slug:"tarif-alarme-maison-2025",              titre:"Tarif installation alarme maison 2025 : prix et comparatif",        cat:"Sécurité",    emoji:"🔒", metier:"installateur alarme",sujet:"tarif",date:"2026-02-11",lecture:4 },
  { slug:"tarif-nettoyage-professionnel-2025",    titre:"Tarif nettoyage professionnel bâtiment 2025 : prix au m²",         cat:"Nettoyage",   emoji:"🧹", metier:"nettoyeur",   sujet:"tarif",    date:"2026-02-12", lecture:4 },
  { slug:"tarif-pavage-dallage-2025",             titre:"Tarif pavage et dallage 2025 : prix pose extérieure au m²",        cat:"Maçonnerie",  emoji:"🧱", metier:"paveur",      sujet:"tarif",    date:"2026-02-13", lecture:4 },
  /* ── Articles par ville supplémentaires ─────────────────────────────────── */
  { slug:"prix-plombier-rennes-2025",             titre:"Prix plombier à Rennes 2025 : tarifs et devis gratuit",            cat:"Plomberie",   emoji:"🔧", metier:"plombier",    sujet:"tarif",    date:"2026-02-14", lecture:4 },
  { slug:"tarif-electricien-toulouse-2025",       titre:"Tarif électricien à Toulouse 2025 : prix horaire et devis",        cat:"Électricité", emoji:"⚡", metier:"électricien", sujet:"tarif",    date:"2026-02-15", lecture:4 },
  { slug:"prix-couvreur-lyon-2025",               titre:"Prix couvreur à Lyon 2025 : tarif réfection toiture",              cat:"Toiture",     emoji:"🏗️", metier:"couvreur",    sujet:"tarif",    date:"2026-02-16", lecture:4 },
  { slug:"tarif-peintre-lyon-2025",               titre:"Tarif peintre à Lyon 2025 : prix peinture intérieure au m²",       cat:"Peinture",    emoji:"🎨", metier:"peintre",     sujet:"tarif",    date:"2026-02-17", lecture:4 },
  { slug:"prix-menuisier-bordeaux-2025",          titre:"Prix menuisier à Bordeaux 2025 : tarif pose et installation",      cat:"Menuiserie",  emoji:"🪚", metier:"menuisier",   sujet:"tarif",    date:"2026-02-18", lecture:4 },
  { slug:"tarif-serrurier-paris-2025",            titre:"Tarif serrurier à Paris 2025 : prix ouverture et remplacement",    cat:"Serrurerie",  emoji:"🔑", metier:"serrurier",   sujet:"tarif",    date:"2026-02-19", lecture:4 },
  { slug:"prix-chauffagiste-paris-2025",          titre:"Prix chauffagiste à Paris 2025 : tarif chaudière et PAC",          cat:"Chauffage",   emoji:"🔥", metier:"chauffagiste",sujet:"tarif",    date:"2026-02-20", lecture:4 },
  { slug:"tarif-carreleur-lyon-2025",             titre:"Tarif carreleur à Lyon 2025 : prix pose carrelage et faïence",     cat:"Carrelage",   emoji:"🏠", metier:"carreleur",   sujet:"tarif",    date:"2026-02-21", lecture:4 },
  { slug:"prix-macon-toulouse-2025",              titre:"Prix maçon à Toulouse 2025 : tarif travaux maçonnerie",            cat:"Maçonnerie",  emoji:"🧱", metier:"maçon",       sujet:"tarif",    date:"2026-02-22", lecture:4 },
  { slug:"tarif-jardinier-paris-2025",            titre:"Tarif jardinier à Paris 2025 : prix entretien et élagage",         cat:"Jardinage",   emoji:"🌿", metier:"jardinier",   sujet:"tarif",    date:"2026-02-23", lecture:4 },
  /* ── Conseils business artisan ──────────────────────────────────────────── */
  { slug:"developper-son-activite-artisan",       titre:"Développer son activité d'artisan : 10 conseils pratiques 2025",   cat:"Marketing",   emoji:"🚀", metier:null,          sujet:"clients",  date:"2026-02-24", lecture:6 },
  { slug:"fidéliser-clients-artisan",             titre:"Fidéliser ses clients artisan : les meilleures stratégies",        cat:"Marketing",   emoji:"⭐", metier:null,          sujet:"clients",  date:"2026-02-25", lecture:5 },
  { slug:"reseaux-sociaux-artisan-guide",         titre:"Réseaux sociaux pour artisans : comment trouver des chantiers ?",  cat:"Marketing",   emoji:"📱", metier:null,          sujet:"site",     date:"2026-02-26", lecture:5 },
  { slug:"facturation-electronique-artisan-2026", titre:"Facturation électronique obligatoire artisan 2026 : se préparer", cat:"Comptabilité",emoji:"📄", metier:null,          sujet:"legal",    date:"2026-02-27", lecture:5 },
  { slug:"numerisation-artisan-comment-commencer",titre:"Numériser son activité artisan : par où commencer en 2025 ?",      cat:"Gestion",     emoji:"💻", metier:null,          sujet:"logiciel", date:"2026-03-01", lecture:5 },
  { slug:"devis-en-ligne-artisan-avantages",      titre:"Devis en ligne pour artisans : avantages et fonctionnement",       cat:"Gestion",     emoji:"📄", metier:null,          sujet:"devis",    date:"2026-03-02", lecture:4 },
  /* ── Métiers spécialisés supplémentaires ────────────────────────────────── */
  { slug:"tarif-etancheite-toiture-2025",         titre:"Tarif étanchéité toiture plate 2025 : prix au m² par type",       cat:"Étanchéité",  emoji:"💧", metier:"étanchéiste", sujet:"tarif",    date:"2026-03-03", lecture:4 },
  { slug:"logiciel-facture-etancheite",           titre:"Logiciel facture étanchéité : quel outil pour les étanchéistes ?", cat:"Étanchéité",  emoji:"💧", metier:"étanchéiste", sujet:"logiciel", date:"2026-03-04", lecture:4 },
  { slug:"tarif-ferrailleur-2025",                titre:"Tarif ferrailleur 2025 : prix ferraillage béton armé au m²",       cat:"Gros œuvre",  emoji:"⚙️", metier:"ferrailleur", sujet:"tarif",    date:"2026-03-05", lecture:4 },
  { slug:"logiciel-facture-soudeur",              titre:"Logiciel facture soudeur : comparatif des meilleurs outils",       cat:"Métallerie",  emoji:"🔩", metier:"soudeur",     sujet:"logiciel", date:"2026-03-06", lecture:4 },
  { slug:"tarif-miroitier-2025",                  titre:"Tarif miroitier 2025 : prix remplacement miroir et vitrage",       cat:"Menuiserie",  emoji:"🪞", metier:"miroitier",   sujet:"tarif",    date:"2026-03-07", lecture:4 },
  { slug:"logiciel-facture-stucateur",            titre:"Logiciel facture stucateur : gérez votre activité facilement",    cat:"Décoration",  emoji:"🎨", metier:"stucateur",   sujet:"logiciel", date:"2026-03-08", lecture:4 },
  { slug:"tarif-pose-parquet-2025",               titre:"Tarif pose de parquet 2025 : prix selon type et finition",        cat:"Menuiserie",  emoji:"🪵", metier:"poseur de parquet",sujet:"tarif",date:"2026-03-09",lecture:4 },
  { slug:"tarif-pose-fenetres-2025",              titre:"Tarif pose de fenêtres 2025 : prix PVC, alu et bois",             cat:"Menuiserie",  emoji:"🪟", metier:"poseur de fenêtres",sujet:"tarif",date:"2026-03-10",lecture:4 },
  { slug:"tarif-pose-volets-2025",                titre:"Tarif pose volets et stores 2025 : prix installation",            cat:"Menuiserie",  emoji:"🏠", metier:"poseur de volets",sujet:"tarif", date:"2026-03-11", lecture:4 },
  { slug:"tarif-nettoyage-toiture-2025",          titre:"Tarif nettoyage toiture 2025 : prix traitement anti-mousse",      cat:"Nettoyage",   emoji:"🏠", metier:"nettoyeur",   sujet:"tarif",    date:"2026-03-12", lecture:4 },
  { slug:"tarif-debouchage-canalisation-2025",    titre:"Tarif débouchage canalisation 2025 : prix selon type d'urgence",  cat:"Plomberie",   emoji:"🔧", metier:"déboucheur",  sujet:"tarif",    date:"2026-03-13", lecture:4 },
  { slug:"tarif-desinsectisation-2025",           titre:"Tarif désinsectisation 2025 : prix traitement nuisibles",         cat:"Nuisibles",   emoji:"🐛", metier:"désinsectiseur",sujet:"tarif",  date:"2026-03-14", lecture:4 },
  { slug:"tarif-debarras-maison-2025",            titre:"Tarif débarras maison 2025 : prix vidage appartement",            cat:"Débarras",    emoji:"📦", metier:"débarrasseur",sujet:"tarif",    date:"2026-03-15", lecture:4 },
  /* ── Facturation électronique obligatoire 2026 ────────────────────────────── */
  { slug:"facturation-electronique-artisan-2026",                 titre:"Facturation électronique obligatoire artisan 2026 : tout comprendre",                               cat:"Facturation électronique",emoji:"⚡",metier:null,         sujet:"facture-elec", date:"2026-04-01", lecture:7 },
  { slug:"logiciel-facture-electronique-artisan-gratuit",         titre:"Logiciel facture électronique artisan gratuit : les meilleures solutions 2026",                    cat:"Facturation électronique",emoji:"💻",metier:null,         sujet:"facture-elec", date:"2026-04-02", lecture:5 },
  { slug:"facturation-electronique-obligatoire-tpe-2027",         titre:"Facturation électronique obligatoire TPE 2027 : ce qui change pour les artisans",                  cat:"Facturation électronique",emoji:"📋",metier:null,         sujet:"facture-elec", date:"2026-04-03", lecture:6 },
  { slug:"facturx-artisan-explication",                           titre:"Factur-X : le format de facture électronique structurée pour artisans",                            cat:"Facturation électronique",emoji:"🧾",metier:null,         sujet:"facture-elec", date:"2026-04-04", lecture:5 },
  { slug:"chorus-pro-artisan-guide",                              titre:"Chorus Pro artisan : comment facturer les collectivités publiques",                                 cat:"Facturation électronique",emoji:"🏛️",metier:null,        sujet:"facture-elec", date:"2026-04-05", lecture:5 },
  { slug:"pdp-plateforme-dematerialisation-artisan",              titre:"PDP (Plateforme de Dématérialisation Partenaire) : guide artisan 2026",                            cat:"Facturation électronique",emoji:"🔗",metier:null,         sujet:"facture-elec", date:"2026-04-06", lecture:6 },
  { slug:"application-facture-electronique-plombier-2026",        titre:"Application facture électronique plombier 2026 : guide complet",                                   cat:"Facturation électronique",emoji:"🔧",metier:"plombier",    sujet:"facture-elec", date:"2026-04-07", lecture:5 },
  { slug:"application-facture-electronique-electricien-2026",     titre:"Application facture électronique électricien 2026 : guide complet",                                cat:"Facturation électronique",emoji:"⚡",metier:"électricien",  sujet:"facture-elec", date:"2026-04-08", lecture:5 },
  { slug:"application-facture-electronique-macon-2026",           titre:"Application facture électronique maçon 2026 : guide complet",                                      cat:"Facturation électronique",emoji:"🧱",metier:"maçon",         sujet:"facture-elec", date:"2026-04-09", lecture:5 },
  { slug:"application-facture-electronique-carreleur-2026",       titre:"Application facture électronique carreleur 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"🏠",metier:"carreleur",    sujet:"facture-elec", date:"2026-04-10", lecture:5 },
  { slug:"application-facture-electronique-peintre-2026",         titre:"Application facture électronique peintre 2026 : guide complet",                                    cat:"Facturation électronique",emoji:"🎨",metier:"peintre",      sujet:"facture-elec", date:"2026-04-11", lecture:5 },
  { slug:"application-facture-electronique-menuisier-2026",       titre:"Application facture électronique menuisier 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"🪚",metier:"menuisier",    sujet:"facture-elec", date:"2026-04-12", lecture:5 },
  { slug:"application-facture-electronique-chauffagiste-2026",    titre:"Application facture électronique chauffagiste 2026 : guide complet",                               cat:"Facturation électronique",emoji:"🔥",metier:"chauffagiste", sujet:"facture-elec", date:"2026-04-13", lecture:5 },
  { slug:"application-facture-electronique-serrurier-2026",       titre:"Application facture électronique serrurier 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"🔑",metier:"serrurier",    sujet:"facture-elec", date:"2026-04-14", lecture:5 },
  { slug:"application-facture-electronique-couvreur-2026",        titre:"Application facture électronique couvreur 2026 : guide complet",                                   cat:"Facturation électronique",emoji:"🏗️",metier:"couvreur",    sujet:"facture-elec", date:"2026-04-15", lecture:5 },
  { slug:"application-facture-electronique-jardinier-2026",       titre:"Application facture électronique jardinier 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"🌿",metier:"jardinier",    sujet:"facture-elec", date:"2026-04-16", lecture:5 },
  { slug:"application-facture-electronique-charpentier-2026",     titre:"Application facture électronique charpentier 2026 : guide complet",                                cat:"Facturation électronique",emoji:"🌲",metier:"charpentier",  sujet:"facture-elec", date:"2026-04-17", lecture:5 },
  { slug:"application-facture-electronique-plaquiste-2026",       titre:"Application facture électronique plaquiste 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"🏗️",metier:"plaquiste",   sujet:"facture-elec", date:"2026-04-18", lecture:5 },
  { slug:"application-facture-electronique-facadier-2026",        titre:"Application facture électronique façadier 2026 : guide complet",                                   cat:"Facturation électronique",emoji:"🏢",metier:"façadier",    sujet:"facture-elec", date:"2026-04-19", lecture:5 },
  { slug:"application-facture-electronique-climaticien-2026",     titre:"Application facture électronique climaticien 2026 : guide complet",                                cat:"Facturation électronique",emoji:"❄️",metier:"climaticien",  sujet:"facture-elec", date:"2026-04-20", lecture:5 },
  { slug:"application-facture-electronique-ramoneur-2026",        titre:"Application facture électronique ramoneur 2026 : guide complet",                                   cat:"Facturation électronique",emoji:"🏠",metier:"ramoneur",     sujet:"facture-elec", date:"2026-04-21", lecture:5 },
  { slug:"application-facture-electronique-elagueur-2026",        titre:"Application facture électronique élagueur 2026 : guide complet",                                   cat:"Facturation électronique",emoji:"🌳",metier:"élagueur",     sujet:"facture-elec", date:"2026-04-22", lecture:5 },
  { slug:"application-facture-electronique-paysagiste-2026",      titre:"Application facture électronique paysagiste 2026 : guide complet",                                 cat:"Facturation électronique",emoji:"🌿",metier:"paysagiste",   sujet:"facture-elec", date:"2026-04-23", lecture:5 },
  { slug:"application-facture-electronique-pisciniste-2026",      titre:"Application facture électronique pisciniste 2026 : guide complet",                                 cat:"Facturation électronique",emoji:"🏊",metier:"pisciniste",   sujet:"facture-elec", date:"2026-04-24", lecture:5 },
  { slug:"application-facture-electronique-terrassier-2026",      titre:"Application facture électronique terrassier 2026 : guide complet",                                 cat:"Facturation électronique",emoji:"🚜",metier:"terrassier",   sujet:"facture-elec", date:"2026-04-25", lecture:5 },
  { slug:"application-facture-electronique-vitrier-2026",         titre:"Application facture électronique vitrier 2026 : guide complet",                                    cat:"Facturation électronique",emoji:"🪟",metier:"vitrier",      sujet:"facture-elec", date:"2026-04-26", lecture:5 },
  { slug:"application-facture-electronique-installateur-solaire-2026",titre:"Application facture électronique installateur solaire 2026 : guide complet",                  cat:"Facturation électronique",emoji:"☀️",metier:"installateur solaire",sujet:"facture-elec",date:"2026-04-27",lecture:5 },
  { slug:"application-facture-electronique-nettoyeur-2026",       titre:"Application facture électronique nettoyeur 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"🧹",metier:"nettoyeur",    sujet:"facture-elec", date:"2026-04-28", lecture:5 },
  { slug:"application-facture-electronique-domoticien-2026",      titre:"Application facture électronique domoticien 2026 : guide complet",                                 cat:"Facturation électronique",emoji:"🏠",metier:"domoticien",   sujet:"facture-elec", date:"2026-04-29", lecture:5 },
  { slug:"application-facture-electronique-poseur-parquet-2026",  titre:"Application facture électronique poseur de parquet 2026 : guide complet",                         cat:"Facturation électronique",emoji:"🪵",metier:"poseur de parquet",sujet:"facture-elec",date:"2026-04-30",lecture:5 },
  { slug:"application-facture-electronique-poseur-fenetres-2026", titre:"Application facture électronique poseur de fenêtres 2026 : guide complet",                        cat:"Facturation électronique",emoji:"🪟",metier:"poseur de fenêtres",sujet:"facture-elec",date:"2026-05-01",lecture:5 },
  { slug:"application-facture-electronique-staffeur-2026",        titre:"Application facture électronique staffeur 2026 : guide complet",                                   cat:"Facturation électronique",emoji:"🏛️",metier:"staffeur",    sujet:"facture-elec", date:"2026-05-02", lecture:5 },
  { slug:"application-facture-electronique-paveur-2026",          titre:"Application facture électronique paveur 2026 : guide complet",                                     cat:"Facturation électronique",emoji:"🧱",metier:"paveur",       sujet:"facture-elec", date:"2026-05-03", lecture:5 },
  { slug:"application-facture-electronique-frigoriste-2026",      titre:"Application facture électronique frigoriste 2026 : guide complet",                                 cat:"Facturation électronique",emoji:"❄️",metier:"frigoriste",   sujet:"facture-elec", date:"2026-05-04", lecture:5 },
  { slug:"application-facture-electronique-technicien-fibre-2026",titre:"Application facture électronique technicien fibre 2026 : guide complet",                          cat:"Facturation électronique",emoji:"📡",metier:"technicien fibre",sujet:"facture-elec",date:"2026-05-05",lecture:5 },
  { slug:"application-facture-electronique-installateur-pac-2026",titre:"Application facture électronique installateur PAC 2026 : guide complet",                         cat:"Facturation électronique",emoji:"♨️",metier:"installateur PAC",sujet:"facture-elec",date:"2026-05-06",lecture:5 },
  { slug:"application-facture-electronique-deboucheur-2026",      titre:"Application facture électronique déboucheur 2026 : guide complet",                                 cat:"Facturation électronique",emoji:"🔧",metier:"déboucheur",   sujet:"facture-elec", date:"2026-05-07", lecture:5 },
  { slug:"application-facture-electronique-isolateur-2026",       titre:"Application facture électronique isolateur thermique 2026 : guide complet",                        cat:"Facturation électronique",emoji:"🏠",metier:"isolateur",    sujet:"facture-elec", date:"2026-05-08", lecture:5 },
  { slug:"application-facture-electronique-echafaudeur-2026",     titre:"Application facture électronique échafaudeur 2026 : guide complet",                                cat:"Facturation électronique",emoji:"🏗️",metier:"échafaudeur", sujet:"facture-elec", date:"2026-05-09", lecture:5 },
  { slug:"application-facture-electronique-metallier-2026",       titre:"Application facture électronique métallier 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"⚙️",metier:"métallier",    sujet:"facture-elec", date:"2026-05-10", lecture:5 },
  { slug:"application-facture-electronique-soudeur-2026",         titre:"Application facture électronique soudeur 2026 : guide complet",                                    cat:"Facturation électronique",emoji:"🔩",metier:"soudeur",      sujet:"facture-elec", date:"2026-05-11", lecture:5 },
  { slug:"application-facture-electronique-etancheur-2026",       titre:"Application facture électronique étanchéiste 2026 : guide complet",                                cat:"Facturation électronique",emoji:"💧",metier:"étanchéiste",  sujet:"facture-elec", date:"2026-05-12", lecture:5 },
  { slug:"application-facture-electronique-plombier-chauffagiste-2026",titre:"Application facture électronique plombier-chauffagiste 2026 : guide complet",                cat:"Facturation électronique",emoji:"🔧",metier:"plombier-chauffagiste",sujet:"facture-elec",date:"2026-05-13",lecture:5 },
  { slug:"application-facture-electronique-miroitier-2026",       titre:"Application facture électronique miroitier 2026 : guide complet",                                  cat:"Facturation électronique",emoji:"🪞",metier:"miroitier",    sujet:"facture-elec", date:"2026-05-14", lecture:5 },
  /* ── Nouvelles pages SEO — facturation électronique 2026 ────────────────────── */
  { slug:"facturation-electronique-artisan-guide-complet",  titre:"Facturation électronique obligatoire artisan 2026–2027 : guide complet",                    cat:"Facturation électronique",emoji:"🔨",metier:null,sujet:"facture-loi",   date:"2026-06-05", lecture:7 },
  { slug:"facture-electronique-tpe-pme-guide",              titre:"Facture électronique obligatoire TPE/PME 2026 : tout ce qu'il faut savoir",                  cat:"Facturation électronique",emoji:"🏢",metier:null,sujet:"facture-loi",   date:"2026-06-05", lecture:6 },
  { slug:"logiciel-facturation-electronique-gratuit-guide", titre:"Logiciel facturation électronique gratuit 2026 : notre comparatif honnête",                 cat:"Facturation électronique",emoji:"💻",metier:null,sujet:"facture-loi",   date:"2026-06-05", lecture:6 },
  { slug:"facture-electronique-2027-artisans-tpe",          titre:"Facture électronique obligatoire 2027 : artisans et TPE, préparez-vous maintenant",          cat:"Facturation électronique",emoji:"⚠️",metier:null,sujet:"facture-loi",   date:"2026-06-05", lecture:6 },
  /* ── Nouvelles pages SEO — mots-clés génériques ────────────────────────────── */
  { slug:"faire-facture-en-ligne-gratuit-artisan",          titre:"Faire une facture en ligne gratuit : guide complet pour artisans 2026",                     cat:"Gestion",    emoji:"💶",metier:null,sujet:"facture-ligne",  date:"2026-06-05", lecture:5 },
  { slug:"facture-en-ligne-artisan-guide",                  titre:"Facture en ligne pour artisan : créez et envoyez en 2 minutes",                             cat:"Gestion",    emoji:"📄",metier:null,sujet:"facture-ligne",  date:"2026-06-05", lecture:5 },
  { slug:"devis-en-ligne-gratuit-artisan-guide",            titre:"Devis en ligne gratuit pour artisans : créez votre devis professionnel en 2 minutes",       cat:"Gestion",    emoji:"📝",metier:null,sujet:"devis-ligne",    date:"2026-06-05", lecture:5 },
  { slug:"application-devis-facture-gratuite-comparatif",   titre:"Application devis facture gratuite artisan 2026 : comparatif des meilleures apps",          cat:"Gestion",    emoji:"📱",metier:null,sujet:"appli-facturation",date:"2026-06-05",lecture:5 },
  { slug:"meilleur-logiciel-devis-facture-artisan-2026",    titre:"Meilleur logiciel devis facture artisan 2026 : comparatif complet et honnête",              cat:"Gestion",    emoji:"💻",metier:null,sujet:"logiciel",        date:"2026-06-05", lecture:7 },
  { slug:"faire-une-facture-gratuitement-guide-artisan",    titre:"Comment faire une facture gratuitement ? Guide complet artisan 2026",                       cat:"Gestion",    emoji:"🧾",metier:null,sujet:"faire-facture",   date:"2026-06-05", lecture:6 },
  { slug:"faire-un-devis-gratuitement-guide-artisan",       titre:"Comment faire un devis gratuitement ? Guide pratique pour artisans 2026",                   cat:"Gestion",    emoji:"📄",metier:null,sujet:"faire-devis",    date:"2026-06-05", lecture:6 },
  { slug:"application-facturation-gratuite-comparatif",     titre:"Application de facturation gratuite artisan 2026 : notre sélection",                        cat:"Gestion",    emoji:"📱",metier:null,sujet:"appli-facturation",date:"2026-06-05",lecture:5 },
  { slug:"facture-auto-entrepreneur-gratuit-guide-complet",  titre:"Facture auto-entrepreneur gratuit 2026 : guide complet et mentions légales",                cat:"Gestion",    emoji:"🧾",metier:null,sujet:"ae-facturation",  date:"2026-06-05", lecture:6 },
  /* ── Articles bonus mots-clés ciblés ───────────────────────────────────────── */
  { slug:"facture-nouvelle-loi-artisan-2026",               titre:"Facture nouvelle loi 2026 : ce qui change pour les artisans",                               cat:"Facturation électronique",emoji:"⚖️",metier:null,sujet:"facture-loi",  date:"2026-06-05", lecture:6 },
  { slug:"devis-electronique-obligatoire-artisan",          titre:"Devis électronique obligatoire 2026 : vrai ou faux pour les artisans ?",                    cat:"Facturation électronique",emoji:"📋",metier:null,sujet:"facture-loi",  date:"2026-06-05", lecture:5 },
  { slug:"logiciel-facture-nouvelle-loi-2026",              titre:"Logiciel facture conforme nouvelle loi 2026 : quel choix pour un artisan ?",                cat:"Facturation électronique",emoji:"💻",metier:null,sujet:"logiciel",      date:"2026-06-05", lecture:5 },
  { slug:"application-devis-facture-pas-cher-artisan",      titre:"Application devis facture pas cher artisan 2026 : top des solutions abordables",            cat:"Gestion",    emoji:"💶",metier:null,sujet:"appli-facturation",date:"2026-06-05",lecture:5 },
  { slug:"meilleur-logiciel-facturation-artisan-2026",      titre:"Meilleur logiciel facturation artisan 2026 : comparatif complet Artisan+ vs concurrents",   cat:"Gestion",    emoji:"🏆",metier:null,sujet:"logiciel",        date:"2026-06-05", lecture:7 },
  /* ── Articles BTP — facturation et gestion ───────────────────────────────── */
  { slug:"facturation-btp-regles-2026",              titre:"Facturation BTP 2026 : toutes les règles que les artisans du bâtiment doivent connaître",   cat:"BTP",           emoji:"🏗️",metier:null,          sujet:"btp",          date:"2026-06-06", lecture:6 },
  { slug:"logiciel-btp-artisan-2026",                titre:"Logiciel BTP artisan 2026 : quel outil choisir pour vos chantiers ?",                        cat:"BTP",           emoji:"💻",metier:null,          sujet:"btp",          date:"2026-06-07", lecture:5 },
  { slug:"application-btp-smartphone-2026",          titre:"Application BTP smartphone 2026 : gérez vos chantiers depuis votre mobile",                  cat:"BTP",           emoji:"📱",metier:null,          sujet:"btp",          date:"2026-06-08", lecture:5 },
  { slug:"logiciel-facturation-btp-gratuit",         titre:"Logiciel facturation BTP gratuit 2026 : nos recommandations honnêtes pour artisans",          cat:"BTP",           emoji:"🔨",metier:null,          sujet:"btp",          date:"2026-06-09", lecture:5 },
  { slug:"application-gestion-btp-ios-android",      titre:"Application gestion BTP iOS et Android : le comparatif complet 2026",                        cat:"BTP",           emoji:"📱",metier:null,          sujet:"btp",          date:"2026-06-10", lecture:5 },
  { slug:"facture-btp-auto-entrepreneur",            titre:"Facture BTP auto-entrepreneur 2026 : guide complet et mentions obligatoires",                  cat:"BTP",           emoji:"🧾",metier:null,          sujet:"btp",          date:"2026-06-11", lecture:5 },
  /* ── Articles comment faire une facture BTP ──────────────────────────────── */
  { slug:"comment-faire-facture-btp",                titre:"Comment faire une facture BTP conforme ? Guide complet 2026",                                  cat:"BTP",           emoji:"📄",metier:null,          sujet:"facture-btp",  date:"2026-06-12", lecture:6 },
  { slug:"mentions-obligatoires-facture-btp",        titre:"Mentions obligatoires sur une facture BTP : la liste complète 2026",                          cat:"BTP",           emoji:"📋",metier:null,          sujet:"facture-btp",  date:"2026-06-13", lecture:5 },
  { slug:"situation-travaux-btp-comment-facturer",   titre:"Situations de travaux BTP : comment facturer l'avancement du chantier ?",                    cat:"BTP",           emoji:"📊",metier:null,          sujet:"facture-btp",  date:"2026-06-14", lecture:5 },
  { slug:"retenue-garantie-btp-2026",                titre:"Retenue de garantie BTP 2026 : calcul, durée et restitution pour artisans",                   cat:"BTP",           emoji:"💶",metier:null,          sujet:"facture-btp",  date:"2026-06-15", lecture:5 },
  { slug:"facture-travaux-renovation-guide",         titre:"Facture travaux rénovation : guide complet pour les artisans du BTP en 2026",                 cat:"BTP",           emoji:"🏠",metier:null,          sujet:"facture-btp",  date:"2026-06-16", lecture:5 },
  { slug:"facture-sous-traitant-btp",                titre:"Facture sous-traitant BTP : auto-liquidation TVA et mentions légales obligatoires",            cat:"BTP",           emoji:"🤝",metier:null,          sujet:"facture-btp",  date:"2026-06-17", lecture:5 },
  /* ── Articles devis BTP ──────────────────────────────────────────────────── */
  { slug:"comment-faire-devis-btp",                  titre:"Comment faire un devis BTP professionnel ? Guide complet 2026",                                cat:"BTP",           emoji:"📝",metier:null,          sujet:"devis-btp",    date:"2026-06-18", lecture:6 },
  { slug:"devis-renovation-guide-btp",               titre:"Devis rénovation BTP : structure, contenu et astuces pour décrocher le chantier",             cat:"BTP",           emoji:"🏚️",metier:null,          sujet:"devis-btp",    date:"2026-06-19", lecture:5 },
  { slug:"chiffrer-chantier-btp-methode",            titre:"Comment chiffrer un chantier BTP ? Méthode étape par étape pour artisans",                    cat:"BTP",           emoji:"🔢",metier:null,          sujet:"devis-btp",    date:"2026-06-20", lecture:5 },
  { slug:"devis-gros-oeuvre-btp",                    titre:"Devis gros œuvre BTP : comment structurer un devis de construction ou rénovation ?",          cat:"BTP",           emoji:"🧱",metier:null,          sujet:"devis-btp",    date:"2026-06-21", lecture:5 },
  { slug:"devis-travaux-renovation-maison",          titre:"Devis travaux rénovation maison : que doit-il contenir ? Guide complet 2026",                  cat:"BTP",           emoji:"🏠",metier:null,          sujet:"devis-btp",    date:"2026-06-22", lecture:5 },
  /* ── Articles facturation et devis rapide ────────────────────────────────── */
  { slug:"faire-facture-2-minutes-artisan",          titre:"Faire une facture en 2 minutes : le guide complet pour artisans pressés",                     cat:"Gestion",       emoji:"⚡",metier:null,          sujet:"facture-rapide",date:"2026-06-23", lecture:5 },
  { slug:"facturer-depuis-smartphone-chantier",      titre:"Facturer depuis son smartphone sur le chantier : comment faire en 2026 ?",                    cat:"Gestion",       emoji:"📱",metier:null,          sujet:"facture-rapide",date:"2026-06-24", lecture:4 },
  { slug:"logiciel-facturation-rapide-artisan",      titre:"Logiciel de facturation rapide pour artisan : top 5 des solutions en 2026",                   cat:"Gestion",       emoji:"💻",metier:null,          sujet:"facture-rapide",date:"2026-06-25", lecture:5 },
  { slug:"facture-simple-artisan-guide",             titre:"Facture simple pour artisan : comment créer une facture vite et bien ?",                       cat:"Gestion",       emoji:"📄",metier:null,          sujet:"facture-rapide",date:"2026-06-26", lecture:4 },
  { slug:"facture-gratuite-artisan-2026",            titre:"Facture gratuite pour artisan 2026 : les meilleures solutions et leurs limites",               cat:"Gestion",       emoji:"💶",metier:null,          sujet:"facture-rapide",date:"2026-06-27", lecture:4 },
  { slug:"creer-devis-rapide-artisan",               titre:"Créer un devis rapide : techniques et outils indispensables pour artisans",                   cat:"Gestion",       emoji:"📝",metier:null,          sujet:"devis-rapide", date:"2026-06-28", lecture:5 },
  { slug:"devis-jour-meme-visite-client",            titre:"Envoyer son devis le jour de la visite client : comment faire et pourquoi c'est crucial",      cat:"Gestion",       emoji:"🚀",metier:null,          sujet:"devis-rapide", date:"2026-06-29", lecture:4 },
  { slug:"devis-facile-artisan-guide",               titre:"Devis facile pour artisan : créez votre devis professionnel en quelques clics",               cat:"Gestion",       emoji:"✅",metier:null,          sujet:"devis-rapide", date:"2026-06-30", lecture:4 },
  { slug:"devis-simple-professionnel-artisan",       titre:"Devis simple et professionnel : guide complet et modèle gratuit 2026",                        cat:"Gestion",       emoji:"📄",metier:null,          sujet:"devis-rapide", date:"2026-07-01", lecture:4 },
  { slug:"devis-gratuit-artisan-2026",               titre:"Devis gratuit artisan 2026 : les meilleures solutions en ligne et leurs vraies limites",       cat:"Gestion",       emoji:"🆓",metier:null,          sujet:"devis-rapide", date:"2026-07-02", lecture:4 },
  /* ── Articles gestion BTP ────────────────────────────────────────────────── */
  { slug:"gestion-chantier-btp-logiciel-2026",       titre:"Logiciel de gestion de chantier BTP 2026 : comparatif complet pour artisans",                 cat:"BTP",           emoji:"🏗️",metier:null,          sujet:"gestion-btp",  date:"2026-07-03", lecture:6 },
  { slug:"suivi-chantier-photos-artisan-btp",        titre:"Suivi de chantier avec photos dans le BTP : pourquoi c'est indispensable en 2026",            cat:"BTP",           emoji:"📸",metier:null,          sujet:"gestion-btp",  date:"2026-07-04", lecture:4 },
  { slug:"gestion-sous-traitants-btp",               titre:"Gérer ses sous-traitants BTP : contrats, facturation et TVA auto-liquidée",                   cat:"BTP",           emoji:"🤝",metier:null,          sujet:"gestion-btp",  date:"2026-07-05", lecture:5 },
  { slug:"pointage-btp-application-2026",            titre:"Pointage BTP sur application mobile 2026 : les meilleures solutions",                         cat:"BTP",           emoji:"⏱️",metier:null,          sujet:"gestion-btp",  date:"2026-07-06", lecture:4 },
  { slug:"suivi-chantier-btp-artisan-seul",          titre:"Suivi de chantier BTP pour artisan seul : outils et méthodes simples",                       cat:"BTP",           emoji:"📊",metier:null,          sujet:"gestion-btp",  date:"2026-07-07", lecture:4 },
  /* ── Articles facture par corps de métier BTP ───────────────────────────── */
  { slug:"facture-maconnerie-guide-2026",            titre:"Facture maçonnerie 2026 : mentions obligatoires, TVA et modèle gratuit",                       cat:"BTP",           emoji:"🧱",metier:"maçon",       sujet:"facture-btp",  date:"2026-07-08", lecture:5 },
  { slug:"devis-maconnerie-guide-complet",           titre:"Devis maçonnerie : que doit-il contenir ? Guide complet pour maçons 2026",                     cat:"BTP",           emoji:"🧱",metier:"maçon",       sujet:"devis-btp",    date:"2026-07-09", lecture:5 },
  { slug:"facture-plomberie-guide-2026",             titre:"Facture plomberie 2026 : mentions obligatoires, TVA et bonnes pratiques",                       cat:"BTP",           emoji:"🔧",metier:"plombier",    sujet:"facture-btp",  date:"2026-07-10", lecture:5 },
  { slug:"devis-plomberie-guide-complet",            titre:"Devis plomberie : structure, contenu et astuces pour décrocher le chantier 2026",              cat:"BTP",           emoji:"🔧",metier:"plombier",    sujet:"devis-btp",    date:"2026-07-11", lecture:5 },
  { slug:"facture-electricite-guide-2026",           titre:"Facture électricité artisan 2026 : mentions obligatoires, TVA et conformité",                   cat:"BTP",           emoji:"⚡",metier:"électricien", sujet:"facture-btp",  date:"2026-07-12", lecture:5 },
  { slug:"devis-electricite-batiment-guide",         titre:"Devis électricité bâtiment : comment structurer votre devis pour décrocher le chantier ?",     cat:"BTP",           emoji:"⚡",metier:"électricien", sujet:"devis-btp",    date:"2026-07-13", lecture:5 },
  { slug:"facture-couverture-toiture-2026",          titre:"Facture couverture toiture 2026 : guide complet pour couvreurs et zingueurs",                   cat:"BTP",           emoji:"🏗️",metier:"couvreur",    sujet:"facture-btp",  date:"2026-07-14", lecture:5 },
  { slug:"devis-couverture-toiture-guide",           titre:"Devis couverture toiture : contenu, TVA et astuces pour couvreurs",                            cat:"BTP",           emoji:"🏗️",metier:"couvreur",    sujet:"devis-btp",    date:"2026-07-15", lecture:5 },
  { slug:"facture-charpente-bois-2026",              titre:"Facture charpente bois 2026 : mentions obligatoires et modèle pour charpentiers",               cat:"BTP",           emoji:"🌲",metier:"charpentier", sujet:"facture-btp",  date:"2026-07-16", lecture:5 },
  { slug:"devis-charpente-guide-complet",            titre:"Devis charpente : comment chiffrer et présenter votre devis de charpente ?",                   cat:"BTP",           emoji:"🌲",metier:"charpentier", sujet:"devis-btp",    date:"2026-07-17", lecture:5 },
  { slug:"facture-menuiserie-guide-2026",            titre:"Facture menuiserie 2026 : guide complet pour menuisiers et poseurs",                            cat:"BTP",           emoji:"🪚",metier:"menuisier",   sujet:"facture-btp",  date:"2026-07-18", lecture:5 },
  { slug:"devis-menuiserie-guide-complet",           titre:"Devis menuiserie : que mettre dans votre devis pour rassurer le client ?",                     cat:"BTP",           emoji:"🪚",metier:"menuisier",   sujet:"devis-btp",    date:"2026-07-19", lecture:5 },
  { slug:"facture-peinture-batiment-2026",           titre:"Facture peinture bâtiment 2026 : guide et mentions obligatoires pour peintres",                 cat:"BTP",           emoji:"🎨",metier:"peintre",     sujet:"facture-btp",  date:"2026-07-20", lecture:5 },
  { slug:"devis-peinture-guide-complet",             titre:"Devis peinture bâtiment : comment structurer votre devis au m² ?",                             cat:"BTP",           emoji:"🎨",metier:"peintre",     sujet:"devis-btp",    date:"2026-07-21", lecture:5 },
  { slug:"facture-carrelage-guide-2026",             titre:"Facture carrelage 2026 : que doit mentionner votre facture de carreleur ?",                     cat:"BTP",           emoji:"🏠",metier:"carreleur",   sujet:"facture-btp",  date:"2026-07-22", lecture:5 },
  { slug:"devis-carrelage-guide-complet",            titre:"Devis carrelage : comment chiffrer la pose au m² et présenter votre devis ?",                  cat:"BTP",           emoji:"🏠",metier:"carreleur",   sujet:"devis-btp",    date:"2026-07-23", lecture:5 },
  { slug:"facture-isolation-thermique-2026",         titre:"Facture isolation thermique 2026 : TVA 5,5%, RGE et mentions obligatoires",                     cat:"BTP",           emoji:"🏠",metier:"isolateur",   sujet:"facture-btp",  date:"2026-07-24", lecture:5 },
  { slug:"devis-isolation-guide-complet",            titre:"Devis isolation thermique : comment structurer votre devis d'isolateur en 2026 ?",              cat:"BTP",           emoji:"🏠",metier:"isolateur",   sujet:"devis-btp",    date:"2026-07-25", lecture:5 },
  { slug:"facture-terrassement-vrd-2026",            titre:"Facture terrassement et VRD 2026 : guide complet pour terrassiers",                             cat:"BTP",           emoji:"🚜",metier:"terrassier",  sujet:"facture-btp",  date:"2026-07-26", lecture:5 },
  { slug:"devis-terrassement-guide-complet",         titre:"Devis terrassement : comment chiffrer vos travaux de terrassement et VRD ?",                   cat:"BTP",           emoji:"🚜",metier:"terrassier",  sujet:"devis-btp",    date:"2026-07-27", lecture:5 },
  /* ── Gestion et conseils par métier BTP ──────────────────────────────────── */
  { slug:"gestion-chantier-maconnerie-2026",         titre:"Gestion de chantier maçonnerie : planification, matériaux et facturation",                      cat:"BTP",           emoji:"🧱",metier:"maçon",       sujet:"gestion-metier-btp", date:"2026-07-28", lecture:5 },
  { slug:"conseils-pro-macon-developper-activite",   titre:"Maçon : 7 conseils pour développer votre activité et décrocher plus de chantiers",              cat:"BTP",           emoji:"🧱",metier:"maçon",       sujet:"conseil-pro",        date:"2026-07-29", lecture:5 },
  { slug:"gestion-chantier-plomberie-2026",          titre:"Gestion de chantier plomberie : organisation, suivi et facturation efficace",                    cat:"BTP",           emoji:"🔧",metier:"plombier",    sujet:"gestion-metier-btp", date:"2026-07-30", lecture:5 },
  { slug:"conseils-pro-plombier-reussir-2026",       titre:"Plombier : stratégies pour se démarquer et augmenter son chiffre d'affaires",                    cat:"BTP",           emoji:"🔧",metier:"plombier",    sujet:"conseil-pro",        date:"2026-07-31", lecture:5 },
  { slug:"gestion-chantier-electricite-2026",        titre:"Gestion de chantier électricité : coordination, sécurité et facturation",                        cat:"BTP",           emoji:"⚡",metier:"électricien", sujet:"gestion-metier-btp", date:"2026-08-01", lecture:5 },
  { slug:"conseils-pro-electricien-croissance",      titre:"Électricien : les clés pour développer son activité en 2026",                                    cat:"BTP",           emoji:"⚡",metier:"électricien", sujet:"conseil-pro",        date:"2026-08-02", lecture:5 },
  { slug:"gestion-chantier-couverture-2026",         titre:"Gestion de chantier couverture : planning, météo et facturation pour couvreurs",                  cat:"BTP",           emoji:"🏗️",metier:"couvreur",    sujet:"gestion-metier-btp", date:"2026-08-03", lecture:5 },
  { slug:"conseils-pro-couvreur-2026",               titre:"Couvreur : 6 conseils pour se démarquer et fidéliser sa clientèle",                              cat:"BTP",           emoji:"🏗️",metier:"couvreur",    sujet:"conseil-pro",        date:"2026-08-04", lecture:5 },
  { slug:"gestion-activite-charpentier-2026",        titre:"Gestion d'activité charpentier : organisation, sous-traitance et devis efficaces",               cat:"BTP",           emoji:"🌲",metier:"charpentier", sujet:"gestion-metier-btp", date:"2026-08-05", lecture:5 },
  { slug:"conseils-pro-charpentier-reussir",         titre:"Charpentier : comment attirer plus de clients et mieux facturer en 2026",                        cat:"BTP",           emoji:"🌲",metier:"charpentier", sujet:"conseil-pro",        date:"2026-08-06", lecture:5 },
  { slug:"gestion-atelier-menuisier-2026",           titre:"Gestion d'atelier menuisier : planification, commandes et facturation",                           cat:"BTP",           emoji:"🪚",metier:"menuisier",   sujet:"gestion-metier-btp", date:"2026-08-07", lecture:5 },
  { slug:"conseils-pro-menuisier-developper",        titre:"Menuisier : stratégies pour développer son carnet de commandes en 2026",                         cat:"BTP",           emoji:"🪚",metier:"menuisier",   sujet:"conseil-pro",        date:"2026-08-08", lecture:5 },
  { slug:"gestion-activite-peintre-2026",            titre:"Gestion d'activité peintre bâtiment : chantiers, fournitures et facturation",                     cat:"BTP",           emoji:"🎨",metier:"peintre",     sujet:"gestion-metier-btp", date:"2026-08-09", lecture:5 },
  { slug:"conseils-pro-peintre-batiment-2026",       titre:"Peintre bâtiment : comment se démarquer et décrocher de meilleurs contrats",                     cat:"BTP",           emoji:"🎨",metier:"peintre",     sujet:"conseil-pro",        date:"2026-08-10", lecture:5 },
  { slug:"gestion-chantier-carreleur-2026",          titre:"Gestion de chantier carreleur : planification, approvisionnement et facturation",                 cat:"BTP",           emoji:"🏠",metier:"carreleur",   sujet:"gestion-metier-btp", date:"2026-08-11", lecture:5 },
  { slug:"conseils-pro-carreleur-reussir-2026",      titre:"Carreleur : 5 conseils pour augmenter son taux de signature de devis",                           cat:"BTP",           emoji:"🏠",metier:"carreleur",   sujet:"conseil-pro",        date:"2026-08-12", lecture:5 },
  { slug:"gestion-chantier-isolation-2026",          titre:"Gestion de chantier isolation thermique : RGE, aides et facturation conforme",                   cat:"BTP",           emoji:"🏠",metier:"isolateur",   sujet:"gestion-metier-btp", date:"2026-08-13", lecture:5 },
  { slug:"conseils-pro-isolateur-rge-2026",          titre:"Isolateur RGE : comment capitaliser sur les aides à la rénovation énergétique 2026",             cat:"BTP",           emoji:"🏠",metier:"isolateur",   sujet:"conseil-pro",        date:"2026-08-14", lecture:5 },
  { slug:"gestion-chantier-terrassement-2026",       titre:"Gestion de chantier terrassement : planning, matériel et facturation VRD",                       cat:"BTP",           emoji:"🚜",metier:"terrassier",  sujet:"gestion-metier-btp", date:"2026-08-15", lecture:5 },
  { slug:"conseils-pro-terrassier-2026",             titre:"Terrassier : comment se positionner sur les chantiers de VRD et réseaux",                        cat:"BTP",           emoji:"🚜",metier:"terrassier",  sujet:"conseil-pro",        date:"2026-08-16", lecture:5 },
  /* ── Plaquiste, chauffagiste, serrurier ──────────────────────────────────── */
  { slug:"facture-plaquiste-guide-2026",             titre:"Facture plaquiste 2026 : mentions obligatoires, TVA et modèle conforme",                          cat:"BTP",           emoji:"🏠",metier:"plaquiste",   sujet:"facture-corps-metier", date:"2026-08-17", lecture:5 },
  { slug:"devis-plaquiste-guide-complet",            titre:"Devis plaquiste : comment structurer et présenter votre devis de plâtrerie-plaquisterie",        cat:"BTP",           emoji:"🏠",metier:"plaquiste",   sujet:"devis-corps-metier",   date:"2026-08-18", lecture:5 },
  { slug:"gestion-activite-plaquiste-2026",          titre:"Gestion d'activité plaquiste : chantiers, sous-traitance et facturation",                         cat:"BTP",           emoji:"🏠",metier:"plaquiste",   sujet:"gestion-metier-btp",   date:"2026-08-19", lecture:5 },
  { slug:"conseils-pro-plaquiste-2026",              titre:"Plaquiste : 6 stratégies pour développer son activité et sa clientèle",                           cat:"BTP",           emoji:"🏠",metier:"plaquiste",   sujet:"conseil-pro",          date:"2026-08-20", lecture:5 },
  { slug:"facture-chauffagiste-guide-2026",          titre:"Facture chauffagiste 2026 : TVA réduite, PAC, chaudière et mentions obligatoires",                cat:"BTP",           emoji:"🔥",metier:"chauffagiste", sujet:"facture-corps-metier", date:"2026-08-21", lecture:5 },
  { slug:"devis-chauffagiste-guide-complet",         titre:"Devis chauffagiste : comment chiffrer un remplacement de chaudière ou pompe à chaleur",          cat:"BTP",           emoji:"🔥",metier:"chauffagiste", sujet:"devis-corps-metier",   date:"2026-08-22", lecture:5 },
  { slug:"gestion-activite-chauffagiste-2026",       titre:"Gestion d'activité chauffagiste : SAV, maintenance et planification des interventions",           cat:"BTP",           emoji:"🔥",metier:"chauffagiste", sujet:"gestion-metier-btp",   date:"2026-08-23", lecture:5 },
  { slug:"conseils-pro-chauffagiste-2026",           titre:"Chauffagiste : comment se positionner sur les marchés PAC et rénovation thermique",               cat:"BTP",           emoji:"🔥",metier:"chauffagiste", sujet:"conseil-pro",          date:"2026-08-24", lecture:5 },
  { slug:"facture-serrurier-guide-2026",             titre:"Facture serrurier 2026 : mentions obligatoires, urgences et conformité",                          cat:"BTP",           emoji:"🔑",metier:"serrurier",   sujet:"facture-corps-metier", date:"2026-08-25", lecture:5 },
  { slug:"devis-serrurier-guide-complet",            titre:"Devis serrurier : comment présenter vos prestations d'urgence et de sécurité",                   cat:"BTP",           emoji:"🔑",metier:"serrurier",   sujet:"devis-corps-metier",   date:"2026-08-26", lecture:5 },
  { slug:"conseils-pro-serrurier-2026",              titre:"Serrurier : comment développer les contrats de maintenance et sécurité",                          cat:"BTP",           emoji:"🔑",metier:"serrurier",   sujet:"conseil-pro",          date:"2026-08-27", lecture:5 },
  /* ── Métiers paysagiste, climaticien, ravaleur ───────────────────────────── */
  { slug:"facture-paysagiste-guide-2026",            titre:"Facture paysagiste 2026 : TVA, mentions obligatoires et modèle conforme",                         cat:"BTP",           emoji:"🌿",metier:"paysagiste",  sujet:"facture-corps-metier", date:"2026-08-28", lecture:5 },
  { slug:"devis-paysagiste-guide-complet",           titre:"Devis paysagiste : comment structurer et présenter vos prestations d'espaces verts",             cat:"BTP",           emoji:"🌿",metier:"paysagiste",  sujet:"devis-corps-metier",   date:"2026-08-29", lecture:5 },
  { slug:"gestion-activite-paysagiste-2026",         titre:"Gestion d'activité paysagiste : saisonnalité, contrats d'entretien et facturation",              cat:"BTP",           emoji:"🌿",metier:"paysagiste",  sujet:"gestion-metier-btp",   date:"2026-08-30", lecture:5 },
  { slug:"conseils-pro-paysagiste-2026",             titre:"Paysagiste : conseils pour décrocher des contrats d'entretien et de création",                    cat:"BTP",           emoji:"🌿",metier:"paysagiste",  sujet:"conseil-pro",          date:"2026-08-31", lecture:5 },
  { slug:"facture-climatisation-guide-2026",         titre:"Facture climatisation 2026 : mentions obligatoires, TVA et conformité RGE",                       cat:"BTP",           emoji:"❄️",metier:"climaticien", sujet:"facture-corps-metier", date:"2026-09-01", lecture:5 },
  { slug:"devis-climatisation-guide-complet",        titre:"Devis climatisation : comment chiffrer l'installation d'un système de climatisation",             cat:"BTP",           emoji:"❄️",metier:"climaticien", sujet:"devis-corps-metier",   date:"2026-09-02", lecture:5 },
  { slug:"conseils-pro-climaticien-2026",            titre:"Climaticien : comment développer son activité d'installation et maintenance",                     cat:"BTP",           emoji:"❄️",metier:"climaticien", sujet:"conseil-pro",          date:"2026-09-03", lecture:5 },
  { slug:"facture-ravaleur-facade-2026",             titre:"Facture ravalement de façade 2026 : TVA 10%, échafaudage et conformité",                          cat:"BTP",           emoji:"🏢",metier:"ravaleur",    sujet:"facture-corps-metier", date:"2026-09-04", lecture:5 },
  { slug:"devis-ravaleur-facade-guide",              titre:"Devis ravalement de façade : comment chiffrer et présenter votre devis",                          cat:"BTP",           emoji:"🏢",metier:"ravaleur",    sujet:"devis-corps-metier",   date:"2026-09-05", lecture:5 },
  { slug:"facture-etancheite-guide-2026",            titre:"Facture étanchéité 2026 : TVA 10%, garanties et mentions obligatoires",                           cat:"BTP",           emoji:"💧",metier:"étancheur",   sujet:"facture-corps-metier", date:"2026-09-06", lecture:5 },
  { slug:"devis-etancheite-guide-complet",           titre:"Devis étanchéité : comment présenter vos travaux d'imperméabilisation",                           cat:"BTP",           emoji:"💧",metier:"étancheur",   sujet:"devis-corps-metier",   date:"2026-09-07", lecture:5 },
  { slug:"facture-parqueteur-guide-2026",            titre:"Facture parqueteur 2026 : TVA, pose et finition — mentions obligatoires",                         cat:"BTP",           emoji:"🪵",metier:"parqueteur",  sujet:"facture-corps-metier", date:"2026-09-08", lecture:5 },
  { slug:"devis-parquet-guide-complet",              titre:"Devis parquet : comment structurer votre devis de pose et finition",                              cat:"BTP",           emoji:"🪵",metier:"parqueteur",  sujet:"devis-corps-metier",   date:"2026-09-09", lecture:5 },
  { slug:"facture-demolition-btp-2026",              titre:"Facture démolition BTP 2026 : TVA, mentions et gestion des déchets",                              cat:"BTP",           emoji:"🏗️",metier:"démolisseur", sujet:"facture-corps-metier", date:"2026-09-10", lecture:5 },
  /* ── Articles "facture facile" ────────────────────────────────────────────── */
  { slug:"facture-facile-artisan-guide-2026",        titre:"Facture facile pour artisan : créer une facture conforme en 2 minutes",                           cat:"Facturation",   emoji:"⚡",metier:"artisan",     sujet:"facture-rapide",       date:"2026-09-11", lecture:4 },
  { slug:"facture-rapide-smartphone-2026",           titre:"Facture rapide sur smartphone : les meilleures apps pour artisans en 2026",                       cat:"Facturation",   emoji:"📱",metier:"artisan",     sujet:"facture-rapide",       date:"2026-09-12", lecture:4 },
  { slug:"facture-simple-sans-logiciel-2026",        titre:"Facture simple sans logiciel : est-ce encore possible en 2026 ?",                                 cat:"Facturation",   emoji:"📄",metier:"artisan",     sujet:"faire-facture",        date:"2026-09-13", lecture:4 },
  { slug:"facture-gratuite-artisan-comparatif",      titre:"Facture gratuite artisan : comparatif des solutions gratuites en 2026",                           cat:"Facturation",   emoji:"💰",metier:"artisan",     sujet:"logiciel",             date:"2026-09-14", lecture:5 },
  { slug:"creer-facture-facile-guide-2026",          titre:"Créer une facture facilement : guide pas à pas pour artisan",                                     cat:"Facturation",   emoji:"✏️",metier:"artisan",     sujet:"faire-facture",        date:"2026-09-15", lecture:4 },
  { slug:"faire-facture-facile-conforme-2026",       titre:"Faire une facture facilement et conformément à la loi en 2026",                                   cat:"Facturation",   emoji:"📋",metier:"artisan",     sujet:"faire-facture",        date:"2026-09-16", lecture:5 },
  { slug:"facture-en-2-minutes-test-artisan",        titre:"Facturer en 2 minutes : mythe ou réalité ? Test avec Artisan+",                                   cat:"Facturation",   emoji:"⏱️",metier:"artisan",     sujet:"facture-rapide",       date:"2026-09-17", lecture:4 },
  { slug:"devis-facile-artisan-guide",               titre:"Devis facile : créer un devis professionnel sans formation",                                      cat:"Devis",         emoji:"📝",metier:"artisan",     sujet:"faire-devis",          date:"2026-09-18", lecture:4 },
  { slug:"devis-rapide-smartphone-guide",            titre:"Devis rapide sur smartphone : envoyer un devis le jour même de la visite",                        cat:"Devis",         emoji:"📱",metier:"artisan",     sujet:"devis-rapide",         date:"2026-09-19", lecture:4 },
  { slug:"devis-simple-sans-logiciel-2026",          titre:"Devis simple sans logiciel : options gratuites et leurs limites",                                 cat:"Devis",         emoji:"📄",metier:"artisan",     sujet:"faire-devis",          date:"2026-09-20", lecture:4 },
  { slug:"devis-gratuit-artisan-solutions",          titre:"Devis gratuit artisan : meilleures solutions comparées en 2026",                                  cat:"Devis",         emoji:"💰",metier:"artisan",     sujet:"logiciel",             date:"2026-09-21", lecture:5 },
  /* ── Articles BTP général ─────────────────────────────────────────────────── */
  { slug:"logiciel-btp-comparatif-2026",             titre:"Logiciel BTP 2026 : comparatif des meilleures solutions pour artisans",                           cat:"BTP",           emoji:"💻",metier:null,          sujet:"gestion-btp",          date:"2026-09-22", lecture:5 },
  { slug:"application-btp-mobile-guide-2026",        titre:"Application BTP mobile 2026 : les apps indispensables sur le chantier",                           cat:"BTP",           emoji:"📱",metier:null,          sujet:"gestion-btp",          date:"2026-09-23", lecture:5 },
  { slug:"facturation-btp-regles-2026",              titre:"Facturation BTP 2026 : règles, TVA auto-liquidée et conformité Factur-X",                         cat:"BTP",           emoji:"📋",metier:null,          sujet:"facture-btp",          date:"2026-09-24", lecture:6 },
  { slug:"devis-travaux-renovation-guide",           titre:"Devis travaux rénovation : comment structurer votre devis et éviter les litiges",                 cat:"BTP",           emoji:"🏠",metier:null,          sujet:"devis-btp",            date:"2026-09-25", lecture:5 },
  { slug:"facture-travaux-renovation-2026",          titre:"Facture travaux rénovation 2026 : TVA 10%, mentions et conformité",                                cat:"BTP",           emoji:"🏠",metier:null,          sujet:"facture-btp",          date:"2026-09-26", lecture:5 },
  { slug:"gestion-chantier-numerique-2026",          titre:"Gestion de chantier numérique : outils et méthodes pour artisans BTP 2026",                      cat:"BTP",           emoji:"💻",metier:null,          sujet:"gestion-btp",          date:"2026-09-27", lecture:5 },
  { slug:"tva-btp-guide-complet-2026",               titre:"TVA dans le BTP 2026 : guide complet des taux applicables selon les travaux",                     cat:"BTP",           emoji:"📊",metier:null,          sujet:"facture-btp",          date:"2026-09-28", lecture:6 },
  { slug:"auto-liquidation-tva-sous-traitant-btp",   titre:"Auto-liquidation de TVA sous-traitant BTP 2026 : guide complet et obligations",                   cat:"BTP",           emoji:"📋",metier:null,          sujet:"facture-btp",          date:"2026-09-29", lecture:6 },
  { slug:"devis-construction-neuve-2026",            titre:"Devis construction neuve 2026 : TVA 20%, contenu obligatoire et bonnes pratiques",                cat:"BTP",           emoji:"🏗️",metier:null,          sujet:"devis-btp",            date:"2026-09-30", lecture:5 },
  { slug:"facture-situation-travaux-btp",            titre:"Situation de travaux BTP : comment créer et gérer vos factures intermédiaires",                   cat:"BTP",           emoji:"📊",metier:null,          sujet:"facture-btp",          date:"2026-10-01", lecture:5 },
  { slug:"facture-renovation-energetique-2026",      titre:"Facture rénovation énergétique 2026 : TVA 5,5%, MaPrimeRénov et conformité",                      cat:"BTP",           emoji:"♻️",metier:null,          sujet:"facture-btp",          date:"2026-10-02", lecture:5 },
  { slug:"devis-renovation-energetique-guide",       titre:"Devis rénovation énergétique : comment intégrer les aides d'État dans vos devis",                cat:"BTP",           emoji:"♻️",metier:null,          sujet:"devis-btp",            date:"2026-10-03", lecture:5 },
  { slug:"facture-second-oeuvre-btp-2026",           titre:"Facture second œuvre BTP 2026 : guide pour menuisiers, plaquistes et peintres",                   cat:"BTP",           emoji:"🏗️",metier:null,          sujet:"facture-btp",          date:"2026-10-04", lecture:5 },
  { slug:"devis-gros-oeuvre-guide-2026",             titre:"Devis gros œuvre 2026 : comment chiffrer et présenter vos travaux de structure",                  cat:"BTP",           emoji:"🏗️",metier:null,          sujet:"devis-btp",            date:"2026-10-05", lecture:5 },
  { slug:"devis-amenagement-interieur-guide",        titre:"Devis aménagement intérieur : structure, prix et astuces pour les artisans",                      cat:"BTP",           emoji:"🛋️",metier:null,          sujet:"devis-btp",            date:"2026-10-06", lecture:4 },
  /* ── Articles Factur-X et loi 2026 ───────────────────────────────────────── */
  { slug:"facture-electronique-artisan-guide",       titre:"Facture électronique artisan 2026 : tout comprendre en 5 minutes",                                cat:"Loi & Réglementation", emoji:"⚖️",metier:"artisan",     sujet:"facture-loi",  date:"2026-10-07", lecture:5 },
  { slug:"factur-x-artisan-guide-pratique",          titre:"Factur-X pour artisan : guide pratique pour être conforme dès 2026",                              cat:"Loi & Réglementation", emoji:"📱",metier:"artisan",     sujet:"facture-loi",  date:"2026-10-08", lecture:5 },
  { slug:"reforme-facturation-electronique-btp",     titre:"Réforme facturation électronique BTP : dates, obligations et solutions",                          cat:"Loi & Réglementation", emoji:"⚖️",metier:null,         sujet:"facture-loi",  date:"2026-10-09", lecture:5 },
  { slug:"pdp-plateforme-dematerialisation-artisan", titre:"PDP (Plateforme de Dématérialisation Partenaire) : ce que ça change pour les artisans",            cat:"Loi & Réglementation", emoji:"🏛️",metier:"artisan",    sujet:"facture-loi",  date:"2026-10-10", lecture:5 },
  { slug:"conformite-facture-artisan-btp-checklist", titre:"Conformité facture artisan BTP : checklist complète 2026",                                         cat:"Loi & Réglementation", emoji:"✅",metier:null,         sujet:"facture-loi",  date:"2026-10-11", lecture:5 },
  { slug:"facturation-electronique-plombier-2026",   titre:"Facturation électronique plombier 2026 : comment s'y préparer",                                   cat:"Loi & Réglementation", emoji:"🔧",metier:"plombier",    sujet:"facture-elec", date:"2026-10-12", lecture:4 },
  { slug:"facturation-electronique-electricien-2026",titre:"Facturation électronique électricien 2026 : guide de préparation",                                cat:"Loi & Réglementation", emoji:"⚡",metier:"électricien", sujet:"facture-elec", date:"2026-10-13", lecture:4 },
  { slug:"facturation-electronique-macon-2026",      titre:"Facturation électronique maçon 2026 : obligations et solutions pratiques",                         cat:"Loi & Réglementation", emoji:"🧱",metier:"maçon",       sujet:"facture-elec", date:"2026-10-14", lecture:4 },
  { slug:"facturation-electronique-couvreur-2026",   titre:"Facturation électronique couvreur 2026 : Factur-X et obligations",                                cat:"Loi & Réglementation", emoji:"🏗️",metier:"couvreur",    sujet:"facture-elec", date:"2026-10-15", lecture:4 },
  { slug:"facturation-electronique-menuisier",       titre:"Facturation électronique menuisier 2026 : guide de mise en conformité",                           cat:"Loi & Réglementation", emoji:"🪚",metier:"menuisier",   sujet:"facture-elec", date:"2026-10-16", lecture:4 },
  { slug:"facturation-electronique-peintre",         titre:"Facturation électronique peintre bâtiment 2026 : Factur-X expliqué",                              cat:"Loi & Réglementation", emoji:"🎨",metier:"peintre",     sujet:"facture-elec", date:"2026-10-17", lecture:4 },
  { slug:"facturation-electronique-chauffagiste",    titre:"Facturation électronique chauffagiste 2026 : obligations et solutions",                           cat:"Loi & Réglementation", emoji:"🔥",metier:"chauffagiste", sujet:"facture-elec", date:"2026-10-18", lecture:4 },
  { slug:"mention-rge-devis-facture-btp",            titre:"Mention RGE sur devis et facture BTP : obligations et bonnes pratiques 2026",                     cat:"Loi & Réglementation", emoji:"✅",metier:null,          sujet:"facture-loi",  date:"2026-10-19", lecture:4 },
  { slug:"assurance-decennale-facture-artisan",      titre:"Assurance décennale sur facture artisan : mention obligatoire et conformité",                     cat:"Loi & Réglementation", emoji:"🛡️",metier:"artisan",    sujet:"facture-loi",  date:"2026-10-20", lecture:4 },
  /* ── Articles logiciels et apps ───────────────────────────────────────────── */
  { slug:"logiciel-devis-facture-btp-2026",          titre:"Logiciel devis et facture BTP 2026 : comparatif des 5 meilleures solutions",                      cat:"Logiciels",     emoji:"💻",metier:null,          sujet:"logiciel",             date:"2026-10-21", lecture:6 },
  { slug:"meilleur-logiciel-artisan-btp-2026",       titre:"Meilleur logiciel artisan BTP 2026 : Artisan+ vs Tolteck vs Obat",                                cat:"Logiciels",     emoji:"🏆",metier:null,          sujet:"logiciel",             date:"2026-10-22", lecture:6 },
  { slug:"logiciel-facturation-gratuit-artisan",     titre:"Logiciel de facturation gratuit artisan : les vraies options en 2026",                            cat:"Logiciels",     emoji:"💰",metier:null,          sujet:"logiciel",             date:"2026-10-23", lecture:5 },
  { slug:"app-devis-facture-chantier-2026",          titre:"App devis et facture sur chantier : créer et envoyer depuis le terrain en 2026",                  cat:"Logiciels",     emoji:"📱",metier:null,          sujet:"appli-facturation",    date:"2026-10-24", lecture:4 },
  { slug:"paiement-en-ligne-artisan-2026",           titre:"Paiement en ligne artisan 2026 : intégrer le paiement dans vos factures",                        cat:"Logiciels",     emoji:"💳",metier:null,          sujet:"paiement",             date:"2026-10-25", lecture:4 },
  { slug:"signature-electronique-devis-artisan",     titre:"Signature électronique devis artisan : légalité et meilleures solutions 2026",                    cat:"Logiciels",     emoji:"✍️",metier:null,          sujet:"faire-devis",          date:"2026-10-26", lecture:4 },
  { slug:"catalogue-prix-artisan-btp",               titre:"Catalogue de prix artisan BTP : créer et maintenir votre grille tarifaire",                       cat:"Logiciels",     emoji:"📊",metier:null,          sujet:"tarif",                date:"2026-10-27", lecture:4 },
  /* ── Articles BTP par ville ───────────────────────────────────────────────── */
  { slug:"artisan-btp-paris-guide-2026",             titre:"Artisan BTP Paris 2026 : marché, prix et gestion des chantiers en Île-de-France",                 cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-10-28", lecture:4 },
  { slug:"artisan-btp-lyon-guide-2026",              titre:"Artisan BTP Lyon 2026 : marché de la construction dans la métropole lyonnaise",                   cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-10-29", lecture:4 },
  { slug:"artisan-btp-marseille-guide-2026",         titre:"Artisan BTP Marseille 2026 : activité BTP et gestion des chantiers",                              cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-10-30", lecture:4 },
  { slug:"artisan-btp-toulouse-guide-2026",          titre:"Artisan BTP Toulouse 2026 : marché de la construction et gestion de chantier",                    cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-10-31", lecture:4 },
  { slug:"artisan-btp-bordeaux-guide-2026",          titre:"Artisan BTP Bordeaux 2026 : secteur BTP et outils de gestion pour artisans",                      cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-01", lecture:4 },
  { slug:"artisan-btp-nantes-guide-2026",            titre:"Artisan BTP Nantes 2026 : marché de la construction et facturation conforme",                     cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-02", lecture:4 },
  { slug:"artisan-btp-strasbourg-guide-2026",        titre:"Artisan BTP Strasbourg 2026 : activité BTP et gestion administrative",                            cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-03", lecture:4 },
  { slug:"artisan-btp-lille-guide-2026",             titre:"Artisan BTP Lille 2026 : secteur BTP, prix du marché et outils de gestion",                      cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-04", lecture:4 },
  { slug:"artisan-btp-nice-guide-2026",              titre:"Artisan BTP Nice 2026 : marché de la construction sur la Côte d'Azur",                            cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-05", lecture:4 },
  { slug:"artisan-btp-montpellier-guide-2026",       titre:"Artisan BTP Montpellier 2026 : croissance du BTP et logiciels de gestion",                        cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-06", lecture:4 },
  { slug:"artisan-btp-rennes-guide-2026",            titre:"Artisan BTP Rennes 2026 : dynamisme du secteur et gestion de chantier efficace",                  cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-07", lecture:4 },
  { slug:"artisan-btp-grenoble-guide-2026",          titre:"Artisan BTP Grenoble 2026 : rénovation énergétique et marché de la construction",                 cat:"BTP",           emoji:"🏙️",metier:null,          sujet:"btp",                  date:"2026-11-08", lecture:4 },
  /* ── Articles auto-entrepreneur BTP ──────────────────────────────────────── */
  { slug:"auto-entrepreneur-btp-facturation-2026",   titre:"Auto-entrepreneur BTP 2026 : facturation, TVA et conformité Factur-X",                            cat:"Auto-Entrepreneur", emoji:"📋",metier:"auto-entrepreneur", sujet:"ae-facturation", date:"2026-11-09", lecture:5 },
  { slug:"micro-entrepreneur-btp-devis-2026",        titre:"Micro-entrepreneur BTP : créer des devis professionnels et décrocher des chantiers",               cat:"Auto-Entrepreneur", emoji:"📝",metier:"micro-entrepreneur", sujet:"faire-devis",    date:"2026-11-10", lecture:5 },
  { slug:"auto-entrepreneur-maconnerie-facturation", titre:"Auto-entrepreneur maçonnerie : facturation, seuils et obligations 2026",                           cat:"Auto-Entrepreneur", emoji:"🧱",metier:"maçon",       sujet:"ae-facturation",       date:"2026-11-11", lecture:5 },
  { slug:"auto-entrepreneur-plomberie-gestion",      titre:"Auto-entrepreneur plomberie : gérer son activité et sa facturation simplement",                    cat:"Auto-Entrepreneur", emoji:"🔧",metier:"plombier",    sujet:"ae-facturation",       date:"2026-11-12", lecture:5 },
  { slug:"auto-entrepreneur-electricien-guide",      titre:"Auto-entrepreneur électricien : obligations, devis et factures conformes 2026",                   cat:"Auto-Entrepreneur", emoji:"⚡",metier:"électricien", sujet:"ae-facturation",       date:"2026-11-13", lecture:5 },
  { slug:"facture-conforme-auto-entrepreneur-2026",  titre:"Facture conforme auto-entrepreneur en 2026 : toutes les mentions obligatoires",                    cat:"Auto-Entrepreneur", emoji:"📋",metier:"auto-entrepreneur", sujet:"ae-facturation", date:"2026-11-14", lecture:5 },
  /* ── Articles gestion et suivi ───────────────────────────────────────────── */
  { slug:"impaye-artisan-comment-gerer-2026",        titre:"Impayés artisan 2026 : comment les prévenir et récupérer ses créances",                            cat:"Gestion",       emoji:"💸",metier:"artisan",     sujet:"paiement",             date:"2026-11-15", lecture:5 },
  { slug:"relance-client-artisan-guide",             titre:"Relance client artisan : modèles et timing optimal pour récupérer vos factures",                   cat:"Gestion",       emoji:"📧",metier:"artisan",     sujet:"clients",              date:"2026-11-16", lecture:4 },
  { slug:"tresorerie-artisan-btp-guide",             titre:"Trésorerie artisan BTP : comment éviter les crises de trésorerie en 2026",                        cat:"Gestion",       emoji:"💰",metier:null,          sujet:"paiement",             date:"2026-11-17", lecture:5 },
  { slug:"charges-artisan-btp-optimiser-2026",       titre:"Charges artisan BTP 2026 : guide pour optimiser votre fiscalité",                                  cat:"Gestion",       emoji:"📉",metier:null,          sujet:"urssaf",               date:"2026-11-18", lecture:5 },
  { slug:"devis-chantier-urgent-artisan",            titre:"Devis chantier urgent : comment répondre vite et professionnellement",                             cat:"Devis",         emoji:"⚡",metier:"artisan",     sujet:"devis-rapide",         date:"2026-11-19", lecture:4 },
  /* ── Articles site vitrine et communication ──────────────────────────────── */
  { slug:"site-web-artisan-btp-guide-2026",          titre:"Site web artisan BTP 2026 : pourquoi et comment créer votre vitrine en ligne",                    cat:"Communication", emoji:"🌐",metier:"artisan",     sujet:"site",                 date:"2026-11-20", lecture:5 },
  { slug:"site-vitrine-macon-2026",                  titre:"Site vitrine maçon 2026 : attirer des clients sur internet sans effort",                           cat:"Communication", emoji:"🧱",metier:"maçon",       sujet:"site",                 date:"2026-11-21", lecture:4 },
  { slug:"site-vitrine-plombier-2026",               titre:"Site vitrine plombier 2026 : comment attirer des clients locaux en ligne",                         cat:"Communication", emoji:"🔧",metier:"plombier",    sujet:"site",                 date:"2026-11-22", lecture:4 },
  { slug:"site-vitrine-electricien-2026",            titre:"Site vitrine électricien 2026 : référencement local et acquisition clients",                       cat:"Communication", emoji:"⚡",metier:"électricien", sujet:"site",                 date:"2026-11-23", lecture:4 },
  { slug:"avis-clients-artisan-btp-guide",           titre:"Avis clients artisan BTP : comment les collecter et les valoriser",                                cat:"Communication", emoji:"⭐",metier:null,          sujet:"clients",              date:"2026-11-24", lecture:4 },
];

// ── Générateur de contenu ─────────────────────────────────────────────────────
function genContenu(art) {
  const { metier, sujet, titre } = art;
  const m = metier || "artisan";
  const M = m.charAt(0).toUpperCase() + m.slice(1);

  const INTROS = {
    devis:    `En tant que ${m} professionnel, établir un devis précis et conforme est la première étape pour décrocher des chantiers. Un devis bien rédigé rassure le client, protège l'artisan en cas de litige et pose les bases d'une relation de confiance. Voici tout ce que vous devez savoir pour créer des devis professionnels rapidement.`,
    logiciel: `Choisir le bon logiciel de facturation est crucial pour un ${m}. Un bon outil vous fait gagner plusieurs heures par semaine sur la gestion administrative et vous permet de vous concentrer sur votre vrai métier. On fait le point sur les meilleures solutions disponibles en 2025.`,
    tarif:    `Fixer ses tarifs est l'un des défis principaux du métier de ${m}. Trop bas, vous travaillez à perte. Trop élevé, vous perdez des clients. Voici une grille de prix complète pour 2025, basée sur les données du marché et les retours d'artisans.`,
    chantier: `Bien préparer et chiffrer un chantier de ${m} permet d'éviter les mauvaises surprises et les litiges. Prix, délais, matériaux, main d'œuvre : voici tout ce que votre document doit contenir pour être complet et professionnel.`,
    appli:    `Les applications mobiles transforment la gestion quotidienne des ${m}s. Créer un devis en quelques minutes depuis le chantier, envoyer la facture par email, recevoir le paiement en ligne — tout ça depuis votre smartphone. Tour d'horizon des meilleures apps en 2025.`,
    legal:    `La réglementation impose plusieurs obligations aux artisans en matière de documents commerciaux. Que vous soyez micro-entrepreneur, auto-entrepreneur ou en société, voici ce que la loi exige et comment vous mettre en conformité facilement.`,
    tva:      `La TVA est un sujet complexe pour les artisans. Taux de 5,5%, 10% ou 20% selon les travaux, TVA sur les débits ou les encaissements, déclarations, récupération... Voici un guide complet pour comprendre et gérer la TVA en 2025.`,
    urssaf:   `Les cotisations URSSAF représentent une part importante des charges de l'artisan. Comprendre leur calcul, les délais de paiement et les exonérations possibles vous permet d'optimiser votre trésorerie. Guide complet pour 2025.`,
    paiement: `Le paiement en ligne révolutionne la gestion des créances pour les artisans. Fini les chèques perdus et les virements qui tardent — vos clients paient directement depuis leur facture par carte bancaire. Tour d'horizon des solutions 2025.`,
    site:     `Avoir un site web professionnel est devenu indispensable pour un artisan. C'est votre vitrine numérique, votre carte de visite disponible 24h/24. Bonne nouvelle : il existe des solutions gratuites ou très abordables en 2025.`,
    clients:      `La fidélisation client est le nerf de la guerre pour les artisans. Un client satisfait revient et vous recommande à son entourage. Voici les meilleures pratiques pour suivre vos clients et développer votre activité.`,
    "facture-elec": `La réforme de la facturation électronique en France oblige toutes les entreprises à basculer vers des formats structurés dès 2026. Pour les artisans et TPE, deux dates clés : septembre 2026 pour la réception, septembre 2027 pour l'émission. Voici ce que vous devez savoir — et comment Artisan+ vous accompagne.`,
    "facture-ligne": `Créer ses factures en ligne est devenu indispensable pour les artisans modernes. Fini les carnets à souche et les documents Word mal formatés — un outil en ligne vous permet de générer des factures conformes, de les envoyer par email et de recevoir vos paiements en quelques clics. Voici ce qu'il faut savoir pour bien choisir votre solution.`,
    "devis-ligne": `Pouvoir créer et envoyer un devis depuis son smartphone, directement sur le chantier lors de la visite client, c'est un avantage concurrentiel réel. Les clients apprécient la réactivité, et un devis envoyé le jour même est signé bien plus souvent que celui envoyé une semaine après. Voici comment optimiser votre process de devis en ligne.`,
    "faire-facture": `Faire une facture conforme n'est pas toujours simple pour un artisan. La législation française impose de nombreuses mentions obligatoires, une numérotation précise et des règles de TVA complexes selon le type de travaux. Ce guide vous explique tout pour créer des factures irréprochables et éviter les litiges avec l'administration.`,
    "faire-devis": `Un bon devis est la base de toute relation commerciale saine pour un artisan. Il protège aussi bien l'artisan que le client, fixe les conditions de la prestation et engage les deux parties. Voici comment créer des devis professionnels et conformes, qui maximisent vos chances de décrocher le chantier.`,
    "appli-facturation": `Les applications de facturation pour artisans ont révolutionné la gestion administrative du quotidien. Devis créés sur le chantier, factures envoyées immédiatement, paiements reçus en ligne — tout ce qui prenait des heures peut maintenant se faire en minutes. Voici notre guide pour choisir la meilleure application selon votre activité.`,
    "ae-facturation": `En tant qu'auto-entrepreneur artisan, votre facturation doit respecter des règles spécifiques à votre statut : mention de franchise TVA, numéro SIRET obligatoire, numéro au Registre des Métiers (RM), numérotation chronologique... Un logiciel dédié vous évite les erreurs et vous protège en cas de contrôle de l'administration.`,
    "facture-loi": `La loi de finances 2024 a profondément réformé la facturation en France. Dès 2026, toutes les entreprises devront basculer vers la facturation électronique structurée. Pour les artisans, cette réforme implique de s'équiper d'un logiciel conforme au format Factur-X. Voici tout ce que vous devez savoir pour anticiper sans stress.`,
    "btp": `Le secteur du Bâtiment et des Travaux Publics impose des contraintes particulières en matière de facturation et de gestion de chantier. Situations de travaux, retenues de garantie, auto-liquidation de TVA pour les sous-traitants, pointage des équipes... Sans outil adapté, la paperasse prend le dessus sur le vrai travail. Un logiciel pensé pour le BTP vous permet de gérer votre activité comme un pro, même quand vous travaillez seul ou en petite équipe.`,
    "facture-btp": `Faire une facture dans le BTP n'est pas une simple facture de prestation. Situation de travaux, retenue de garantie de 5%, TVA auto-liquidée pour les sous-traitants, numéro de chantier et mention RGE si vous intervenez sur des travaux de rénovation énergétique... Autant de spécificités qui imposent un outil de facturation pensé pour les professionnels du bâtiment. Voici tout ce qu'il faut savoir pour facturer correctement dans le BTP en 2026.`,
    "devis-btp": `Dans le BTP, un devis bien structuré peut faire la différence entre décrocher un chantier et le perdre face à la concurrence. Les donneurs d'ordre — maîtres d'ouvrage, particuliers, promoteurs — exigent des devis détaillés avec décomposition précise par poste. La forme du document influence autant que le prix : un devis professionnel inspire confiance là où un document Word mal formaté inquiète. Voici comment créer des devis BTP qui décrochent les chantiers.`,
    "facture-rapide": `Créer une facture en 2 minutes — c'est possible, même pour un artisan. Avec les bons outils, vous pouvez générer une facture professionnelle, conforme à la législation française et prête à envoyer en quelques clics depuis votre smartphone. Chaque heure passée sur la paperasse est une heure de moins sur le chantier. Voici comment accélérer votre processus de facturation et récupérer ce temps précieux pour votre vrai métier.`,
    "devis-rapide": `Un devis envoyé le jour même de la visite client a statistiquement 3 fois plus de chances d'être signé qu'un devis envoyé une semaine après. Dans un marché où les particuliers comparent souvent plusieurs artisans, la réactivité est un vrai avantage commercial. Voici comment créer des devis professionnels en quelques minutes et vous démarquer de la concurrence sans effort supplémentaire.`,
    "gestion-btp": `Gérer un chantier BTP, c'est jongler entre planning, approvisionnement, sous-traitants, situations de travaux et relances clients. Sans outil adapté, vous passez des heures en administratif alors que vous devriez être sur le terrain. Les logiciels de gestion BTP modernes permettent de tout centraliser : devis, factures, planning, photos de chantier, pointage d'équipe et suivi des encaissements — depuis votre smartphone.`,
    "facture-corps-metier": `Faire une facture conforme en tant que ${m} dans le BTP comporte des spécificités que peu d'artisans maîtrisent parfaitement. Taux de TVA réduit, auto-liquidation pour les sous-traitants, situation de travaux, retenue de garantie — chaque aspect a ses règles. Ce guide complet est spécialement conçu pour les ${m}s qui veulent facturer juste et vite en 2026.`,
    "devis-corps-metier": `Un devis de ${m} bien rédigé est votre meilleur argument commercial. Dans le BTP, les particuliers et les maîtres d'ouvrage comparent toujours plusieurs professionnels. Un devis clair, détaillé et professionnel vous démarque immédiatement de la concurrence — même si votre prix n'est pas le plus bas. Voici comment construire un devis de ${m} qui déclenche la signature.`,
    "gestion-metier-btp": `La gestion d'une activité de ${m} dans le BTP va bien au-delà des travaux eux-mêmes. Planification des chantiers, gestion des matériaux et fournisseurs, suivi de la facturation, relances clients... Un artisan ${m} efficace est aussi un gestionnaire organisé. Voici comment les ${m}s les plus performants gèrent leur activité en 2026.`,
    "conseil-pro": `Développer son activité de ${m} en 2026 demande à la fois une excellente maîtrise technique et des compétences commerciales solides. Les artisans qui se démarquent ne sont pas forcément les meilleurs techniciens — ce sont souvent ceux qui communiquent le mieux, répondent le plus vite et s'équipent des bons outils. Voici les conseils concrets des ${m}s qui ont fait passer leur activité au niveau supérieur.`,
  };

  const intro = INTROS[sujet] || INTROS.devis;

  const SECTIONS = {
    devis: [
      {
        titre: `Mentions obligatoires sur un devis de ${m}`,
        contenu: `Un devis de ${m} doit obligatoirement mentionner : votre nom, prénom et adresse professionnelle (ou raison sociale), votre numéro SIRET, votre numéro d'assurance décennale si applicable, la date d'émission et la durée de validité du devis, une description détaillée des travaux à réaliser, le prix unitaire et total HT, le taux de TVA applicable et le montant TTC. Oubliez l'une de ces mentions et votre devis n'est pas légalement valide.`,
      },
      {
        titre: `Comment calculer le prix d'un devis ${m} ?`,
        contenu: `Le prix d'un devis ${m} se calcule en additionnant : le coût de la main d'œuvre (heures × taux horaire), le coût des matériaux (avec votre marge), les frais de déplacement, et votre marge bénéficiaire. Pensez aussi à inclure le coût des garanties et assurances. En pratique, utilisez un catalogue de prix pour aller plus vite et éviter les oublis. Artisan+ intègre un catalogue de prestations que vous pouvez personnaliser avec vos prix habituels.`,
      },
      {
        titre: `Quel logiciel pour créer un devis ${m} rapidement ?`,
        contenu: `Les meilleurs logiciels de devis pour ${m} en 2025 sont Artisan+ (7,99€/mois), Tolteck (19€/mois) et Obat (39€/mois). Artisan+ se distingue par son rapport qualité-prix exceptionnel et ses fonctionnalités complètes : catalogue de prix personnalisable, signature électronique, envoi par email et paiement en ligne. Créez votre premier devis en moins de 2 minutes, directement depuis votre smartphone sur le chantier.`,
      },
      {
        titre: `Artisan+ : votre devis ${m} en 2 minutes`,
        contenu: `Avec Artisan+, créez un devis professionnel en quelques clics : sélectionnez vos prestations dans votre catalogue, ajustez les quantités, ajoutez votre client et envoyez par email. Votre client signe électroniquement depuis son smartphone — légalement valide. Dès la signature, transformez le devis en facture en un clic. Essayez gratuitement, sans carte bancaire.`,
      },
    ],
    logiciel: [
      {
        titre: `Fonctionnalités indispensables d'un logiciel pour ${m}`,
        contenu: `Un bon logiciel de facturation pour ${m} doit inclure : création de devis et factures conformes à la législation française, catalogue de prix personnalisable, envoi par email, signature électronique des devis, suivi des paiements et relances, export PDF professionnel et mode mobile (smartphone). Des fonctionnalités avancées comme le suivi de chantier, le paiement en ligne et le mini-site vitrine sont de véritables plus.`,
      },
      {
        titre: `Comparatif des logiciels de facturation pour ${m} en 2025`,
        contenu: `Voici les principaux logiciels disponibles : Artisan+ à 7,99€/mois (le moins cher, fonctionnalités complètes), Tolteck à 19€/mois (simple mais limité), Obat à 39€/mois (complet mais cher), ArtisanFacture à 29€/mois (correct mais sans suivi chantier ni paiement en ligne). Artisan+ offre le meilleur rapport fonctionnalités/prix avec des outils exclusifs comme le suivi chantier avancé, le mini-site vitrine et le paiement en ligne client.`,
      },
      {
        titre: `Comment démarrer avec un logiciel de devis ${m} ?`,
        contenu: `Pour démarrer rapidement : 1) Créez votre compte sur Artisan+ (gratuit), 2) Complétez votre profil avec votre SIRET et informations professionnelles, 3) Configurez votre catalogue de prix ${m}, 4) Créez votre premier devis et envoyez-le à un client. L'ensemble prend moins de 15 minutes. Artisan+ vous guide étape par étape et propose des modèles pré-remplis adaptés au métier de ${m}.`,
      },
    ],
    tarif: [
      {
        titre: `Grille de prix ${M} 2025`,
        contenu: `Les tarifs d'un ${m} varient selon la région, l'expérience et la complexité des travaux. En France, le taux horaire moyen d'un ${m} se situe entre 40€ et 80€ HT. À Paris et en Île-de-France, comptez 15 à 20% de plus. Les prix sont également influencés par le coût des matériaux, qui ont augmenté de 8 à 15% en 2024. Pour rester compétitif, mettez régulièrement à jour votre catalogue de prix.`,
      },
      {
        titre: `Comment fixer ses tarifs en tant que ${m} ?`,
        contenu: `Pour fixer vos tarifs en tant que ${m}, calculez votre seuil de rentabilité : charges fixes mensuelles ÷ heures facturables = coût horaire minimum. Ajoutez votre marge bénéficiaire souhaitée (généralement 20-30% pour un artisan). Comparez avec les prix du marché local et ajustez selon votre positionnement (entrée de gamme, milieu de gamme, haut de gamme). N'oubliez pas d'intégrer le temps de trajet, les garanties et le risque chantier.`,
      },
      {
        titre: `Gérez vos tarifs facilement avec Artisan+`,
        contenu: `Artisan+ vous permet de créer un catalogue de prix personnalisé avec vos tarifs habituels. Quand vous créez un devis, il vous suffit de sélectionner la prestation dans votre catalogue — le prix se remplit automatiquement. Vous pouvez ajuster à la hausse ou à la baisse pour chaque chantier. Plus besoin de recalculer à chaque fois, vous gagnez du temps et évitez les erreurs.`,
      },
    ],
    chantier: [
      {
        titre: `Que doit contenir ce type de devis ?`,
        contenu: `Un devis complet pour ce type de chantier doit détailler : la description précise des travaux à réaliser, les matériaux utilisés avec leurs références et quantités, le coût de la main d'œuvre, le délai d'exécution prévisionnel, les conditions de paiement (acompte, solde), la mention de l'assurance décennale si applicable, et les conditions de garantie. Plus le devis est précis, moins il y a de risques de litiges.`,
      },
      {
        titre: `Comment chiffrer ce type de travaux ?`,
        contenu: `Pour chiffrer correctement ce type de chantier : commencez par une visite sur place pour mesurer et évaluer la complexité, estimez les matériaux nécessaires avec 10% de marge pour les chutes et erreurs, calculez le nombre d'heures de main d'œuvre en ajoutant 20% pour les imprévus, ajoutez les frais de déplacement et de gestion. Utilisez un logiciel comme Artisan+ avec votre catalogue de prix pour aller plus vite et ne rien oublier.`,
      },
      {
        titre: `Simplifiez votre gestion avec Artisan+`,
        contenu: `Artisan+ vous permet de créer ce type de devis en 2 minutes depuis votre smartphone, directement sur le chantier. Votre catalogue de prix personnalisé, l'envoi par email avec signature électronique et la transformation en facture en un clic vous font gagner plusieurs heures par semaine. À 7,99€/mois seulement — 2 à 5 fois moins cher que la concurrence.`,
      },
    ],
    appli: [
      {
        titre: `Critères pour choisir une application devis ${m}`,
        contenu: `Une bonne application de devis pour ${m} doit être utilisable hors connexion (sur un chantier sans internet), permettre la création rapide de devis depuis un catalogue de prix, envoyer le devis par email depuis l'app, et proposer la signature électronique. L'interface doit être simple et rapide — vous n'êtes pas derrière un bureau, vous avez les mains occupées sur le chantier.`,
      },
      {
        titre: `Comparatif des meilleures apps pour ${m} en 2025`,
        contenu: `Artisan+ (iOS/Android, 7,99€/mois Pro) est l'app la plus complète pour les ${m}s : devis en 2 minutes, signature électronique, paiement en ligne, suivi de chantier et 20 outils métier intégrés. Tolteck (19€/mois) est simple mais limité. Obat (39€/mois) est complet mais coûteux. Artisan+ est installable comme une PWA sur iOS et Android, fonctionne hors connexion et synchronise automatiquement quand vous retrouvez le réseau.`,
      },
      {
        titre: `Artisan+ : l'app tout-en-un pour ${m}`,
        contenu: `Artisan+ est conçu pour les artisans qui travaillent sur le terrain. En plus des devis et factures, l'app intègre 20 outils métier : niveau à bulle (gyroscope du téléphone), boussole, lampe torche, mesure par photo IA, identificateur de matériaux IA, notes vocales, checklist chantier... Tout ce dont vous avez besoin sur un chantier, dans une seule app à 7,99€/mois.`,
      },
    ],
  };

  const SECTIONS_FE = [
    {
      titre: `Facturation électronique pour ${m} : les dates à retenir`,
      contenu: `Deux échéances à connaître : 1er septembre 2026 — toute entreprise (y compris les ${m}s) doit pouvoir recevoir des factures électroniques structurées via une Plateforme de Dématérialisation Partenaire (PDP) agréée. 1er septembre 2027 — les TPE, PME, micro-entreprises et auto-entrepreneurs du secteur du ${m} devront aussi émettre leurs factures en format structuré (Factur-X, UBL ou CII). Les factures PDF non structurées ne seront plus acceptées pour les transactions B2B.`,
    },
    {
      titre: `Qu'est-ce que le format Factur-X pour un ${m} ?`,
      contenu: `Factur-X est le standard français de facturation électronique structurée. C'est un fichier PDF enrichi d'un XML embarqué conforme à la norme européenne EN 16931. Pour un ${m}, cela signifie concrètement : votre facture habituelle reste identique visuellement (PDF lisible par votre client), mais elle contient aussi une couche de données structurées (XML) que les logiciels de comptabilité peuvent lire automatiquement. Deux profils existent : MINIMUM (pour les micro-entreprises sans TVA, art. 293B CGI) et EN16931 (pour les ${m}s assujettis à la TVA).`,
    },
    {
      titre: `Artisan+ génère déjà les factures Factur-X pour les ${m}s`,
      contenu: `Artisan+ a intégré la génération de fichiers Factur-X XML conformes EN 16931 dans son tableau de bord. Pour chaque facture créée, un bouton "Factur-X" vous permet de télécharger instantanément le fichier XML structuré correspondant. Les données nécessaires (SIRET, adresse, lignes de prestation, TVA, IBAN) sont déjà stockées en base de données de façon structurée. Aucun paramétrage supplémentaire n'est requis : Artisan+ détermine automatiquement le bon profil selon votre régime TVA.`,
    },
    {
      titre: `Comment choisir une application de facture électronique pour ${m} ?`,
      contenu: `Pour choisir la bonne application de facturation électronique en tant que ${m}, vérifiez : 1) Le logiciel génère-t-il bien du Factur-X, UBL ou CII ? (formats acceptés par la réforme), 2) Est-il connecté à une PDP (Plateforme de Dématérialisation Partenaire) agréée ?, 3) Reste-t-il simple à utiliser sur le chantier ?, 4) Le prix est-il raisonnable ? Artisan+ répond à ces 4 critères : format Factur-X intégré, interface simple pour ${m}s, à 7,99€/mois — soit 2 à 5× moins cher que la concurrence.`,
    },
  ];

  const SECTIONS_FACTURE_LIGNE = [
    { titre: "Faire une facture en ligne : les étapes clés", contenu: `Pour créer une facture en ligne conforme : 1) Connectez-vous à votre logiciel (Artisan+ sur smartphone ou ordinateur), 2) Sélectionnez ou créez votre client, 3) Ajoutez vos lignes de prestation depuis votre catalogue de prix, 4) Vérifiez le taux de TVA applicable (5,5%, 10% ou 20% selon le type de travaux), 5) Envoyez directement par email. Le tout prend moins de 2 minutes avec Artisan+.` },
    { titre: "Mentions légales obligatoires sur une facture artisan", contenu: `Une facture d'artisan doit obligatoirement mentionner : numéro de facture séquentiel unique, date d'émission, vos coordonnées complètes (nom, adresse, SIRET, n° TVA intracommunautaire si assujetti), coordonnées du client, description précise des prestations, quantités, prix unitaires HT, taux de TVA et montant TTC, conditions de règlement, délai de paiement et taux des pénalités de retard (obligatoire en B2B). Artisan+ génère automatiquement tous ces éléments.` },
    { titre: "Paiement en ligne : recevez vos règlements plus vite", contenu: `Avec Artisan+, chaque facture envoyée par email contient un bouton de paiement en ligne. Vos clients paient par carte bancaire en quelques secondes — sans chèque, sans virement qui tarde. Le montant est crédité sur votre compte sous 2 à 3 jours ouvrés via Stripe. Résultat : moins d'impayés et une trésorerie plus saine.` },
    { titre: "Artisan+ : votre facture en ligne en 2 minutes", contenu: `Artisan+ est conçu pour les artisans qui n'ont pas de temps à perdre sur la paperasse. Créez votre catalogue de prestations une fois, et chaque nouvelle facture se remplit en quelques clics. Envoi par email, signature électronique des devis, transformation devis→facture en 1 clic, paiement en ligne intégré. Le tout à 7,99€/mois — essai gratuit sans carte bancaire.` },
  ];
  const SECTIONS_DEVIS_LIGNE = [
    { titre: "Comment créer un devis en ligne professionnel", contenu: `Pour créer un devis en ligne professionnel avec Artisan+ : 1) Ajoutez votre client (ou créez-en un nouveau), 2) Sélectionnez vos prestations dans votre catalogue de prix, 3) Ajustez les quantités et les prix si nécessaire, 4) Prévisualisez le PDF, 5) Envoyez par email. Votre client reçoit un lien pour signer électroniquement — sans imprimer, sans scanner.` },
    { titre: "Devis en ligne vs devis papier : les avantages", contenu: `Un devis en ligne présente de nombreux avantages par rapport au devis papier : envoi instantané par email (pas d'attente postal), signature électronique immédiate, traçabilité complète (date d'envoi, d'ouverture, de signature), transformation automatique en facture dès signature, et conformité légale garantie. Le taux de transformation est aussi significativement plus élevé.` },
    { titre: "Signature électronique : légalement valide en France", contenu: `En France, la signature électronique est régie par le règlement eIDAS (UE n° 910/2014) depuis 2016. Une signature électronique simple a la même valeur probante qu'une signature manuscrite lorsqu'elle est horodatée et rattachée au document. Artisan+ génère des signatures électroniques conformes eIDAS, avec horodatage et archivage automatique.` },
    { titre: "Artisan+ : devis en ligne en 2 minutes depuis votre smartphone", contenu: `Avec Artisan+, créez votre devis depuis le chantier lors de la visite client, envoyez-le par email avant de repartir, et recevez la signature électronique souvent dans l'heure. Le taux de signature augmente car le client peut signer immédiatement, sans avoir à imprimer, signer et scanner. À 7,99€/mois seulement.` },
  ];
  const SECTIONS_FAIRE_FACTURE = [
    { titre: "Mentions légales obligatoires : la liste complète", contenu: `Votre facture doit impérativement mentionner : 1) Numéro de facture séquentiel (ex: 2026-042), 2) Date d'émission, 3) Vos coordonnées : nom/prénom, adresse, SIRET, n° TVA intracommunautaire (si assujetti), 4) Coordonnées complètes du client, 5) Description précise des travaux par ligne, 6) Prix unitaire HT, quantité, total HT, 7) Taux de TVA et montant de TVA, 8) Total TTC, 9) Délai de paiement et taux des pénalités de retard, 10) Conditions d'escompte (ou mention "Pas d'escompte pour paiement anticipé").` },
    { titre: "Quel taux de TVA appliquer sur vos travaux ?", contenu: `Les taux de TVA applicables aux travaux artisanaux : 5,5% pour les travaux de rénovation énergétique (isolation, chaudière, panneaux solaires) dans les logements de plus de 2 ans, 10% pour les travaux de rénovation et d'amélioration dans les logements de plus de 2 ans (peinture, carrelage, plomberie, électricité...), 20% pour les travaux de construction neuve et les travaux dans les logements de moins de 2 ans. Si vous êtes sous le seuil de franchise TVA (art. 293B CGI), vous ne facturez pas de TVA.` },
    { titre: "La réforme 2026–2027 : votre facture doit aussi être électronique", contenu: `À partir du 1er septembre 2027, vos factures adressées à des clients professionnels (B2B) devront être émises au format électronique structuré : Factur-X, UBL ou CII. Artisan+ génère automatiquement le fichier XML Factur-X conforme EN 16931 pour chaque facture créée, en plus du PDF habituel. Aucune action supplémentaire requise.` },
    { titre: "Artisan+ automatise votre facturation", contenu: `Avec Artisan+, oubliez les modèles Word et Excel. Artisan+ génère des factures conformes automatiquement : mentions légales complètes, numérotation chronologique, calcul TVA selon le taux configuré, envoi par email avec paiement en ligne intégré, et archivage sécurisé 10 ans dans le cloud. À 7,99€/mois seulement — le tarif le plus bas du marché.` },
  ];
  const SECTIONS_FAIRE_DEVIS = [
    { titre: "Devis obligatoire : quand et pour quel montant ?", contenu: `Le devis est obligatoire pour tout artisan dès que le montant des travaux dépasse 150€ TTC pour un client particulier (Code de la consommation, article L. 211-1). Pour les clients professionnels (B2B), il n'y a pas de seuil légal mais un devis est fortement recommandé pour éviter les litiges. En pratique, établissez toujours un devis, quelle que soit la valeur du chantier.` },
    { titre: "Mentions obligatoires sur un devis artisan", contenu: `Un devis d'artisan doit comporter : date d'émission et durée de validité (généralement 30 à 90 jours), vos coordonnées complètes et numéro SIRET, coordonnées du client (nom, adresse), description détaillée des travaux par ligne (fournitures + pose séparées), prix unitaire HT, quantité et total HT pour chaque ligne, taux et montant de TVA, total TTC, délai d'exécution prévisionnel, conditions d'acceptation (signature + mention "Bon pour accord"), et mention de votre assurance décennale le cas échéant.` },
    { titre: "Comment calculer son prix de revient sur un devis", contenu: `Pour calculer le prix de revient d'un chantier : main d'œuvre = nombre d'heures × taux horaire chargé (incluant charges sociales), matériaux = prix d'achat × (1 + taux de marge souhaité, généralement 30-40%), frais de déplacement = nombre de km × 0,50€ minimum, plus-value chantier = 10-15% pour les imprévus, marge bénéficiaire = 15-25% sur le total. Artisan+ avec son catalogue de prix personnalisable vous permet de calculer automatiquement votre prix de revient.` },
    { titre: "Artisan+ : votre devis professionnel en 2 minutes", contenu: `Créez un devis professionnel avec Artisan+ en 3 étapes : 1) Sélectionnez votre client, 2) Ajoutez vos prestations depuis votre catalogue personnalisé, 3) Envoyez par email. Votre client signe électroniquement depuis son smartphone. Dès la signature, transformez le devis en facture en un clic — sans ressaisie. Essai gratuit sans carte bancaire, puis 7,99€/mois.` },
  ];
  const SECTIONS_APPLI_FACTURATION = [
    { titre: "Critères pour choisir une application de facturation artisan", contenu: `Votre application de facturation doit : fonctionner sur smartphone (iOS et Android), créer rapidement devis et factures depuis votre catalogue, permettre l'envoi par email avec signature électronique, intégrer le paiement en ligne, fonctionner hors connexion sur le chantier, être conforme à la législation française et à la réforme Factur-X 2026, et rester abordable (moins de 15€/mois pour un solo-artisan). Artisan+ coche toutes ces cases à 7,99€/mois.` },
    { titre: "Comparatif des meilleures applications de facturation artisan 2026", contenu: `Le podium 2026 : 1) Artisan+ (7,99€/mois) — le meilleur rapport qualité-prix, le plus complet avec suivi chantier, paiement en ligne, mini-site et Factur-X. 2) Tolteck (19€/mois) — simple mais limité, sans suivi chantier ni paiement en ligne. 3) Obat (39€/mois) — complet mais cher, plutôt adapté aux entreprises de 5+ salariés. 4) ArtisanFacture (29€/mois) — correct pour la facturation basique uniquement.` },
    { titre: "Application gratuite vs payante : le vrai coût", contenu: `Une application de facturation gratuite peut paraître attractive, mais ses limitations vous coûtent du temps : nombre de factures limité, pas de signature électronique, pas de paiement en ligne, interface basique, pas de catalogue de prix, pas de Factur-X pour 2026. Le temps perdu en ressaisie et relances représente souvent 3 à 5 heures par semaine — soit bien plus que 7,99€/mois pour Artisan+.` },
    { titre: "Artisan+ : l'app tout-en-un pour artisans", contenu: `Artisan+ est bien plus qu'une application de facturation : c'est un outil de gestion complet pour artisans. En plus des devis et factures, Artisan+ inclut le suivi de chantier avec photos, la gestion d'équipe/ouvriers, le mini-site vitrine automatique, 20 outils terrain (niveau, boussole, mesure IA), et la conformité Factur-X 2026. Tout ça pour 7,99€/mois — essai gratuit sans carte bancaire.` },
  ];
  const SECTIONS_AE_FACTURATION = [
    { titre: "Règles de facturation spécifiques aux auto-entrepreneurs artisans", contenu: `En tant qu'auto-entrepreneur artisan, vos factures doivent obligatoirement mentionner : votre nom/prénom, adresse professionnelle, numéro SIRET, numéro au Registre des Métiers (RM) ou au Registre du Commerce (RC) selon votre activité, la mention 'TVA non applicable - art. 293B du CGI' si vous êtes sous le seuil de franchise TVA (37 500€ pour les services et prestations, 85 000€ pour les ventes de marchandises en 2026).` },
    { titre: "Seuils de chiffre d'affaires auto-entrepreneur 2026", contenu: `Les seuils de franchise TVA pour les auto-entrepreneurs en 2026 : 37 500€ de chiffre d'affaires pour les prestations de services (artisans du bâtiment, jardinage, etc.), 85 000€ pour les activités commerciales (vente de marchandises). Si vous dépassez ces seuils, vous devez facturer la TVA à partir du 1er jour du mois de dépassement. Artisan+ calcule automatiquement si la mention TVA doit apparaître selon votre configuration.` },
    { titre: "Réforme facturation électronique 2027 : impact sur les auto-entrepreneurs", contenu: `La réforme de la facturation électronique s'applique aussi aux auto-entrepreneurs artisans. À partir du 1er septembre 2027, pour vos clients professionnels (maîtres d'ouvrage, autres entreprises, SCI...), vous devrez émettre vos factures au format Factur-X profil MINIMUM — un format PDF avec un fichier XML simplifié prévu spécialement pour les micro-entreprises sans TVA. Artisan+ gère ce profil automatiquement.` },
    { titre: "Artisan+ : spécialement adapté aux auto-entrepreneurs", contenu: `Artisan+ propose une configuration dédiée aux auto-entrepreneurs artisans : franchise TVA automatique (mention légale ajoutée automatiquement), numérotation conforme, export PDF et Factur-X profil MINIMUM, et tous les outils dont vous avez besoin pour gérer vos devis et chantiers. À 7,99€/mois seulement, c'est la solution la plus abordable du marché pour un auto-entrepreneur artisan.` },
  ];
  const SECTIONS_FACTURE_LOI = [
    { titre: "La nouvelle loi sur la facturation : ce qui change pour les artisans", contenu: `La loi de finances 2024 (article 91) a instauré la généralisation de la facturation électronique structurée en France. Pour les artisans, deux dates clés : 1er septembre 2026 pour la réception des factures électroniques (toutes entreprises) et 1er septembre 2027 pour l'émission par les TPE, PME et micro-entreprises. Les factures PDF non structurées ne seront plus acceptées pour les transactions B2B à partir de cette date.` },
    { titre: "Factur-X : le format imposé par la nouvelle loi", contenu: `Factur-X est le format recommandé en France par la DGFiP pour se conformer à la nouvelle réglementation. C'est un fichier PDF hybride enrichi d'un XML structuré conforme à la norme européenne EN 16931. Deux profils existent : MINIMUM (pour les micro-entreprises sous franchise TVA, comme la plupart des auto-entrepreneurs artisans) et EN16931 (pour les entreprises assujetties à la TVA). Artisan+ génère automatiquement le bon profil selon votre situation.` },
    { titre: "PDP : la plateforme que vous devrez utiliser", contenu: `Pour être conforme à la nouvelle loi, vous devrez passer par une Plateforme de Dématérialisation Partenaire (PDP) agréée par la DGFiP pour transmettre vos factures électroniques à vos clients professionnels. La liste des PDP agréées est en cours de publication. En attendant, équipez-vous d'un logiciel comme Artisan+ qui génère déjà les fichiers Factur-X XML, prêts à être transmis via la PDP de votre choix.` },
    { titre: "Artisan+ : prêt pour la nouvelle loi, dès aujourd'hui", contenu: `Artisan+ est le logiciel artisan le plus abordable du marché déjà compatible avec la nouvelle réglementation de la facturation électronique. Pour chaque facture créée dans Artisan+, vous pouvez télécharger en un clic le fichier XML Factur-X conforme EN 16931. Aucun paramétrage supplémentaire, aucune mise à jour payante — c'est inclus dans l'abonnement à 7,99€/mois.` },
  ];
  const SECTIONS_BTP = [
    { titre: "Les spécificités de la facturation dans le BTP", contenu: `Le BTP a ses propres règles en matière de facturation. Contrairement à une facture de prestation classique, une facture BTP peut inclure : des situations de travaux (factures intermédiaires selon l'avancement du chantier), une retenue de garantie de 5% restituée à la réception des travaux, l'auto-liquidation de TVA pour les sous-traitants travaillant pour un donneur d'ordre assujetti, et des plus-values de chantier pour les travaux imprévus. Maîtriser ces particularités est essentiel pour éviter les litiges et rester dans les règles comptables.` },
    { titre: "Situations de travaux : facturer l'avancement de chantier", contenu: `Les situations de travaux sont des factures intermédiaires émises au fur et à mesure de l'avancement du chantier. Elles permettent d'encaisser des acomptes progressifs plutôt que d'attendre la fin du chantier pour tout facturer. Une situation de travaux doit mentionner : le numéro de situation (1ère, 2ème situation...), le pourcentage d'avancement pour chaque poste, le cumul déjà facturé, le montant de la situation courante HT et TTC, et la retenue de garantie éventuellement appliquée. Artisan+ vous permet de créer des situations de travaux précises à partir de votre devis initial.` },
    { titre: "TVA dans le BTP : auto-liquidation et taux selon travaux", contenu: `Dans le BTP, plusieurs taux de TVA s'appliquent selon la nature des travaux : 20% pour les travaux neufs et la construction, 10% pour la rénovation dans les logements de plus de 2 ans (peinture, carrelage, plomberie, électricité), 5,5% pour les travaux de rénovation énergétique (isolation, pompe à chaleur, panneaux solaires, chaudière à condensation). L'auto-liquidation de TVA est obligatoire pour les sous-traitants BTP travaillant pour un donneur d'ordre assujetti : le sous-traitant facture HT et le donneur d'ordre reverse la TVA. Artisan+ gère automatiquement ces règles.` },
    { titre: "Artisan+ : le logiciel de facturation BTP le plus abordable", contenu: `Artisan+ est conçu pour répondre aux besoins spécifiques des professionnels du bâtiment : situations de travaux, retenue de garantie configurable, gestion des sous-traitants avec auto-liquidation TVA, suivi de chantier avec photos, catalogue de prix BTP personnalisable. À 7,99€/mois, c'est la solution la plus abordable du marché pour les artisans et TPE du BTP. Déjà compatible avec la réforme de facturation électronique 2026 (Factur-X EN 16931 inclus).` },
  ];
  const SECTIONS_DEVIS_BTP = [
    { titre: "Ce que doit contenir un devis BTP professionnel", contenu: `Un devis BTP complet doit inclure : la description précise de chaque poste avec sous-détail des travaux, les matériaux utilisés avec références et quantités exactes, le coût de la main d'œuvre séparé des fournitures, le délai d'exécution et le planning prévisionnel, les conditions de paiement (pourcentages d'avancement), la mention de l'assurance décennale et de la garantie biennale, et le prix unitaire puis total HT/TTC pour chaque poste. Plus le devis est détaillé, moins il y a de risques de litige en cours de chantier. Un devis vague génère des travaux supplémentaires contestés.` },
    { titre: "Comment chiffrer correctement un chantier BTP", contenu: `Pour chiffrer un chantier BTP avec précision : commencez par une visite de chantier approfondie avec métrage détaillé, identifiez les aléas potentiels (structure ancienne, présence d'amiante, accessibilité réduite), calculez les matériaux avec 10-15% de marge pour les pertes et erreurs, estimez les heures de main d'œuvre en incluant les temps de préparation et de nettoyage, ajoutez les frais de location de matériel si nécessaire, et intégrez une provision pour travaux imprévus de 5 à 10% du total. Un devis trop serré qui ne tient pas compte des aléas vous coûtera plus cher à terme qu'un devis légèrement plus élevé mais réaliste.` },
    { titre: "Gagner des appels d'offres BTP grâce à un devis professionnel", contenu: `Dans le BTP, la forme du devis influence autant que le fond. Un devis bien présenté, structuré en postes clairs et sans faute d'orthographe inspire confiance aux maîtres d'ouvrage. Utilisez un logiciel comme Artisan+ pour créer des devis au format PDF soigné avec votre logo et vos coordonnées. La signature électronique intégrée permet au client de signer immédiatement depuis son email, sans impression. Les maîtres d'ouvrage et promoteurs qui comparent plusieurs devis prennent systématiquement celui qui est le plus lisible et professionnel.` },
    { titre: "Artisan+ pour vos devis BTP : simple, rapide, professionnel", contenu: `Avec Artisan+, créez vos devis BTP en quelques minutes depuis votre smartphone ou ordinateur. Votre catalogue de prix BTP personnalisable contient toutes vos prestations habituelles — vous les sélectionnez en quelques clics plutôt que de les retaper. Envoyez le devis par email, obtenez la signature électronique de votre client, et transformez le devis en facture d'acompte en un clic. À 7,99€/mois, Artisan+ est la solution la plus économique pour les professionnels du bâtiment.` },
  ];
  const SECTIONS_FACTURE_RAPIDE = [
    { titre: "Comment créer une facture professionnelle en moins de 2 minutes", contenu: `Créer une facture en 2 minutes avec Artisan+ : 1) Ouvrez l'application sur votre smartphone, 2) Sélectionnez votre client (ou créez-en un nouveau en 30 secondes), 3) Choisissez vos prestations dans votre catalogue de prix — les prix se remplissent automatiquement, 4) Ajustez les quantités si nécessaire, 5) Envoyez directement par email. Votre client reçoit une facture PDF professionnelle avec un bouton de paiement en ligne intégré. La totalité de l'opération prend moins de 2 minutes, même sur un chantier.` },
    { titre: "Le catalogue de prix : la clé pour facturer vite et sans erreur", contenu: `La vraie astuce pour créer des factures rapides est de maintenir un catalogue de prix à jour. Au lieu de taper le nom et le prix de chaque prestation à chaque fois, vous le faites une seule fois lors de la configuration initiale. Ensuite, créer une facture se résume à sélectionner des lignes et ajuster les quantités. Artisan+ vous permet de créer autant de prestations que nécessaire, organisées par catégories, avec vos prix habituels et votre taux de TVA configuré par défaut. Chaque facture devient cohérente et sans oubli.` },
    { titre: "Envoyer sa facture instantanément depuis le chantier", contenu: `L'avantage de facturer depuis le smartphone, c'est de pouvoir envoyer la facture immédiatement à la fin de l'intervention, encore en présence du client. Le client reçoit la facture par email quelques secondes après la fin du chantier — une expérience professionnelle qui vous démarque et évite les oublis. Avec le paiement en ligne intégré dans Artisan+, il peut même régler directement depuis l'email par carte bancaire, avant que vous soyez arrivé chez vous. Moins d'impayés, meilleure trésorerie.` },
    { titre: "Artisan+ : la facturation la plus rapide du marché pour artisans", contenu: `Artisan+ est conçu pour les artisans qui n'ont pas de secrétaire pour gérer la paperasse. En moins de 2 minutes, vous créez et envoyez une facture complète, conforme à la législation française et compatible avec la réforme Factur-X 2026. À 7,99€/mois, c'est moins cher que le coût d'une heure de votre temps perdue à taper un document Word. Essai gratuit sans carte bancaire, accès immédiat à toutes les fonctionnalités.` },
  ];
  const SECTIONS_DEVIS_RAPIDE = [
    { titre: "Pourquoi la rapidité d'envoi du devis est un avantage concurrentiel", contenu: `Des études sectorielles montrent que le taux de transformation d'un devis chute significativement avec le temps. Un devis envoyé le jour même de la visite a environ 65-70% de chances d'être accepté. Ce taux tombe à 40-45% si le devis est envoyé 3 jours plus tard, et autour de 20-25% au-delà d'une semaine. Pendant ce temps, le client a contacté d'autres artisans. Dans un marché concurrentiel, être le premier à envoyer un devis professionnel est souvent suffisant pour décrocher le chantier, même si votre prix n'est pas le plus bas.` },
    { titre: "Créer un devis rapide sur smartphone lors de la visite client", contenu: `Avec une application comme Artisan+, vous pouvez créer votre devis pendant la visite client, en sa présence. Certains artisans montrent même le devis sur l'écran de leur téléphone avant de l'envoyer — une technique efficace pour détecter les objections et y répondre immédiatement. Le client signe électroniquement depuis son propre smartphone, et vous repartez du chantier avec un devis signé. C'est un niveau de réactivité que la concurrence qui rentre chez elle d'abord ne peut pas suivre.` },
    { titre: "Modèles de devis pré-configurés : gain de temps ultime", contenu: `Les modèles de devis pré-configurés pour les types de chantiers récurrents sont la clé pour créer des devis en 2 minutes. Pour chaque type de travaux habituel (installation électrique standard, rénovation salle de bain, entretien chaudière, peinture intérieure au m²...), créez un modèle avec les lignes de prestations pré-remplies. Lors de la prochaine visite similaire, chargez le modèle, ajustez les quantités et les détails spécifiques, envoyez. Ce qui prenait 30 minutes se fait en moins de 5 minutes.` },
    { titre: "Artisan+ : votre devis professionnel en moins de 3 minutes", contenu: `Avec Artisan+, créez un devis professionnel en 3 étapes : 1) Sélectionnez votre client, 2) Choisissez vos prestations dans votre catalogue de prix personnalisé, 3) Envoyez par email. Votre client peut signer électroniquement depuis son téléphone, sans imprimer ni scanner. Dès la signature, transformez le devis en facture en un clic. Essai gratuit sans carte bancaire, puis 7,99€/mois — le tarif le plus bas du marché pour un logiciel de devis complet.` },
  ];
  const SECTIONS_GESTION_BTP = [
    { titre: "Les enjeux de la gestion d'un chantier BTP en 2026", contenu: `Gérer un chantier BTP, c'est coordonner plusieurs intervenants simultanément : maçons, électriciens, plombiers, plaquistes, peintres. Un planning qui glisse, un sous-traitant qui ne se présente pas, une livraison de matériaux retardée — et c'est tout le chantier qui prend du retard. Les retards génèrent des pénalités, des litiges clients et une réputation dégradée. Un outil de gestion de chantier numérique vous permet de visualiser l'avancement en temps réel, de communiquer avec votre équipe et d'anticiper les problèmes avant qu'ils ne deviennent critiques.` },
    { titre: "Suivi de chantier avec photos : protection juridique et commercial", contenu: `Le suivi de chantier avec photos est devenu incontournable dans le BTP. En photographiant les différentes étapes des travaux, vous vous protégez juridiquement (preuve de l'état des lieux avant travaux et de l'avancement réel), vous rassurez votre client (qui n'est pas toujours présent sur place), et vous constituez un portfolio de réalisations pour votre mini-site vitrine et vos futurs prospects. Artisan+ intègre une galerie de photos par chantier, accessible directement depuis votre smartphone sur le terrain.` },
    { titre: "Gestion des sous-traitants BTP : cadre légal et facturation", contenu: `La gestion des sous-traitants dans le BTP est encadrée par la loi du 31 décembre 1975 sur la sous-traitance. Elle impose un contrat de sous-traitance écrit avant tout début des travaux, le droit au paiement direct du sous-traitant par le maître d'ouvrage sous conditions, et l'auto-liquidation de TVA lorsqu'un sous-traitant travaille pour un donneur d'ordre assujetti à la TVA. Artisan+ vous permet de créer des devis et factures de sous-traitance conformes, avec les mentions légales adaptées et la case auto-liquidation TVA.` },
    { titre: "Artisan+ : la gestion de chantier BTP à portée de smartphone", contenu: `Artisan+ centralise toute la gestion de vos chantiers BTP : devis et factures conformes (Factur-X 2026 inclus), situations de travaux, catalogue de prix BTP, galerie photos par chantier, gestion des sous-traitants, paiement en ligne client, et suivi de vos encaissements. À 7,99€/mois, c'est la solution la plus complète et la plus abordable pour les artisans et PME du bâtiment français. Essai gratuit sans carte bancaire.` },
  ];

  const SECTIONS_FACTURE_CORPS_METIER = [
    { titre: `TVA sur les factures de ${m} : taux applicables en 2026`, contenu: `En BTP, la TVA dépend de la nature des travaux et du statut du client. Pour les travaux de rénovation chez des particuliers, le taux réduit de 10% s'applique si le logement a plus de 2 ans — et même 5,5% pour les travaux d'amélioration de la performance énergétique (isolation, chaudière, pompe à chaleur) si vous êtes certifié RGE. Pour les constructions neuves ou en sous-traitance avec un donneur d'ordre assujetti à la TVA, c'est le taux de 20% et l'auto-liquidation qui s'appliquent. En tant que ${m}, vous devez identifier le bon taux sur chaque facture sous peine de redressement fiscal.` },
    { titre: `Situation de travaux vs facture finale : ce que doit savoir chaque ${m}`, contenu: `Pour les chantiers importants ou de longue durée, la pratique des situations de travaux (ou décomptes intermédiaires) est courante dans le BTP. Une situation de travaux n'est pas une facture finale — c'est un état d'avancement à un instant T, qui déclenche un paiement partiel. Elle doit mentionner le montant total du marché, le pourcentage d'avancement, le montant appelé et les sommes déjà réglées. Artisan+ permet de créer des situations de travaux conformes, liées à votre devis initial, et de les transformer automatiquement en facture de solde à la fin du chantier.` },
    { titre: `Retenue de garantie : comment la gérer dans vos factures de ${m}`, contenu: `La retenue de garantie est un mécanisme légal qui permet au maître d'ouvrage de retenir 5% du montant de chaque situation de travaux comme garantie contre les malfaçons. Cette somme est restituée 12 mois après la réception des travaux (sauf réserves). En pratique, sur une facture de 10 000€ TTC, le client ne règle que 9 500€ et conserve 500€ pendant un an. Artisan+ gère automatiquement la retenue de garantie dans vos factures BTP : le logiciel calcule les 5%, l'indique clairement sur le document et vous rappelle quand vous pouvez réclamer la levée de la retenue.` },
    { titre: `Artisan+ : la facturation ${m} conforme et sans effort`, contenu: `Artisan+ est conçu pour les ${m}s qui veulent des factures 100% conformes sans passer des heures sur l'administration. TVA calculée automatiquement selon le type de travaux, mentions légales adaptées au BTP, gestion des situations de travaux, retenue de garantie, auto-liquidation pour la sous-traitance, et export Factur-X pour la réforme 2026 — tout est intégré. À 7,99€/mois, vous n'avez plus besoin d'un comptable pour créer vos factures BTP. Essai gratuit sans carte bancaire.` },
  ];
  const SECTIONS_DEVIS_CORPS_METIER = [
    { titre: `Structure d'un devis de ${m} professionnel`, contenu: `Un devis de ${m} professionnel est organisé en plusieurs parties distinctes. L'en-tête contient vos coordonnées complètes (SIRET, assurance décennale, qualification professionnelle), celles de votre client et la date de validité. La partie descriptive détaille chaque poste de travaux : description précise, unité de mesure, quantité, prix unitaire HT et montant HT. Viennent ensuite les totaux (HT, TVA par taux, TTC), les conditions de paiement (acompte souhaité, délais de règlement) et la signature. Cette structure rassure immédiatement le client et montre votre sérieux.` },
    { titre: `Décomposition des postes de travaux dans un devis ${m}`, contenu: `La vraie valeur ajoutée d'un devis de ${m} est la décomposition précise par postes. Ne vous contentez pas d'une ligne "travaux de ${m} — forfait 5000€". Décomposez : fourniture des matériaux (avec références si possible), main d'œuvre (en heures ou en forfait par type d'intervention), location de matériel spécifique, travaux préparatoires, nettoyage et évacuation des déchets. Cette transparence inspire confiance, justifie votre prix et réduit les demandes de négociation car le client comprend d'où vient chaque euro.` },
    { titre: `Comment présenter votre devis de ${m} pour maximiser les signatures`, contenu: `La présentation visuelle de votre devis influence directement le taux de signature. Un document bien mis en page, avec votre logo, vos coordonnées clairement affichées et une mise en forme professionnelle vaut une augmentation de 15 à 20% du taux de conversion selon les retours d'artisans Artisan+. Les clients comparent souvent 3 à 5 devis : un document professionnel vous place instinctivement dans la catégorie "sérieux". Artisan+ génère automatiquement des devis avec votre identité visuelle, prêts à envoyer par email avec signature électronique intégrée.` },
    { titre: `Artisan+ : votre devis ${m} signé en 2 minutes`, contenu: `Avec Artisan+, créez votre devis de ${m} depuis votre smartphone en moins de 2 minutes : sélectionnez les prestations dans votre catalogue de prix personnalisé, ajustez les quantités, ajoutez les détails du chantier et envoyez par email. Votre client signe électroniquement depuis son propre téléphone — légalement valide et sans paperasse. Dès la signature, transformez le devis en facture en un seul clic. À 7,99€/mois, c'est la solution la plus rapide et la plus abordable du marché pour les ${m}s professionnels.` },
  ];
  const SECTIONS_GESTION_METIER_BTP = [
    { titre: `Planifier ses chantiers de ${m} : méthode et outils`, contenu: `La planification des chantiers est le premier défi organisationnel d'un ${m} qui développe son activité. Jongler entre plusieurs chantiers simultanément, gérer les disponibilités des sous-traitants et les livraisons de matériaux, prévoir les imprévus sans déstabiliser le planning global — c'est tout un art. Les meilleurs ${m}s utilisent un outil de planning simple avec vue hebdomadaire et alertes pour les conflits. Artisan+ intègre un gestionnaire de chantiers qui vous permet de visualiser tous vos chantiers actifs, leurs statuts et vos prochaines interventions depuis votre smartphone.` },
    { titre: `Gérer ses matériaux et fournisseurs en tant que ${m}`, contenu: `Pour un ${m}, les matériaux représentent généralement 30 à 50% du montant d'un chantier. Une mauvaise gestion des commandes génère des retards de livraison qui bloquent le chantier, du stock inutile qui immobilise votre trésorerie, ou des ruptures d'approvisionnement qui vous font perdre du temps. Les ${m}s les plus efficaces constituent une liste de fournisseurs de confiance, négocient des remises sur volume, commandent avec 2 à 3 jours d'avance et incluent toujours 10% de marge dans leurs devis pour les imprévus matière.` },
    { titre: `Suivi de facturation et relances clients pour ${m}`, contenu: `Le suivi de la facturation est l'une des tâches les plus chronophages pour un ${m} qui travaille seul. Savoir quelles factures ont été payées, lesquelles sont en retard, qui relancer et quand — sans un outil dédié, c'est une source de stress permanente. Des études montrent que 35% des impayés des artisans auraient pu être évités avec un système de relance automatique. Artisan+ vous envoie des alertes quand une facture approche de son échéance, vous permet d'envoyer une relance par email en un clic et suit l'historique complet des échanges avec chaque client.` },
    { titre: `Artisan+ : la gestion complète pour ${m} à 7,99€/mois`, contenu: `Artisan+ centralise toute la gestion de votre activité de ${m} : devis et factures BTP conformes (Factur-X 2026 inclus), situations de travaux, planning de chantiers, galerie photos par chantier, suivi des encaissements et relances clients automatiques. L'application fonctionne sur smartphone et PC, synchronise en temps réel et fonctionne même sans connexion sur le chantier. À 7,99€/mois — soit moins de 10 centimes par heure travaillée — c'est l'investissement le plus rentable pour un ${m} qui veut gagner du temps et développer son activité.` },
  ];
  const SECTIONS_CONSEIL_PRO = [
    { titre: `Réactivité commerciale : l'arme secrète du ${m} qui réussit`, contenu: `Dans le secteur BTP, la réactivité est l'un des premiers critères de choix des clients. Un particulier qui contacte 3 ${m}s choisit souvent celui qui répond en premier, pas forcément le moins cher. Répondre aux demandes de devis dans les 24h (idéalement dans les 4h), envoyer le devis le jour même de la visite, rappeler quand une demande est sans nouvelles depuis 3 jours — ces habitudes simples multiplient votre taux de transformation. Des artisans Artisan+ rapportent avoir augmenté leur taux de signature de 30 à 45% simplement en améliorant leur réactivité.` },
    { titre: `Fidéliser ses clients en tant que ${m} : les meilleures pratiques`, contenu: `Un client ${m} fidèle vaut 5 fois plus qu'un nouveau client car il revient, recommande et ne fait pas jouer la concurrence. Pour fidéliser : soignez la relation après le chantier (appel de satisfaction 2 semaines après la fin), proposez un contrat d'entretien annuel si votre métier le permet, envoyez un email saisonnier avec vos disponibilités, restez visible sur votre mini-site avec des réalisations récentes. Artisan+ intègre un module CRM simple qui vous rappelle de suivre vos clients et vous permet de les contacter en quelques clics depuis votre historique de chantiers.` },
    { titre: `Fixer ses prix en tant que ${m} : méthode pour ne pas travailler à perte`, contenu: `Beaucoup de ${m}s sous-évaluent leur prestation par peur de perdre des chantiers. Or, travailler à des prix trop bas est dangereux : trésorerie tendue, impossible de renouveler le matériel, burnout professionnel. La bonne méthode : calculez votre coût de revient complet (charges fixes mensuelles ÷ heures facturables + coût variable par heure), ajoutez votre marge cible (20-30% minimum), comparez avec le marché local. Si vos prix semblent élevés, c'est souvent votre communication qui doit monter en gamme — pas vos tarifs qui doivent baisser. Artisan+ vous aide à structurer votre catalogue de prix pour garantir votre rentabilité.` },
    { titre: `Artisan+ : l'outil des ${m}s qui veulent passer au niveau supérieur`, contenu: `Les artisans qui utilisent Artisan+ gagnent en moyenne 3 à 5 heures par semaine sur la gestion administrative. Ce temps récupéré, ils le réinvestissent dans plus de chantiers, dans la relation client ou simplement dans leur qualité de vie. Artisan+ propose devis et factures professionnels, mini-site vitrine, galerie de réalisations, outils de chantier sur smartphone, paiement en ligne client, et conformité Factur-X 2026. À 7,99€/mois — le tarif le plus bas du marché pour une solution aussi complète — c'est l'investissement le plus rentable pour un ${m} ambitieux. Essai gratuit sans carte bancaire.` },
  ];

  const sujetToSections = {
    "facture-ligne": SECTIONS_FACTURE_LIGNE,
    "devis-ligne": SECTIONS_DEVIS_LIGNE,
    "faire-facture": SECTIONS_FAIRE_FACTURE,
    "faire-devis": SECTIONS_FAIRE_DEVIS,
    "appli-facturation": SECTIONS_APPLI_FACTURATION,
    "ae-facturation": SECTIONS_AE_FACTURATION,
    "facture-loi": SECTIONS_FACTURE_LOI,
    "btp": SECTIONS_BTP,
    "facture-btp": SECTIONS_BTP,
    "devis-btp": SECTIONS_DEVIS_BTP,
    "facture-rapide": SECTIONS_FACTURE_RAPIDE,
    "devis-rapide": SECTIONS_DEVIS_RAPIDE,
    "gestion-btp": SECTIONS_GESTION_BTP,
    "facture-corps-metier": SECTIONS_FACTURE_CORPS_METIER,
    "devis-corps-metier": SECTIONS_DEVIS_CORPS_METIER,
    "gestion-metier-btp": SECTIONS_GESTION_METIER_BTP,
    "conseil-pro": SECTIONS_CONSEIL_PRO,
  };
  const sections = sujet === "facture-elec" ? SECTIONS_FE : (sujetToSections[sujet] || SECTIONS[sujet] || SECTIONS.devis);
  return { intro, sections };
}

// ── Categories ────────────────────────────────────────────────────────────────
const CATS = [...new Set(ARTICLES.map(a => a.cat))];

// ── Composant : En-tête blog ──────────────────────────────────────────────────
function BlogHeader() {
  return (
    <header style={{ background: D, borderBottom: "1px solid rgba(255,140,0,0.1)", padding: "0 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", height: "60px", display: "flex", alignItems: "center", gap: "20px" }}>
        <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "20px", fontWeight: "900", color: "white" }}>Artisan<span style={{ color: P }}>+</span></span>
        </a>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: P, fontWeight: "700", fontSize: "14px" }}>Blog</span>
        <div style={{ flex: 1 }} />
        <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
          style={{ background: P, color: "white", fontSize: "13px", fontWeight: "700", padding: "8px 18px", borderRadius: "8px", textDecoration: "none" }}>
          Essai gratuit →
        </a>
      </div>
    </header>
  );
}

function BlogFooter() {
  return (
    <footer style={{ background: C, borderTop: "1px solid rgba(255,140,0,0.1)", padding: "40px 20px", marginTop: "60px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ color: "white", fontWeight: "900", fontSize: "18px", marginBottom: "12px" }}>Artisan<span style={{ color: P }}>+</span></div>
        <p style={{ color: G, fontSize: "13px", marginBottom: "20px" }}>Logiciel devis et factures pour artisans — 7,99€/mois</p>
        <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
          style={{ background: P, color: "white", fontWeight: "800", padding: "12px 28px", borderRadius: "10px", textDecoration: "none", fontSize: "15px" }}>
          🚀 Essayer gratuitement
        </a>
        <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
          {[
            { label: "Accueil", href: "/" },
            { label: "CGU",    href: "/cgu" },
            { label: "Confidentialité", href: "/politique-confidentialite" },
          ].map(l => (
            <a key={l.label} href={l.href} onClick={e => { e.preventDefault(); navigate(l.href); }}
              style={{ color: G, fontSize: "12px", textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── PAGE : Liste des articles ──────────────────────────────────────────────────
function PageBlogListe({ filterCat }) {
  const [search,   setSearch]   = useState("");
  const [catActif, setCatActif] = useState(filterCat || "Tous");

  useEffect(() => {
    setPageMeta(
      "Blog Artisan+ | Conseils devis, facturation et gestion pour artisans",
      "Blog dédié aux artisans : logiciels de devis, facturation, gestion de chantier, conseils métier pour plombiers, électriciens, maçons et tous les artisans.",
      `${BASE}/blog`
    );
    const schema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Blog Artisan+",
      "description": "Conseils et guides pour les artisans : devis, facturation, gestion de chantier",
      "url": `${BASE}/blog`,
      "publisher": { "@type": "Organization", "name": "Artisan+", "url": BASE }
    };
    let el = document.getElementById("schema-blog");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-blog"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, []);

  const liste = ARTICLES.filter(a => {
    const okCat    = catActif === "Tous" || a.cat === catActif;
    const okSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase());
    return okCat && okSearch;
  });

  return (
    <>
      <BlogHeader />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "clamp(40px,6vw,70px) 20px" }}>
        {/* Hero blog */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,40px)", fontWeight: "900", margin: "0 0 12px" }}>
            Blog <span style={{ color: P }}>Artisan+</span>
          </h1>
          <p style={{ color: G, fontSize: "16px", marginBottom: "28px" }}>
            Guides, conseils et astuces pour les artisans français — {ARTICLES.length} articles
          </p>
          <input
            placeholder="🔍 Rechercher un article…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: C, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "12px", padding: "13px 18px", color: "white", fontSize: "14px", outline: "none", width: "100%", maxWidth: "480px", boxSizing: "border-box" }}
          />
        </div>

        {/* Catégories */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px", marginBottom: "32px", scrollbarWidth: "none" }}>
          {["Tous", ...CATS].map(cat => (
            <button key={cat} onClick={() => setCatActif(cat)}
              style={{ background: catActif === cat ? "rgba(255,140,0,0.15)" : C, border: `1.5px solid ${catActif === cat ? P : "rgba(255,255,255,0.08)"}`, color: catActif === cat ? P : G, borderRadius: "10px", padding: "8px 14px", fontSize: "13px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grille articles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {liste.map(art => (
            <a key={art.slug} href={`/blog/${art.slug}`}
              onClick={e => { e.preventDefault(); navigate(`/blog/${art.slug}`); }}
              style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "16px", padding: "24px", textDecoration: "none", display: "block", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ fontSize: "28px" }}>{art.emoji}</span>
                <span style={{ background: "rgba(255,140,0,0.1)", color: P, fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "6px" }}>{art.cat}</span>
              </div>
              <h2 style={{ color: "white", fontSize: "14px", fontWeight: "800", lineHeight: "1.5", margin: "0 0 12px" }}>{art.titre}</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#556677", fontSize: "11px" }}>
                  {new Date(art.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                <span style={{ color: G, fontSize: "11px" }}>⏱ {art.lecture} min</span>
              </div>
            </a>
          ))}
        </div>

        {liste.length === 0 && (
          <div style={{ textAlign: "center", color: G, padding: "60px 20px" }}>
            Aucun article trouvé pour « {search} »
          </div>
        )}
      </div>
      <BlogFooter />
    </>
  );
}

// ── PAGE : Article individuel ──────────────────────────────────────────────────
function PageArticle({ slug }) {
  const art = ARTICLES.find(a => a.slug === slug);

  useEffect(() => {
    if (!art) return;
    setPageMeta(
      art.titre + " | Artisan+",
      `${art.titre.slice(0, 120)}. Conseils pratiques pour artisans sur Artisan+.`,
      `${BASE}/blog/${art.slug}`
    );
    // Schema.org Article
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": art.titre,
      "datePublished": art.date,
      "dateModified": art.date,
      "author": { "@type": "Organization", "name": "Artisan+" },
      "publisher": { "@type": "Organization", "name": "Artisan+", "url": BASE },
      "url": `${BASE}/blog/${art.slug}`,
      "mainEntityOfPage": `${BASE}/blog/${art.slug}`,
    };
    let el = document.getElementById("schema-article");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-article"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, [art]);

  if (!art) {
    return (
      <>
        <BlogHeader />
        <div style={{ maxWidth: "800px", margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
          <div style={{ fontSize: "48px" }}>😕</div>
          <h1 style={{ color: "white" }}>Article introuvable</h1>
          <a href="/blog" onClick={e => { e.preventDefault(); navigate("/blog"); }} style={{ color: P, textDecoration: "none" }}>← Retour au blog</a>
        </div>
        <BlogFooter />
      </>
    );
  }

  const { intro, sections } = genContenu(art);
  const artlesRelated = ARTICLES.filter(a => a.slug !== art.slug && (a.cat === art.cat || a.metier === art.metier)).slice(0, 3);

  return (
    <>
      <BlogHeader />
      <article style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(40px,6vw,70px) 20px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "28px", flexWrap: "wrap" }}>
          <a href="/blog" onClick={e => { e.preventDefault(); navigate("/blog"); }} style={{ color: G, fontSize: "13px", textDecoration: "none" }}>Blog</a>
          <span style={{ color: G, fontSize: "13px" }}>›</span>
          <span style={{ color: P, fontSize: "13px" }}>{art.cat}</span>
        </div>

        {/* Header article */}
        <div style={{ marginBottom: "32px" }}>
          <span style={{ fontSize: "40px", display: "block", marginBottom: "16px" }}>{art.emoji}</span>
          <h1 style={{ color: "white", fontSize: "clamp(22px,4vw,34px)", fontWeight: "900", lineHeight: "1.25", margin: "0 0 16px" }}>{art.titre}</h1>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,140,0,0.1)", color: P, fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "8px" }}>{art.cat}</span>
            <span style={{ color: G, fontSize: "12px" }}>
              {new Date(art.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span style={{ color: G, fontSize: "12px" }}>⏱ {art.lecture} min de lecture</span>
          </div>
        </div>

        {/* CTA inline top */}
        <div style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "14px", padding: "16px 20px", marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>💡 Artisan+ : créez vos devis en 2 min — <span style={{ color: P }}>7,99€/mois</span></span>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ background: P, color: "white", fontSize: "13px", fontWeight: "700", padding: "9px 18px", borderRadius: "9px", textDecoration: "none", whiteSpace: "nowrap" }}>
            Essai gratuit →
          </a>
        </div>

        {/* Intro */}
        <p style={{ color: "#c8d8e8", fontSize: "16px", lineHeight: "1.8", marginBottom: "40px" }}>{intro}</p>

        {/* Sections */}
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: "36px" }}>
            <h2 style={{ color: "white", fontSize: "20px", fontWeight: "800", margin: "0 0 14px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,140,0,0.12)" }}>{s.titre}</h2>
            <p style={{ color: "#c8d8e8", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>{s.contenu}</p>
          </div>
        ))}

        {/* CTA final */}
        <div style={{ background: `linear-gradient(135deg, rgba(255,140,0,0.1), rgba(10,22,40,0))`, border: "1px solid rgba(255,140,0,0.25)", borderRadius: "20px", padding: "36px", textAlign: "center", margin: "48px 0" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🚀</div>
          <h3 style={{ color: "white", fontSize: "20px", fontWeight: "900", margin: "0 0 12px" }}>
            Prêt à simplifier votre gestion ?
          </h3>
          <p style={{ color: G, fontSize: "14px", marginBottom: "24px" }}>
            Rejoignez plus de 500 artisans qui font confiance à Artisan+. Essai gratuit, sans carte bancaire.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "14px 32px", borderRadius: "12px", textDecoration: "none" }}>
            Commencer gratuitement →
          </a>
          <div style={{ color: "#445566", fontSize: "12px", marginTop: "12px" }}>7,99€/mois · Sans engagement · Annulation en 1 clic</div>
        </div>

        {/* Articles liés */}
        {artlesRelated.length > 0 && (
          <div>
            <h3 style={{ color: "white", fontWeight: "800", fontSize: "18px", margin: "0 0 20px" }}>Articles liés</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
              {artlesRelated.map(a => (
                <a key={a.slug} href={`/blog/${a.slug}`}
                  onClick={e => { e.preventDefault(); navigate(`/blog/${a.slug}`); }}
                  style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "12px", padding: "16px", textDecoration: "none", display: "block" }}>
                  <span style={{ fontSize: "20px" }}>{a.emoji}</span>
                  <div style={{ color: "white", fontSize: "13px", fontWeight: "700", marginTop: "8px", lineHeight: "1.4" }}>{a.titre}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
      <BlogFooter />
    </>
  );
}

// ── Routeur Blog ──────────────────────────────────────────────────────────────
export default function Blog() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (path.startsWith("/blog/")) {
    const slug = path.replace("/blog/", "").split("?")[0];
    return <PageArticle slug={slug} />;
  }
  return <PageBlogListe />;
}
