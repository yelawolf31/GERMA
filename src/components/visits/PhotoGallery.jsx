import { useState, useCallback, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '../../i18n'

function PhotoThumbnail({ signedUrl, onClick, alt }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (failed || !signedUrl) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <AlertCircle className="h-6 w-6 text-slate-300" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onClick()}
      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      )}
      <img
        src={signedUrl}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${loaded ? '' : 'invisible'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </button>
  )
}

function Lightbox({ signedUrl, photos, onClose, onNavigate }) {
  const [failed, setFailed] = useState(false)
  const overlayRef = useRef(null)
  const { t } = useTranslation()
  const idx = photos.findIndex((p) => p.id === photos[photos.findIndex((pp) => pp.id === photos[idx]?.id)]?.id)
  const currentIdx = photos.findIndex((p) => p.id === photos.find((pp) => pp.id === photos[idx]?.id)?.id)
  const hasPrev = idx > 0
  const hasNext = idx < photos.length - 1

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(idx - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(idx + 1)
    },
    [onClose, onNavigate, idx, hasPrev, hasNext],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleDownload = async () => {
    try {
      const resp = await fetch(signedUrl)
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photos[idx]?.path?.split('/')?.pop() || 'photo.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(signedUrl, '_blank', 'noopener')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={t('visits.photoPreview')}
    >
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
        aria-label={t('common.close')}
      >
        <X className="h-5 w-5" />
      </button>

      {hasPrev && (
        <button
          onClick={() => onNavigate(idx - 1)}
          className="absolute left-3 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          aria-label={t('common.previous')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={() => onNavigate(idx + 1)}
          className="absolute right-14 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 sm:right-16"
          aria-label={t('common.next')}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div className="flex max-h-[85vh] max-w-[90vw] items-center justify-center">
        {failed ? (
          <div className="flex flex-col items-center gap-2 text-white">
            <AlertCircle className="h-12 w-12" />
            <p className="text-sm">{t('visits.photoLoadError')}</p>
          </div>
        ) : (
          <img
            src={signedUrl}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
          {idx + 1} / {photos.length}
        </span>
        <button
          onClick={handleDownload}
          className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          aria-label={t('visits.downloadPhoto')}
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function PhotoGallery({ photos = [], signedUrls = {}, loading = false }) {
  const { t } = useTranslation()
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-8 text-center">
        <ImageIcon className="h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">{t('visits.noPhotos')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, i) => (
          <PhotoThumbnail
            key={photo.id}
            signedUrl={signedUrls[photo.path]}
            onClick={() => setLightboxIndex(i)}
            alt={`${t('visits.photo')} ${photo.path?.split('/')?.pop() || ''}`}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          signedUrl={signedUrls[photos[lightboxIndex]?.path]}
          photos={photos}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}
