export interface PlatformPreferences {
  instagram: boolean
  tiktok: boolean
  facebook: boolean
}

export interface StudioSettings {
  platforms: PlatformPreferences
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  platforms: {
    instagram: true,
    tiktok: false,
    facebook: false,
  },
}

export interface ComingSoonFeature {
  id: string
  title: string
  description: string
  icon: string
}
