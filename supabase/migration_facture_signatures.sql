-- Migration : support signatures sur factures
-- À exécuter dans Supabase → SQL Editor

-- 1. Ajouter facture_id dans la table signatures
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS facture_id UUID REFERENCES factures(id) ON DELETE CASCADE;

-- 2. Rendre devis_id optionnel (pour les signatures de factures)
ALTER TABLE signatures ALTER COLUMN devis_id DROP NOT NULL;

-- 3. Index pour les recherches par facture_id
CREATE INDEX IF NOT EXISTS signatures_facture_id_idx ON signatures(facture_id);
