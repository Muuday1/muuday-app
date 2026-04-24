-- Migration 068: Add AI OCR fields to professional_credentials
-- For KYC triage pipeline (Sprint 2)

-- OCR processing status
ALTER TABLE public.professional_credentials
  ADD COLUMN IF NOT EXISTS ocr_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'manual_review'));

-- OCR confidence score (0-100)
ALTER TABLE public.professional_credentials
  ADD COLUMN IF NOT EXISTS ocr_score INTEGER
  CHECK (ocr_score BETWEEN 0 AND 100);

-- Extracted structured data from OCR
ALTER TABLE public.professional_credentials
  ADD COLUMN IF NOT EXISTS ocr_extracted_data JSONB;

-- Which provider performed OCR
ALTER TABLE public.professional_credentials
  ADD COLUMN IF NOT EXISTS ocr_provider TEXT
  CHECK (ocr_provider IN ('textract', 'document-ai', 'manual'));

-- When OCR was last run
ALTER TABLE public.professional_credentials
  ADD COLUMN IF NOT EXISTS ocr_checked_at TIMESTAMPTZ;

-- Human reviewer notes (for manual_review status)
ALTER TABLE public.professional_credentials
  ADD COLUMN IF NOT EXISTS ocr_review_notes TEXT;

-- Index for admin dashboard: pending/failed OCRs
CREATE INDEX IF NOT EXISTS idx_professional_credentials_ocr_status
  ON public.professional_credentials (professional_id, ocr_status)
  WHERE ocr_status IN ('pending', 'failed', 'manual_review');

-- Index for scoring queries
CREATE INDEX IF NOT EXISTS idx_professional_credentials_ocr_score
  ON public.professional_credentials (ocr_score DESC NULLS LAST);
