'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { GlassCard, GlassButton, GlassInput } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { createSocialAccount, updateSocialAccount } from '../services/marketing-service'
import { PLATFORM_INFO } from '../constants/tattoo-marketing'
import type { SocialAccount, SocialPlatform, CreateAccountInput } from '../types/marketing'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  existingAccount?: SocialAccount
}

export function AccountSetupModal({ isOpen, onClose, onSaved, existingAccount }: Props) {
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [username, setUsername] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [followersCount, setFollowersCount] = useState('')
  const [followingCount, setFollowingCount] = useState('')
  const [postsCount, setPostsCount] = useState('')
  const [bio, setBio] = useState('')
  const [isBusinessAccount, setIsBusinessAccount] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingAccount) {
      setPlatform(existingAccount.platform)
      setUsername(existingAccount.username)
      setProfileUrl(existingAccount.profile_url ?? '')
      setFollowersCount(String(existingAccount.followers_count))
      setFollowingCount(String(existingAccount.following_count))
      setPostsCount(String(existingAccount.posts_count))
      setBio(existingAccount.bio ?? '')
      setIsBusinessAccount(existingAccount.is_business_account)
    }
  }, [existingAccount])

  if (!isOpen) return null

  async function handleSave() {
    if (!username.trim()) {
      setError('El nombre de usuario es requerido')
      return
    }

    setIsSaving(true)
    setError(null)

    const input: CreateAccountInput = {
      platform,
      username: username.trim().replace(/^@/, ''),
      profile_url: profileUrl.trim() || undefined,
      followers_count: Number(followersCount) || 0,
      following_count: Number(followingCount) || 0,
      posts_count: Number(postsCount) || 0,
      bio: bio.trim() || undefined,
      is_business_account: isBusinessAccount,
    }

    const result = existingAccount
      ? await updateSocialAccount(existingAccount.id, input)
      : await createSocialAccount(input)

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSaved()
      onClose()
    }
  }

  const isEditing = !!existingAccount

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <GlassCard
          hover={false}
          padding="p-6"
          className="w-full max-w-md flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold text-ink-dark">
              {isEditing ? 'Editar Cuenta' : 'Agregar Cuenta'}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-ink-dark/70 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50"
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Platform selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink-dark/80">Plataforma</span>
            <div className="flex gap-2">
              {(Object.keys(PLATFORM_INFO) as SocialPlatform[]).map((p) => {
                const info = PLATFORM_INFO[p]
                const isSelected = platform === p
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      'flex-1 h-10 rounded-2xl text-sm font-medium transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                      isSelected
                        ? cn(info.bgColor, 'text-white border-transparent ring-2 ring-white/30 shadow-sm')
                        : 'bg-white/10 text-ink-dark/70 border-white/20 hover:bg-white/20'
                    )}
                  >
                    {info.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4">
            <GlassInput
              label="Usuario"
              placeholder="@usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
            <GlassInput
              label="URL del perfil"
              placeholder="https://instagram.com/usuario"
              type="url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              <GlassInput
                label="Seguidores"
                type="number"
                min="0"
                value={followersCount}
                onChange={(e) => setFollowersCount(e.target.value)}
                placeholder="0"
              />
              <GlassInput
                label="Siguiendo"
                type="number"
                min="0"
                value={followingCount}
                onChange={(e) => setFollowingCount(e.target.value)}
                placeholder="0"
              />
              <GlassInput
                label="Publicaciones"
                type="number"
                min="0"
                value={postsCount}
                onChange={(e) => setPostsCount(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Bio textarea */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="account-bio" className="text-sm font-medium text-ink-dark/80">
                Bio
              </label>
              <textarea
                id="account-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Descripcion de la cuenta..."
                className="w-full px-4 py-3 text-sm text-ink-dark bg-white/15 backdrop-blur-md border border-white/20 focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20 rounded-xl transition-all duration-200 outline-none resize-none placeholder:text-gray-400"
              />
            </div>

            {/* Business account toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
              <span className="text-sm font-medium text-ink-dark/80">Cuenta Business</span>
              <button
                role="switch"
                aria-checked={isBusinessAccount}
                onClick={() => setIsBusinessAccount((prev) => !prev)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                  isBusinessAccount ? 'bg-ink-orange' : 'bg-white/25 border border-white/20'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                    isBusinessAccount ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500 font-medium">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <GlassButton
              variant="ghost"
              className="flex-1"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </GlassButton>
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              isLoading={isSaving}
            >
              <Plus className="h-4 w-4" />
              Guardar
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </>
  )
}
