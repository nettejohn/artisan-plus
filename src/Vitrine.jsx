/**
 * Vitrine Artisan+ — Site marketing complet
 * Routes : /, /devis-facture-:metier, /artisan-:ville,
 *          /alternative-:concurrent, /cgu, /politique-confidentialite
 */
import { useState, useEffect } from "react";

const P  = "#FF8C00";
const D  = "#0a1628";
const C  = "#111e35";
const G  = "#8899aa";
const BASE = "https://www.artisan-plus.fr";

// ── Données métiers (50 métiers) ──────────────────────────────────────────────
const METIERS = [
  // ── Top 20 (pages combinées métier+ville) ────────────────────────────────────
  { slug:"plombier",           label:"Plombier",             emoji:"🔧", art:"le",  accroche:"devis plomberie",          kw:"plombier",            desc:"plomberie et sanitaires" },
  { slug:"electricien",        label:"Électricien",          emoji:"⚡", art:"l'",  accroche:"devis électricité",         kw:"électricien",         desc:"travaux électriques" },
  { slug:"macon",              label:"Maçon",                emoji:"🧱", art:"le",  accroche:"devis maçonnerie",          kw:"maçon",               desc:"gros œuvre et maçonnerie" },
  { slug:"carreleur",          label:"Carreleur",            emoji:"🏠", art:"le",  accroche:"devis carrelage",           kw:"carreleur",           desc:"pose de carrelage et faïence" },
  { slug:"peintre",            label:"Peintre",              emoji:"🎨", art:"le",  accroche:"devis peinture",            kw:"peintre",             desc:"peinture et décoration" },
  { slug:"menuisier",          label:"Menuisier",            emoji:"🪚", art:"le",  accroche:"devis menuiserie",          kw:"menuisier",           desc:"menuiserie et ébénisterie" },
  { slug:"chauffagiste",       label:"Chauffagiste",         emoji:"🔥", art:"le",  accroche:"devis chauffage",           kw:"chauffagiste",        desc:"chauffage et climatisation" },
  { slug:"serrurier",          label:"Serrurier",            emoji:"🔑", art:"le",  accroche:"devis serrurerie",          kw:"serrurier",           desc:"serrurerie et sécurité" },
  { slug:"couvreur",           label:"Couvreur",             emoji:"🏗️", art:"le",  accroche:"devis toiture",             kw:"couvreur",            desc:"couverture et toiture" },
  { slug:"jardinier",          label:"Jardinier",            emoji:"🌿", art:"le",  accroche:"devis jardinage",           kw:"jardinier",           desc:"jardinage et espaces verts" },
  { slug:"charpentier",        label:"Charpentier",          emoji:"🌲", art:"le",  accroche:"devis charpente",           kw:"charpentier",         desc:"charpente bois et ossature" },
  { slug:"plaquiste",          label:"Plaquiste",            emoji:"🏗️", art:"le",  accroche:"devis plaquisterie",        kw:"plaquiste",           desc:"plaquisterie et cloisons sèches" },
  { slug:"facadier",           label:"Façadier",             emoji:"🏢", art:"le",  accroche:"devis façade",              kw:"façadier",            desc:"ravalement de façade et enduits" },
  { slug:"climaticien",        label:"Climaticien",          emoji:"❄️", art:"le",  accroche:"devis climatisation",       kw:"climaticien",         desc:"installation et maintenance climatisation" },
  { slug:"ramoneur",           label:"Ramoneur",             emoji:"🏠", art:"le",  accroche:"devis ramonage",            kw:"ramoneur",            desc:"ramonage et entretien cheminée" },
  { slug:"elagueur",           label:"Élagueur",             emoji:"🌳", art:"l'",  accroche:"devis élagage",             kw:"élagueur",            desc:"élagage et abattage d'arbres" },
  { slug:"paysagiste",         label:"Paysagiste",           emoji:"🌿", art:"le",  accroche:"devis paysagisme",          kw:"paysagiste",          desc:"aménagement paysager et jardins" },
  { slug:"pisciniste",         label:"Pisciniste",           emoji:"🏊", art:"le",  accroche:"devis piscine",             kw:"pisciniste",          desc:"construction et entretien piscine" },
  { slug:"terrassier",         label:"Terrassier",           emoji:"🚜", art:"le",  accroche:"devis terrassement",        kw:"terrassier",          desc:"terrassement et travaux de sol" },
  { slug:"vitrier",            label:"Vitrier",              emoji:"🪟", art:"le",  accroche:"devis vitrerie",            kw:"vitrier",             desc:"pose et remplacement vitrage" },
  // ── Métiers supplémentaires ──────────────────────────────────────────────────
  { slug:"etancheur",          label:"Étanchéiste",          emoji:"💧", art:"l'",  accroche:"devis étanchéité",          kw:"étanchéiste",         desc:"étanchéité et imperméabilisation" },
  { slug:"ferrailleur",        label:"Ferrailleur",          emoji:"⚙️", art:"le",  accroche:"devis ferraillage",         kw:"ferrailleur",         desc:"ferraillage et armatures béton" },
  { slug:"soudeur",            label:"Soudeur",              emoji:"🔩", art:"le",  accroche:"devis soudure",             kw:"soudeur",             desc:"soudure et assemblage métallique" },
  { slug:"metallier",          label:"Métallier",            emoji:"⚙️", art:"le",  accroche:"devis métallerie",          kw:"métallier",           desc:"métallerie et serrurerie industrielle" },
  { slug:"installateur-solaire",label:"Installateur solaire",emoji:"☀️", art:"l'",  accroche:"devis solaire",             kw:"installateur solaire",desc:"installation panneaux solaires photovoltaïques" },
  { slug:"nettoyeur",          label:"Nettoyeur",            emoji:"🧹", art:"le",  accroche:"devis nettoyage",           kw:"nettoyeur",           desc:"nettoyage professionnel de bâtiments" },
  { slug:"laveur-vitres",      label:"Laveur de vitres",     emoji:"🪟", art:"le",  accroche:"devis lavage vitres",       kw:"laveur de vitres",    desc:"lavage de vitres professionnel" },
  { slug:"debarrasseur",       label:"Débarrasseur",         emoji:"📦", art:"le",  accroche:"devis débarras",            kw:"débarrasseur",        desc:"débarras et vidage maison" },
  { slug:"domoticien",         label:"Domoticien",           emoji:"🏠", art:"le",  accroche:"devis domotique",           kw:"domoticien",          desc:"installation domotique et maison connectée" },
  { slug:"installateur-alarme",label:"Installateur alarme",  emoji:"🔒", art:"l'",  accroche:"devis alarme",              kw:"installateur alarme", desc:"installation alarme et sécurité" },
  { slug:"poseur-parquet",     label:"Poseur de parquet",    emoji:"🪵", art:"le",  accroche:"devis parquet",             kw:"poseur de parquet",   desc:"pose de parquet et sols stratifiés" },
  { slug:"poseur-fenetres",    label:"Poseur de fenêtres",   emoji:"🪟", art:"le",  accroche:"devis fenêtres",            kw:"poseur de fenêtres",  desc:"pose fenêtres et menuiseries extérieures" },
  { slug:"poseur-volets",      label:"Poseur de volets",     emoji:"🏠", art:"le",  accroche:"devis volets",              kw:"poseur de volets",    desc:"pose volets et stores" },
  { slug:"staffeur",           label:"Staffeur",             emoji:"🏛️", art:"le",  accroche:"devis staff",               kw:"staffeur",            desc:"décoration en staff et plâtre ornemental" },
  { slug:"stucateur",          label:"Stucateur",            emoji:"🎨", art:"le",  accroche:"devis stuc",                kw:"stucateur",           desc:"pose de stuc et enduits décoratifs" },
  { slug:"marbrier",           label:"Marbrier",             emoji:"🪨", art:"le",  accroche:"devis marbrerie",           kw:"marbrier",            desc:"marbrerie et pierre naturelle" },
  { slug:"paveur",             label:"Paveur",               emoji:"🧱", art:"le",  accroche:"devis pavage",              kw:"paveur",              desc:"pavage et dallage extérieur" },
  { slug:"frigoriste",         label:"Frigoriste",           emoji:"❄️", art:"le",  accroche:"devis froid industriel",    kw:"frigoriste",          desc:"installation et maintenance chambre froide" },
  { slug:"technicien-fibre",   label:"Technicien fibre",     emoji:"📡", art:"le",  accroche:"devis fibre optique",       kw:"technicien fibre",    desc:"installation fibre optique et réseau" },
  { slug:"installateur-pac",   label:"Installateur PAC",     emoji:"♨️", art:"l'",  accroche:"devis pompe à chaleur",     kw:"installateur PAC",    desc:"installation pompe à chaleur" },
  { slug:"deboucheur",         label:"Déboucheur",           emoji:"🔧", art:"le",  accroche:"devis débouchage",          kw:"déboucheur",          desc:"débouchage canalisation et assainissement" },
  { slug:"desinsectiseur",     label:"Désinsectiseur",       emoji:"🐛", art:"le",  accroche:"devis désinsectisation",    kw:"désinsectiseur",      desc:"désinsectisation et traitement nuisibles" },
  { slug:"derateur",           label:"Dératiseur",           emoji:"🐭", art:"le",  accroche:"devis dératisation",        kw:"dératiseur",          desc:"dératisation et lutte contre les nuisibles" },
  { slug:"miroitier",          label:"Miroitier",            emoji:"🪞", art:"le",  accroche:"devis miroiterie",          kw:"miroitier",           desc:"pose de miroirs et vitrages décoratifs" },
  { slug:"plombier-chauffagiste",label:"Plombier-chauffagiste",emoji:"🔧",art:"le",  accroche:"devis plomberie chauffage", kw:"plombier-chauffagiste",desc:"plomberie et chauffage combinés" },
  { slug:"electricien-industriel",label:"Électricien industriel",emoji:"⚡",art:"l'",accroche:"devis électricité industrielle",kw:"électricien industriel",desc:"électricité industrielle et tertiaire" },
  { slug:"isolateur",          label:"Isolateur thermique",  emoji:"🏠", art:"l'",  accroche:"devis isolation",           kw:"isolateur",           desc:"isolation thermique et phonique" },
  { slug:"echafaudeur",        label:"Échafaudeur",          emoji:"🏗️", art:"l'",  accroche:"devis échafaudage",         kw:"échafaudeur",         desc:"montage et location d'échafaudages" },
  { slug:"carreleur-mosaiste", label:"Carreleur mosaïste",   emoji:"🎨", art:"le",  accroche:"devis mosaïque",            kw:"carreleur mosaïste",  desc:"pose de mosaïque et carrelage décoratif" },
  { slug:"peintre-batiment",   label:"Peintre en bâtiment",  emoji:"🎨", art:"le",  accroche:"devis peinture bâtiment",   kw:"peintre en bâtiment", desc:"peinture intérieure et extérieure bâtiment" },
  { slug:"electricien-domotique",label:"Électricien domotique",emoji:"⚡",art:"l'",  accroche:"devis électricité domotique",kw:"électricien domotique",desc:"électricité et domotique maison connectée" },
];

