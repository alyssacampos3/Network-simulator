import { useState } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { encodeTopologyToURL } from '../persistence/urlEncoder'
import { LAB_SCENARIOS } from '../data/labScenarios'
import { applyMask } from '../engine/subnet'

const ALL_SKILLS = [
  'IP Addressing', 'Subnetting', 'VLANs', 'Static Routing', 'Dynamic Routing',
  'OSPF', 'EIGRP', 'RIP', 'NAT', 'DHCP', 'DNS', 'ACL', 'Firewall',
  'WAN', 'Serial Links', 'Ethernet', 'ARP', 'Ping', 'Traceroute',
  'Default Gateway', 'Inter-VLAN Routing', 'Spanning Tree', 'Port Security',
]

const DIFFICULTY_COLORS = {
  Beginner: 'text-green-400 bg-green-400/10 border-green-500/30',
  Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
  Advanced: 'text-red-400 bg-red-400/10 border-red-500/30',
}

type Tab = 'scenarios' | 'skills' | 'readme' | 'export'

export function PortfolioPanel({ onClose }: { onClose: () => void }) {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const labDescription = useNetworkStore(s => s.labDescription)
  const setLabDescription = useNetworkStore(s => s.setLabDescription)
  const loadTopology = useNetworkStore(s => s.loadTopology)
  const getSnapshot = useNetworkStore(s => s.getSnapshot)

  const [tab, setTab] = useState<Tab>('scenarios')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [authorName, setAuthorName] = useState('')
  const [copied, setCopied] = useState(false)
  const [exportMsg, setExportMsg] = useState('')

  // Derive topology stats
  const configuredNodes = nodes.filter(n => n.data.interfaces.some(i => i.ipAddress))
  const subnets = Array.from(new Set(
    nodes.flatMap(n => n.data.interfaces
      .filter(i => i.ipAddress && i.subnetMask)
      .map(i => `${applyMask(i.ipAddress, i.subnetMask)}/${i.subnetMask}`)
    )
  ))

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function loadScenario(scenarioId: string) {
    const scenario = LAB_SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) return
    loadTopology(scenario.topology)
    setSelectedSkills(scenario.skills)
    setTab('skills')
  }

  // Generate README
  const readme = `# ${labDescription || 'Network Lab'} — CCNA Portfolio Project

## Overview
${labDescription || 'A browser-based network topology simulation built to demonstrate CCNA networking concepts.'}

## Skills Demonstrated
${selectedSkills.length > 0
  ? selectedSkills.map(s => `- ${s}`).join('\n')
  : '- IP Addressing\n- Subnetting\n- Routing'}

## Topology
- **Devices:** ${nodes.length} (${configuredNodes.length} configured)
- **Links:** ${edges.length}
- **Subnets:** ${subnets.length > 0 ? subnets.join(', ') : 'None configured'}

## Device Summary
${nodes.map(n => {
  const ip = n.data.interfaces[0]?.ipAddress
  return `| ${n.data.hostname} | ${n.type.charAt(0).toUpperCase() + n.type.slice(1)} | ${ip || 'Not configured'} |`
}).join('\n') || '| No devices |'}

## How to View
This lab was built using the [Network Lab Simulator](${window.location.origin}) — a browser-based CCNA study tool.

[▶ Open Interactive Lab](${encodeTopologyToURL(getSnapshot())})

## Concepts Covered
${selectedSkills.length > 0
  ? selectedSkills.map(s => `### ${s}\nDemonstrated in this lab topology.`).join('\n\n')
  : '### IP Addressing\nAll devices are configured with IPv4 addresses on appropriate subnets.'}

