import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Eye } from 'lucide-react'
import api from '../../utils/api'
import { formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'
import toast from 'react-hot-toast'

const STATUS_COLORS = { new: 'orange', contacted: 'blue', enrolled: 'green' }
const STATUS_OPTS   = ['new', 'contacted', 'enrolled']

export default function AdminInquiries() {
  const qc = useQueryClient()
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['adminInquiries'],
    queryFn:  () => api.get('/admin/inquiries').then(r => r.data),
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/inquiries/${id}`, { status }),
    onSuccess:  () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['adminInquiries'] })
    },
    onError: () => toast.error('Update failed'),
  })

  const filtered = filter === 'all'
    ? inquiries
    : inquiries.filter(i => i.status === filter)

  if (isLoading) return <LoadingSpinner text="Loading inquiries…" />

  return (
    <div className="space-y-5">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {['all', ...STATUS_OPTS].map(s => {
          const count = s === 'all'
            ? inquiries.length
            : inquiries.filter(i => i.status === s).length
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No inquiries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Phone', 'Class', 'Date', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inq => (
                  <tr key={inq._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{inq.name}</p>
                      {inq.email && <p className="text-xs text-gray-400">{inq.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <a href={`tel:${inq.phone}`} className="hover:text-primary transition-colors">
                        {inq.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inq.classInterested || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(inq.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_COLORS[inq.status]}>
                        {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={inq.status}
                          onChange={e => updateStatus({ id: inq._id, status: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        >
                          {STATUS_OPTS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <button onClick={() => setSelected(inq)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Inquiry Details" size="sm">
        {selected && (
          <div className="space-y-4">
            {[
              { label: 'Name',     value: selected.name            },
              { label: 'Phone',    value: selected.phone           },
              { label: 'Email',    value: selected.email || '—'    },
              { label: 'Class',    value: selected.classInterested || '—' },
              { label: 'Date',     value: formatDate(selected.createdAt)  },
              { label: 'Status',   value: selected.status          },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                <span className="text-sm text-gray-800 font-medium">{value}</span>
              </div>
            ))}
            {selected.message && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                  {selected.message}
                </p>
              </div>
            )}
            <div className="pt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Update Status</label>
              <select
                value={selected.status}
                onChange={e => {
                  updateStatus({ id: selected._id, status: e.target.value })
                  setSelected(s => ({ ...s, status: e.target.value }))
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                {STATUS_OPTS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}