// ── Données villes (300+ communes françaises >10 000 hab.) ────────────────────
const VILLES = [
  // ── Île-de-France ───────────────────────────────────────────────────────────
  { slug:"paris",                    label:"Paris",                    dept:"75", region:"Île-de-France",             pop:"2,1M"  },
  { slug:"boulogne-billancourt",     label:"Boulogne-Billancourt",     dept:"92", region:"Île-de-France",             pop:"120k"  },
  { slug:"saint-denis",              label:"Saint-Denis",              dept:"93", region:"Île-de-France",             pop:"110k"  },
  { slug:"argenteuil",               label:"Argenteuil",               dept:"95", region:"Île-de-France",             pop:"110k"  },
  { slug:"montreuil",                label:"Montreuil",                dept:"93", region:"Île-de-France",             pop:"105k"  },
  { slug:"nanterre",                 label:"Nanterre",                 dept:"92", region:"Île-de-France",             pop:"97k"   },
  { slug:"vitry-sur-seine",          label:"Vitry-sur-Seine",          dept:"94", region:"Île-de-France",             pop:"94k"   },
  { slug:"creteil",                  label:"Créteil",                  dept:"94", region:"Île-de-France",             pop:"91k"   },
  { slug:"asnières-sur-seine",       label:"Asnières-sur-Seine",      dept:"92", region:"Île-de-France",             pop:"88k"   },
  { slug:"colombes",                 label:"Colombes",                 dept:"92", region:"Île-de-France",             pop:"88k"   },
  { slug:"aubervilliers",            label:"Aubervilliers",            dept:"93", region:"Île-de-France",             pop:"86k"   },
  { slug:"versailles",               label:"Versailles",               dept:"78", region:"Île-de-France",             pop:"85k"   },
  { slug:"courbevoie",               label:"Courbevoie",               dept:"92", region:"Île-de-France",             pop:"85k"   },
  { slug:"rueil-malmaison",          label:"Rueil-Malmaison",          dept:"92", region:"Île-de-France",             pop:"83k"   },
  { slug:"aulnay-sous-bois",         label:"Aulnay-sous-Bois",        dept:"93", region:"Île-de-France",             pop:"82k"   },
  { slug:"champigny-sur-marne",      label:"Champigny-sur-Marne",     dept:"94", region:"Île-de-France",             pop:"78k"   },
  { slug:"saint-maur-des-fosses",    label:"Saint-Maur-des-Fossés",   dept:"94", region:"Île-de-France",             pop:"77k"   },
  { slug:"drancy",                   label:"Drancy",                   dept:"93", region:"Île-de-France",             pop:"68k"   },
  { slug:"noisy-le-grand",           label:"Noisy-le-Grand",          dept:"93", region:"Île-de-France",             pop:"68k"   },
  { slug:"issy-les-moulineaux",      label:"Issy-les-Moulineaux",     dept:"92", region:"Île-de-France",             pop:"67k"   },
  { slug:"levallois-perret",         label:"Levallois-Perret",        dept:"92", region:"Île-de-France",             pop:"65k"   },
  { slug:"neuilly-sur-seine",        label:"Neuilly-sur-Seine",       dept:"92", region:"Île-de-France",             pop:"62k"   },
  { slug:"clichy",                   label:"Clichy",                   dept:"92", region:"Île-de-France",             pop:"61k"   },
  { slug:"pantin",                   label:"Pantin",                   dept:"93", region:"Île-de-France",             pop:"57k"   },
  { slug:"le-blanc-mesnil",          label:"Le Blanc-Mesnil",         dept:"93", region:"Île-de-France",             pop:"56k"   },
  { slug:"fontenay-sous-bois",       label:"Fontenay-sous-Bois",      dept:"94", region:"Île-de-France",             pop:"53k"   },
  { slug:"maisons-alfort",           label:"Maisons-Alfort",          dept:"94", region:"Île-de-France",             pop:"53k"   },
  { slug:"sartrouville",             label:"Sartrouville",             dept:"78", region:"Île-de-France",             pop:"52k"   },
  { slug:"massy",                    label:"Massy",                    dept:"91", region:"Île-de-France",             pop:"47k"   },
  { slug:"meaux",                    label:"Meaux",                    dept:"77", region:"Île-de-France",             pop:"55k"   },
  { slug:"melun",                    label:"Melun",                    dept:"77", region:"Île-de-France",             pop:"41k"   },
  { slug:"pontault-combault",        label:"Pontault-Combault",       dept:"77", region:"Île-de-France",             pop:"40k"   },
  { slug:"gennevilliers",            label:"Gennevilliers",            dept:"92", region:"Île-de-France",             pop:"41k"   },
  { slug:"vincennes",                label:"Vincennes",                dept:"94", region:"Île-de-France",             pop:"49k"   },
  { slug:"montrouge",                label:"Montrouge",                dept:"92", region:"Île-de-France",             pop:"49k"   },
  { slug:"villejuif",                label:"Villejuif",                dept:"94", region:"Île-de-France",             pop:"54k"   },
  { slug:"saint-germain-en-laye",    label:"Saint-Germain-en-Laye",   dept:"78", region:"Île-de-France",             pop:"40k"   },
  { slug:"poissy",                   label:"Poissy",                   dept:"78", region:"Île-de-France",             pop:"39k"   },
  { slug:"la-courneuve",             label:"La Courneuve",             dept:"93", region:"Île-de-France",             pop:"40k"   },
  { slug:"bobigny",                  label:"Bobigny",                  dept:"93", region:"Île-de-France",             pop:"51k"   },
  { slug:"clamart",                  label:"Clamart",                  dept:"92", region:"Île-de-France",             pop:"50k"   },
  { slug:"orly",                     label:"Orly",                     dept:"94", region:"Île-de-France",             pop:"21k"   },
  { slug:"chatou",                   label:"Chatou",                   dept:"78", region:"Île-de-France",             pop:"30k"   },
  { slug:"houilles",                 label:"Houilles",                 dept:"78", region:"Île-de-France",             pop:"32k"   },
  { slug:"conflans-sainte-honorine", label:"Conflans-Sainte-Honorine",dept:"78", region:"Île-de-France",             pop:"35k"   },
  { slug:"noisy-le-sec",             label:"Noisy-le-Sec",            dept:"93", region:"Île-de-France",             pop:"41k"   },
  { slug:"stains",                   label:"Stains",                   dept:"93", region:"Île-de-France",             pop:"37k"   },
  // ── Auvergne-Rhône-Alpes ───────────────────────────────────────────────────
  { slug:"lyon",                     label:"Lyon",                     dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"520k"  },
  { slug:"saint-etienne",            label:"Saint-Étienne",            dept:"42", region:"Auvergne-Rhône-Alpes",      pop:"175k"  },
  { slug:"grenoble",                 label:"Grenoble",                 dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"160k"  },
  { slug:"villeurbanne",             label:"Villeurbanne",             dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"150k"  },
  { slug:"clermont-ferrand",         label:"Clermont-Ferrand",        dept:"63", region:"Auvergne-Rhône-Alpes",      pop:"142k"  },
  { slug:"annecy",                   label:"Annecy",                   dept:"74", region:"Auvergne-Rhône-Alpes",      pop:"130k"  },
  { slug:"valence",                  label:"Valence",                  dept:"26", region:"Auvergne-Rhône-Alpes",      pop:"64k"   },
  { slug:"chambery",                 label:"Chambéry",                 dept:"73", region:"Auvergne-Rhône-Alpes",      pop:"60k"   },
  { slug:"venissieux",               label:"Vénissieux",               dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"67k"   },
  { slug:"caluire-et-cuire",         label:"Caluire-et-Cuire",        dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"43k"   },
  { slug:"roanne",                   label:"Roanne",                   dept:"42", region:"Auvergne-Rhône-Alpes",      pop:"36k"   },
  { slug:"montelimar",               label:"Montélimar",               dept:"26", region:"Auvergne-Rhône-Alpes",      pop:"38k"   },
  { slug:"romans-sur-isere",         label:"Romans-sur-Isère",        dept:"26", region:"Auvergne-Rhône-Alpes",      pop:"33k"   },
  { slug:"echirolles",               label:"Échirolles",               dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"35k"   },
  { slug:"saint-martin-d-heres",     label:"Saint-Martin-d'Hères",    dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"40k"   },
  { slug:"bron",                     label:"Bron",                     dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"40k"   },
  { slug:"villefranche-sur-saone",   label:"Villefranche-sur-Saône",  dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"37k"   },
  { slug:"saint-priest",             label:"Saint-Priest",             dept:"69", region:"Auvergne-Rhône-Alpes",      pop:"43k"   },
  { slug:"vienne",                   label:"Vienne",                   dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"29k"   },
  { slug:"bourgoin-jallieu",         label:"Bourgoin-Jallieu",        dept:"38", region:"Auvergne-Rhône-Alpes",      pop:"30k"   },
  { slug:"annemasse",                label:"Annemasse",                dept:"74", region:"Auvergne-Rhône-Alpes",      pop:"36k"   },
  { slug:"oyonnax",                  label:"Oyonnax",                  dept:"01", region:"Auvergne-Rhône-Alpes",      pop:"22k"   },
  { slug:"thonon-les-bains",         label:"Thonon-les-Bains",        dept:"74", region:"Auvergne-Rhône-Alpes",      pop:"37k"   },
  { slug:"aubiere",                  label:"Aubière",                  dept:"63", region:"Auvergne-Rhône-Alpes",      pop:"12k"   },
  // ── Provence-Alpes-Côte d'Azur ────────────────────────────────────────────
  { slug:"marseille",                label:"Marseille",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"870k"  },
  { slug:"nice",                     label:"Nice",                     dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"340k"  },
  { slug:"toulon",                   label:"Toulon",                   dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"180k"  },
  { slug:"aix-en-provence",          label:"Aix-en-Provence",         dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"142k"  },
  { slug:"avignon",                  label:"Avignon",                  dept:"84", region:"Provence-Alpes-Côte d'Azur",pop:"93k"   },
  { slug:"antibes",                  label:"Antibes",                  dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"77k"   },
  { slug:"cannes",                   label:"Cannes",                   dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"74k"   },
  { slug:"la-seyne-sur-mer",         label:"La Seyne-sur-Mer",        dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"63k"   },
  { slug:"hyeres",                   label:"Hyères",                   dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"57k"   },
  { slug:"frejus",                   label:"Fréjus",                   dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"52k"   },
  { slug:"grasse",                   label:"Grasse",                   dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"50k"   },
  { slug:"cagnes-sur-mer",           label:"Cagnes-sur-Mer",          dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"47k"   },
  { slug:"arles",                    label:"Arles",                    dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"53k"   },
  { slug:"salon-de-provence",        label:"Salon-de-Provence",       dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"44k"   },
  { slug:"aubagne",                  label:"Aubagne",                  dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"47k"   },
  { slug:"martigues",                label:"Martigues",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"48k"   },
  { slug:"draguignan",               label:"Draguignan",               dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"40k"   },
  { slug:"la-ciotat",                label:"La Ciotat",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"35k"   },
  { slug:"six-fours-les-plages",     label:"Six-Fours-les-Plages",    dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"34k"   },
  { slug:"menton",                   label:"Menton",                   dept:"06", region:"Provence-Alpes-Côte d'Azur",pop:"29k"   },
  { slug:"la-garde",                 label:"La Garde",                 dept:"83", region:"Provence-Alpes-Côte d'Azur",pop:"25k"   },
  { slug:"gap",                      label:"Gap",                      dept:"05", region:"Provence-Alpes-Côte d'Azur",pop:"41k"   },
  { slug:"vitrolles",                label:"Vitrolles",                dept:"13", region:"Provence-Alpes-Côte d'Azur",pop:"37k"   },
  // ── Occitanie ──────────────────────────────────────────────────────────────
  { slug:"toulouse",                 label:"Toulouse",                 dept:"31", region:"Occitanie",                 pop:"490k"  },
  { slug:"montpellier",              label:"Montpellier",              dept:"34", region:"Occitanie",                 pop:"295k"  },
  { slug:"nimes",                    label:"Nîmes",                    dept:"30", region:"Occitanie",                 pop:"150k"  },
  { slug:"perpignan",                label:"Perpignan",                dept:"66", region:"Occitanie",                 pop:"121k"  },
  { slug:"beziers",                  label:"Béziers",                  dept:"34", region:"Occitanie",                 pop:"75k"   },
  { slug:"montauban",                label:"Montauban",                dept:"82", region:"Occitanie",                 pop:"63k"   },
  { slug:"narbonne",                 label:"Narbonne",                 dept:"11", region:"Occitanie",                 pop:"54k"   },
  { slug:"carcassonne",              label:"Carcassonne",              dept:"11", region:"Occitanie",                 pop:"47k"   },
  { slug:"albi",                     label:"Albi",                     dept:"81", region:"Occitanie",                 pop:"49k"   },
  { slug:"castres",                  label:"Castres",                  dept:"81", region:"Occitanie",                 pop:"44k"   },
  { slug:"tarbes",                   label:"Tarbes",                   dept:"65", region:"Occitanie",                 pop:"43k"   },
  { slug:"sete",                     label:"Sète",                     dept:"34", region:"Occitanie",                 pop:"44k"   },
  { slug:"ales",                     label:"Alès",                     dept:"30", region:"Occitanie",                 pop:"41k"   },
  { slug:"agde",                     label:"Agde",                     dept:"34", region:"Occitanie",                 pop:"23k"   },
  { slug:"lunel",                    label:"Lunel",                    dept:"34", region:"Occitanie",                 pop:"26k"   },
  { slug:"mende",                    label:"Mende",                    dept:"48", region:"Occitanie",                 pop:"12k"   },
  { slug:"lattes",                   label:"Lattes",                   dept:"34", region:"Occitanie",                 pop:"19k"   },
  // ── Nouvelle-Aquitaine ─────────────────────────────────────────────────────
  { slug:"bordeaux",                 label:"Bordeaux",                 dept:"33", region:"Nouvelle-Aquitaine",        pop:"260k"  },
  { slug:"limoges",                  label:"Limoges",                  dept:"87", region:"Nouvelle-Aquitaine",        pop:"131k"  },
  { slug:"pau",                      label:"Pau",                      dept:"64", region:"Nouvelle-Aquitaine",        pop:"77k"   },
  { slug:"la-rochelle",              label:"La Rochelle",              dept:"17", region:"Nouvelle-Aquitaine",        pop:"76k"   },
  { slug:"poitiers",                 label:"Poitiers",                 dept:"86", region:"Nouvelle-Aquitaine",        pop:"88k"   },
  { slug:"merignac",                 label:"Mérignac",                 dept:"33", region:"Nouvelle-Aquitaine",        pop:"70k"   },
  { slug:"pessac",                   label:"Pessac",                   dept:"33", region:"Nouvelle-Aquitaine",        pop:"63k"   },
  { slug:"bayonne",                  label:"Bayonne",                  dept:"64", region:"Nouvelle-Aquitaine",        pop:"52k"   },
  { slug:"angouleme",                label:"Angoulême",                dept:"16", region:"Nouvelle-Aquitaine",        pop:"43k"   },
  { slug:"niort",                    label:"Niort",                    dept:"79", region:"Nouvelle-Aquitaine",        pop:"57k"   },
  { slug:"brive-la-gaillarde",       label:"Brive-la-Gaillarde",      dept:"19", region:"Nouvelle-Aquitaine",        pop:"47k"   },
  { slug:"agen",                     label:"Agen",                     dept:"47", region:"Nouvelle-Aquitaine",        pop:"35k"   },
  { slug:"perigueux",                label:"Périgueux",                dept:"24", region:"Nouvelle-Aquitaine",        pop:"30k"   },
  { slug:"saintes",                  label:"Saintes",                  dept:"17", region:"Nouvelle-Aquitaine",        pop:"28k"   },
  { slug:"rochefort",                label:"Rochefort",                dept:"17", region:"Nouvelle-Aquitaine",        pop:"25k"   },
  { slug:"mont-de-marsan",           label:"Mont-de-Marsan",          dept:"40", region:"Nouvelle-Aquitaine",        pop:"31k"   },
  { slug:"dax",                      label:"Dax",                      dept:"40", region:"Nouvelle-Aquitaine",        pop:"21k"   },
  // ── Hauts-de-France ────────────────────────────────────────────────────────
  { slug:"lille",                    label:"Lille",                    dept:"59", region:"Hauts-de-France",           pop:"235k"  },
  { slug:"amiens",                   label:"Amiens",                   dept:"80", region:"Hauts-de-France",           pop:"135k"  },
  { slug:"tourcoing",                label:"Tourcoing",                dept:"59", region:"Hauts-de-France",           pop:"99k"   },
  { slug:"roubaix",                  label:"Roubaix",                  dept:"59", region:"Hauts-de-France",           pop:"96k"   },
  { slug:"dunkerque",                label:"Dunkerque",                dept:"59", region:"Hauts-de-France",           pop:"92k"   },
  { slug:"calais",                   label:"Calais",                   dept:"62", region:"Hauts-de-France",           pop:"74k"   },
  { slug:"villeneuve-d-ascq",        label:"Villeneuve-d'Ascq",       dept:"59", region:"Hauts-de-France",           pop:"65k"   },
  { slug:"valenciennes",             label:"Valenciennes",             dept:"59", region:"Hauts-de-France",           pop:"44k"   },
  { slug:"lens",                     label:"Lens",                     dept:"62", region:"Hauts-de-France",           pop:"34k"   },
  { slug:"arras",                    label:"Arras",                    dept:"62", region:"Hauts-de-France",           pop:"42k"   },
  { slug:"douai",                    label:"Douai",                    dept:"59", region:"Hauts-de-France",           pop:"42k"   },
  { slug:"maubeuge",                 label:"Maubeuge",                 dept:"59", region:"Hauts-de-France",           pop:"30k"   },
  { slug:"bethune",                  label:"Béthune",                  dept:"62", region:"Hauts-de-France",           pop:"26k"   },
  { slug:"cambrai",                  label:"Cambrai",                  dept:"59", region:"Hauts-de-France",           pop:"33k"   },
  { slug:"soissons",                 label:"Soissons",                 dept:"02", region:"Hauts-de-France",           pop:"29k"   },
  { slug:"saint-quentin",            label:"Saint-Quentin",            dept:"02", region:"Hauts-de-France",           pop:"55k"   },
  { slug:"laon",                     label:"Laon",                     dept:"02", region:"Hauts-de-France",           pop:"25k"   },
  // ── Grand Est ──────────────────────────────────────────────────────────────
  { slug:"strasbourg",               label:"Strasbourg",               dept:"67", region:"Grand Est",                 pop:"285k"  },
  { slug:"reims",                    label:"Reims",                    dept:"51", region:"Grand Est",                 pop:"185k"  },
  { slug:"metz",                     label:"Metz",                     dept:"57", region:"Grand Est",                 pop:"115k"  },
  { slug:"mulhouse",                 label:"Mulhouse",                 dept:"68", region:"Grand Est",                 pop:"111k"  },
  { slug:"nancy",                    label:"Nancy",                    dept:"54", region:"Grand Est",                 pop:"104k"  },
  { slug:"colmar",                   label:"Colmar",                   dept:"68", region:"Grand Est",                 pop:"67k"   },
  { slug:"troyes",                   label:"Troyes",                   dept:"10", region:"Grand Est",                 pop:"63k"   },
  { slug:"charleville-mezieres",     label:"Charleville-Mézières",    dept:"08", region:"Grand Est",                 pop:"51k"   },
  { slug:"thionville",               label:"Thionville",               dept:"57", region:"Grand Est",                 pop:"42k"   },
  { slug:"haguenau",                 label:"Haguenau",                 dept:"67", region:"Grand Est",                 pop:"35k"   },
  { slug:"epinal",                   label:"Épinal",                   dept:"88", region:"Grand Est",                 pop:"34k"   },
  { slug:"chalons-en-champagne",     label:"Châlons-en-Champagne",    dept:"51", region:"Grand Est",                 pop:"48k"   },
  { slug:"saint-avold",              label:"Saint-Avold",              dept:"57", region:"Grand Est",                 pop:"17k"   },
  { slug:"sarreguemines",            label:"Sarreguemines",            dept:"57", region:"Grand Est",                 pop:"22k"   },
  { slug:"forbach",                  label:"Forbach",                  dept:"57", region:"Grand Est",                 pop:"22k"   },
  // ── Bretagne ───────────────────────────────────────────────────────────────
  { slug:"rennes",                   label:"Rennes",                   dept:"35", region:"Bretagne",                  pop:"220k"  },
  { slug:"brest",                    label:"Brest",                    dept:"29", region:"Bretagne",                  pop:"139k"  },
  { slug:"quimper",                  label:"Quimper",                  dept:"29", region:"Bretagne",                  pop:"63k"   },
  { slug:"lorient",                  label:"Lorient",                  dept:"56", region:"Bretagne",                  pop:"58k"   },
  { slug:"vannes",                   label:"Vannes",                   dept:"56", region:"Bretagne",                  pop:"54k"   },
  { slug:"saint-nazaire",            label:"Saint-Nazaire",            dept:"44", region:"Bretagne",                  pop:"68k"   },
  { slug:"saint-malo",               label:"Saint-Malo",               dept:"35", region:"Bretagne",                  pop:"46k"   },
  { slug:"saint-brieuc",             label:"Saint-Brieuc",             dept:"22", region:"Bretagne",                  pop:"43k"   },
  { slug:"fougeres",                 label:"Fougères",                 dept:"35", region:"Bretagne",                  pop:"20k"   },
  { slug:"morlaix",                  label:"Morlaix",                  dept:"29", region:"Bretagne",                  pop:"16k"   },
  // ── Pays de la Loire ───────────────────────────────────────────────────────
  { slug:"nantes",                   label:"Nantes",                   dept:"44", region:"Pays de la Loire",          pop:"320k"  },
  { slug:"angers",                   label:"Angers",                   dept:"49", region:"Pays de la Loire",          pop:"155k"  },
  { slug:"le-mans",                  label:"Le Mans",                  dept:"72", region:"Pays de la Loire",          pop:"149k"  },
  { slug:"saint-herblain",           label:"Saint-Herblain",           dept:"44", region:"Pays de la Loire",          pop:"46k"   },
  { slug:"cholet",                   label:"Cholet",                   dept:"49", region:"Pays de la Loire",          pop:"57k"   },
  { slug:"la-roche-sur-yon",         label:"La Roche-sur-Yon",        dept:"85", region:"Pays de la Loire",          pop:"53k"   },
  { slug:"laval",                    label:"Laval",                    dept:"53", region:"Pays de la Loire",          pop:"50k"   },
  { slug:"reze",                     label:"Rezé",                     dept:"44", region:"Pays de la Loire",          pop:"40k"   },
  { slug:"les-sables-d-olonne",      label:"Les Sables-d'Olonne",     dept:"85", region:"Pays de la Loire",          pop:"46k"   },
  // ── Normandie ──────────────────────────────────────────────────────────────
  { slug:"le-havre",                 label:"Le Havre",                 dept:"76", region:"Normandie",                 pop:"170k"  },
  { slug:"rouen",                    label:"Rouen",                    dept:"76", region:"Normandie",                 pop:"111k"  },
  { slug:"caen",                     label:"Caen",                     dept:"14", region:"Normandie",                 pop:"108k"  },
  { slug:"cherbourg-en-cotentin",    label:"Cherbourg-en-Cotentin",   dept:"50", region:"Normandie",                 pop:"80k"   },
  { slug:"evreux",                   label:"Évreux",                   dept:"27", region:"Normandie",                 pop:"50k"   },
  { slug:"dieppe",                   label:"Dieppe",                   dept:"76", region:"Normandie",                 pop:"29k"   },
  { slug:"alencon",                  label:"Alençon",                  dept:"61", region:"Normandie",                 pop:"27k"   },
  { slug:"lisieux",                  label:"Lisieux",                  dept:"14", region:"Normandie",                 pop:"22k"   },
  // ── Centre-Val de Loire ────────────────────────────────────────────────────
  { slug:"orleans",                  label:"Orléans",                  dept:"45", region:"Centre-Val de Loire",       pop:"115k"  },
  { slug:"tours",                    label:"Tours",                    dept:"37", region:"Centre-Val de Loire",       pop:"137k"  },
  { slug:"bourges",                  label:"Bourges",                  dept:"18", region:"Centre-Val de Loire",       pop:"67k"   },
  { slug:"blois",                    label:"Blois",                    dept:"41", region:"Centre-Val de Loire",       pop:"46k"   },
  { slug:"chartres",                 label:"Chartres",                 dept:"28", region:"Centre-Val de Loire",       pop:"39k"   },
  { slug:"chateauroux",              label:"Châteauroux",              dept:"36", region:"Centre-Val de Loire",       pop:"46k"   },
  { slug:"vierzon",                  label:"Vierzon",                  dept:"18", region:"Centre-Val de Loire",       pop:"26k"   },
  // ── Bourgogne-Franche-Comté ────────────────────────────────────────────────
  { slug:"dijon",                    label:"Dijon",                    dept:"21", region:"Bourgogne-Franche-Comté",   pop:"155k"  },
  { slug:"besancon",                 label:"Besançon",                 dept:"25", region:"Bourgogne-Franche-Comté",   pop:"117k"  },
  { slug:"belfort",                  label:"Belfort",                  dept:"90", region:"Bourgogne-Franche-Comté",   pop:"50k"   },
  { slug:"chalon-sur-saone",         label:"Chalon-sur-Saône",        dept:"71", region:"Bourgogne-Franche-Comté",   pop:"46k"   },
  { slug:"auxerre",                  label:"Auxerre",                  dept:"89", region:"Bourgogne-Franche-Comté",   pop:"36k"   },
  { slug:"macon",                    label:"Mâcon",                    dept:"71", region:"Bourgogne-Franche-Comté",   pop:"33k"   },
  { slug:"montbeliard",              label:"Montbéliard",              dept:"25", region:"Bourgogne-Franche-Comté",   pop:"26k"   },
  { slug:"sens",                     label:"Sens",                     dept:"89", region:"Bourgogne-Franche-Comté",   pop:"25k"   },
  // ── Corse ──────────────────────────────────────────────────────────────────
  { slug:"ajaccio",                  label:"Ajaccio",                  dept:"2A", region:"Corse",                     pop:"72k"   },
  { slug:"bastia",                   label:"Bastia",                   dept:"2B", region:"Corse",                     pop:"43k"   },
];

