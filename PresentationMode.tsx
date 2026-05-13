import { useState, useRef } from 'react'
import { useSchedulerStore, assignmentKey, getDaysInMonth } from '../store/schedulerStore'
import { SHIFT_DEFINITIONS } from '../types/scheduler'
import type { ShiftType } from '../types/scheduler'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function shiftDef(id: ShiftType) {
  return SHIFT_DEFINITIONS.find(s => s.id === id) ?? SHIFT_DEFINITIONS[SHIFT_DEFINITIONS.length - 1]
}

// ── Export helpers ────────────────────────────────────────────────────────────

function exportCSV(
  year: number,
  month: number,
  members: { id: string; name: string }[],
  assignments: Record<string, ShiftType>
) {
  const days = getDaysInMonth(year, month)
  const header = ['Date', 'Day', ...members.map(m => m.name)].join(',')
  const rows = days.map(date => {
    const d = new Date(date + 'T00:00:00')
    const dayName = DAY_NAMES[d.getDay()]
    const cols = members.map(m => {
      const shift = assignments[assignmentKey(m.id, date)] ?? 'OFF'
      const def = shiftDef(shift)
      return shift === 'OFF' ? '' : def.label
    })
    return [date, dayName, ...cols].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `oncall-${year}-${String(month + 1).padStart(2, '0')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportQuip(
  year: number,
  month: number,
  members: { id: string; name: string }[],
  assignments: Record<string, ShiftType>
) {
  const days = getDaysInMonth(year, month)
  const header = `| Date | Day | ${members.map(m => m.name).join(' | ')} |`
  const sep    = `| --- | --- | ${members.map(() => '---').join(' | ')} |`
  const rows = days.map(date => {
    const d = new Date(date + 'T00:00:00')
    const dayName = DAY_NAMES[d.getDay()]
    const cols = members.map(m => {
      const shift = assignments[assignmentKey(m.id, date)] ?? 'OFF'
      return shift === 'OFF' ? '—' : shiftDef(shift).label
    })
    return `| ${date} | ${dayName} | ${cols.join(' | ')} |`
  })
  const md = [header, sep, ...rows].join('\n')
  navigator.clipboard.writeText(md).then(() => alert('Quip markdown copied to clipboard!'))
}

// ── Shift cell dropdown ───────────────────────────────────────────────────────

function ShiftCell({ memberId, date }: { memberId: string; date: string }) {
  const shift = useSchedulerStore(s => s.assignments[assignmentKey(memberId, date)] ?? 'OFF')
  const setShift = useSchedulerStore(s => s.setShift)
  const def = shiftDef(shift)

  return (
    <select
      value={shift}
      onChange={e => setShift(memberId, date, e.target.value as ShiftType)}
      className={`w-full text-center text-xs font-semibold rounded px-1 py-0.5 border-0 outline-none cursor-pointer
        ${def.bgColor} ${def.color} bg-opacity-80`}
      aria-label={`Shift for ${date}`}
    >
      {SHIFT_DEFINITIONS.map(s => (
        <option key={s.id} value={s.id} className="bg-gray-900 text-white">
          {s.id === 'OFF' ? '— OFF' : `${s.label} (${s.hours})`}
        </option>
      ))}
    </select>
  )
}

// ── Member row editor ─────────────────────────────────────────────────────────

function MemberNameCell({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
  const renameMember = useSchedulerStore(s => s.renameMember)
  const removeMember = useSchedulerStore(s => s.removeMember)

  const commit = () => {
    if (val.trim()) renameMember(id, val.trim())
    else setVal(name)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[100px]">
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(name); setEditing(false) } }}
          className="bg-gray-700 text-white text-xs rounded px-1 py-0.5 w-full border border-blue-500 outline-none"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group min-w-[100px]">
      <span
        className="text-xs text-gray-200 font-medium truncate cursor-pointer hover:text-white"
        onClick={() => setEditing(true)}
        title="Click to rename"
      >
        {name}
      </span>
      <button
        onClick={() => { if (confirm(`Remove ${name}?`)) removeMember(id) }}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs transition-opacity ml-auto"
        title="Remove member"
      >✕</button>
    </div>
  )
}

// ── Shift count summary ───────────────────────────────────────────────────────

function ShiftSummary() {
  const { year, month, members, assignments } = useSchedulerStore()
  const days = getDaysInMonth(year, month)

  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
      {members.map(m => {
        const am1 = days.filter(d => assignments[assignmentKey(m.id, d)] === 'AM1').length
        const mid = days.filter(d => assignments[assignmentKey(m.id, d)] === 'MID').length
        const pm1 = days.filter(d => assignments[assignmentKey(m.id, d)] === 'PM1').length
        const leo = days.filter(d => assignments[assignmentKey(m.id, d)] === 'LEO').length
        const ooto = days.filter(d => assignments[assignmentKey(m.id, d)] === 'OOTO').length
        return (
          <div key={m.id} className="bg-gray-800 rounded px-2 py-1 flex gap-2 items-center">
            <span className="text-gray-300 font-medium">{m.name}</span>
            <span className="text-blue-400">AM1:{am1}</span>
            <span className="text-teal-400">MID:{mid}</span>
            <span className="text-purple-400">PM1:{pm1}</span>
            {leo > 0 && <span className="text-orange-400">LEO:{leo}</span>}
            {ooto > 0 && <span className="text-gray-500">OOTO:{ooto}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function OnCallScheduler({ onClose }: { onClose: () => void }) {
  const { year, month, members, assignments, setMonth, addMember, autoGenerate, clearMonth } = useSchedulerStore()
  const [newName, setNewName] = useState('')
  const days = getDaysInMonth(year, month)
  const addInputRef = useRef<HTMLInputElement>(null)

  const prevMonth = () => {
    if (month === 0) setMonth(year - 1, 11)
    else setMonth(year, month - 1)
  }
  const nextMonth = () => {
    if (month === 11) setMonth(year + 1, 0)
    else setMonth(year, month + 1)
  }

  const handleAddMember = () => {
    if (newName.trim()) {
      addMember(newName.trim())
      setNewName('')
      addInputRef.current?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">📅</span>
          <div>
            <p className="font-semibold text-white text-sm">On-Call Scheduler</p>
            <p className="text-[10px] text-gray-500">Monthly rotation · AM1 / PM1 / LEO / OOTO</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(year, month, members, assignments)}
            className="px-3 py-1.5 text-xs bg-green-800 hover:bg-green-700 text-green-200 rounded-lg border border-green-700 transition-colors"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={() => exportQuip(year, month, members, assignments)}
            className="px-3 py-1.5 text-xs bg-indigo-800 hover:bg-indigo-700 text-indigo-200 rounded-lg border border-indigo-700 transition-colors"
          >
            📋 Copy for Quip
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-900/60 border-b border-gray-800 shrink-0 flex-wrap">
        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-sm">‹</button>
          <span className="text-sm font-semibold text-white w-36 text-center">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-sm">›</button>
        </div>

        <div className="w-px h-5 bg-gray-700" />

        {/* Auto-generate */}
        <button
          onClick={() => { if (confirm('Auto-generate will overwrite unset days. Continue?')) autoGenerate() }}
          className="px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded-lg border border-blue-600 transition-colors font-medium"
        >
          ⚡ Auto-Generate
        </button>
        <button
          onClick={() => { if (confirm('Clear all assignments for this month?')) clearMonth() }}
          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg border border-gray-700 transition-colors"
        >
          🗑 Clear Month
        </button>

        <div className="w-px h-5 bg-gray-700" />

        {/* Add member */}
        <div className="flex items-center gap-1.5">
          <input
            ref={addInputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            placeholder="Add team member…"
            className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 w-40 outline-none focus:border-blue-500 placeholder-gray-600"
          />
          <button
            onClick={handleAddMember}
            className="px-2.5 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg border border-gray-600 transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 ml-auto">
          {SHIFT_DEFINITIONS.filter(s => s.id !== 'OFF').map(s => (
            <span key={s.id} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${s.bgColor} ${s.color}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-2 shrink-0 border-b border-gray-800/50">
        <ShiftSummary />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-5 py-3">
        {members.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Add team members above to get started.
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="sticky top-0 z-10 bg-gray-950">
                <th className="text-left text-gray-500 font-medium py-2 pr-3 w-28 sticky left-0 bg-gray-950">Member</th>
                {days.map(date => {
                  const d = new Date(date + 'T00:00:00')
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  return (
                    <th
                      key={date}
                      className={`text-center font-medium py-2 px-0.5 min-w-[52px] ${isWeekend ? 'text-gray-600' : 'text-gray-400'}`}
                    >
                      <div>{DAY_NAMES[d.getDay()]}</div>
                      <div className={`text-[10px] ${isWeekend ? 'text-gray-700' : 'text-gray-500'}`}>{d.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} className={i % 2 === 0 ? 'bg-gray-900/30' : ''}>
                  <td className="py-1.5 pr-3 sticky left-0 bg-gray-950 z-10">
                    <MemberNameCell id={m.id} name={m.name} />
                  </td>
                  {days.map(date => {
                    const d = new Date(date + 'T00:00:00')
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                    return (
                      <td key={date} className={`py-1 px-0.5 ${isWeekend ? 'opacity-60' : ''}`}>
                        <ShiftCell memberId={m.id} date={date} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
