import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPublicPortfolioBySlug } from '@/features/portfolio/services/portfolio-service'
import { PortfolioGrid } from '@/features/portfolio/components'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { artist } = await getPublicPortfolioBySlug(slug)

  const name = artist?.artistName ?? artist?.studioName ?? 'Portafolio'
  const studio = artist?.studioName ?? 'INKBuddy'

  return {
    title: `${name} | ${studio}`,
    description: artist?.artistBio ?? `Portafolio de tatuajes de ${name}. Explora los trabajos y agenda tu cita.`,
    openGraph: {
      title: `${name} - Portafolio de Tatuajes`,
      description: artist?.artistBio ?? `Explora los trabajos de ${name} y agenda tu cita.`,
      images: artist?.artistAvatar ? [artist.artistAvatar] : [],
    },
  }
}

export default async function ArtistPortfolioPage({ params }: PageProps) {
  const { slug } = await params
  const { data: items, artist, error } = await getPublicPortfolioBySlug(slug)

  if (error || !artist) notFound()

  const displayName = artist.artistName ?? artist.studioName

  return (
    <div className="min-h-screen gradient-warm relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="gradient-blob-1 animate-blob absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="gradient-blob-2 animate-blob-slow absolute bottom-0 -left-20 w-80 h-80 rounded-full pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="gradient-blob-3 animate-blob absolute top-1/2 left-1/4 w-64 h-64 rounded-full pointer-events-none"
      />

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-20">
        {/* Artist header */}
        <header className="flex flex-col items-center text-center mb-10">
          {artist.artistAvatar ? (
            <Image
              src={artist.artistAvatar}
              alt={displayName ?? 'Avatar'}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/50 shadow-warm mb-4"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-24 h-24 rounded-full gradient-accent flex items-center justify-center shadow-warm mb-4 text-4xl"
            >
              🎨
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
            {displayName}
          </h1>

          {artist.studioName && artist.artistName && (
            <p className="text-sm text-ink-dark/50 mt-0.5 font-medium">
              {artist.studioName}
            </p>
          )}

          {artist.artistBio && (
            <p className="text-sm text-ink-dark/70 mt-3 max-w-md leading-relaxed">
              {artist.artistBio}
            </p>
          )}

          <Link
            href={`/booking`}
            className="mt-5 inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-sm font-semibold gradient-accent text-white shadow-warm hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50"
          >
            Agendar una cita
          </Link>
        </header>

        {/* Portfolio grid */}
        {items && items.length > 0 ? (
          <PortfolioGrid items={items} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/20 backdrop-blur-sm border border-white/25 rounded-3xl">
            <div
              aria-hidden="true"
              className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center mb-4 shadow-warm"
            >
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-base font-semibold text-ink-dark mb-1">
              Portafolio en construccion
            </h3>
            <p className="text-sm text-ink-dark/60 max-w-xs">
              Pronto habra trabajos disponibles para explorar.
            </p>
          </div>
        )}

        {/* Footer CTA */}
        <footer className="mt-12 text-center">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-semibold gradient-accent text-white shadow-warm hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50"
          >
            Reservar una cita
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            Todos los disenos son originales. Reserva tu sesion hoy.
          </p>
        </footer>
      </main>
    </div>
  )
}
