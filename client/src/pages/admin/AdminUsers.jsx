import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, Search, Users } from 'lucide-react'
import api from '../../utils/api'
import { formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import Badge from '../../components/Badge'
import Button from '../../components/Button'

const ROLE_COLORS = { admin: 'orange', teacher: 'blue', student: 'purple' }

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState('all')
  const [search,     setSearch]     = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn:  () => api.get('/admin/users').then(r => r.data),
  })

  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase())
      || u.userID.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  function printCredentials() {
    const rows = users.map(u =>
      `<tr>
        <td>${u.userID}</td>
        <td>${u.name}</td>
        <td style="text-transform:capitalize">${u.role}</td>
        <td>${u.classID || '—'}</td>
        <td><strong>${u.formulaPassword}</strong></td>
      </tr>`
    ).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>JSS Institute — User Credentials</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
          h1   { color: #6C3FCF; font-size: 18px; margin-bottom: 4px; }
          p    { color: #666; font-size: 11px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th   { background: #6C3FCF; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
          td   { padding: 7px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>JSS — Jai Shree Shyam Institute</h1>
        <p>User Credentials — Generated on ${new Date().toLocaleDateString('en-IN')}</p>
        <table>
          <thead>
            <tr><th>User ID</th><th>Name</th><th>Role</th><th>Class</th><th>Password</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <br/>
        <button onclick="window.print()">🖨️ Print</button>
      </body>
      </html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.focus()
  }

  if (isLoading) return <LoadingSpinner text="Loading users…" />

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'student', 'teacher', 'admin'].map(r => {
            const count = r === 'all' ? users.length : users.filter(u => u.role === r).length
            return (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  roleFilter === r
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                }`}>
                {r.charAt(0).toUpperCase() + r.slice(1)} ({count})
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name / ID…"
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-44"
            />
          </div>
          <Button variant="secondary" className="text-xs gap-1.5" onClick={printCredentials}>
            <Printer size={14} /> Print Credentials
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User ID', 'Name', 'Role', 'Class', 'Password', 'Last Login'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.userID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.userID}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{u.name[0]}</span>
                        </div>
                        <span className="font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={ROLE_COLORS[u.role]}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.classID || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                        {u.formulaPassword}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.lastLogin ? formatDate(u.lastLogin) : (
                        <span className="text-gray-300">Never</span>
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