import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
);

const BASE = "https://www.artisan-plus.fr";

const METIERS = [
  "plombier","electricien","macon","carreleur","peintre",
  "menuisier","chauffagiste","serrurier","couvreur","jardinier",
];

const VILLES = [
  "paris","lyon","marseille","toulouse","nice","nantes","strasbourg",
  "montpellier","bordeaux","lille","rennes","reims","le-havre",
  "saint-etienne","toulon","grenoble","dijon","angers","nimes","villeurbanne",
];

const CONCURRENTS = ["tolteck","obat","artisanfacture"];

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  // Mini-sites artisans depuis Supabase
  const { data: sites } = await supabase
    .from("mini_sites")
    .select("slug, updated_at")
    .eq("actif", true)
    .not("slug", "is", null);

  const { data: profils } = await supabase
    .from("profils")
    .select("mini_site_slug, updated_at")
    .eq("mini_site_actif", true)
    .not("mini_site_slug", "is", null);

  const seen = new Set();
  const miniSiteEntries = [];

  (sites || []).forEach(s => {
    if (s.slug && !seen.has(s.slug)) {
      seen.add(s.slug);
      miniSiteEntries.push({ slug: s.slug, date: s.updated_at });
    }
  });
  (profils || []).forEach(p => {
    if (p.mini_site_slug && !seen.has(p.mini_site_slug)) {
      seen.add(p.mini_site_slug);
      miniSiteEntries.push({ slug: p.mini_site_slug, date: p.updated_at });
    }
  });

  const today = new Date().toISOString().slice(0, 10);

  const staticPages = [
    { loc: `${BASE}/`,                      priority: "1.0", freq: "weekly"  },
    { loc: `${BASE}/cgu`,                   priority: "0.3", freq: "monthly" },
    { loc: `${BASE}/politique-confidentialite`, priority: "0.3", freq: "monthly" },
    ...METIERS.map(m => ({ loc: `${BASE}/devis-facture-${m}`, priority: "0.8", freq: "monthly" })),
    ...VILLES.map(v  => ({ loc: `${BASE}/artisan-${v}`,        priority: "0.7", freq: "monthly" })),
    ...CONCURRENTS.map(c => ({ loc: `${BASE}/alternative-${c}`, priority: "0.8", freq: "monthly" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`).join("\n")}
${miniSiteEntries.map(e => `  <url>
    <loc>${BASE}/artisan/${e.slug}</loc>
    <lastmod>${(e.date || today).slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n")}
</urlset>`;

  res.status(200).send(xml);
}
