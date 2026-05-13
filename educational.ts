import type { TopologySnapshot } from '../types'

export interface LabScenario {
  id: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  skills: string[]
  topology: TopologySnapshot
}

export const LAB_SCENARIOS: LabScenario[] = [
  {
    id: 'basic-lan',
    title: 'Basic LAN',
    description: 'Two PCs connected through a switch. Covers IP addressing, subnet masks, and basic connectivity testing.',
    difficulty: 'Beginner',
    skills: ['IP Addressing', 'Subnetting', 'Ping', 'ARP'],
    topology: {
      version: '1.0',
      labDescription: 'Basic LAN — two PCs connected through a switch on the 192.168.1.0/24 network.',
      savedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'sw1', type: 'switch', position: { x: 300, y: 200 },
          data: {
            hostname: 'SW1',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '', subnetMask: '', defaultGateway: '', isUp: true }],
            deviceConfig: { hostname: 'SW1', interfaces: [] },
          },
        },
        {
          id: 'pc1', type: 'pc', position: { x: 150, y: 350 },
          data: {
            hostname: 'PC1',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.1.2', subnetMask: '255.255.255.0', defaultGateway: '192.168.1.1', isUp: true }],
            deviceConfig: { hostname: 'PC1', interfaces: [] },
          },
        },
        {
          id: 'pc2', type: 'pc', position: { x: 450, y: 350 },
          data: {
            hostname: 'PC2',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.1.3', subnetMask: '255.255.255.0', defaultGateway: '192.168.1.1', isUp: true }],
            deviceConfig: { hostname: 'PC2', interfaces: [] },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'pc1', target: 'sw1', sourceHandle: 'top', targetHandle: 'bottom', data: { linkType: 'ethernet' } },
        { id: 'e2', source: 'pc2', target: 'sw1', sourceHandle: 'top', targetHandle: 'bottom', data: { linkType: 'ethernet' } },
      ],
    },
  },
  {
    id: 'small-office',
    title: 'Small Office Network',
    description: 'Router connecting a switch with multiple PCs. Covers default gateway, inter-device routing, and traceroute.',
    difficulty: 'Beginner',
    skills: ['IP Addressing', 'Default Gateway', 'Routing', 'Traceroute'],
    topology: {
      version: '1.0',
      labDescription: 'Small office network — router, switch, and three PCs on 192.168.1.0/24.',
      savedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'r1', type: 'router', position: { x: 300, y: 100 },
          data: {
            hostname: 'R1',
            interfaces: [{ id: 'fa0', name: 'fa0/0', ipAddress: '192.168.1.1', subnetMask: '255.255.255.0', defaultGateway: '', isUp: true }],
            deviceConfig: { hostname: 'R1', interfaces: [] },
          },
        },
        {
          id: 'sw1', type: 'switch', position: { x: 300, y: 230 },
          data: { hostname: 'SW1', interfaces: [], deviceConfig: { hostname: 'SW1', interfaces: [] } },
        },
        {
          id: 'pc1', type: 'pc', position: { x: 100, y: 370 },
          data: {
            hostname: 'PC1',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.1.10', subnetMask: '255.255.255.0', defaultGateway: '192.168.1.1', isUp: true }],
            deviceConfig: { hostname: 'PC1', interfaces: [] },
          },
        },
        {
          id: 'pc2', type: 'pc', position: { x: 300, y: 370 },
          data: {
            hostname: 'PC2',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.1.11', subnetMask: '255.255.255.0', defaultGateway: '192.168.1.1', isUp: true }],
            deviceConfig: { hostname: 'PC2', interfaces: [] },
          },
        },
        {
          id: 'pc3', type: 'pc', position: { x: 500, y: 370 },
          data: {
            hostname: 'PC3',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.1.12', subnetMask: '255.255.255.0', defaultGateway: '192.168.1.1', isUp: true }],
            deviceConfig: { hostname: 'PC3', interfaces: [] },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'r1', target: 'sw1', sourceHandle: 'bottom', targetHandle: 'top', data: { linkType: 'ethernet' } },
        { id: 'e2', source: 'sw1', target: 'pc1', sourceHandle: 'bottom', targetHandle: 'top', data: { linkType: 'ethernet' } },
        { id: 'e3', source: 'sw1', target: 'pc2', sourceHandle: 'bottom', targetHandle: 'top', data: { linkType: 'ethernet' } },
        { id: 'e4', source: 'sw1', target: 'pc3', sourceHandle: 'bottom', targetHandle: 'top', data: { linkType: 'ethernet' } },
      ],
    },
  },
  {
    id: 'two-subnets',
    title: 'Inter-Subnet Routing',
    description: 'Router with two interfaces connecting two separate subnets. Core CCNA routing concept.',
    difficulty: 'Intermediate',
    skills: ['Subnetting', 'Static Routing', 'Inter-VLAN Routing', 'Default Gateway'],
    topology: {
      version: '1.0',
      labDescription: 'Inter-subnet routing — router connecting 192.168.1.0/24 and 192.168.2.0/24.',
      savedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'r1', type: 'router', position: { x: 350, y: 200 },
          data: {
            hostname: 'R1',
            interfaces: [
              { id: 'fa0', name: 'fa0/0', ipAddress: '192.168.1.1', subnetMask: '255.255.255.0', defaultGateway: '', isUp: true },
              { id: 'fa1', name: 'fa0/1', ipAddress: '192.168.2.1', subnetMask: '255.255.255.0', defaultGateway: '', isUp: true },
            ],
            deviceConfig: { hostname: 'R1', interfaces: [] },
          },
        },
        {
          id: 'pc1', type: 'pc', position: { x: 100, y: 350 },
          data: {
            hostname: 'PC1',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.1.10', subnetMask: '255.255.255.0', defaultGateway: '192.168.1.1', isUp: true }],
            deviceConfig: { hostname: 'PC1', interfaces: [] },
          },
        },
        {
          id: 'pc2', type: 'pc', position: { x: 600, y: 350 },
          data: {
            hostname: 'PC2',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.2.10', subnetMask: '255.255.255.0', defaultGateway: '192.168.2.1', isUp: true }],
            deviceConfig: { hostname: 'PC2', interfaces: [] },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'pc1', target: 'r1', sourceHandle: 'right', targetHandle: 'left', data: { linkType: 'ethernet' } },
        { id: 'e2', source: 'r1', target: 'pc2', sourceHandle: 'right', targetHandle: 'left', data: { linkType: 'ethernet' } },
      ],
    },
  },
  {
    id: 'wan-link',
    title: 'WAN Point-to-Point',
    description: 'Two routers connected via a serial WAN link, each with a LAN behind them.',
    difficulty: 'Intermediate',
    skills: ['WAN', 'Serial Links', 'Static Routing', 'Subnetting /30'],
    topology: {
      version: '1.0',
      labDescription: 'WAN point-to-point — two sites connected via serial link with /30 subnet.',
      savedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'r1', type: 'router', position: { x: 150, y: 200 },
          data: {
            hostname: 'R1-HQ',
            interfaces: [
              { id: 'fa0', name: 'fa0/0', ipAddress: '192.168.1.1', subnetMask: '255.255.255.0', defaultGateway: '', isUp: true },
              { id: 's0', name: 's0/0', ipAddress: '10.0.0.1', subnetMask: '255.255.255.252', defaultGateway: '', isUp: true },
            ],
            deviceConfig: { hostname: 'R1-HQ', interfaces: [] },
          },
        },
        {
          id: 'r2', type: 'router', position: { x: 550, y: 200 },
          data: {
            hostname: 'R2-Branch',
            interfaces: [
              { id: 's0', name: 's0/0', ipAddress: '10.0.0.2', subnetMask: '255.255.255.252', defaultGateway: '', isUp: true },
              { id: 'fa0', name: 'fa0/0', ipAddress: '192.168.2.1', subnetMask: '255.255.255.0', defaultGateway: '', isUp: true },
            ],
            deviceConfig: { hostname: 'R2-Branch', interfaces: [] },
          },
        },
        {
          id: 'pc1', type: 'pc', position: { x: 50, y: 370 },
          data: {
            hostname: 'HQ-PC',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.1.10', subnetMask: '255.255.255.0', defaultGateway: '192.168.1.1', isUp: true }],
            deviceConfig: { hostname: 'HQ-PC', interfaces: [] },
          },
        },
        {
          id: 'pc2', type: 'pc', position: { x: 650, y: 370 },
          data: {
            hostname: 'Branch-PC',
            interfaces: [{ id: 'eth0', name: 'eth0', ipAddress: '192.168.2.10', subnetMask: '255.255.255.0', defaultGateway: '192.168.2.1', isUp: true }],
            deviceConfig: { hostname: 'Branch-PC', interfaces: [] },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'pc1', target: 'r1', sourceHandle: 'right', targetHandle: 'left', data: { linkType: 'ethernet' } },
        { id: 'e2', source: 'r1', target: 'r2', sourceHandle: 'right', targetHandle: 'left', data: { linkType: 'serial' } },
        { id: 'e3', source: 'r2', target: 'pc2', sourceHandle: 'right', targetHandle: 'left', data: { linkType: 'ethernet' } },
      ],
    },
  },
]
