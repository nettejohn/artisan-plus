import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
);

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const BASE = "https://artisan-plus.vercel.app";

  // Mini-sites from mini_sites table
  const { data: sites } = await supabase
    .from("mini_sites")
    .select("slug, updated_at")
    .eq("actif", true)
    .not("slug", "is", null);

  // Backward compat: profils with mini_site_actif
  const { data: profils } = await supabase
    .from("profils")
    .select("mini_site_slug, updated_at")
    .eq("mini_site_actif", true)
    .not("mini_site_slug", "is", null);

  const seen = new Set();
  const entries = [];

  (sites || []).forEach(s => {
    if (s.slug && !seen.has(s.slug)) {
      seen.add(s.slug);
      entries.push({ slug: s.slug, date: s.updated_at });
    }
  });

  (profils || []).forEach(p => {
    if (p.mini_site_slug && !seen.has(p.mini_site_slug)) {
      seen.add(p.mini_site_slug);
      entries.push({ slug: p.mini_site_slug, date: p.updated_at });
    }
  });

  const today = new Date().toISOString().slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>
${entries.map(e => `  <url>
    <loc>${BASE}/artisan/${e.slug}</loc>
    <lastmod>${(e.date || today).slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("\n")}
</urlset>`;

  res.status(200).send(xml);
}
