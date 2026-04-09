export interface PlatformPreferences {
  instagram: boolean
  tiktok: boolean
  facebook: boolean
}

export interface StudioSettings {
  platforms: PlatformPreferences
  smart_inventory_enabled?: boolean
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  platforms: {
    instagram: true,
    tiktok: false,
    facebook: false,
  },
  smart_inventory_enabled: false,
}

export interface ComingSoonFeature {
  id: string
  title: string
  description: string
  icon: string
}
