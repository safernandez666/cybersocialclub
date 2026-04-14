-- ==========================================================================
-- Migration: Survey CSC — tabla survey_responses
-- Date: 2026-03-18
-- Author: Gonza (Backend)
--
-- Execute in Supabase SQL Editor before deploying the API route.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS survey_responses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  q1          TEXT,                    -- Visión para la comunidad
  q2          JSONB,                   -- Tipo de eventos (array de checkboxes)
  q3          TEXT,                    -- Actividades sociales
  q4          TEXT,                    -- Beneficios de ser socio
  q5          JSONB,                   -- Contenido de interés (array)
  q6          JSONB,                   -- Cómo participar (array)
  q7          TEXT,                    -- Tipo de profesional (radio)
  q8          TEXT,                    -- Club ideal
  q9          TEXT,                    -- Ideas locas
  q10         TEXT,                    -- Qué NO debería tener
  q11         TEXT,                    -- Email opcional
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS: anónimo puede insertar, solo service_role puede leer
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_insert_survey"
  ON survey_responses FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policy for anon — only service_role can read
