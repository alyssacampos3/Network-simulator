import { useState, useRef } from 'react'
import { useNetworkStore } from '../store/networkStore'
import type { NoteTopic } from '../types'

interface LabNotesPanelProps {
  onClose: () => void
}

const TABS: { id: NoteTopic; label: string }[] = [
  { id: 'ip-addressing', label: 'IP Addressing' },
  { id: 'subnetting', label: 'Subnetting' },
  { id: 'vlans', label: 'VLANs' },
  { id: 'routing', label: 'Routing' },
  { id: 'arp', label: 'ARP' },
  { id: 'dhcp', label: 'DHCP' },
]

const EXPLANATIONS: Record<NoteTopic, string> = {
  'ip-addressing': `An IP address is a 32-bit number (IPv4) written as four octets separated by dots, e.g. 192.168.1.10. Every device on a network needs a unique IP address to send and receive data. Addresses are split into a network portion and a host portion, determined by the subnet mask. Private ranges like 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16 are reserved for internal use and are not routed on the public internet. Understanding addressing is the foundation of everything else in networking.`,

  subnetting: `Subnetting divides a large IP network into smaller, more manageable sub-networks. The subnet mask (e.g. 255.255.255.0 or /24 in CIDR notation) tells you how many bits belong to the network vs. the hosts. A /24 gives you 254 usable host addresses; a /30 gives only 2, which is perfect for point-to-point links. To find the network address, AND the IP with the mask; the broadcast address has all host bits set to 1. Subnetting reduces broadcast traffic and improves security by isolating segments.`,

  vlans: `A VLAN (Virtual LAN) logically segments a physical switch into multiple isolated broadcast domains. Devices in different VLANs cannot communicate directly — they need a router or Layer 3 switch. VLANs are identified by a number (1–4094); VLAN 1 is the default. Trunk ports carry traffic for multiple VLANs using 802.1Q tagging, while access ports carry traffic for a single VLAN. VLANs are essential for separating departments, guest networks, and management traffic on the same physical infrastructure.`,

  routing: `Routing is the process of forwarding packets between different networks. A router examines the destination IP, looks up its routing table, and forwards the packet out the best interface. Static routes are manually configured; dynamic routing protocols like OSPF or EIGRP learn routes automatically. The routing table entry with the longest matching prefix wins (most specific route). The default route (0.0.0.0/0) acts as a catch-all for traffic with no more specific match, typically pointing toward the internet gateway.`,

  arp: `ARP (Address Resolution Protocol) maps a known IP address to an unknown MAC address on a local network segment. When a device wants to send a frame, it broadcasts an ARP request asking "who has IP x.x.x.x?" The owner replies with its MAC address, and the sender caches the result in its ARP table. ARP only works within the same subnet; traffic destined for another subnet is sent to the default gateway's MAC instead. Stale ARP entries can cause connectivity issues, so entries typically expire after a few minutes.`,

  dhcp: `DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses, subnet masks, default gateways, and DNS servers to clients. A client broadcasts a DISCOVER message; the server responds with an OFFER; the client sends a REQUEST; the server confirms with an ACK — this is the DORA process. Leases are time-limited, so clients must renew before expiry. DHCP relay agents (ip helper-address on a router) forward broadcasts across subnets so a single server can serve multiple VLANs. Without DHCP, every device would need manual IP configuration.`,
}

export function LabNotesPanel({ onClose }: LabNotesPanelProps) {
  const [activeTab, setActiveTab] = useState<NoteTopic>('ip-addressing')
  const userNotes = useNetworkStore(s => s.userNotes)
  const setUserNote = useNetworkStore(s => s.setUserNote)
  const clearUserNote = useNetworkStore(s => s.clearUserNote)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleNoteChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setUserNote(activeTab, value)
    }, 400)
  }

  function handleClear() {
    clearUserNote(activeTab)
    // Force textarea to reflect cleared state immediately
    const ta = document.getElementById('notes-textarea') as HTMLTextAreaElement | null
    if (ta) ta.value = ''
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-gray-900 border-l border-gray-700 flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-white font-semibold text-lg">Lab Notes</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
          aria-label="Close notes panel"
        >
          ✕
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-700 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Built-in explanation */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-2">
            Concept Overview
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {EXPLANATIONS[activeTab]}
          </p>
        </div>

        {/* User notes */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-300 text-sm font-semibold">Your Notes</h3>
            <button
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear Notes
            </button>
          </div>
          <textarea
            id="notes-textarea"
            key={activeTab}
            defaultValue={userNotes[activeTab] ?? ''}
            onChange={e => handleNoteChange(e.target.value)}
            placeholder="Write your notes here..."
            className="flex-1 min-h-[200px] bg-gray-800 text-gray-200 text-sm rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-600"
          />
        </div>
      </div>
    </div>
  )
}
