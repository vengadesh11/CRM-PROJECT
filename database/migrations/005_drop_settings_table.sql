-- Remove settings table created for dashboard image storage

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
DROP FUNCTION IF EXISTS update_settings_updated_at();
DROP TABLE IF EXISTS public.settings;
