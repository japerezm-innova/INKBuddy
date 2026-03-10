-- =============================================
-- INKBuddy: Core Schema
-- Run this FIRST in Supabase SQL Editor
-- =============================================

-- Studios (SaaS-ready foundation)
CREATE TABLE public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'America/Mexico_City',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'artist' CHECK (role IN ('owner', 'artist')),
  phone TEXT,
  bio TEXT,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  birth_date DATE,
  profession TEXT,
  notes TEXT,
  source TEXT CHECK (source IN ('walk_in', 'instagram', 'referral', 'website', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Services / Tattoo Types
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  price_min NUMERIC(10,2),
  price_max NUMERIC(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  artist_id UUID REFERENCES public.profiles(id) NOT NULL,
  service_id UUID REFERENCES public.services(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  price NUMERIC(10,2),
  deposit NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  design_reference_urls TEXT[],
  body_placement TEXT,
  external_calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Artist Availability
CREATE TABLE public.artist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  artist_id UUID REFERENCES public.profiles(id) NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Artist Blocked Dates
CREATE TABLE public.artist_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  artist_id UUID REFERENCES public.profiles(id) NOT NULL,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Portfolio Items
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  artist_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  style TEXT,
  body_placement TEXT,
  is_available_design BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inventory Items
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ink', 'needle', 'supply', 'aftercare', 'equipment', 'other')),
  current_stock INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 5,
  unit TEXT DEFAULT 'units',
  cost_per_unit NUMERIC(10,2),
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inventory Usage Log
CREATE TABLE public.inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  item_id UUID REFERENCES public.inventory_items(id) NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  quantity_used INT NOT NULL,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tasks (Kanban board)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  due_date DATE,
  category TEXT CHECK (category IN ('design_prep', 'studio_task', 'client_followup', 'inventory', 'other')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Notifications (provider-agnostic)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'artist', 'owner')),
  recipient_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'push', 'in_app')),
  template TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_appointments_studio ON public.appointments(studio_id);
CREATE INDEX idx_appointments_artist ON public.appointments(artist_id);
CREATE INDEX idx_appointments_starts ON public.appointments(starts_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_clients_studio ON public.clients(studio_id);
CREATE INDEX idx_clients_name ON public.clients(full_name);
CREATE INDEX idx_portfolio_studio ON public.portfolio_items(studio_id);
CREATE INDEX idx_portfolio_artist ON public.portfolio_items(artist_id);
CREATE INDEX idx_inventory_studio ON public.inventory_items(studio_id);
CREATE INDEX idx_tasks_studio ON public.tasks(studio_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for);