// ── Pages combinées métier × ville (20×20 = 400 routes) ──────────────────────
// URL pattern : /{metier.slug}-{ville.slug} ex: /plombier-paris
const TOP20_M = METIERS.slice(0, 20);
const TOP20_V = VILLES.filter(v => [
  "paris","boulogne-billancourt","marseille","lyon","toulouse","nice","nantes","strasbourg",
  "montpellier","bordeaux","lille","rennes","reims","le-havre","saint-etienne","toulon",
  "grenoble","dijon","angers","nimes"
].includes(v.slug));

const COMBO_MAP = new Map();
for (const m of TOP20_M) {
  for (const v of TOP20_V) {
    COMBO_MAP.set(`/${m.slug}-${v.slug}`, { metier: m, ville: v });
  }
}

// ── Données concurrents ───────────────────────────────────────────────────────
const CONCURRENTS = [
  {
    slug: "tolteck", label: "Tolteck", prix: "19€/mois",
    avantages: ["Interface simple", "Gestion des acomptes", "Relances automatiques"],
    inconvenients: ["Plus cher qu'Artisan+", "Pas de suivi chantier avancé", "Pas de mini-site", "Pas de paiement en ligne client"],
  },
  {
    slug: "obat", label: "Obat", prix: "39€/mois",
    avantages: ["Fonctionnalités complètes", "Planning chantier", "Gestion équipe"],
    inconvenients: ["Prix très élevé (39€/mois)", "Interface complexe", "Pas de mini-site artisan", "Pas de paiement en ligne client"],
  },
  {
    slug: "artisanfacture", label: "ArtisanFacture", prix: "29€/mois",
    avantages: ["Reconnu en France", "Support téléphonique", "Modèles de documents"],
    inconvenients: ["Coût élevé (29€/mois)", "Pas de suivi de chantier", "Pas de mini-site", "Pas de paiement en ligne client"],
  },
];

// ── Fonctionnalités principales ───────────────────────────────────────────────
// ── Catégories de fonctionnalités ────────────────────────────────────────────
const FEATURE_GROUPS = [
  {
    id: "devis-facturation",
    titre: "📄 Devis & Facturation",
    sous: "Créez, envoyez, encaissez — tout en quelques clics",
    features: [
      {
        icon: "📄",
        titre: "Devis en 2 minutes",
        desc: "Catalogue de prix intégré, calcul TVA automatique, envoi par email. Votre client reçoit un devis pro depuis votre smartphone, sur le chantier.",
        benefit: "1h gagnée par devis",
      },
      {
        icon: "🧾",
        titre: "Factures conformes",
        desc: "Numérotation automatique, mentions légales françaises, TVA sur débit ou encaissement, acomptes, relances automatiques à J+15 et J+30.",
        benefit: "Zéro erreur légale",
      },
      {
        icon: "🎨",
        titre: "5 thèmes PDF pro",
        desc: "Classique, Moderne, Minimal, Premium ou Artisan : choisissez le design de vos documents. Votre logo, vos couleurs, votre marque.",
        benefit: "Image pro immédiate",
      },
      {
        icon: "✍️",
        titre: "Signature électronique",
        desc: "Votre client signe le devis depuis son téléphone en 10 secondes. Légalement valide (eIDAS), empreinte IP + date archivées automatiquement.",
        benefit: "Accord sans déplacement",
      },
      {
        icon: "🔳",
        titre: "QR code sur chaque doc",
        desc: "Chaque devis et facture intègre un QR code unique. Votre client le scanne pour signer, payer ou suivre l'avancement du chantier en temps réel.",
        benefit: "Expérience client premium",
      },
      {
        icon: "💶",
        titre: "Paiement en ligne",
        desc: "Vos clients paient directement depuis leur facture par carte bancaire (Stripe Connect). Fonds sur votre compte en 48h. Taux de paiement ×3.",
        benefit: "Encaissez plus vite",
      },
      {
        icon: "📚",
        titre: "Catalogue de prix",
        desc: "Créez votre bibliothèque de prestations avec vos tarifs. Insérez une ligne en 1 clic. Se met à jour automatiquement à partir de vos devis acceptés.",
        benefit: "Cohérence tarifaire",
      },
      {
        icon: "📸",
        titre: "Import photo IA",
        desc: "Photographiez un ancien devis papier ou une liste manuscrite. L'IA extrait les prestations et les intègre automatiquement dans votre nouveau devis.",
        benefit: "Dématérialisation en 10s",
      },
    ],
  },
  {
    id: "chantier-terrain",
    titre: "🏗️ Chantier & Terrain",
    sous: "Gérez vos chantiers depuis le terrain, en temps réel",
    features: [
      {
        icon: "🏗️",
        titre: "Suivi chantier temps réel",
        desc: "Photos avant/après, avancement en %, journal de chantier, suivi des coûts. Partagez un lien de suivi à votre client : il suit sans vous appeler.",
        benefit: "Moins d'appels clients",
      },
      {
        icon: "⛅",
        titre: "Météo chantier",
        desc: "Météo sur 7 jours directement dans votre chantier. Planifiez vos travaux extérieurs en évitant la pluie. Alertes personnalisables.",
        benefit: "Planification optimale",
      },
      {
        icon: "⏱️",
        titre: "Pointage des heures",
        desc: "Chaque membre de l'équipe pointe ses heures avec géolocalisation. Tableau de bord temps réel pour le patron. Calcul automatique du coût MO.",
        benefit: "Maîtrisez vos marges",
      },
      {
        icon: "🗺️",
        titre: "Plan chantier IA",
        desc: "Décrivez vos travaux en texte ou vocal. L'IA génère un plan d'exécution structuré avec étapes, matériaux estimés et planning recommandé.",
        benefit: "Organisation sans effort",
      },
    ],
  },
  {
    id: "ia-assistants",
    titre: "🤖 Intelligence Artificielle",
    sous: "L'IA travaille pour vous, vous gardez les mains libres",
    features: [
      {
        icon: "🎤",
        titre: "Devis vocal IA",
        desc: "Dictez votre devis à voix haute sur le chantier. L'IA transcrit, identifie les prestations, retrouve vos prix dans le catalogue et génère le document.",
        benefit: "Devis les mains dans le cambouis",
      },
      {
        icon: "🤖",
        titre: "Scan factures fournisseur",
        desc: "Photographiez vos factures d'achat (matériaux, sous-traitance). L'IA extrait montant, TVA, fournisseur et intègre tout dans votre comptabilité.",
        benefit: "Fin de la saisie manuelle",
      },
      {
        icon: "📊",
        titre: "Assistant comptable TVA",
        desc: "L'IA calcule votre TVA collectée/déductible, estime vos cotisations URSSAF et vous rappelle les échéances fiscales du trimestre.",
        benefit: "Sérénité fiscale",
      },
      {
        icon: "📋",
        titre: "Récap mensuel IA PDF",
        desc: "Chaque mois, un rapport PDF automatique : CA, charges, marge, TVA due, top clients, évolution. Exportable pour votre comptable en 1 clic.",
        benefit: "Pilotez votre activité",
      },
      {
        icon: "📅",
        titre: "Agenda + suggestions IA",
        desc: "Calendrier de vos chantiers et RDV. L'IA suggère les meilleurs créneaux selon la météo, la localisation et la dispo de votre équipe.",
        benefit: "Tournées optimisées",
      },
    ],
  },
  {
    id: "presence-equipe",
    titre: "🌐 Présence & Équipe",
    sous: "Votre vitrine en ligne et votre équipe bien gérée",
    features: [
      {
        icon: "🌐",
        titre: "Mini-site web professionnel",
        desc: "Votre page pro sur artisan-plus.fr/site/votre-nom. Galerie de réalisations, avis clients, formulaire de devis, coordonnées. En ligne en 5 minutes.",
        benefit: "Trouvé sur Google",
      },
      {
        icon: "👥",
        titre: "Gestion équipe 4 rôles",
        desc: "Patron (accès total), Chef de chantier, Ouvrier (mobile), Comptable (lecture seule). Invitations par code, droits granulaires, activité tracée.",
        benefit: "Coordination sans WhatsApp",
      },
      {
        icon: "🎁",
        titre: "Programme de parrainage",
        desc: "Parrainez un artisan = 1 mois offert pour vous deux. Lien unique personnalisé, tableau de bord parrainage, suivi des gains en temps réel.",
        benefit: "Abonnement réduit",
      },
    ],
  },
  {
    id: "tech-outils",
    titre: "📱 Tech & Outils de terrain",
    sous: "Une app fiable partout, même sans réseau",
    features: [
      {
        icon: "📱",
        titre: "PWA installable",
        desc: "Installez Artisan+ sur iOS ou Android sans passer par l'App Store. Icône sur l'écran d'accueil, chargement instantané, notifications push.",
        benefit: "Accès en 1 tap",
      },
      {
        icon: "📶",
        titre: "Mode hors connexion",
        desc: "Pas de réseau sur le chantier ? Artisan+ fonctionne hors connexion. Vos données se synchronisent automatiquement dès que le réseau revient.",
        benefit: "Zéro interruption",
      },
      {
        icon: "🧰",
        titre: "20+ outils de terrain",
        desc: "Niveau à bulle AR, boussole, mesure par photo IA, calculateur de surfaces et volumes, identificateur de matériaux IA, traduction IA en 50 langues, convertisseur d'unités, et bien plus.",
        benefit: "Une seule app suffit",
      },
    ],
  },
];

