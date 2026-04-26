import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Send } from 'lucide-react'
import api from '../../utils/api'
import { formatDate, timeAgo } from '../../utils/helpers'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import toast from 'react-hot-toast'

const emptyForm = { message: '', classID: '', expiresAt: '' }

export default function AdminNotifications() {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: classes = [] } = useQuery({
    queryKey: ['publicClasses'],
    queryFn:  () => api.get('/public/classes').then(r => r.data),
  })

  // Fetch sent notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn:  () => api.get('/admin/notifications').then(r => r.data).catch(() => []),
  })

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => api.post('/admin/notifications', {
      message:   form.message.trim(),
      classID:   form.classID || null,
      expiresAt: form.expiresAt || null,
    }),
    onSuccess: () => {
      toast.success('Notification sent!')
      setForm(emptyForm)
      qc.invalidateQueries({ queryKey: ['adminNotifications'] })
    },
    onError: () => toast.error('Failed to send notification'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.message.trim()) { toast.error('Message is required'); return }
    send()
  }

  // Min datetime for expiry
  const minExpiry = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-5">
      {/* Send form */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Send size={16} className="text-primary" /> Send Notification
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="Type your announcement or alert here…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length} chars</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Audience</label>
              <select
                value={form.classID}
                onChange={e => set('classID', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="">🌐 All Classes (Global)</option>
                {classes.map(c => (
                  <option key={c.classID} value={c.classID}>{c.className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                min={minExpiry()}
                onChange={e => set('expiresAt', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Preview */}
          {form.message && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-500 font-medium mb-1">Preview</p>
              <div className="flex items-start gap-2">
                <Bell size={13} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{form.message}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                → {form.classID ? `Class ${form.classID}` : 'All students & teachers'}
              </p>
            </div>
          )}

          <Button type="submit" variant="primary" loading={isPending} className="w-full py-2.5">
            <Send size={15} /> Send Notification
          </Button>
        </form>
      </div>

      {/* Sent notifications list */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell size={16} className="text-primary" /> Sent Notifications
        </h2>
        {notifications.length === 0 ? (
          <div className="text-center py-10">
            <Bell size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const expired = n.expiresAt && new Date(n.expiresAt) < new Date()
              return (
                <div key={n._id} className={`p-4 rounded-xl border ${expired ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">{n.message}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                        {n.classID
                          ? <Badge color="purple">Class {n.classID}</Badge>
                          : <Badge color="blue">Global</Badge>
                        }
                        {expired && <Badge color="gray">Expired</Badge>}
                        {n.expiresAt && !expired && (
                          <span className="text-xs text-gray-400">
                            Expires: {formatDate(n.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}