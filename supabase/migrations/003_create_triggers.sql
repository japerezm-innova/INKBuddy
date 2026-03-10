-- =============================================
-- INKBuddy: Triggers & Functions
-- Run this THIRD in Supabase SQL Editor
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_studio_id UUID;
BEGIN
  -- Get or create default studio
  SELECT id INTO default_studio_id FROM public.studios LIMIT 1;
  IF default_studio_id IS NULL THEN
    INSERT INTO public.studios (name, slug) VALUES ('Mi Estudio', 'mi-estudio')
    RETURNING id INTO default_studio_id;
  END IF;

  INSERT INTO public.profiles (id, studio_id, email, full_name, role)
  VALUES (
    NEW.id,
    default_studio_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'artist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_studios_updated_at
  BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- Auto-deduct inventory on usage insert
CREATE OR REPLACE FUNCTION public.deduct_inventory()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.inventory_items
  SET current_stock = current_stock - NEW.quantity_used
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_inventory_usage
  AFTER INSERT ON public.inventory_usage
  FOR EACH ROW EXECUTE PROCEDURE public.deduct_inventory();
