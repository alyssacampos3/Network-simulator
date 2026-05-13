import { useState, useMemo } from 'react'
import { useTrafficStore } from '../store/trafficStore'
import type { Protocol, TrafficStatus, TrafficEvent } from '../store/trafficStore'

const PROTOCOL_COLORS: Record<Protocol, string> = {
  ICMP: 'bg-blue-500', ARP: 'bg-yellow-500', TCP: 'bg-green-500',
  UDP: 'bg-purple-500', OSPF: 'bg-orange-500', OTHER: 'bg-gray-500',
}
const PROTOCOL_TEXT: Record<Protocol, string> = {
  ICMP: 'text-blue-400', ARP: 'text-yellow-400', TCP: 'text-green-400',
  UDP: 'text-purple-400', OSPF: 'text-orange-400', OTHER: 'text-gray-400',
}
const STATUS_STYLES: Record<TrafficStatus, string> = {
  success: 'text-green-400 bg-green-400/10 border-green-500/30',
  failed: 'text-red-400 bg-red-400/10 border-red-500/30',
  timeout: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-6 text-right">{value}</span>
    </div>
  )
}

function PacketInspector({ event }: { event: TrafficEvent }) {
  const [layer, setLayer] = useState<'flow' | 'ethernet' | 'ip' | 'transport'>('flow')

  return (
    <div className="border-t border-gray-800 bg-gray-950">
      {/* Inspector header */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-800 bg-gray-900">
        <span className="text-[10px] text-gray-400 font-semibold mr-2">PACKET INSPECTOR</span>
        {(['flow', 'ethernet', 'ip', 'transport'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLayer(l)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
              layer === l ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {l === 'flow' ? 'Hop Flow' : l === 'ethernet' ? 'L2 Ethernet' : l === 'ip' ? 'L3 IP' : 'L4 ICMP/ARP'}
          </button>
        ))}
      </div>

      <div className="p-3 font-mono text-[11px] max-h-72 overflow-y-auto">

        {/* ── Hop Flow ── */}
        {layer === 'flow' && (
          <div className="space-y-2">
            {event.hopDecisions.length === 0 && (
              <p className="text-gray-600">No hop data available for this event.</p>
            )}
            {event.hopDecisions.map((hop, i) => (
              <div key={i} className={`flex gap-3 p-2 rounded-lg border ${
                hop.deviceType === 'drop'
                  ? 'border-red-800/40 bg-red-900/10'
                  : hop.success
                  ? 'border-gray-800 bg-gray-900'
                  : 'border-yellow-800/40 bg-yellow-900/10'
              }`}>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    hop.deviceType === 'drop' ? 'bg-red-500/20 text-red-400' :
                    hop.success ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {hop.deviceType === 'drop' ? '✗' : hop.hopNumber}
                  </div>
                  {i < event.hopDecisions.length - 1 && (
                    <div className={`w-px flex-1 min-h-[12px] ${hop.success ? 'bg-gray-700' : 'bg-red-800'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-gray-200 font-semibold">{hop.hostname}</span>
                    {hop.ingressIp && <span className="text-gray-500">{hop.ingressIp}</span>}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      hop.deviceType === 'source' ? 'bg-blue-500/20 text-blue-400' :
                      hop.deviceType === 'destination' ? 'bg-green-500/20 text-green-400' :
                      hop.deviceType === 'drop' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{hop.deviceType}</span>
                  </div>
                  <p className="text-gray-300">{hop.action}</p>
                  <p className="text-gray-600 mt-0.5 leading-relaxed">{hop.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Ethernet Frame ── */}
        {layer === 'ethernet' && event.ethernet && (
          <div className="space-y-1">
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Ethernet II Frame</p>
              <table className="w-full">
                <tbody>
                  {[
                    ['Destination MAC', event.ethernet.dstMac],
                    ['Source MAC', event.ethernet.srcMac],
                    ['EtherType', event.ethernet.etherType],
                    ['Frame Size', `${event.bytes + 14} bytes`],
                    ['Preamble', '10101010 10101010 10101010 10101010...'],
                    ['FCS', `0x${Math.floor(Math.random()*0xFFFFFFFF).toString(16).toUpperCase().padStart(8,'0')}`],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-800/50">
                      <td className="py-1 pr-4 text-gray-500 w-40">{k}</td>
                      <td className="py-1 text-gray-200">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800 text-gray-600 text-[10px]">
              <span className="text-gray-500">Frame layout: </span>
              <span className="text-blue-400">Preamble(7)</span> +{' '}
              <span className="text-green-400">SFD(1)</span> +{' '}
              <span className="text-yellow-400">Dst MAC(6)</span> +{' '}
              <span className="text-orange-400">Src MAC(6)</span> +{' '}
              <span className="text-purple-400">EtherType(2)</span> +{' '}
              <span className="text-gray-300">Payload({event.bytes})</span> +{' '}
              <span className="text-red-400">FCS(4)</span>
            </div>
          </div>
        )}

        {/* ── IP Header ── */}
        {layer === 'ip' && event.ipHeader && (
          <div className="space-y-1">
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">IPv{event.ipHeader.version} Header (20 bytes)</p>
              <table className="w-full">
                <tbody>
                  {[
                    ['Version', `${event.ipHeader.version}`],
                    ['IHL', '5 (20 bytes)'],
                    ['DSCP/ECN', '0x00'],
                    ['Total Length', `${event.ipHeader.totalLength} bytes`],
                    ['Identification', `0x${Math.floor(Math.random()*0xFFFF).toString(16).toUpperCase().padStart(4,'0')}`],
                    ['Flags', event.ipHeader.flags],
                    ['Fragment Offset', '0'],
                    ['TTL', `${event.ipHeader.ttl}`],
                    ['Protocol', event.ipHeader.protocol],
                    ['Header Checksum', event.ipHeader.checksum],
                    ['Source IP', event.ipHeader.srcIp],
                    ['Destination IP', event.ipHeader.dstIp],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-800/50">
                      <td className="py-1 pr-4 text-gray-500 w-40">{k}</td>
                      <td className="py-1 text-gray-200">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-2 text-[10px] text-blue-300">
              TTL={event.ipHeader.ttl} — Each router decrements TTL by 1. When TTL reaches 0, packet is dropped and ICMP Time Exceeded is sent back.
            </div>
          </div>
        )}

        {/* ── Transport / ICMP / ARP ── */}
        {layer === 'transport' && (
          <div className="space-y-2">
            {event.icmp && (
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">ICMP Header (8 bytes)</p>
                <table className="w-full">
                  <tbody>
                    {[
                      ['Type', `${event.icmp.type} (${event.icmp.typeName})`],
                      ['Code', `${event.icmp.code}`],
                      ['Checksum', event.icmp.checksum],
                      ['Identifier', `0x${event.icmp.identifier.toString(16).toUpperCase().padStart(4,'0')}`],
                      ['Sequence Number', `${event.icmp.sequenceNumber}`],
                      ['Data', `${event.bytes - 8} bytes of padding`],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-gray-800/50">
                        <td className="py-1 pr-4 text-gray-500 w-40">{k}</td>
                        <td className="py-1 text-gray-200">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 bg-blue-900/20 border border-blue-800/30 rounded p-2 text-[10px] text-blue-300">
                  ICMP Type 8 = Echo Request (ping sent). Type 0 = Echo Reply (ping response). Type 3 = Destination Unreachable.
                </div>
              </div>
            )}
            {event.arp && (
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">ARP Packet (28 bytes)</p>
                <table className="w-full">
                  <tbody>
                    {[
                      ['Hardware Type', '1 (Ethernet)'],
                      ['Protocol Type', '0x0800 (IPv4)'],
                      ['Hardware Size', '6'],
                      ['Protocol Size', '4'],
                      ['Operation', `${event.arp.operation === 'Request' ? '1' : '2'} (${event.arp.operation})`],
                      ['Sender MAC', event.arp.senderMac],
                      ['Sender IP', event.arp.senderIp],
                      ['Target MAC', event.arp.targetMac],
                      ['Target IP', event.arp.targetIp],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-gray-800/50">
                        <td className="py-1 pr-4 text-gray-500 w-40">{k}</td>
                        <td className="py-1 text-gray-200">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!event.icmp && !event.arp && (
              <p className="text-gray-600">No transport layer data for this event.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function TrafficAnalyzer({ onClose }: { onClose: () => void }) {
  const events = useTrafficStore(s => s.events)
  const clearEvents = useTrafficStore(s => s.clearEvents)
  const selectedEventId = useTrafficStore(s => s.selectedEventId)
  const selectEvent = useTrafficStore(s => s.selectEvent)

  const [filter, setFilter] = useState<Protocol | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<TrafficStatus | 'ALL'>('ALL')

  const filtered = useMemo(() =>
    events.filter(e =>
      (filter === 'ALL' || e.protocol === filter) &&
      (statusFilter === 'ALL' || e.status === statusFilter)
    ), [events, filter, statusFilter])

  const protocolCounts = useMemo(() => {
    const counts: Partial<Record<Protocol, number>> = {}
    for (const e of events) counts[e.protocol] = (counts[e.protocol] ?? 0) + 1
    return counts
  }, [events])

  const deviceStats = useMemo(() => {
    const stats: Record<string, { sent: number; received: number; failed: number }> = {}
    for (const e of events) {
      if (!stats[e.source]) stats[e.source] = { sent: 0, received: 0, failed: 0 }
      if (!stats[e.destination]) stats[e.destination] = { sent: 0, received: 0, failed: 0 }
      stats[e.source].sent++
      if (e.status === 'success') stats[e.destination].received++
      else stats[e.source].failed++
    }
    return Object.entries(stats).sort((a, b) => (b[1].sent + b[1].received) - (a[1].sent + a[1].received))
  }, [events])

  const successCount = events.filter(e => e.status === 'success').length
  const failCount = events.filter(e => e.status !== 'success').length
  const maxProto = Math.max(...Object.values(protocolCounts).map(v => v ?? 0), 1)
  const maxDevice = Math.max(...deviceStats.map(([, s]) => s.sent + s.received), 1)
  const selectedEvent = events.find(e => e.id === selectedEventId) ?? null

  return (
    <div className="fixed inset-y-0 right-0 w-[680px] bg-gray-950 border-l border-gray-800 flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h2 className="text-white font-semibold text-sm">Packet Analyzer</h2>
          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{events.length} captured</span>
          {selectedEvent && (
            <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              Inspecting: {selectedEvent.command}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedEvent && (
            <button onClick={() => selectEvent(null)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Close Inspector
            </button>
          )}
          <button onClick={clearEvents} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Clear</button>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none ml-1">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-px bg-gray-800 border-b border-gray-800 shrink-0">
          {[
            { label: 'Captured', value: events.length, color: 'text-white' },
            { label: 'Success', value: successCount, color: 'text-green-400' },
            { label: 'Failed', value: failCount, color: 'text-red-400' },
            { label: 'Success Rate', value: events.length > 0 ? `${Math.round((successCount / events.length) * 100)}%` : '—', color: 'text-blue-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-950 px-3 py-2.5 text-center">
              <p className={`text-base font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-px bg-gray-800 border-b border-gray-800 shrink-0">
          <div className="bg-gray-950 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Protocol</p>
            {Object.keys(PROTOCOL_COLORS).map(proto => {
              const count = protocolCounts[proto as Protocol] ?? 0
              if (count === 0) return null
              return (
                <div key={proto} className="mb-1.5">
                  <span className={`text-[11px] font-mono font-semibold ${PROTOCOL_TEXT[proto as Protocol]}`}>{proto}</span>
                  <MiniBar value={count} max={maxProto} color={PROTOCOL_COLORS[proto as Protocol]} />
                </div>
              )
            })}
            {events.length === 0 && <p className="text-[11px] text-gray-600">Run ping or traceroute</p>}
          </div>
          <div className="bg-gray-950 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Device Activity</p>
            {deviceStats.slice(0, 4).map(([device, stats]) => (
              <div key={device} className="mb-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-gray-300 font-semibold truncate max-w-[90px]">{device}</span>
                  <span className="text-[10px] text-gray-600">{stats.sent}↑ {stats.received}↓</span>
                </div>
                <MiniBar value={stats.sent + stats.received} max={maxDevice} color="bg-blue-500" />
              </div>
            ))}
            {deviceStats.length === 0 && <p className="text-[11px] text-gray-600">No activity yet</p>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-950 flex-wrap shrink-0">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Proto:</span>
          {(['ALL', 'ICMP', 'ARP', 'TCP', 'UDP'] as const).map(p => (
            <button key={p} onClick={() => setFilter(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${filter === p ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {p}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-800 mx-1" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Status:</span>
          {(['ALL', 'success', 'failed', 'timeout'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-600">Click a row to inspect</span>
        </div>

        {/* Packet inspector (shown when event selected) */}
        {selectedEvent && <PacketInspector event={selectedEvent} />}

        {/* Traffic log */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-[11px] font-mono">
            <thead className="sticky top-0 bg-gray-950">
              <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wide text-[9px]">
                <th className="text-left px-3 py-2 w-16">Time</th>
                <th className="text-left px-2 py-2 w-12">Proto</th>
                <th className="text-left px-2 py-2">Source</th>
                <th className="text-left px-2 py-2">Destination</th>
                <th className="text-left px-2 py-2 w-10">Hops</th>
                <th className="text-left px-2 py-2 w-12">Bytes</th>
                <th className="text-left px-2 py-2 w-14">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-600">
                  {events.length === 0 ? 'No packets captured — run ping or traceroute in the terminal' : 'No events match filter'}
                </td></tr>
              )}
              {filtered.map(event => (
                <tr
                  key={event.id}
                  onClick={() => selectEvent(selectedEventId === event.id ? null : event.id)}
                  className={`border-b border-gray-900 cursor-pointer transition-colors ${
                    selectedEventId === event.id
                      ? 'bg-blue-900/20 border-blue-800/40'
                      : 'hover:bg-gray-900/50'
                  }`}
                >
                  <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                    {event.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`font-bold ${PROTOCOL_TEXT[event.protocol]}`}>{event.protocol}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="text-gray-200">{event.source}</span>
                    {event.sourceIp && <span className="text-gray-600 ml-1">({event.sourceIp})</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="text-gray-200">{event.destination}</span>
                    {event.destIp && event.destIp !== event.destination && (
                      <span className="text-gray-600 ml-1">({event.destIp})</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-gray-500 text-center">{event.hopCount}</td>
                  <td className="px-2 py-1.5 text-gray-500">{event.bytes}B</td>
                  <td className="px-2 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase ${STATUS_STYLES[event.status]}`}>
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
