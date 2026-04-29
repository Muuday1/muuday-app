-- Migration 084: Add service-level feature flags to professional_services
-- Purpose: Enable per-service configuration of recurring, batch, and monthly subscription support
-- Date: 2026-04-29

-- Add enable_recurring flag (default true for backward compatibility)
ALTER TABLE professional_services
ADD COLUMN IF NOT EXISTS enable_recurring BOOLEAN NOT NULL DEFAULT TRUE;

-- Add enable_batch flag (default true for backward compatibility)
ALTER TABLE professional_services
ADD COLUMN IF NOT EXISTS enable_batch BOOLEAN NOT NULL DEFAULT TRUE;

-- Add display_order for sorting services on profile
ALTER TABLE professional_services
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_professional_services_order
ON professional_services(professional_id, display_order);

-- Backfill: set display_order based on created_at for existing services
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY professional_id ORDER BY created_at) - 1 AS new_order
  FROM professional_services
)
UPDATE professional_services
SET display_order = ordered.new_order
FROM ordered
WHERE professional_services.id = ordered.id
  AND professional_services.display_order = 0;
