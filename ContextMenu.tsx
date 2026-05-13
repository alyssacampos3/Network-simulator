import { useState } from 'react'

interface Command {
  cmd: string
  description: string
  example?: string
  output?: string
}

interface Section {
  title: string
  icon: string
  color: string
  commands: Command[]
}

const SECTIONS: Section[] = [
  {
    title: 'Simulator CLI',
    icon: '💻',
    color: 'text-green-400',
    commands: [
      { cmd: 'ping <ip>', description: 'Test if a device is reachable', example: 'ping 192.168.1.2', output: 'Reply from 192.168.1.2: bytes=32 time<1ms TTL=128' },
      { cmd: 'traceroute <ip>', description: 'Show the hop-by-hop path to a destination', example: 'traceroute 192.168.1.2', output: '1  <1ms  192.168.1.1 (router-a1b2)' },
      { cmd: 'ipconfig', description: 'Show IP configuration for all interfaces (Windows style)', example: 'ipconfig' },
      { cmd: 'show ip interface brief', description: 'Summary table of interfaces and their status (Cisco style)', example: 'show ip interface brief' },
      { cmd: 'show arp', description: 'Show ARP table — devices known on the same subnet', example: 'show arp' },
      { cmd: 'help', description: 'List all available commands', example: 'help' },
    ],
  },
  {
    title: 'IP Addressing',
    icon: '🌐',
    color: 'text-blue-400',
    commands: [
      { cmd: '192.168.x.x', description: 'Class C private range — use for home labs and small networks', example: '192.168.1.0/24 → 254 hosts' },
      { cmd: '10.x.x.x', description: 'Class A private range — use for large enterprise networks', example: '10.0.0.0/8 → 16M hosts' },
      { cmd: '172.16–31.x.x', description: 'Class B private range — medium networks', example: '172.16.0.0/16 → 65K hosts' },
      { cmd: '255.255.255.0 (/24)', description: 'Most common subnet mask — 254 usable hosts', example: 'Network: 192.168.1.0, Hosts: .1–.254, Broadcast: .255' },
      { cmd: '255.255.255.252 (/30)', description: 'Point-to-point link mask — only 2 hosts', example: 'Use for Router↔Router serial links' },
      { cmd: '255.255.0.0 (/16)', description: 'Large subnet — 65,534 usable hosts', example: 'Network: 10.1.0.0, Hosts: .0.1–.255.254' },
    ],
  },
  {
    title: 'Subnetting Quick Ref',
    icon: '🔢',
    color: 'text-purple-400',
    commands: [
      { cmd: '/24 = 255.255.255.0', description: '256 addresses, 254 usable hosts' },
      { cmd: '/25 = 255.255.255.128', description: '128 addresses, 126 usable hosts' },
      { cmd: '/26 = 255.255.255.192', description: '64 addresses, 62 usable hosts' },
      { cmd: '/27 = 255.255.255.224', description: '32 addresses, 30 usable hosts' },
      { cmd: '/28 = 255.255.255.240', description: '16 addresses, 14 usable hosts' },
      { cmd: '/30 = 255.255.255.252', description: '4 addresses, 2 usable hosts — router links' },
      { cmd: 'Usable hosts = 2ⁿ - 2', description: 'n = number of host bits (0s in mask)' },
    ],
  },
  {
    title: 'Cisco IOS Commands',
    icon: '🔧',
    color: 'text-orange-400',
    commands: [
      { cmd: 'enable', description: 'Enter privileged EXEC mode', example: 'Router> enable → Router#' },
      { cmd: 'configure terminal', description: 'Enter global configuration mode', example: 'Router# configure terminal' },
      { cmd: 'interface fa0/0', description: 'Enter interface configuration mode', example: 'Router(config)# interface fa0/0' },
      { cmd: 'ip address <ip> <mask>', description: 'Assign IP address to an interface', example: 'ip address 192.168.1.1 255.255.255.0' },
      { cmd: 'no shutdown', description: 'Enable (bring up) an interface', example: 'Router(config-if)# no shutdown' },
      { cmd: 'show running-config', description: 'Display current device configuration', example: 'Router# show running-config' },
      { cmd: 'show ip route', description: 'Display the routing table', example: 'Router# show ip route' },
      { cmd: 'show interfaces', description: 'Detailed interface status and stats', example: 'Router# show interfaces' },
      { cmd: 'copy running-config startup-config', description: 'Save config so it survives reboot', example: 'Router# copy run start' },
    ],
  },
  {
    title: 'Troubleshooting',
    icon: '🔍',
    color: 'text-red-400',
    commands: [
      { cmd: 'Ping fails → check IPs', description: 'Both devices must be on the same subnet or have a gateway configured' },
      { cmd: 'Ping fails → check mask', description: 'Subnet masks must match on both devices' },
      { cmd: 'Ping fails → check gateway', description: 'PCs need a default gateway set to the router\'s IP' },
      { cmd: 'No ARP entries', description: 'Devices are not on the same subnet — check IP and mask' },
      { cmd: 'Traceroute stops at hop 1', description: 'Router has no route to the destination network' },
      { cmd: '"Destination host unreachable"', description: 'No device has that IP configured in the topology' },
      { cmd: '"No route to host"', description: 'Path exists but subnets don\'t line up — check masks' },
    ],
  },
  {
    title: 'Cable Types',
    icon: '🔌',
    color: 'text-sky-400',
    commands: [
      { cmd: 'Ethernet (straight-through)', description: 'PC → Switch, Router → Switch. Most common.', example: 'Green solid line in simulator' },
      { cmd: 'Serial', description: 'Router → Router over WAN. Point-to-point links.', example: 'Orange dashed line in simulator' },
      { cmd: 'Crossover', description: 'PC → PC direct, Switch → Switch.', example: 'Blue solid line in simulator' },
    ],
  },
]

export function CommandCheatSheet({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState(0)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? SECTIONS.map(s => ({
        ...s,
        commands: s.commands.filter(c =>
          c.cmd.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.commands.length > 0)
    : [SECTIONS[activeSection]]

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-gray-900 border-l border-gray-700 flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h2 className="text-white font-semibold">Command Cheat Sheet</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-700 shrink-0">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search commands..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Section tabs */}
      {!search && (
        <div className="flex overflow-x-auto border-b border-gray-700 shrink-0">
          {SECTIONS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setActiveSection(i)}
              className={`px-3 py-2 text-xs whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeSection === i
                  ? 'text-white border-b-2 border-blue-500 bg-gray-800'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Commands */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filtered.map(section => (
          <div key={section.title}>
            {search && (
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 ${section.color}`}>
                {section.icon} {section.title}
              </h3>
            )}
            <div className="space-y-2">
              {section.commands.map((cmd, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-500 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <code className={`text-sm font-mono font-bold ${section.color}`}>{cmd.cmd}</code>
                  </div>
                  <p className="text-gray-300 text-xs mt-1">{cmd.description}</p>
                  {cmd.example && (
                    <div className="mt-2 bg-gray-900 rounded px-2 py-1">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wide">Example: </span>
                      <code className="text-gray-300 text-[11px] font-mono">{cmd.example}</code>
                    </div>
                  )}
                  {cmd.output && (
                    <div className="mt-1 bg-black rounded px-2 py-1">
                      <span className="text-gray-600 text-[10px] uppercase tracking-wide">Output: </span>
                      <code className="text-green-400 text-[11px] font-mono">{cmd.output}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">No commands match "{search}"</p>
        )}
      </div>
    </div>
  )
}
