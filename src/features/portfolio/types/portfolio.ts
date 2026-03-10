export interface PortfolioItem {
  id: string
  studio_id: string
  artist_id: string
  title: string | null
  description: string | null
  image_url: string
  style: string | null
  body_placement: string | null
  is_available_design: boolean
  is_public: boolean
  sort_order: number
  created_at: string
  artist?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CreatePortfolioInput {
  title?: string
  description?: string
  image_url: string
  style?: string
  body_placement?: string
  is_available_design?: boolean
  is_public?: boolean
}

export interface PortfolioFilter {
  style?: string
  artistId?: string
  availableOnly?: boolean
}