---
*Built with Network Lab Simulator | CCNA Study Tool*
${authorName ? `*Author: ${authorName}*` : ''}
`

  async function copyReadme() {
    await navigator.clipboard.writeText(readme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function exportPNG() {
    // Use html2canvas-style approach via SVG snapshot of the React Flow viewport
    const rfViewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!rfViewport) { setExportMsg('Could not find canvas. Make sure the topology is visible.'); return }

    try {
      const svgNS = 'http://www.w3.org/2000/svg'
      void svgNS // suppress unused warning
      const bounds = rfViewport.getBoundingClientRect()
      const canvas = document.createElement('canvas')
      canvas.width = bounds.width || 800
      canvas.height = bounds.height || 600
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Dark background
      ctx.fillStyle = '#0f1117'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw nodes as colored rectangles with labels
      nodes.forEach(node => {
        const el = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement
        if (!el) return
        const rect = el.getBoundingClientRect()
        const canvasBounds = (document.querySelector('.react-flow') as HTMLElement)?.getBoundingClientRect()
        if (!canvasBounds) return
        const x = rect.left - canvasBounds.left
        const y = rect.top - canvasBounds.top

        const colors: Record<string, string> = { router: '#1e3a5f', switch: '#14532d', pc: '#2e1065', cloud: '#0c4a6e' }
        const borders: Record<string, string> = { router: '#3b82f6', switch: '#22c55e', pc: '#8b5cf6', cloud: '#38bdf8' }

        ctx.fillStyle = colors[node.type] ?? '#1f2937'
        ctx.strokeStyle = borders[node.type] ?? '#6b7280'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(x, y, rect.width, rect.height, 8)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#e2e8f0'
        ctx.font = '11px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.data.hostname, x + rect.width / 2, y + rect.height / 2 + 4)

        const ip = node.data.interfaces[0]?.ipAddress
        if (ip) {
          ctx.fillStyle = '#94a3b8'
          ctx.font = '9px JetBrains Mono, monospace'
          ctx.fillText(ip, x + rect.width / 2, y + rect.height / 2 + 16)
        }
      })

      // Add title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(labDescription || 'Network Lab Topology', 16, 24)

      ctx.fillStyle = '#64748b'
      ctx.font = '10px Inter, sans-serif'
      ctx.fillText(`${nodes.length} devices · ${edges.length} links · ${subnets.length} subnets`, 16, 40)

      const link = document.createElement('a')
      link.download = `${(labDescription || 'network-lab').replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setExportMsg('PNG downloaded!')
      setTimeout(() => setExportMsg(''), 3000)
    } catch {
      setExportMsg('Export failed — try the share link instead.')
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-gray-950 border-l border-gray-800 flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h2 className="text-white font-semibold text-sm">Portfolio Tools</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 shrink-0">
        {([
          { id: 'scenarios', label: '📁 Lab Scenarios' },
          { id: 'skills', label: '🏷 Skills' },
          { id: 'readme', label: '📄 README' },
          { id: 'export', label: '⬇ Export' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-900'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Lab Scenarios ── */}
        {tab === 'scenarios' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Load a pre-built lab to get started quickly. Your current topology will be replaced.</p>
            {LAB_SCENARIOS.map(scenario => (
              <div key={scenario.id} className="border border-gray-800 rounded-xl p-4 bg-gray-900 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{scenario.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{scenario.description}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${DIFFICULTY_COLORS[scenario.difficulty]}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {scenario.skills.map(skill => (
                    <span key={skill} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">{skill}</span>
                  ))}
                </div>
                <button
                  onClick={() => loadScenario(scenario.id)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-1.5 text-xs font-medium transition-colors"
                >
                  Load This Lab
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Skills Tags ── */}
        {tab === 'skills' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Lab Title / Description</label>
              <input
                type="text"
                value={labDescription}
                onChange={e => setLabDescription(e.target.value)}
                placeholder="e.g. Small Office Network with Inter-VLAN Routing"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Skills Demonstrated ({selectedSkills.length} selected)</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SKILLS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            {selectedSkills.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Selected Skills</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSkills.map(s => (
                    <span key={s} className="text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── README Generator ── */}
        {tab === 'readme' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Your Name (optional)</label>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="e.g. Alyssa"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Generated README.md</p>
              <button
                onClick={copyReadme}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-[11px] text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {readme}
            </pre>
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-300 space-y-1">
              <p className="font-semibold">How to use this README:</p>
              <p>1. Copy the README above</p>
              <p>2. Create a new GitHub repo called "network-lab" or "ccna-labs"</p>
              <p>3. Paste as README.md</p>
              <p>4. The share link lets anyone open your interactive lab</p>
            </div>
          </div>
        )}

        {/* ── Export ── */}
        {tab === 'export' && (
          <div className="space-y-4">
            <div className="border border-gray-800 rounded-xl p-4 bg-gray-900 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔗</span>
                <div>
                  <p className="text-sm font-semibold text-white">Share Link</p>
                  <p className="text-xs text-gray-400">Anyone with this link can view your interactive lab</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(encodeTopologyToURL(getSnapshot()))
                  setCopied(true); setTimeout(() => setCopied(false), 2000)
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                {copied ? '✓ Link Copied!' : 'Copy Share Link'}
              </button>
            </div>

            <div className="border border-gray-800 rounded-xl p-4 bg-gray-900 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖼</span>
                <div>
                  <p className="text-sm font-semibold text-white">Export as PNG</p>
                  <p className="text-xs text-gray-400">Download a diagram image for your resume or portfolio</p>
                </div>
              </div>
              <button
                onClick={exportPNG}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Download PNG
              </button>
              {exportMsg && <p className="text-xs text-green-400">{exportMsg}</p>}
            </div>

            <div className="border border-gray-800 rounded-xl p-4 bg-gray-900 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-sm font-semibold text-white">Lab Summary</p>
                  <p className="text-xs text-gray-400">Current topology stats</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { label: 'Devices', value: nodes.length },
                  { label: 'Links', value: edges.length },
                  { label: 'Configured', value: configuredNodes.length },
                  { label: 'Subnets', value: subnets.length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-800 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</p>
                    <p className="text-white font-bold text-lg">{value}</p>
                  </div>
                ))}
              </div>
              {subnets.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Subnets in use</p>
                  {subnets.map(s => (
                    <p key={s} className="text-xs font-mono text-gray-300">{s}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
