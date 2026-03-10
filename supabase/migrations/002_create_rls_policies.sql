-- =============================================
-- INKBuddy: RLS Policies
-- Run this SECOND in Supabase SQL Editor
-- =============================================

-- Helper function: get user's studio_id
CREATE OR REPLACE FUNCTION public.get_user_studio_id()
RETURNS UUID AS $$
  SELECT studio_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===== STUDIOS =====
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own studio" ON public.studios
  FOR SELECT USING (id = public.get_user_studio_id());

CREATE POLICY "Owners update own studio" ON public.studios
  FOR UPDATE USING (id = public.get_user_studio_id() AND public.is_owner());

-- ===== PROFILES =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view studio profiles" ON public.profiles
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Owners manage studio profiles" ON public.profiles
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- ===== CLIENTS =====
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view clients" ON public.clients
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members create clients" ON public.clients
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members update clients" ON public.clients
  FOR UPDATE USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Owners delete clients" ON public.clients
  FOR DELETE USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- ===== SERVICES =====
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view services" ON public.services
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Owners manage services" ON public.services
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- Allow anonymous access for public booking
CREATE POLICY "Public view active services" ON public.services
  FOR SELECT USING (is_active = TRUE);

-- ===== APPOINTMENTS =====
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view all studio appointments" ON public.appointments
  FOR SELECT USING (studio_id = public.get_user_studio_id() AND public.is_owner());

CREATE POLICY "Artists view own appointments" ON public.appointments
  FOR SELECT USING (studio_id = public.get_user_studio_id() AND artist_id = auth.uid());

CREATE POLICY "Owners manage all appointments" ON public.appointments
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

CREATE POLICY "Artists update own appointments" ON public.appointments
  FOR UPDATE USING (studio_id = public.get_user_studio_id() AND artist_id = auth.uid());

CREATE POLICY "Studio members create appointments" ON public.appointments
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

-- Allow anonymous booking creation
CREATE POLICY "Public create appointments" ON public.appointments
  FOR INSERT WITH CHECK (TRUE);

-- ===== ARTIST AVAILABILITY =====
ALTER TABLE public.artist_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view availability" ON public.artist_availability
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Artists manage own availability" ON public.artist_availability
  FOR ALL USING (studio_id = public.get_user_studio_id() AND artist_id = auth.uid());

CREATE POLICY "Owners manage all availability" ON public.artist_availability
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- Public access for booking page
CREATE POLICY "Public view availability" ON public.artist_availability
  FOR SELECT USING (is_available = TRUE);

-- ===== ARTIST BLOCKED DATES =====
ALTER TABLE public.artist_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view blocked dates" ON public.artist_blocked_dates
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Artists manage own blocked dates" ON public.artist_blocked_dates
  FOR ALL USING (studio_id = public.get_user_studio_id() AND artist_id = auth.uid());

CREATE POLICY "Owners manage all blocked dates" ON public.artist_blocked_dates
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- Public access for booking
CREATE POLICY "Public view blocked dates" ON public.artist_blocked_dates
  FOR SELECT USING (TRUE);

-- ===== PORTFOLIO ITEMS =====
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view public portfolio" ON public.portfolio_items
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Studio members view all portfolio" ON public.portfolio_items
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Artists manage own portfolio" ON public.portfolio_items
  FOR ALL USING (studio_id = public.get_user_studio_id() AND artist_id = auth.uid());

CREATE POLICY "Owners manage all portfolio" ON public.portfolio_items
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- ===== INVENTORY ITEMS =====
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view inventory" ON public.inventory_items
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members update inventory" ON public.inventory_items
  FOR UPDATE USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Owners manage inventory" ON public.inventory_items
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- ===== INVENTORY USAGE =====
ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view usage" ON public.inventory_usage
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members log usage" ON public.inventory_usage
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

-- ===== TASKS =====
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view tasks" ON public.tasks
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members create tasks" ON public.tasks
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members update tasks" ON public.tasks
  FOR UPDATE USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Owners delete tasks" ON public.tasks
  FOR DELETE USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- ===== NOTIFICATIONS =====
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view notifications" ON public.notifications
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members create notifications" ON public.notifications
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

CREATE POLICY "System update notifications" ON public.notifications
  FOR UPDATE USING (studio_id = public.get_user_studio_id());
