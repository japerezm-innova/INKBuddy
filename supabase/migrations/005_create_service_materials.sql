-- Smart Inventory: recipes per service
CREATE TABLE IF NOT EXISTS public.service_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_per_session INT NOT NULL DEFAULT 1,
  studio_id UUID NOT NULL REFERENCES studios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, item_id)
);

ALTER TABLE public.service_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members manage service_materials"
  ON public.service_materials
  FOR ALL
  TO authenticated
  USING (studio_id = get_user_studio_id())
  WITH CHECK (studio_id = get_user_studio_id());
