import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Play, FileText, ExternalLink, X } from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import { getYouTubeID, formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'

const TABS = ['All', 'Videos', 'Notes']

export default function StudentContent() {
  const user = useAuthStore(s => s.user)
  const [tab,       setTab]       = useState('All')
  const [videoModal, setVideoModal] = useState(null)

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['content', user.classID],
    queryFn:  () => api.get(`/student/content/${user.classID}`).then(r => r.data),
  })

  const filtered = content.filter(c => {
    if (tab === 'Videos') return c.type === 'video'
    if (tab === 'Notes')  return c.type === 'note'
    return true
  })

  if (isLoading) return <LoadingSpinner text="Loading content…" />

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
            <span className="ml-1.5 text-xs opacity-70">
              {t === 'All' ? content.length : content.filter(c => c.type === t.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            {tab === 'Notes' ? <FileText size={20} className="text-gray-400"/> : <Play size={20} className="text-gray-400"/>}
          </div>
          <p className="text-gray-500 text-sm">No {tab.toLowerCase()} available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            item.type === 'video'
              ? <VideoCard key={item._id} item={item} onPlay={() => setVideoModal(item)} />
              : <NoteCard  key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Study Mode Modal — full dark overlay video player */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">{videoModal.title}</h2>
              <button onClick={() => setVideoModal(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X size={20} className="text-white"/>
              </button>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
              {getYouTubeID(videoModal.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeID(videoModal.url)}?autoplay=1`}
                  className="w-full h-full" allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={videoModal.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <a href={videoModal.url} target="_blank" rel="noreferrer"
                    className="text-white flex items-center gap-2 underline">
                    <ExternalLink size={16}/> Open video link
                  </a>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-2">{formatDate(videoModal.createdAt)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function VideoCard({ item, onPlay }) {
  const ytID = getYouTubeID(item.url)
  return (
    <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onPlay}>
      <div className="relative bg-gray-100 aspect-video">
        {ytID
          ? <img src={`https://img.youtube.com/vi/${ytID}/mqdefault.jpg`} alt={item.title} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center bg-purple-50"><Play size={28} className="text-primary"/></div>
        }
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={20} className="text-primary ml-0.5"/>
          </div>
        </div>
        <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">VIDEO</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{item.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  )
}

function NoteCard({ item }) {
  return (
    <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-accent"/>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{item.title}</h3>
          <p className="text-xs text-gray-400 mt-1">{formatDate(item.createdAt)}</p>
        </div>
      </div>
      <a href={item.url} target="_blank" rel="noreferrer"
        className="mt-3 w-full inline-flex items-center justify-center gap-2 text-sm text-primary border border-primary rounded-lg py-2 hover:bg-purple-50 transition-colors font-medium">
        <ExternalLink size={14}/> Open Note
      </a>
    </div>
  )
}