// Pour le SEO et les pages métiers (liste plate des features)
const FEATURES = FEATURE_GROUPS.flatMap(g => g.features);

// ── Témoignages ───────────────────────────────────────────────────────────────
const TEMOIGNAGES = [
  { nom: "Marc D.", metier: "Plombier", ville: "Lyon", note: 5, texte: "J'ai arrêté de faire mes devis à la main grâce à Artisan+. En 2 minutes c'est envoyé, signé électroniquement et archivé. À 7,99€/mois c'est imbattable — j'ai économisé 200€/an par rapport à mon ancien logiciel." },
  { nom: "Sophie L.", metier: "Électricienne", ville: "Paris", note: 5, texte: "Le mini-site m'a permis d'avoir une présence en ligne sans payer un développeur. Maintenant je reçois des demandes de devis directement depuis mon profil. Le paiement en ligne m'a sauvé la mise avec plusieurs clients qui traînaient à payer." },
  { nom: "Jean-Pierre M.", metier: "Maçon", ville: "Toulouse", note: 5, texte: "Simple, rapide et pas cher. J'ai comparé avec Tolteck et Obat — Artisan+ a les mêmes fonctions pour deux fois moins cher. La gestion de chantier avec les photos est vraiment pratique pour mes clients." },
];

// ── Tableau comparatif ────────────────────────────────────────────────────────
const COMPARATIF = {
  lignes: [
    "Prix mensuel",
    "Devis illimités",
    "Factures illimitées",
    "Suivi de chantier",
    "Mini-site vitrine",
    "Paiement en ligne client",
    "Signature électronique",
    "Catalogue de prix perso.",
    "Gestion multi-artisans",
    "Export PDF professionnel",
    "Support client",
  ],
  cols: [
    {
      nom: "Artisan+",
      prix: "7,99€/mois",
      values: ["7,99€/mois", true, true, true, true, true, true, true, true, true, "Chat & Email"],
      highlight: true,
    },
    {
      nom: "Tolteck",
      prix: "19€/mois",
      values: ["19€/mois", true, true, false, false, false, true, true, false, true, "Email"],
    },
    {
      nom: "Obat",
      prix: "39€/mois",
      values: ["39€/mois", true, true, true, false, false, false, true, true, true, "Téléphone"],
    },
    {
      nom: "ArtisanFacture",
      prix: "29€/mois",
      values: ["29€/mois", true, true, false, false, false, false, true, false, true, "Email"],
    },
  ],
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function setPageMeta(title, description, canonical) {
  document.title = title;
  const upsertMeta = (sel, attr, name, content) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  };
  upsertMeta('meta[name="description"]', "name", "description", description);
  upsertMeta('meta[property="og:title"]', "property", "og:title", title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", description);
  upsertMeta('meta[property="og:url"]', "property", "og:url", canonical || BASE);
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = canonical || BASE;
}

function navigate(to) {
  const hashIdx = to.indexOf("#");
  const hash = hashIdx >= 0 ? to.slice(hashIdx + 1) : null;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (hash) {
    // Scroll vers la section (petit délai pour laisser React re-rendre)
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ── Composant : En-tête ───────────────────────────────────────────────────────
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled,  setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Fonctionnalités", href: "/#fonctionnalites" },
    { label: "Tarifs",          href: "/#tarifs" },
    { label: "Métiers",         href: "/#metiers" },
  ];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 500,
      background: scrolled ? "rgba(10,22,40,0.97)" : D,
      borderBottom: scrolled ? "1px solid rgba(255,140,0,0.15)" : "1px solid transparent",
      backdropFilter: "blur(12px)",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px", fontWeight: "900", color: "white", letterSpacing: "-0.5px" }}>
            Artisan<span style={{ color: P }}>+</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {navLinks.map(l => (
            <a key={l.label} href={l.href} onClick={e => { e.preventDefault(); navigate(l.href); }}
              style={{ color: G, fontSize: "14px", fontWeight: "600", textDecoration: "none", padding: "6px 12px", borderRadius: "8px", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = G}
            >{l.label}</a>
          ))}
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ color: G, fontSize: "14px", fontWeight: "600", textDecoration: "none", padding: "6px 12px" }}>
            Connexion
          </a>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ background: P, color: "white", fontSize: "14px", fontWeight: "700", textDecoration: "none", padding: "10px 20px", borderRadius: "10px", transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Essai gratuit →
          </a>
        </nav>
      </div>
    </header>
  );
}

