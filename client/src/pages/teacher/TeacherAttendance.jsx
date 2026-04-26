import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, CheckSquare } from 'lucide-react'
import api from '../../utils/api'
import Button from '../../components/Button'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function TeacherAttendance({ classes }) {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  const [selectedClass, setSelectedClass] = useState('')
  const [date,          setDate]          = useState(today)
  const [records,       setRecords]       = useState({})

  const classID = selectedClass || classes[0]?.classID

  // Fetch students in this class
  const { data: students = [], isLoading: studLoading } = useQuery({
  queryKey: ['students', classID],
  queryFn:  () => api.get(`/teacher/students/${classID}`).then(r => r.data),
  enabled:  !!classID,
})

  // Fetch existing attendance for this class + date
  const { data: existing = [], isLoading: attLoading } = useQuery({
    queryKey: ['attendanceSheet', classID, date],
    queryFn:  () => api.get(`/teacher/attendance/${classID}/${date}`).then(r => r.data),
    enabled:  !!classID && !!date,
  })

  // Initialise records from existing data or default to present
  useEffect(() => {
    if (!students.length) return
    const map = {}
    students.forEach(s => {
      const found = existing.find(e => e.studentID === s.userID)
      map[s.userID] = found ? found.status : 'present'
    })
    setRecords(map)
  }, [students, existing])

  const toggle = (id) =>
    setRecords(r => ({ ...r, [id]: r[id] === 'present' ? 'absent' : 'present' }))

  const markAll = (status) => {
    const map = {}
    students.forEach(s => { map[s.userID] = status })
    setRecords(map)
  }

  const { mutate: saveAtt, isPending } = useMutation({
    mutationFn: () => api.post('/teacher/attendance', {
      classID,
      date,
      records: Object.entries(records).map(([studentID, status]) => ({ studentID, status })),
    }),
    onSuccess: () => {
      toast.success('Attendance saved!')
      qc.invalidateQueries({ queryKey: ['attendanceSheet', classID, date] })
    },
    onError: () => toast.error('Failed to save attendance'),
  })

  const presentCount = Object.values(records).filter(s => s === 'present').length
  const absentCount  = students.length - presentCount

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass || classID}
              onChange={e => setSelectedClass(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {classes.map(c => (
                <option key={c.classID} value={c.classID}>{c.className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" className="text-xs" onClick={() => markAll('present')}>
              <CheckSquare size={14}/> All Present
            </Button>
            <Button variant="ghost" className="text-xs text-red-500 hover:bg-red-50"
              onClick={() => markAll('absent')}>
              All Absent
            </Button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 mt-3">
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
            ✓ {presentCount} Present
          </span>
          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
            ✗ {absentCount} Absent
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
            {students.length} Total
          </span>
        </div>
      </div>

      {/* Attendance table */}
      {studLoading || attLoading ? (
        <LoadingSpinner text="Loading students…" />
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-sm">No students found in this class</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Student Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Student ID</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s, i) => {
                const status = records[s.userID] || 'present'
                return (
                  <tr key={s.userID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{s.name[0]}</span>
                        </div>
                        <span className="font-medium text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.userID}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(s.userID)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          status === 'present'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {status === 'present'
                          ? <><CheckCircle size={13}/> Present</>
                          : <><XCircle size={13}/> Absent</>
                        }
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Save button */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <Button variant="primary" className="px-8" loading={isPending} onClick={() => saveAtt()}>
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  )
}