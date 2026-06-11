ALTER TABLE settings
ADD COLUMN IF NOT EXISTS writing_style text DEFAULT 'educational';