// ── Composant : Pied de page ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: C, borderTop: "1px solid rgba(255,140,0,0.12)", padding: "60px 20px 40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "48px" }}>
          {/* Colonne logo */}
          <div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: "white", marginBottom: "12px" }}>
              Artisan<span style={{ color: P }}>+</span>
            </div>
            <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: "0 0 16px" }}>
              L'application de gestion pour artisans la plus abordable du marché. Devis, factures, chantiers — tout en un.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🇫🇷</span>
              <span style={{ color: G, fontSize: "12px", alignSelf: "center" }}>Fait en France</span>
            </div>
          </div>

          {/* Métiers */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Métiers</div>
            {METIERS.slice(0, 5).map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{m.emoji} {m.label}</a>
            ))}
            {METIERS.slice(5).map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{m.emoji} {m.label}</a>
            ))}
          </div>

          {/* Villes */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Principales villes</div>
            {VILLES.slice(0, 10).map(v => (
              <a key={v.slug} href={`/artisan-${v.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/artisan-${v.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >📍 {v.label}</a>
            ))}
          </div>

          {/* Liens utiles */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Liens utiles</div>
            {[
              { label: "Connexion", href: "/login" },
              { label: "Créer un compte", href: "/login" },
              { label: "Alternative à Tolteck", href: "/alternative-tolteck" },
              { label: "Alternative à Obat", href: "/alternative-obat" },
              { label: "Alternative à ArtisanFacture", href: "/alternative-artisanfacture" },
              { label: "Conditions d'utilisation", href: "/cgu" },
              { label: "Politique de confidentialité", href: "/politique-confidentialite" },
            ].map(l => (
              <a key={l.label} href={l.href}
                onClick={e => { e.preventDefault(); navigate(l.href); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{l.label}</a>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#445566", fontSize: "12px", margin: 0 }}>
            © {new Date().getFullYear()} Artisan+. Tous droits réservés.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href="/cgu" onClick={e => { e.preventDefault(); navigate("/cgu"); }} style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>CGU</a>
            <a href="/politique-confidentialite" onClick={e => { e.preventDefault(); navigate("/politique-confidentialite"); }} style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>Confidentialité</a>
            <a href="mailto:contact@artisan-plus.fr" style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Composant : Mockup app (CSS) ──────────────────────────────────────────────
function AppMockup() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "360px", margin: "0 auto" }}>
      {/* Téléphone */}
      <div style={{ background: "#0d1f3c", borderRadius: "32px", border: "3px solid rgba(255,140,0,0.3)", padding: "12px", boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,140,0,0.1)" }}>
        {/* Écran */}
        <div style={{ background: D, borderRadius: "24px", overflow: "hidden", minHeight: "480px", padding: "16px" }}>
          {/* Header app */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ color: "white", fontWeight: "900", fontSize: "16px" }}>Artisan<span style={{ color: P }}>+</span></span>
            <span style={{ fontSize: "20px" }}>🔔</span>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: "CA ce mois", val: "4 820 €", color: "#4CAF50" },
              { label: "Devis envoyés", val: "12", color: P },
              { label: "Factures", val: "8", color: "#2196F3" },
              { label: "En attente", val: "1 340 €", color: "#FFA500" },
            ].map(s => (
              <div key={s.label} style={{ background: C, borderRadius: "10px", padding: "10px", border: "1px solid rgba(255,140,0,0.1)" }}>
                <div style={{ color: G, fontSize: "9px", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ color: s.color, fontWeight: "800", fontSize: "14px" }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Devis récent */}
          <div style={{ background: C, borderRadius: "12px", padding: "12px", marginBottom: "10px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>DEV-2024-042</span>
              <span style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "6px" }}>Signé ✓</span>
            </div>
            <div style={{ color: G, fontSize: "10px" }}>Réfection toiture — M. Dupont</div>
            <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>3 240,00 €</div>
          </div>

          {/* Facture récente */}
          <div style={{ background: C, borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>FAC-2024-038</span>
              <span style={{ background: "rgba(255,165,0,0.15)", color: "#FFA500", fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "6px" }}>En attente</span>
            </div>
            <div style={{ color: G, fontSize: "10px" }}>Installation chaudière — Mme Martin</div>
            <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>1 840,00 €</div>
          </div>
        </div>
      </div>

      {/* Badge flottant */}
      <div style={{ position: "absolute", top: "20px", right: "-20px", background: "rgba(76,175,80,0.9)", color: "white", fontSize: "11px", fontWeight: "700", padding: "8px 12px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
        ✓ Devis signé !
      </div>
      <div style={{ position: "absolute", bottom: "60px", left: "-20px", background: "rgba(255,140,0,0.9)", color: "white", fontSize: "11px", fontWeight: "700", padding: "8px 12px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
        💶 Paiement reçu
      </div>
    </div>
  );
}

// ── Composant : Tableau comparatif ────────────────────────────────────────────
function TableauComparatif({ titre }) {
  return (
    <div id="tarifs" style={{ scrollMarginTop: "80px" }}>
      {titre && <h2 style={{ color: "white", fontSize: "clamp(22px,4vw,32px)", fontWeight: "800", textAlign: "center", marginBottom: "8px" }}>{titre}</h2>}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: "600px", borderCollapse: "separate", borderSpacing: 0, background: C, borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,140,0,0.15)" }}>
          <thead>
            <tr>
              <th style={{ padding: "16px 20px", textAlign: "left", color: G, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", background: "#0d1f3c", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>Fonctionnalité</th>
              {COMPARATIF.cols.map(col => (
                <th key={col.nom} style={{ padding: "16px 20px", textAlign: "center", background: col.highlight ? "rgba(255,140,0,0.12)" : "#0d1f3c", borderBottom: `1px solid ${col.highlight ? "rgba(255,140,0,0.4)" : "rgba(255,140,0,0.1)"}`, borderTop: col.highlight ? `3px solid ${P}` : "3px solid transparent" }}>
                  <div style={{ color: col.highlight ? P : "white", fontWeight: "800", fontSize: "15px" }}>{col.nom}</div>
                  <div style={{ color: col.highlight ? P : G, fontSize: "13px", fontWeight: "700", marginTop: "4px" }}>{col.prix}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARATIF.lignes.map((ligne, i) => (
              <tr key={ligne} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                <td style={{ padding: "12px 20px", color: "white", fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{ligne}</td>
                {COMPARATIF.cols.map(col => {
                  const val = col.values[i];
                  return (
                    <td key={col.nom} style={{ padding: "12px 20px", textAlign: "center", background: col.highlight ? "rgba(255,140,0,0.04)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {typeof val === "boolean" ? (
                        <span style={{ fontSize: "16px" }}>{val ? "✅" : "❌"}</span>
                      ) : (
                        <span style={{ color: col.highlight ? P : G, fontWeight: col.highlight ? "800" : "600", fontSize: "13px" }}>{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Composant : Section CTA ───────────────────────────────────────────────────
function CTASection({ titre, sous }) {
  return (
    <div style={{ background: `linear-gradient(135deg, rgba(255,140,0,0.08) 0%, rgba(10,22,40,0) 100%)`, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "24px", padding: "clamp(40px,6vw,80px) 20px", textAlign: "center", margin: "0 auto", maxWidth: "800px" }}>
      <div style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: "900", color: "white", lineHeight: "1.2", marginBottom: "16px" }}>
        {titre || <>Commencez <span style={{ color: P }}>gratuitement</span> aujourd'hui</>}
      </div>
      <p style={{ color: G, fontSize: "16px", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
        {sous || "Aucune carte bancaire requise. Essai gratuit sans engagement. 7,99€/mois ensuite pour passer Pro."}
      </p>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
          style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "16px 32px", borderRadius: "14px", textDecoration: "none", transition: "opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          🚀 Essayer gratuitement
        </a>
        <a href="/#tarifs" onClick={e => { e.preventDefault(); navigate("/#tarifs"); }}
          style={{ background: "rgba(255,255,255,0.07)", color: "white", fontWeight: "700", fontSize: "16px", padding: "16px 32px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
          Voir les tarifs
        </a>
      </div>
    </div>
  );
}

// ── PAGE : Accueil ────────────────────────────────────────────────────────────
// ── Composant : Accordion FAQ ────────────────────────────────────────────────
function FaqAccordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: D, border: `1px solid ${open === i ? "rgba(255,140,0,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", overflow: "hidden", transition: "border-color 0.2s" }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", background: "none", border: "none", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ color: "white", fontSize: "15px", fontWeight: "700", lineHeight: "1.4" }}>{item.q}</span>
            <span style={{ color: P, fontSize: "20px", flexShrink: 0, transform: open === i ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.2s" }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: "0 24px 20px", color: G, fontSize: "14px", lineHeight: "1.8" }}>{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Données FAQ ───────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Combien coûte Artisan+ ?",
    a: "Artisan+ est disponible en version gratuite (fonctionnalités de base) et en version Pro à 7,99€/mois sans engagement. C'est le logiciel de gestion artisan le moins cher du marché — Tolteck coûte 19€/mois, ArtisanFacture 29€/mois et Obat 39€/mois.",
  },
  {
    q: "Est-ce que je peux essayer Artisan+ gratuitement ?",
    a: "Oui ! Vous pouvez créer un compte gratuitement sans carte bancaire. La version gratuite vous permet de créer des devis et factures, gérer vos clients et accéder aux fonctionnalités de base. Pour le mini-site, le paiement en ligne et le suivi chantier avancé, passez en Pro à 7,99€/mois.",
  },
  {
    q: "Est-ce que la signature électronique est légalement valable ?",
    a: "Oui. La signature électronique intégrée à Artisan+ est légalement valable en France conformément au règlement eIDAS et à l'article 1366 du Code civil. Elle génère une preuve horodatée que votre client a bien signé le devis.",
  },
  {
    q: "Artisan+ fonctionne-t-il sur smartphone ?",
    a: "Artisan+ est une Progressive Web App (PWA) optimisée pour iPhone et Android. Vous pouvez créer vos devis directement sur le chantier depuis votre téléphone, et l'installer sur votre écran d'accueil comme une vraie application mobile.",
  },
  {
    q: "Pour quels métiers du bâtiment est conçu Artisan+ ?",
    a: "Artisan+ est conçu pour tous les artisans du bâtiment : plombiers, électriciens, maçons, carreleurs, peintres, menuisiers, chauffagistes, serruriers, couvreurs, jardiniers et bien d'autres. Le catalogue de prix est adaptable à votre métier.",
  },
  {
    q: "Comment fonctionne le paiement en ligne pour mes clients ?",
    a: "Une fois votre compte Stripe Connect lié à Artisan+, vos clients peuvent payer leurs factures directement par carte bancaire en un clic. Les fonds sont virés sur votre compte bancaire en 48 heures. Artisan+ utilise Stripe, la solution de paiement la plus sécurisée du marché.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Vos données sont hébergées sur Supabase en Europe (RGPD), chiffrées en transit (HTTPS) et sécurisées par Row Level Security. Artisan+ ne partage jamais vos données avec des tiers à des fins commerciales.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Oui, sans condition. Vous pouvez résilier votre abonnement Pro en 1 clic depuis les paramètres de l'application, sans frais ni préavis. Votre compte repasse en version gratuite immédiatement.",
  },
];

function PageHome() {
  useEffect(() => {
    setPageMeta(
      "Artisan+ | App Devis Factures Artisan - 7,99€/mois",
      "Logiciel devis et factures pour artisans à 7,99€/mois. Moins cher que Tolteck, Obat et ArtisanFacture. Devis, factures, chantiers, mini-site, paiement en ligne.",
      BASE
    );
    // ── Schema.org : SoftwareApplication + WebSite + FAQPage ──────────────────
    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Artisan+",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": {
          "@type": "Offer",
          "price": "7.99",
          "priceCurrency": "EUR",
          "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" }
        },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "500", "bestRating": "5" },
        "description": "Logiciel de devis et facturation pour artisans. Devis, factures, suivi chantier, mini-site, paiement en ligne.",
        "url": BASE,
        "screenshot": `${BASE}/og-image.png`,
        "featureList": "Devis professionnels, Factures conformes, Signature électronique, Paiement en ligne, Suivi de chantier, Mini-site vitrine",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Artisan+",
        "url": BASE,
        "potentialAction": { "@type": "SearchAction", "target": `${BASE}/blog?q={search_term_string}`, "query-input": "required name=search_term_string" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_ITEMS.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
    ];
    schemas.forEach((schema, i) => {
      const id = `schema-home-${i}`;
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = id; document.head.appendChild(el); }
      el.textContent = JSON.stringify(schema);
    });
  }, []);

  return (
    <>
      {/* ── Bannière facturation électronique 2026 ──────────────── */}
      <div style={{ background: "linear-gradient(90deg, rgba(255,140,0,0.15) 0%, rgba(255,140,0,0.08) 100%)", borderBottom: "1px solid rgba(255,140,0,0.3)", padding: "10px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "16px" }}>⚡</span>
          <span style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>Artisan+ est prêt pour la facturation électronique obligatoire 2026</span>
          <span style={{ color: G, fontSize: "12px" }}>—</span>
          <span style={{ color: G, fontSize: "12px" }}>Format Factur-X (EN 16931) déjà disponible dans votre app</span>
          <a href="/facturation-electronique-obligatoire-2026"
            onClick={e => { e.preventDefault(); navigate("/facturation-electronique-obligatoire-2026"); }}
            style={{ color: P, fontSize: "12px", fontWeight: "800", textDecoration: "none", background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.4)", borderRadius: "8px", padding: "4px 10px", whiteSpace: "nowrap" }}>
            En savoir plus →
          </a>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px clamp(40px,6vw,80px)", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", gap: "60px", alignItems: "center" }}>
          <div>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", padding: "6px 14px", marginBottom: "24px" }}>
              <span style={{ color: P, fontSize: "12px", fontWeight: "800" }}>🏆 N°1 des apps artisan les moins chères</span>
            </div>

            <h1 style={{ color: "white", fontSize: "clamp(32px,5vw,56px)", fontWeight: "900", lineHeight: "1.1", margin: "0 0 20px", letterSpacing: "-1px" }}>
              Vos devis et factures<br />
              <span style={{ color: P }}>en 2 minutes</span><br />
              à 7,99€/mois
            </h1>

            <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "520px" }}>
              L'application de gestion pour artisans la plus complète et la moins chère du marché. Devis, factures, suivi chantier, mini-site vitrine et paiement en ligne — tout en un.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "32px" }}>
              <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
                style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none", transition: "transform 0.15s, opacity 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                🚀 Essayer gratuitement
              </a>
              <a href="#comparatif" onClick={e => { e.preventDefault(); document.getElementById("comparatif")?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ background: "rgba(255,255,255,0.06)", color: "white", fontWeight: "700", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
                Voir le comparatif
              </a>
            </div>

            {/* Proof points */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {["✅ Sans engagement", "✅ Essai gratuit", "✅ Support inclus"].map(p => (
                <span key={p} style={{ color: G, fontSize: "13px", fontWeight: "600" }}>{p}</span>
              ))}
            </div>
          </div>

          {/* Mockup app */}
          <div style={{ display: "flex", justifyContent: "center", minWidth: "300px" }}>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section style={{ background: C, padding: "32px 20px", borderTop: "1px solid rgba(255,140,0,0.1)", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "24px" }}>
          {[
            { val: "500+",    label: "Artisans actifs" },
            { val: "10 000+", label: "Devis générés" },
            { val: "7,99€",   label: "Par mois seulement" },
            { val: "4.9/5",   label: "Note moyenne" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: P, fontWeight: "900", fontSize: "clamp(24px,4vw,36px)" }}>{s.val}</div>
              <div style={{ color: G, fontSize: "13px", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités ─────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ padding: "clamp(60px,8vw,100px) 20px", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", padding: "6px 16px", marginBottom: "20px" }}>
              <span style={{ color: P, fontSize: "12px", fontWeight: "800" }}>✦ 25+ fonctionnalités incluses</span>
            </div>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,42px)", fontWeight: "900", margin: "0 0 16px", lineHeight: "1.1" }}>
              Tout ce dont un artisan a besoin,<br /><span style={{ color: P }}>dans une seule app</span>
            </h2>
            <p style={{ color: G, fontSize: "17px", maxWidth: "600px", margin: "0 auto" }}>
              Du devis vocal sur le chantier au récap mensuel IA, en passant par le suivi en temps réel et les 20 outils de terrain.
            </p>
          </div>

          {FEATURE_GROUPS.map(group => (
            <div key={group.id} style={{ marginBottom: "64px" }}>
              {/* En-tête de groupe */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ color: "white", fontSize: "clamp(18px,2.5vw,24px)", fontWeight: "900", margin: "0 0 6px" }}>{group.titre}</h3>
                <p style={{ color: G, fontSize: "14px", margin: 0 }}>{group.sous}</p>
                <div style={{ width: "48px", height: "3px", background: `linear-gradient(90deg, ${P}, transparent)`, borderRadius: "2px", marginTop: "12px" }} />
              </div>
              {/* Grille de cartes */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {group.features.map(f => (
                  <div key={f.titre}
                    style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "16px", padding: "24px", transition: "border-color 0.2s, transform 0.2s", display: "flex", flexDirection: "column", gap: "0" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.35)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ fontSize: "30px", marginBottom: "14px" }}>{f.icon}</div>
                    <h4 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 10px", lineHeight: "1.3" }}>{f.titre}</h4>
                    <p style={{ color: G, fontSize: "13px", lineHeight: "1.65", margin: "0 0 16px", flexGrow: 1 }}>{f.desc}</p>
                    {f.benefit && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "5px 10px", width: "fit-content" }}>
                        <span style={{ color: P, fontSize: "11px", fontWeight: "800" }}>✓ {f.benefit}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparatif ──────────────────────────────────────────── */}
      <section id="comparatif" style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.03) 0%, transparent 100%)`, scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 16px" }}>
              Artisan+ :<br /><span style={{ color: P }}>2× moins cher que la concurrence</span>
            </h2>
            <p style={{ color: G, fontSize: "16px" }}>
              Toutes les fonctionnalités pour 7,99€/mois au lieu de 19€ à 39€ chez nos concurrents.
            </p>
          </div>
          <TableauComparatif />
        </div>
      </section>

      {/* ── Témoignages ─────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 12px" }}>
              Ils font confiance à <span style={{ color: P }}>Artisan+</span>
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "8px" }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: "#FFD700", fontSize: "20px" }}>★</span>)}
            </div>
            <p style={{ color: G, fontSize: "14px" }}>Note moyenne 4,9/5 · Plus de 500 artisans satisfaits</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {TEMOIGNAGES.map(t => (
              <div key={t.nom} style={{ background: C, border: "1px solid rgba(255,140,0,0.15)", borderRadius: "20px", padding: "28px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                  {[...Array(t.note)].map((_, i) => <span key={i} style={{ color: "#FFD700", fontSize: "16px" }}>★</span>)}
                </div>
                <p style={{ color: "white", fontSize: "14px", lineHeight: "1.7", fontStyle: "italic", margin: "0 0 20px" }}>"{t.texte}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", background: `rgba(255,140,0,0.15)`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                    {t.metier === "Plombier" ? "🔧" : t.metier === "Électricienne" ? "⚡" : "🧱"}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{t.nom}</div>
                    <div style={{ color: G, fontSize: "12px" }}>{t.metier} · {t.ville}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Métiers ─────────────────────────────────────────────── */}
      <section id="metiers" style={{ padding: "clamp(60px,8vw,100px) 20px", background: C, scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 12px" }}>
              Pour <span style={{ color: P }}>tous les métiers</span> du bâtiment
            </h2>
            <p style={{ color: G, fontSize: "15px" }}>
              Catalogue de prix adapté, modèles de devis spécifiques à votre activité.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
            {METIERS.map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ background: D, border: "1px solid rgba(255,140,0,0.12)", borderRadius: "14px", padding: "20px 16px", textDecoration: "none", textAlign: "center", transition: "all 0.2s", display: "block" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{m.emoji}</div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>{m.label}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: C }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", margin: "0 0 12px" }}>
              Questions <span style={{ color: P }}>fréquentes</span>
            </h2>
            <p style={{ color: G, fontSize: "15px" }}>Tout ce que vous devez savoir sur Artisan+</p>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <CTASection />
        </div>
      </section>
    </>
  );
}

// ── PAGE : Métier ─────────────────────────────────────────────────────────────
function PageMetier({ metier }) {
  const faq = genFaqMetier(metier);
  useEffect(() => {
    const title = `Logiciel devis facture ${metier.label} | Artisan+ à 7,99€/mois`;
    const description = `Créez vos devis et factures de ${metier.desc} en 2 minutes. Logiciel ${metier.kw} Artisan+ à 7,99€/mois. Suivi chantier, mini-site, paiement en ligne inclus.`;
    setPageMeta(title, description, `${BASE}/devis-facture-${metier.slug}`);
    // Schema.org SoftwareApplication + FAQPage
    const schemas = [
      { "@context":"https://schema.org","@type":"SoftwareApplication","name":"Artisan+","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","offers":{"@type":"Offer","price":"7.99","priceCurrency":"EUR"},"description":description,"url":`${BASE}/devis-facture-${metier.slug}` },
      { "@context":"https://schema.org","@type":"FAQPage","mainEntity": faq.map(f=>({ "@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a} })) },
    ];
    schemas.forEach((s, i) => {
      const id = `schema-metier-${i}`;
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.type="application/ld+json"; el.id=id; document.head.appendChild(el); }
      el.textContent = JSON.stringify(s);
    });
  }, [metier]);

  const Icone = metier.emoji;
  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>{metier.emoji}</div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            {metier.label} ? Gérez vos devis<br />et factures en <span style={{ color: P }}>2 minutes</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ est l'outil de gestion conçu pour {art(metier.art)}{metier.label.toLowerCase()}. Créez des devis professionnels de {metier.desc}, envoyez-les par email, obtenez la signature électronique et encaissez en ligne — le tout à <strong style={{ color: P }}>7,99€/mois</strong>.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Essayer gratuitement — {metier.label}
          </a>
        </div>
      </section>

      {/* Contenu SEO */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginBottom: "60px" }}>
            {[
              { icon: "⚡", titre: `Devis ${metier.desc} en 2 min`, desc: `Catalogue de prix ${metier.desc} intégré. Créez un devis complet en quelques clics, sans saisie répétitive.` },
              { icon: "🧾", titre: "Factures conformes", desc: "Factures légalement conformes avec TVA, acomptes, mentions obligatoires et export PDF professionnel." },
              { icon: "✍️", titre: "Signature en ligne", desc: "Vos clients signent le devis depuis leur téléphone. Plus besoin de rendez-vous pour une signature." },
              { icon: "💶", titre: "Paiement en ligne", desc: "Encaissez par carte bancaire directement depuis la facture. Virements dans les 48h sur votre compte." },
              { icon: "🌐", titre: "Mini-site gratuit", desc: `Votre vitrine en ligne de ${metier.label.toLowerCase()} avec vos réalisations. Recevez des demandes de devis directement.` },
              { icon: "🏗️", titre: "Suivi de chantier", desc: "Gérez vos chantiers de A à Z : photos, coûts, avancement. Partagez l'état d'avancement avec vos clients." },
            ].map(f => (
              <div key={f.titre} style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 8px" }}>{f.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bloc texte SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Pourquoi Artisan+ est le meilleur logiciel de gestion pour {art(metier.art)}{metier.label.toLowerCase()} ?
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>En tant que {metier.kw}, vous faites face à des défis quotidiens : établir des devis rapidement, relancer les clients, suivre les paiements et gérer plusieurs chantiers en même temps. Artisan+ a été conçu pour résoudre exactement ces problèmes.</p>
              <p>Notre logiciel de devis et de facturation pour {metier.kw} vous permet de :</p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                <li>Créer un devis de {metier.desc} en moins de 2 minutes grâce à votre catalogue de prix personnel</li>
                <li>Envoyer le devis par email avec signature électronique légalement valide</li>
                <li>Générer la facture en un clic depuis le devis accepté</li>
                <li>Recevoir le paiement par carte bancaire directement depuis la facture</li>
                <li>Suivre vos chantiers de {metier.desc} avec photos et suivi des coûts</li>
                <li>Présenter vos réalisations sur votre mini-site vitrine professionnel</li>
              </ul>
              <p>À <strong style={{ color: P }}>7,99€/mois</strong> seulement (sans engagement), Artisan+ est <strong>2 à 5 fois moins cher</strong> que Tolteck (19€/mois), Obat (39€/mois) ou ArtisanFacture (29€/mois), tout en offrant davantage de fonctionnalités.</p>
            </div>
          </div>

          <TableauComparatif titre={`Artisan+ vs les alternatives pour ${art(metier.art)}${metier.label.toLowerCase()}`} />

          {/* FAQ métier */}
          <div style={{ marginTop: "56px", marginBottom: "56px" }}>
            <h2 style={{ color: "white", fontWeight: "900", fontSize: "22px", margin: "0 0 24px" }}>
              Questions fréquentes — <span style={{ color: P }}>{metier.label}</span>
            </h2>
            <FaqAccordion items={faq} />
          </div>

          {/* Liens villes combinées */}
          {TOP20_V.length > 0 && (
            <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "32px", marginBottom: "48px" }}>
              <h2 style={{ color: "white", fontWeight: "800", fontSize: "18px", margin: "0 0 20px" }}>
                {metier.label} par ville
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {TOP20_V.map(v => (
                  <a key={v.slug} href={`/${metier.slug}-${v.slug}`}
                    onClick={e => { e.preventDefault(); navigate(`/${metier.slug}-${v.slug}`); }}
                    style={{ background: D, border: "1px solid rgba(255,140,0,0.15)", borderRadius: "8px", padding: "7px 14px", color: G, fontSize: "13px", textDecoration: "none", transition: "color 0.15s, border-color 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = P; e.currentTarget.style.borderColor = "rgba(255,140,0,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = G; e.currentTarget.style.borderColor = "rgba(255,140,0,0.15)"; }}
                  >{metier.label} {v.label}</a>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <CTASection titre={<>Commencez maintenant,<br /><span style={{ color: P }}>{metier.label}</span></>} sous={`Rejoignez les artisans en ${metier.desc} qui font confiance à Artisan+. Essai gratuit, sans carte bancaire.`} />
          </div>
        </div>
      </section>
    </>
  );
}

function art(a) { return a === "l'" ? "l'" : `${a} `; }

// ── PAGE : Ville ──────────────────────────────────────────────────────────────
function PageVille({ ville }) {
  useEffect(() => {
    const title = `Artisan+ ${ville.label} | Logiciel devis facture artisan ${ville.label}`;
    const description = `Logiciel de devis et factures pour artisans à ${ville.label} (${ville.dept}). Gérez votre activité en ${ville.region} à 7,99€/mois. Essai gratuit.`;
    setPageMeta(title, description, `${BASE}/artisan-${ville.slug}`);
    const schema = {
      "@context":"https://schema.org","@type":"LocalBusiness","name":`Artisan+ — ${ville.label}`,"description":description,
      "url":`${BASE}/artisan-${ville.slug}`,
      "areaServed":{"@type":"City","name":ville.label,"containedInPlace":{"@type":"AdministrativeArea","name":ville.region}},
      "priceRange":"7,99€/mois","currenciesAccepted":"EUR",
    };
    let el = document.getElementById("schema-ville");
    if (!el) { el = document.createElement("script"); el.type="application/ld+json"; el.id="schema-ville"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, [ville]);

  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📍</div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            Artisans à <span style={{ color: P }}>{ville.label}</span>,<br />simplifiez votre gestion
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ est utilisé par des centaines d'artisans en {ville.region}, dont beaucoup à {ville.label}. Devis, factures, chantiers et paiement en ligne à <strong style={{ color: P }}>7,99€/mois</strong> — aucun engagement.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Démarrer gratuitement à {ville.label}
          </a>
        </div>
      </section>

      {/* Contenu SEO */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Chiffres ville */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "56px" }}>
            {[
              { val: ville.pop, label: `Habitants à ${ville.label}` },
              { val: "7,99€/mois", label: "Prix Artisan+ Pro" },
              { val: "2 min", label: "Pour créer un devis" },
              { val: "100%", label: "Sans engagement" },
            ].map(s => (
              <div key={s.label} style={{ background: C, borderRadius: "14px", padding: "20px", textAlign: "center", border: "1px solid rgba(255,140,0,0.1)" }}>
                <div style={{ color: P, fontWeight: "900", fontSize: "24px" }}>{s.val}</div>
                <div style={{ color: G, fontSize: "12px", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bloc SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Artisan+ : le logiciel de gestion des artisans à {ville.label}
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>Vous êtes artisan à {ville.label} (département {ville.dept}, {ville.region}) et vous cherchez un outil simple pour créer vos devis et factures ? Artisan+ est la solution la plus abordable du marché, utilisée par des plombiers, électriciens, maçons, carreleurs, peintres, menuisiers et autres artisans de la région.</p>
              <p>Avec Artisan+, les artisans à {ville.label} peuvent :</p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                <li>Créer des devis professionnels en moins de 2 minutes, directement depuis leur smartphone sur le chantier</li>
                <li>Envoyer des factures conformes par email avec signature électronique</li>
                <li>Suivre leurs chantiers en temps réel et partager l'avancement avec leurs clients</li>
                <li>Encaisser par carte bancaire avec Stripe Connect (fonds virés en 48h)</li>
                <li>Créer un mini-site vitrine professionnel pour attirer de nouveaux clients à {ville.label}</li>
              </ul>
              <p>À seulement <strong style={{ color: P }}>7,99€/mois</strong>, Artisan+ est bien moins cher que les alternatives sur le marché — Tolteck (19€/mois), ArtisanFacture (29€/mois) ou Obat (39€/mois).</p>
            </div>
          </div>

          {/* Métiers dans cette ville */}
          <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 24px" }}>
            Artisan+ pour tous les métiers à {ville.label}
          </h2>
          {/* Liens combinés si la ville est dans le Top 20 */}
          {(() => {
            const isTop20 = TOP20_V.some(v => v.slug === ville.slug);
            if (!isTop20) return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "56px" }}>
                {METIERS.slice(0,20).map(m => (
                  <a key={m.slug} href={`/devis-facture-${m.slug}`}
                    onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                    style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "12px", padding: "16px 12px", textDecoration: "none", textAlign: "center", display: "block" }}>
                    <div style={{ fontSize: "24px", marginBottom: "6px" }}>{m.emoji}</div>
                    <div style={{ color: "white", fontSize: "12px", fontWeight: "700" }}>{m.label}</div>
                  </a>
                ))}
              </div>
            );
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginBottom: "56px" }}>
                {TOP20_M.map(m => (
                  <a key={m.slug} href={`/${m.slug}-${ville.slug}`}
                    onClick={e => { e.preventDefault(); navigate(`/${m.slug}-${ville.slug}`); }}
                    style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "12px", padding: "14px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", transition: "border-color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,140,0,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,140,0,0.1)"}
                  >
                    <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                    <div>
                      <div style={{ color: "white", fontSize: "12px", fontWeight: "700" }}>{m.label}</div>
                      <div style={{ color: P, fontSize: "10px" }}>à {ville.label} →</div>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}

          <TableauComparatif titre={`Comparatif logiciels artisan à ${ville.label}`} />

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <CTASection titre={<>Artisans à <span style={{ color: P }}>{ville.label}</span>,<br />démarrez gratuitement</>} sous={`Rejoignez les artisans de ${ville.region} sur Artisan+. Essai gratuit, sans carte bancaire, sans engagement.`} />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : Alternative ────────────────────────────────────────────────────────
function PageAlternative({ concurrent }) {
  useEffect(() => {
    const title = `Alternative à ${concurrent.label} | Artisan+ moins cher à 7,99€/mois`;
    const description = `Vous cherchez une alternative à ${concurrent.label} (${concurrent.prix}) ? Artisan+ offre plus de fonctionnalités à 7,99€/mois. Comparatif complet.`;
    setPageMeta(title, description, `${BASE}/alternative-${concurrent.slug}`);
  }, [concurrent]);

  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", display: "inline-block", padding: "6px 16px", marginBottom: "20px" }}>
            <span style={{ color: P, fontWeight: "800", fontSize: "13px" }}>Alternative à {concurrent.label}</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            Artisan+ vs {concurrent.label} :<br /><span style={{ color: P }}>7,99€/mois au lieu de {concurrent.prix}</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ propose les mêmes fonctionnalités que {concurrent.label} — et même plus — pour un tarif jusqu'à <strong style={{ color: P }}>{Math.round((parseFloat(concurrent.prix) / 7.99 - 1) * 100)}% moins cher</strong>. Découvrez le comparatif complet.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Essayer Artisan+ gratuitement
          </a>
        </div>
      </section>

      {/* Contenu */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Prix cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "60px" }}>
            <div style={{ background: "rgba(255,140,0,0.08)", border: "2px solid rgba(255,140,0,0.4)", borderRadius: "20px", padding: "32px", textAlign: "center" }}>
              <div style={{ color: P, fontWeight: "900", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>✅ Artisan+</div>
              <div style={{ color: P, fontWeight: "900", fontSize: "42px" }}>7,99€</div>
              <div style={{ color: G, fontSize: "14px" }}>/mois — tout inclus</div>
              <div style={{ marginTop: "16px", color: G, fontSize: "13px", lineHeight: "1.6" }}>
                {FEATURES.slice(0, 4).map(f => <div key={f.titre}>✅ {f.titre}</div>)}
                <div>✅ Mini-site vitrine</div>
                <div>✅ Paiement en ligne</div>
              </div>
            </div>
            <div style={{ background: C, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "32px", textAlign: "center" }}>
              <div style={{ color: G, fontWeight: "700", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{concurrent.label}</div>
              <div style={{ color: "white", fontWeight: "900", fontSize: "42px" }}>{concurrent.prix.replace("/mois", "")}</div>
              <div style={{ color: G, fontSize: "14px" }}>/mois</div>
              <div style={{ marginTop: "16px", color: G, fontSize: "13px", lineHeight: "1.6" }}>
                {concurrent.avantages.map(a => <div key={a}>✅ {a}</div>)}
                {concurrent.inconvenients.map(i => <div key={i} style={{ color: "#ff6b6b" }}>❌ {i}</div>)}
              </div>
            </div>
          </div>

          {/* Contenu SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Pourquoi choisir Artisan+ plutôt que {concurrent.label} ?
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>{concurrent.label} est un logiciel de gestion pour artisans bien connu, facturé à {concurrent.prix}. C'est une solution correcte, mais à ce tarif, beaucoup d'artisans cherchent une alternative plus accessible sans sacrifier les fonctionnalités.</p>
              <p>Artisan+ offre à <strong style={{ color: P }}>7,99€/mois</strong> :</p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                <li><strong>Devis et factures illimités</strong> avec catalogue de prix personnalisé</li>
                <li><strong>Signature électronique</strong> légalement valide directement depuis le devis</li>
                <li><strong>Suivi de chantier avancé</strong> avec photos, coûts et partage client</li>
                <li><strong>Mini-site vitrine</strong> professionnel pour attirer de nouveaux clients</li>
                <li><strong>Paiement en ligne</strong> par carte bancaire — une fonctionnalité que {concurrent.label} ne propose pas</li>
                <li><strong>Support par chat et email</strong> inclus dans l'abonnement</li>
              </ul>
              <p>En résumé : Artisan+ propose plus de fonctionnalités que {concurrent.label} pour un prix {Math.round((parseFloat(concurrent.prix) / 7.99 - 1) * 100)}% moins élevé. Sans engagement, avec un essai gratuit pour tester avant de s'abonner.</p>
            </div>
          </div>

          <TableauComparatif titre={`Artisan+ vs ${concurrent.label} — comparatif complet`} />

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <CTASection titre={<>Passez à <span style={{ color: P }}>Artisan+</span>,<br />l'alternative moins chère</>} sous={`Migrez depuis ${concurrent.label} en quelques minutes. Essai gratuit, sans carte bancaire, sans engagement.`} />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : CGU ────────────────────────────────────────────────────────────────
function PageCGU() {
  useEffect(() => {
    setPageMeta(
      "Conditions Générales d'Utilisation | Artisan+",
      "Conditions générales d'utilisation de l'application Artisan+. Modalités d'abonnement, droits et obligations des utilisateurs.",
      `${BASE}/cgu`
    );
  }, []);

  return (
    <section style={{ padding: "clamp(60px,8vw,80px) 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", marginBottom: "8px" }}>Conditions Générales d'Utilisation</h1>
        <p style={{ color: G, fontSize: "13px", marginBottom: "40px" }}>Dernière mise à jour : 1er juin 2025</p>

        {[
          {
            titre: "1. Objet et acceptation",
            contenu: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application Artisan+ (ci-après "le Service") éditée par Artisan+ SAS. En créant un compte ou en utilisant le Service, l'utilisateur accepte sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.`,
          },
          {
            titre: "2. Description du Service",
            contenu: `Artisan+ est une application web de gestion destinée aux artisans et professionnels du bâtiment. Le Service permet notamment : la création de devis et factures, le suivi de chantiers, la gestion de clients, la publication d'un mini-site vitrine, l'envoi de documents par email, la signature électronique de devis et la réception de paiements en ligne via Stripe Connect.`,
          },
          {
            titre: "3. Accès et compte utilisateur",
            contenu: `L'accès au Service nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes, à maintenir la confidentialité de ses identifiants et à informer immédiatement Artisan+ de toute utilisation non autorisée de son compte. L'accès est personnel et non transférable. Un essai gratuit est disponible avec des fonctionnalités limitées.`,
          },
          {
            titre: "4. Abonnement et tarification",
            contenu: `Le plan Pro est proposé à 7,99€ TTC par mois, facturé mensuellement via Stripe. L'abonnement est sans engagement, résiliable à tout moment depuis les paramètres du compte ou via le portail Stripe. Aucun remboursement n'est effectué pour les périodes en cours. Les prix peuvent être modifiés avec un préavis de 30 jours par email.`,
          },
          {
            titre: "5. Données et responsabilités",
            contenu: `L'utilisateur est seul responsable des données saisies (informations clients, montants, descriptions), de la conformité fiscale et légale de ses documents, et du respect des obligations déclaratives liées à son activité. Artisan+ n'est pas responsable des erreurs dans les documents générés. Il incombe à l'utilisateur de vérifier la conformité de ses devis et factures avec la législation applicable.`,
          },
          {
            titre: "6. Propriété intellectuelle",
            contenu: `L'application Artisan+, ses logos, sa charte graphique et l'ensemble de ses contenus sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou utilisation non autorisée est strictement interdite. L'utilisateur conserve la propriété de ses données et documents créés via le Service.`,
          },
          {
            titre: "7. Disponibilité et maintenance",
            contenu: `Artisan+ s'efforce d'assurer la disponibilité du Service 24h/24 et 7j/7. Des interruptions peuvent survenir pour maintenance, mise à jour ou en cas de force majeure. Artisan+ ne garantit pas un accès ininterrompu au Service et ne saurait être tenu responsable des dommages résultant d'une indisponibilité.`,
          },
          {
            titre: "8. Résiliation",
            contenu: `L'utilisateur peut résilier son abonnement à tout moment depuis son espace Paramètres > Abonnement, ou en contactant support@artisan-plus.fr. Artisan+ se réserve le droit de suspendre ou de résilier un compte en cas de violation des présentes CGU, d'utilisation abusive ou frauduleuse, sans préavis.`,
          },
          {
            titre: "9. Loi applicable et litiges",
            contenu: `Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord amiable dans un délai de 30 jours, tout litige sera soumis aux tribunaux compétents de Paris.`,
          },
          {
            titre: "10. Contact",
            contenu: `Pour toute question relative aux présentes CGU, vous pouvez contacter Artisan+ à l'adresse : contact@artisan-plus.fr`,
          },
        ].map(s => (
          <div key={s.titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "12px" }}>{s.titre}</h2>
            <p style={{ color: G, fontSize: "14px", lineHeight: "1.8", margin: 0 }}>{s.contenu}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PAGE : Politique de confidentialité ───────────────────────────────────────
function PageRGPD() {
  useEffect(() => {
    setPageMeta(
      "Politique de Confidentialité RGPD | Artisan+",
      "Politique de confidentialité et protection des données personnelles d'Artisan+. Conformité RGPD, droits des utilisateurs, données collectées.",
      `${BASE}/politique-confidentialite`
    );
  }, []);

  return (
    <section style={{ padding: "clamp(60px,8vw,80px) 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", marginBottom: "8px" }}>Politique de Confidentialité</h1>
        <p style={{ color: G, fontSize: "13px", marginBottom: "40px" }}>Dernière mise à jour : 1er juin 2025 — Conforme au Règlement Général sur la Protection des Données (RGPD)</p>

        {[
          {
            titre: "1. Responsable du traitement",
            contenu: `Artisan+ SAS est responsable du traitement de vos données personnelles. Contact : contact@artisan-plus.fr — Vous pouvez nous contacter pour toute question relative à vos données.`,
          },
          {
            titre: "2. Données collectées",
            contenu: `Nous collectons les données suivantes : Données d'identification : nom, prénom, adresse email, numéro de téléphone (si fourni). Données professionnelles : SIRET, numéro de TVA, adresse professionnelle, métier. Données de facturation : informations Stripe pour le paiement de l'abonnement (non stockées en clair chez nous). Données d'utilisation : documents créés (devis, factures), informations clients, photos de chantier. Données techniques : adresse IP, type de navigateur, pages visitées (analytics anonymisés).`,
          },
          {
            titre: "3. Finalités et bases légales",
            contenu: `Vos données sont traitées pour : l'exécution du contrat d'abonnement (base légale : exécution contractuelle), la gestion de votre compte et du Service (base légale : exécution contractuelle), l'envoi de notifications liées au Service (base légale : intérêt légitime), la conformité avec les obligations légales et fiscales (base légale : obligation légale), l'amélioration du Service avec analytics anonymisés (base légale : intérêt légitime).`,
          },
          {
            titre: "4. Hébergement et sous-traitants",
            contenu: `Vos données sont hébergées chez : Supabase (base de données, authentification) — serveurs en Europe (UE). Vercel (hébergement de l'application) — serveurs UE et US avec garanties RGPD. Stripe (paiements) — certifié PCI-DSS, conforme RGPD. Ces sous-traitants sont liés par des clauses contractuelles types conformes au RGPD.`,
          },
          {
            titre: "5. Durée de conservation",
            contenu: `Vos données sont conservées pendant la durée de votre abonnement et 3 ans après la résiliation de votre compte (obligations légales de conservation des données comptables). Les données de logs techniques sont conservées 12 mois. À l'expiration de ces délais, vos données sont supprimées ou anonymisées.`,
          },
          {
            titre: "6. Vos droits RGPD",
            contenu: `Conformément au RGPD, vous disposez des droits suivants : Droit d'accès : obtenir une copie de vos données. Droit de rectification : corriger des données inexactes. Droit à l'effacement : demander la suppression de vos données. Droit à la portabilité : recevoir vos données dans un format structuré. Droit d'opposition : vous opposer à certains traitements. Droit à la limitation : limiter le traitement de vos données. Pour exercer ces droits : contact@artisan-plus.fr. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
          },
          {
            titre: "7. Sécurité",
            contenu: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, authentification sécurisée via Supabase Auth, accès aux données restreint par Row Level Security (RLS), mots de passe hashés (bcrypt), clés API jamais exposées côté client.`,
          },
          {
            titre: "8. Cookies et consentement",
            contenu: `Artisan+ utilise deux catégories de cookies :\n\n• Cookies essentiels — indispensables au fonctionnement du Service (session utilisateur, authentification, préférences). Toujours actifs, ils ne peuvent pas être désactivés.\n• Cookies analytiques — mesure d'audience anonymisée pour améliorer l'application (optionnels). Aucune donnée transmise à des tiers publicitaires.\n\nÀ votre première visite, un bandeau de consentement vous permet d'accepter tout, refuser les cookies analytiques, ou personnaliser vos choix. Votre décision est mémorisée localement dans votre navigateur. Vous pouvez la modifier à tout moment en vidant les données du site dans les paramètres de votre navigateur.`,
          },
          {
            titre: "9. Modifications",
            contenu: `Nous pouvons modifier cette politique de confidentialité. En cas de modification substantielle, vous serez informé par email au moins 30 jours avant l'entrée en vigueur des changements. La poursuite de l'utilisation du Service après cette date vaut acceptation de la nouvelle politique.`,
          },
          {
            titre: "10. Contact DPO",
            contenu: `Pour toute question relative à la protection de vos données personnelles : contact@artisan-plus.fr — Nous nous engageons à répondre dans un délai de 30 jours.`,
          },
        ].map(s => (
          <div key={s.titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "12px" }}>{s.titre}</h2>
            <p style={{ color: G, fontSize: "14px", lineHeight: "1.8", margin: 0 }}>{s.contenu}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── FAQ dynamique par métier ──────────────────────────────────────────────────
function genFaqMetier(metier) {
  const kw = metier.kw; const desc = metier.desc;
  return [
    { q:`Combien coûte un ${kw} ?`, a:`Le tarif d'un ${kw} varie selon la région, le type de travaux et la complexité de l'intervention. En France, comptez généralement entre 40 et 100€/heure selon le niveau de qualification. Pour un devis précis et gratuit, utilisez Artisan+ : vos clients reçoivent un devis professionnel en 2 minutes.` },
    { q:`Comment trouver un bon ${kw} ?`, a:`Pour trouver un ${kw} fiable, vérifiez qu'il possède une assurance décennale (obligatoire), un numéro SIRET et des avis clients. Demandez toujours plusieurs devis comparatifs. Un ${kw} professionnel utilise un logiciel de devis comme Artisan+ pour vous fournir un document clair et détaillé.` },
    { q:`Quelles mentions obligatoires sur un devis de ${kw} ?`, a:`Un devis de ${kw} doit obligatoirement mentionner : la dénomination sociale et le SIRET, la description détaillée des travaux de ${desc}, le prix unitaire HT et TTC, la TVA applicable (5,5%, 10% ou 20%), la durée de validité et la date de début des travaux. Artisan+ génère automatiquement des devis conformes à la loi.` },
    { q:`Comment facturer en tant que ${kw} auto-entrepreneur ?`, a:`En tant que ${kw} auto-entrepreneur, votre facture doit inclure votre numéro SIRET, la mention "TVA non applicable, art. 293B du CGI" si vous n'êtes pas assujetti à la TVA, les détails de vos prestations de ${desc} et vos coordonnées bancaires. Artisan+ gère tout ça automatiquement.` },
    { q:`Quelle application pour gérer les devis et factures de ${kw} ?`, a:`Artisan+ est l'application idéale pour un ${kw} : création de devis en 2 minutes, envoi par email, signature électronique légale, génération de factures, suivi des paiements et mini-site vitrine. À 7,99€/mois, c'est la solution la moins chère du marché — 2 à 5× moins cher que Tolteck ou Obat.` },
  ];
}

// ── PAGE : Métier × Ville (400 pages combinées) ───────────────────────────────
function PageMetierVille({ metier, ville }) {
  useEffect(() => {
    const title = `${metier.label} à ${ville.label} | Devis et factures — Artisan+`;
    const desc  = `Vous êtes ${metier.kw} à ${ville.label} (${ville.dept}) ? Artisan+ vous permet de créer vos devis de ${metier.desc} en 2 minutes. Logiciel ${metier.kw} à 7,99€/mois. Essai gratuit.`;
    setPageMeta(title, desc, `${BASE}/${metier.slug}-${ville.slug}`);
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `${metier.label} à ${ville.label}`,
      "description": desc,
      "areaServed": { "@type": "City", "name": ville.label, "containedInPlace": { "@type": "AdministrativeArea", "name": ville.region } },
      "provider": { "@type": "Organization", "name": "Artisan+", "url": BASE },
    };
    let el = document.getElementById("schema-combo");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-combo"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, [metier, ville]);

  const faq = genFaqMetier(metier);
  return (
    <>
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>{metier.emoji}</div>
          <h1 style={{ color: "white", fontSize: "clamp(26px,5vw,48px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            {metier.label} à <span style={{ color: P }}>{ville.label}</span><br />
            <span style={{ fontSize: "0.75em" }}>Devis et factures en 2 minutes</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(14px,2vw,17px)", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px", margin: "0 auto 32px" }}>
            Artisan+ aide les {metier.kw}s de {ville.label} ({ville.region}) à créer des devis professionnels de {metier.desc} en quelques clics. Logiciel de devis et facturation à <strong style={{ color: P }}>7,99€/mois</strong>, sans engagement.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Essayer gratuitement — {metier.label} {ville.label}
          </a>
        </div>
      </section>

      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Avantages métier+ville */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginBottom: "56px" }}>
            {[
              { icon: "⚡", titre: `Devis ${metier.desc} en 2 min`, desc: `Catalogue de prix personnalisé pour vos travaux à ${ville.label}. Envoyez un devis professionnel depuis votre smartphone.` },
              { icon: "✍️", titre: "Signature électronique", desc: `Vos clients à ${ville.label} signent le devis depuis leur téléphone. Légalement valide, gain de temps garanti.` },
              { icon: "💶", titre: "Paiement en ligne", desc: `Encaissez par carte bancaire. Vos clients à ${ville.label} paient leur facture en un clic.` },
              { icon: "🌐", titre: `Mini-site ${metier.label} ${ville.label}`, desc: `Votre page vitrine en ligne pour attirer de nouveaux clients ${metier.kw} à ${ville.label}.` },
            ].map(f => (
              <div key={f.titre} style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ fontSize: "26px", marginBottom: "10px" }}>{f.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "14px", margin: "0 0 8px" }}>{f.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bloc SEO texte */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "20px", margin: "0 0 16px" }}>
              Artisan+ : le logiciel de gestion des {metier.kw}s à {ville.label}
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>Vous exercez votre activité de {metier.kw} à {ville.label} (département {ville.dept}, {ville.region}) et vous cherchez un outil simple pour gérer vos devis et factures ? Artisan+ est la solution de référence pour les artisans de la région.</p>
              <p>Avec Artisan+, les {metier.kw}s à {ville.label} peuvent :</p>
              <ul style={{ paddingLeft: "20px" }}>
                <li>Créer un devis de {metier.desc} en moins de 2 minutes depuis leur smartphone sur le chantier à {ville.label}</li>
                <li>Envoyer des devis et factures professionnels par email avec signature électronique légalement valide</li>
                <li>Suivre leurs chantiers à {ville.label} avec photos et suivi des coûts en temps réel</li>
                <li>Encaisser leurs clients par carte bancaire avec Stripe Connect (fonds virés en 48h)</li>
                <li>Présenter leurs réalisations sur un mini-site vitrine professionnel pour attirer de nouveaux clients à {ville.label}</li>
              </ul>
              <p>À <strong style={{ color: P }}>7,99€/mois</strong> seulement, Artisan+ est <strong>2 à 5 fois moins cher</strong> que Tolteck, Obat ou ArtisanFacture, avec davantage de fonctionnalités adaptées aux {metier.kw}s.</p>
            </div>
          </div>

          <TableauComparatif titre={`Meilleur logiciel pour ${metier.kw} à ${ville.label}`} />

          {/* FAQ */}
          <div style={{ marginTop: "56px", marginBottom: "56px" }}>
            <h2 style={{ color: "white", fontWeight: "900", fontSize: "22px", margin: "0 0 24px" }}>
              Questions fréquentes — {metier.label} à {ville.label}
            </h2>
            <FaqAccordion items={faq} />
          </div>

          <div style={{ textAlign: "center" }}>
            <CTASection
              titre={<>{metier.label} à <span style={{ color: P }}>{ville.label}</span>,<br />démarrez gratuitement</>}
              sous={`Rejoignez les ${metier.kw}s de ${ville.region} sur Artisan+. Essai gratuit, sans carte bancaire.`}
            />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : Facturation électronique obligatoire 2026 ─────────────────────────
function PageFacturationElectronique() {
  useEffect(() => {
    setPageMeta(
      "Facturation électronique obligatoire 2026–2027 | Artisan+ est prêt",
      "À partir du 1er septembre 2026, toutes les entreprises doivent recevoir des factures électroniques (Factur-X). Dès 2027, les artisans et TPE doivent aussi les émettre. Artisan+ est déjà conforme.",
      `${BASE}/facturation-electronique-obligatoire-2026`
    );
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "La facturation électronique est-elle obligatoire pour les artisans ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. À partir du 1er septembre 2026, toutes les entreprises (y compris les artisans) doivent pouvoir recevoir des factures électroniques structurées via une PDP agréée. Dès le 1er septembre 2027, les TPE, PME et micro-entreprises devront aussi émettre leurs factures dans un format structuré (Factur-X, UBL ou CII)." } },
        { "@type": "Question", "name": "Qu'est-ce que le format Factur-X ?", "acceptedAnswer": { "@type": "Answer", "text": "Factur-X est le format de facture électronique structurée choisi par la France. C'est un PDF enrichi d'un fichier XML conforme à la norme européenne EN 16931. Il est lisible par l'humain (PDF) et traitable automatiquement par les logiciels (XML)." } },
        { "@type": "Question", "name": "Artisan+ génère-t-il des factures Factur-X ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. Artisan+ génère des factures PDF classiques ET permet de télécharger le fichier Factur-X XML correspondant en un clic. Ce fichier est conforme à la norme EN 16931 et au profil Factur-X MINIMUM ou EN16931 selon votre régime de TVA." } },
        { "@type": "Question", "name": "Dois-je faire quelque chose maintenant ?", "acceptedAnswer": { "@type": "Answer", "text": "Non, si vous utilisez Artisan+. La fonctionnalité Factur-X est déjà disponible dans votre espace. Pour chaque facture, un bouton 'Factur-X' vous permet de télécharger le fichier XML structuré. Aucune action supplémentaire n'est requise avant 2026." } },
      ]
    };
    let el = document.getElementById("schema-facture-elec");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "schema-facture-elec"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schema);
  }, []);

  const TIMELINE = [
    { date: "1er septembre 2026", icon: "📥", titre: "Réception obligatoire", desc: "Toutes les entreprises françaises (quelle que soit leur taille) doivent être capables de recevoir des factures électroniques structurées via une Plateforme de Dématérialisation Partenaire (PDP) agréée par l'État.", who: "Toutes entreprises" },
    { date: "1er septembre 2027", icon: "📤", titre: "Émission obligatoire TPE/PME", desc: "Les TPE, PME, micro-entreprises et auto-entrepreneurs du BTP et des services doivent émettre leurs factures B2B dans un format structuré accepté : Factur-X, UBL ou CII. Les factures PDF non structurées ne seront plus acceptées.", who: "Artisans, TPE, PME" },
  ];

  const FORMATS = [
    { nom: "Factur-X", tag: "Recommandé 🇫🇷", desc: "PDF + XML embarqué. Le standard français, lisible par l'humain et traitable automatiquement. Artisan+ génère ce format.", color: "#FF8C00" },
    { nom: "UBL 2.1", tag: "Européen", desc: "Universal Business Language. Standard pan-européen utilisé notamment en Belgique, Pays-Bas, Danemark. Pur XML.", color: "#4CAF50" },
    { nom: "CII (UN/CEFACT)", tag: "International", desc: "Cross Industry Invoice. Base du Factur-X. Standard ONU utilisé en Allemagne (ZUGFeRD) et au Japon.", color: "#2196F3" },
  ];

  const FAQ_FE = [
    { q: "Qui est concerné par la réforme de 2026 ?", a: "Toutes les entreprises françaises soumises à la TVA (y compris les auto-entrepreneurs assujettis à la TVA). Les micro-entreprises sous le seuil de franchise TVA (art. 293B CGI) sont aussi concernées dès 2027 pour l'émission, même si leur XML contiendra une mention d'exonération." },
    { q: "Qu'est-ce qu'une PDP (Plateforme de Dématérialisation Partenaire) ?", a: "C'est un opérateur privé agréé par la DGFIP pour transmettre et recevoir des factures électroniques. Il est immatriculé, contrôlé et tenu de respecter des normes de sécurité strictes. Artisan+ s'interface avec ces plateformes pour assurer la conformité de ses utilisateurs." },
    { q: "Mes factures PDF actuelles ne sont-elles plus valables ?", a: "Pour les transactions B2C (artisan → particulier), le PDF reste valable. Pour les transactions B2B (artisan → entreprise, SCI, etc.), à partir du 1er septembre 2027, il faudra émettre des factures dans un format structuré (Factur-X, UBL ou CII)." },
    { q: "Artisan+ est-il conforme à la réforme ?", a: "Oui. Artisan+ génère déjà des factures au format Factur-X (XML structuré conforme EN 16931). Pour chaque facture créée, vous pouvez télécharger le fichier XML Factur-X en un clic depuis votre tableau de bord." },
    { q: "Qu'arrive-t-il si je n'émets pas de factures électroniques en 2027 ?", a: "Des pénalités peuvent s'appliquer en cas de non-conformité. La DGFiP a prévu des amendes pouvant atteindre 15€ par facture non conforme, plafonnées à 15 000€ par an. Il est recommandé de se préparer dès maintenant." },
  ];

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.06) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", padding: "6px 16px", marginBottom: "24px" }}>
            <span style={{ color: P, fontSize: "12px", fontWeight: "800" }}>⚡ Loi de finances 2024 — Réforme DGFiP</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.1", margin: "0 0 20px", letterSpacing: "-1px" }}>
            Facturation électronique<br /><span style={{ color: P }}>obligatoire en 2026</span> :<br />Artisan+ est déjà prêt
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "680px", margin: "0 auto 36px" }}>
            À partir du 1er septembre 2026, toute entreprise française devra pouvoir recevoir des factures électroniques structurées. Dès septembre 2027, les artisans et TPE/PME devront aussi les émettre au format Factur-X, UBL ou CII. Artisan+ génère déjà le format Factur-X conforme EN 16931.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
              style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none" }}>
              🚀 Essayer gratuitement — déjà conforme
            </a>
            <a href="#calendrier" onClick={e => { e.preventDefault(); document.getElementById("calendrier")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: "rgba(255,255,255,0.06)", color: "white", fontWeight: "700", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
              Voir le calendrier
            </a>
          </div>
        </div>
      </section>

      {/* ── Badge conformité ──────────────────────────────────────── */}
      <section style={{ background: C, padding: "24px 20px", borderTop: "1px solid rgba(255,140,0,0.1)", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }}>
          {[
            { icon: "✅", label: "Factur-X XML conforme EN 16931" },
            { icon: "✅", label: "Profil MINIMUM (micro-entreprise)" },
            { icon: "✅", label: "Profil EN16931 (TVA)" },
            { icon: "✅", label: "Téléchargement XML en 1 clic" },
          ].map(b => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>{b.icon}</span>
              <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Calendrier ────────────────────────────────────────────── */}
      <section id="calendrier" style={{ padding: "clamp(60px,8vw,100px) 20px", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: "900", margin: "0 0 12px" }}>
              Calendrier de la réforme
            </h2>
            <p style={{ color: G, fontSize: "15px" }}>Deux échéances à retenir pour les artisans</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {TIMELINE.map((t, i) => (
              <div key={t.date} style={{ background: C, border: `1px solid ${i === 1 ? "rgba(255,140,0,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "20px", padding: "32px", position: "relative" }}>
                {i === 1 && <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: P, color: "white", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "10px", whiteSpace: "nowrap" }}>⚠️ CONCERNÉ : artisans & TPE</div>}
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{t.icon}</div>
                <div style={{ color: P, fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>{t.date}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "18px", margin: "0 0 12px" }}>{t.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: "0 0 16px" }}>{t.desc}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "4px 10px" }}>
                  <span style={{ color: P, fontSize: "11px", fontWeight: "700" }}>👥 {t.who}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formats acceptés ──────────────────────────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px", background: C }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,32px)", fontWeight: "900", margin: "0 0 8px", textAlign: "center" }}>
            Formats acceptés par l'État
          </h2>
          <p style={{ color: G, fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
            3 formats structurés sont reconnus. Artisan+ implémente <strong style={{ color: P }}>Factur-X</strong>, le standard français.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {FORMATS.map(f => (
              <div key={f.nom} style={{ background: D, border: `1px solid ${f.color}33`, borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ color: "white", fontWeight: "900", fontSize: "20px" }}>{f.nom}</span>
                  <span style={{ background: `${f.color}22`, color: f.color, fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "8px" }}>{f.tag}</span>
                </div>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche dans Artisan+ ───────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,32px)", fontWeight: "900", margin: "0 0 12px", textAlign: "center" }}>
            Comment ça fonctionne dans <span style={{ color: P }}>Artisan+</span> ?
          </h2>
          <p style={{ color: G, fontSize: "14px", textAlign: "center", marginBottom: "48px" }}>
            Trois données Supabase confirmées comme stockées en format structuré : client, lignes de facture, TVA, SIRET.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { step: "1", icon: "📄", titre: "Créez votre facture normalement", desc: "Rien ne change dans votre workflow habituel : clients, lignes, TVA, notes. Artisan+ stocke toutes les données en format structuré dans Supabase." },
              { step: "2", icon: "⚡", titre: "Cliquez sur « Factur-X »", desc: "Dans la liste de vos factures, un bouton bleu « Factur-X » apparaît à côté du bouton PDF. Cliquez dessus pour télécharger le fichier XML structuré." },
              { step: "3", icon: "📤", titre: "Transmettez le fichier XML", desc: "Envoyez le fichier .xml à votre client ou à votre PDP (Plateforme de Dématérialisation Partenaire). Le fichier est conforme EN 16931, profil Factur-X MINIMUM ou EN16931." },
            ].map(s => (
              <div key={s.step} style={{ background: C, border: "1px solid rgba(255,140,0,0.15)", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
                <div style={{ width: "40px", height: "40px", background: P, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "white", fontWeight: "900", fontSize: "18px" }}>{s.step}</div>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{s.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 10px" }}>{s.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Données Supabase structurées ──────────────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px", background: C }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(20px,3vw,30px)", fontWeight: "900", margin: "0 0 8px", textAlign: "center" }}>
            Données structurées vérifiées dans Supabase
          </h2>
          <p style={{ color: G, fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
            Toutes les données nécessaires au Factur-X sont déjà stockées en base de données.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {[
              ["Table factures", "numero, total_ht, tva, total_ttc, created_at, nature_operation, tva_sur_debits"],
              ["Table lignes_facture", "description, quantite, prix_unitaire, total"],
              ["Table clients", "nom, email, telephone, adresse"],
              ["Table profils (artisan)", "nom, siret, adresse, telephone, email, iban"],
            ].map(([table, champs]) => (
              <div key={table} style={{ background: D, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginBottom: "8px" }}>✅ {table}</div>
                <div style={{ color: G, fontSize: "11px", lineHeight: "1.6", fontFamily: "monospace" }}>{champs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "clamp(22px,3.5vw,34px)", fontWeight: "900", margin: "0 0 36px", textAlign: "center" }}>
            Questions <span style={{ color: P }}>fréquentes</span>
          </h2>
          <FaqAccordion items={FAQ_FE} />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <CTASection
            titre={<>Préparez-vous à la réforme 2026<br /><span style={{ color: P }}>avec Artisan+, dès aujourd'hui</span></>}
            sous="Artisan+ génère déjà des factures Factur-X conformes EN 16931. Essai gratuit, sans carte bancaire, à 7,99€/mois ensuite."
          />
        </div>
      </section>
    </>
  );
}

// ── Routeur principal ─────────────────────────────────────────────────────────
export default function Vitrine() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const metier     = METIERS.find(m => path === `/devis-facture-${m.slug}`);
  const ville      = VILLES.find(v => path === `/artisan-${v.slug}`);
  const concurrent = CONCURRENTS.find(c => path === `/alternative-${c.slug}`);
  const combo      = COMBO_MAP.get(path);

  let PageContent;
  if      (metier)                                                        PageContent = <PageMetier metier={metier} />;
  else if (ville)                                                         PageContent = <PageVille  ville={ville} />;
  else if (concurrent)                                                    PageContent = <PageAlternative concurrent={concurrent} />;
  else if (combo)                                                         PageContent = <PageMetierVille metier={combo.metier} ville={combo.ville} />;
  else if (path === "/cgu")                                               PageContent = <PageCGU />;
  else if (path === "/politique-confidentialite")                         PageContent = <PageRGPD />;
  else if (path === "/facturation-electronique-obligatoire-2026")        PageContent = <PageFacturationElectronique />;
  else                                                                    PageContent = <PageHome />;

  return (
    <div style={{ minHeight: "100vh", background: D, fontFamily: "'Segoe UI', -apple-system, sans-serif", color: "white" }}>
      <Header />
      <main>{PageContent}</main>
      <Footer />
    </div>
  );
}
