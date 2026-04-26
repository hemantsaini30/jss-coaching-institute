import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Activity, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import { formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import Badge from '../../components/Badge'

export default function AdminLogs() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | inactive

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['adminLogs'],
    queryFn:  () => api.get('/admin/logs').then(r => r.data),
    refetchInterval: 60000,
  })

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.userID.toLowerCase().includes(search.toLowerCase()) ||
      l.classID?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'inactive' && l.inactive)
    return matchSearch && matchFilter
  })

  const inactiveCount = logs.filter(l => l.inactive).length

  function exportCSV() {
    const header = ['UserID', 'Name', 'Class', 'Last Login', 'Days Since Login', 'Status']
    const rows   = logs.map(l => [
      l.userID,
      l.name,
      l.classID || '',
      l.lastLogin ? new Date(l.lastLogin).toLocaleDateString('en-IN') : 'Never',
      l.daysSince ?? 'N/A',
      l.inactive ? 'Inactive' : 'Active',
    ])

    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `jss-engagement-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <LoadingSpinner text="Loading logs…" />

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Students</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{logs.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Active (≤7 days)</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{logs.length - inactiveCount}</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-xs text-red-500 uppercase tracking-wider font-medium">Inactive (&gt;7 days)</p>
          </div>
          <p className="text-3xl font-bold text-red-600 mt-1">{inactiveCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: 'all',      label: `All (${logs.length})`          },
            { key: 'inactive', label: `Inactive (${inactiveCount})`   },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student…"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-44"
          />
          <Button variant="secondary" className="text-xs gap-1.5" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Activity size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'User ID', 'Class', 'Last Login', 'Days Since', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(l => (
                  <tr key={l.userID}
                    className={`transition-colors ${
                      l.inactive
                        ? 'bg-red-50/50 hover:bg-red-50'
                        : 'hover:bg-gray-50'
                    }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          l.inactive ? 'bg-red-100' : 'bg-purple-100'
                        }`}>
                          <span className={`text-xs font-bold ${l.inactive ? 'text-red-500' : 'text-primary'}`}>
                            {l.name[0]}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{l.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.userID}</td>
                    <td className="px-4 py-3 text-gray-500">{l.classID || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {l.lastLogin ? formatDate(l.lastLogin) : (
                        <span className="text-gray-300 italic">Never logged in</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.daysSince === null ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : (
                        <span className={`text-sm font-semibold ${
                          l.daysSince > 7 ? 'text-red-500' : 'text-green-600'
                        }`}>
                          {l.daysSince}d
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.inactive ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} className="text-red-500" />
                          <Badge color="red">Inactive</Badge>
                        </div>
                      ) : (
                        <Badge color="green">Active</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}