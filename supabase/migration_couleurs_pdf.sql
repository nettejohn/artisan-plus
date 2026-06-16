-- Migration : colonne couleurs_pdf pour la personnalisation des PDF
-- À exécuter dans Supabase → SQL Editor

ALTER TABLE parametres ADD COLUMN IF NOT EXISTS couleurs_pdf JSONB;
