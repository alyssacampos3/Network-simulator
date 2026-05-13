import type { EducationalEntry, EducationalTopic } from '../types'

/**
 * Educational Mode Content
 * Provides beginner-friendly explanations of networking concepts
 */

export const educationalContent: Record<EducationalTopic, EducationalEntry> = {
  vlans: {
    topic: 'vlans',
    title: 'VLANs (Virtual Local Area Networks)',
    summary: 'VLANs logically segment a physical network into separate broadcast domains.',
    details: `A VLAN allows you to group devices together as if they were on the same physical switch, even if they're spread across multiple switches. 

Key concepts:
• Each VLAN is its own broadcast domain — broadcasts in VLAN 10 won't reach VLAN 20
• Devices in different VLANs need a router (inter-VLAN routing) to communicate
• Trunk ports carry traffic for multiple VLANs between switches using 802.1Q tagging
• Access ports belong to a single VLAN and connect to end devices

Common use cases:
• Separating departments (HR, Engineering, Finance)
• Isolating voice traffic from data traffic
• Security segmentation (guest WiFi vs corporate)`,
    relatedCommands: ['show vlan', 'show interfaces trunk', 'show spanning-tree'],
  },

  routing: {
    topic: 'routing',
    title: 'IP Routing',
    summary: 'Routing is the process of forwarding packets between different networks (subnets).',
    details: `Routers examine the destination IP of each packet and consult their routing table to determine the best next hop.

Key concepts:
• Connected routes — networks directly attached to router interfaces
• Static routes — manually configured paths to remote networks
• Dynamic routing — protocols (OSPF, EIGRP, BGP) that automatically learn routes
• Default route (0.0.0.0/0) — the "gateway of last resort" for unknown destinations
• Longest prefix match — the most specific route wins

How a packet is forwarded:
1. Packet arrives on an interface
2. Router checks destination IP against routing table
3. Best match determines outgoing interface and next hop
4. Router decrements TTL and forwards the packet`,
    relatedCommands: ['show ip route', 'show ip interface brief', 'traceroute'],
  },

  ospf: {
    topic: 'ospf',
    title: 'OSPF (Open Shortest Path First)',
    summary: 'OSPF is a link-state routing protocol that builds a complete map of the network topology.',
    details: `OSPF routers exchange Link-State Advertisements (LSAs) to build a synchronized database of the network. Each router then runs Dijkstra's algorithm to compute the shortest path tree.

Key concepts:
• Areas — OSPF divides networks into areas to reduce overhead (Area 0 is the backbone)
• Hello packets — sent every 10 seconds to discover and maintain neighbor relationships
• DR/BDR — Designated Router reduces LSA flooding on multi-access networks
• Cost metric — based on interface bandwidth (lower cost = preferred path)
• Convergence — time for all routers to agree on topology after a change

Neighbor states: Down → Init → 2-Way → ExStart → Exchange → Loading → Full`,
    relatedCommands: ['show ip ospf neighbor', 'show ip ospf interface', 'show ip route ospf'],
  },

  stp: {
    topic: 'stp',
    title: 'STP (Spanning Tree Protocol)',
    summary: 'STP prevents Layer 2 loops by blocking redundant paths in a switched network.',
    details: `Without STP, redundant links between switches would cause broadcast storms, MAC table instability, and duplicate frames.

Key concepts:
• Root Bridge — the switch with the lowest Bridge ID becomes the root (center of the tree)
• Root Port — each non-root switch's best port toward the root bridge
• Designated Port — the best port on each segment toward the root
• Blocked Port — redundant ports that are disabled to prevent loops
• Port states: Blocking → Listening → Learning → Forwarding

When a link fails, STP reconverges by unblocking previously blocked ports. This can take 30-50 seconds with classic STP (Rapid STP is much faster).`,
    relatedCommands: ['show spanning-tree', 'show spanning-tree summary', 'show interfaces'],
  },

  arp: {
    topic: 'arp',
    title: 'ARP (Address Resolution Protocol)',
    summary: 'ARP maps IP addresses to MAC addresses so frames can be delivered on the local network.',
    details: `When a device wants to send a packet to another device on the same subnet, it needs the destination's MAC address for the Ethernet frame.

How ARP works:
1. Device checks its ARP cache for the destination IP
2. If not found, sends an ARP Request (broadcast) asking "Who has IP x.x.x.x?"
3. The device with that IP responds with an ARP Reply (unicast) containing its MAC
4. The sender caches the IP-to-MAC mapping for future use

Security concerns:
• ARP Spoofing — an attacker sends fake ARP replies to redirect traffic
• Dynamic ARP Inspection (DAI) — validates ARP packets against a trusted database
• ARP entries expire after a timeout (typically 4 hours on Cisco)`,
    relatedCommands: ['show arp', 'show ip arp', 'clear arp-cache'],
  },

  dhcp: {
    topic: 'dhcp',
    title: 'DHCP (Dynamic Host Configuration Protocol)',
    summary: 'DHCP automatically assigns IP addresses and network settings to devices.',
    details: `Instead of manually configuring every device, DHCP provides automatic IP assignment from a pool.

The DORA process:
1. Discover — client broadcasts looking for a DHCP server
2. Offer — server responds with an available IP address
3. Request — client formally requests the offered address
4. Acknowledge — server confirms the lease

What DHCP provides:
• IP address
• Subnet mask
• Default gateway
• DNS server addresses
• Lease duration

DHCP Relay: When the DHCP server is on a different subnet, routers use "ip helper-address" to forward DHCP broadcasts.`,
    relatedCommands: ['show ip dhcp binding', 'show ip dhcp pool', 'ipconfig /release', 'ipconfig /renew'],
  },

  dns: {
    topic: 'dns',
    title: 'DNS (Domain Name System)',
    summary: 'DNS translates human-readable domain names into IP addresses.',
    details: `DNS is the "phone book" of the internet. When you type a URL, DNS resolves it to an IP address.

Resolution process:
1. Client checks local DNS cache
2. Queries configured DNS server (recursive resolver)
3. Resolver queries root servers → TLD servers → authoritative servers
4. Answer is cached at each level for the TTL duration

Record types:
• A — maps hostname to IPv4 address
• AAAA — maps hostname to IPv6 address
• CNAME — alias pointing to another hostname
• MX — mail server for a domain
• PTR — reverse lookup (IP to hostname)

Common issues: DNS misconfiguration is one of the most frequent causes of "internet is down" reports.`,
    relatedCommands: ['nslookup', 'show ip dns view', 'show hosts'],
  },

  acls: {
    topic: 'acls',
    title: 'ACLs (Access Control Lists)',
    summary: 'ACLs filter traffic by permitting or denying packets based on defined rules.',
    details: `ACLs are applied to router interfaces to control which traffic is allowed through.

Types:
• Standard ACLs (1-99) — filter based on source IP only
• Extended ACLs (100-199) — filter on source/dest IP, protocol, and port
• Named ACLs — use descriptive names instead of numbers

Key rules:
• Processed top-down — first match wins
• Implicit "deny all" at the end of every ACL
• Apply as close to the source as possible (extended) or destination (standard)
• One ACL per interface, per direction (in/out)

Example: "permit tcp 192.168.1.0 0.0.0.255 any eq 80" allows HTTP from 192.168.1.0/24 to anywhere.`,
    relatedCommands: ['show access-lists', 'show ip interface', 'show running-config | include access'],
  },

  subnetting: {
    topic: 'subnetting',
    title: 'Subnetting',
    summary: 'Subnetting divides a large network into smaller, more manageable segments.',
    details: `Subnetting lets you create multiple logical networks from a single IP address block.

Key concepts:
• Subnet mask determines which bits are network vs host
• /24 = 255.255.255.0 = 256 addresses (254 usable hosts)
• /25 = 255.255.255.128 = 128 addresses (126 usable hosts)
• /30 = 255.255.255.252 = 4 addresses (2 usable — perfect for point-to-point links)

Why subnet:
• Reduce broadcast domain size
• Improve security through segmentation
• Efficient IP address allocation
• Easier troubleshooting and management

Quick math: 2^(32 - prefix) = total addresses in subnet`,
    relatedCommands: ['show ip interface brief', 'show ip route', 'ping'],
  },

  nat: {
    topic: 'nat',
    title: 'NAT (Network Address Translation)',
    summary: 'NAT translates private IP addresses to public IPs for internet access.',
    details: `NAT allows multiple devices with private IPs (10.x, 172.16-31.x, 192.168.x) to share one or more public IP addresses.

Types:
• Static NAT — one-to-one mapping (private IP ↔ public IP)
• Dynamic NAT — pool of public IPs assigned on demand
• PAT (Port Address Translation) — many private IPs share one public IP using different port numbers (most common)

How PAT works:
1. Internal host sends packet with private source IP
2. Router replaces source IP with its public IP and assigns a unique port
3. Router tracks the mapping in its NAT table
4. Return traffic is translated back using the port mapping

NAT breaks end-to-end connectivity, which can cause issues with some protocols (IPsec, SIP, FTP).`,
    relatedCommands: ['show ip nat translations', 'show ip nat statistics', 'debug ip nat'],
  },
}

/**
 * Get educational content for a topic
 */
export function getEducationalContent(topic: EducationalTopic): EducationalEntry {
  return educationalContent[topic]
}

/**
 * Get all available topics
 */
export function getAllTopics(): EducationalTopic[] {
  return Object.keys(educationalContent) as EducationalTopic[]
}
