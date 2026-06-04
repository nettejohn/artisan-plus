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

  const sections = sujet === "facture-elec" ? SECTIONS_FE : (SECTIONS[sujet] || SECTIONS.devis);
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
