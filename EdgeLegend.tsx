import { useState, useEffect } from 'react'
import type { NetworkNode, NetworkInterface, DeviceConfig, RouteEntry } from '../types'
import { isValidIPv4 } from '../engine/subnet'
import { useNetworkStore } from '../store/networkStore'

interface Props {
  device: NetworkNode | null
  onClose: () => void
}

interface IfaceErrors {
  ipAddress?: string
  subnetMask?: string
}

type Tab = 'interfaces' | 'vlan' | 'routing' | 'dhcp'

function newInterface(): NetworkInterface {
  return { id: `eth${Date.now()}`, name: '', ipAddress: '', subnetMask: '', defaultGateway: '', isUp: true }
}

function newRoute(): RouteEntry {
  return { network: '', mask: '', nextHop: '', interface: '', metric: 1 }
}

export function DeviceConfigPanel({ device, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('interfaces')
  const [hostname, setHostname] = useState('')
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([])
  const [errors, setErrors] = useState<Record<number, IfaceErrors>>({})
  const [vlan, setVlan] = useState<number | ''>('')
  const [vlanDesc, setVlanDesc] = useState('')
  const [routes, setRoutes] = useState<RouteEntry[]>([])
  const [dhcpEnabled, setDhcpEnabled] = useState(false)
  const [dhcpPool, setDhcpPool] = useState('')
  const [dhcpStart, setDhcpStart] = useState('')
  const [dhcpEnd, setDhcpEnd] = useState('')
  const [dhcpGateway, setDhcpGateway] = useState('')

  useEffect(() => {
    if (device) {
      setHostname(device.data.hostname)
      setInterfaces(device.data.interfaces.map(i => ({ ...i })))
      setErrors({})
      setVlan(device.data.deviceConfig.vlan ?? '')
      setRoutes(device.data.deviceConfig.routingTable?.map(r => ({ ...r })) ?? [])
      setTab('interfaces')
    }
  }, [device])

  if (!device) return null

  const isRouter = device.type === 'router'
  const isSwitch = device.type === 'switch'

  const hasErrors = Object.values(errors).some(e => e && (e.ipAddress || e.subnetMask))

  function validateField(index: number, field: 'ipAddress' | 'subnetMask', value: string) {
    if (!value) { setErrors(prev => ({ ...prev, [index]: { ...prev[index], [field]: undefined } })); return }
    setErrors(prev => ({ ...prev, [index]: { ...prev[index], [field]: isValidIPv4(value) ? undefined : 'Invalid IPv4' } }))
  }

  function updateIface(index: number, patch: Partial<NetworkInterface>) {
    setInterfaces(prev => prev.map((iface, i) => i === index ? { ...iface, ...patch } : iface))
  }

  function removeIface(index: number) {
    setInterfaces(prev => prev.filter((_, i) => i !== index))
  }

  function updateRoute(index: number, patch: Partial<RouteEntry>) {
    setRoutes(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r))
  }

  function handleSave() {
    if (!device) return
    const config: DeviceConfig = {
      hostname,
      interfaces,
      vlan: vlan !== '' ? Number(vlan) : undefined,
      routingTable: routes.filter(r => r.network),
    }
    useNetworkStore.getState().updateNodeConfig(device.id, config)
    onClose()
  }

  const tabs: { id: Tab; label: string; show: boolean }[] = (
    [
      { id: 'interfaces' as Tab, label: 'Interfaces', show: true },
      { id: 'vlan' as Tab, label: 'VLANs', show: isSwitch },
      { id: 'routing' as Tab, label: 'Routing', show: isRouter },
      { id: 'dhcp' as Tab, label: 'DHCP', show: isRouter },
    ] as { id: Tab; label: string; show: boolean }[]
  ).filter(t => t.show)

  return (
    <div className="fixed top-0 right-0 h-full w-[400px] bg-gray-950 text-white border-l border-gray-800 flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{device.type}</p>
          <h2 className="text-sm font-semibold text-white">{hostname || 'Configure Device'}</h2>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
      </div>

      {/* Hostname */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-800 shrink-0">
        <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Hostname</label>
        <input
          type="text"
          value={hostname}
          onChange={e => setHostname(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex border-b border-gray-800 shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-900'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* ── Interfaces tab ── */}
        {tab === 'interfaces' && (
          <>
            {interfaces.map((iface, i) => (
              <div key={iface.id} className="border border-gray-800 rounded-lg p-3 space-y-2 bg-gray-900">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={iface.name}
                    onChange={e => updateIface(i, { name: e.target.value })}
                    placeholder="Interface name (e.g. fa0/0)"
                    className="bg-transparent text-xs font-mono font-semibold text-gray-300 focus:outline-none border-b border-gray-700 focus:border-blue-500 w-40"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={iface.isUp} onChange={e => updateIface(i, { isUp: e.target.checked })} className="accent-green-500 w-3 h-3" />
                      Up
                    </label>
                    <button onClick={() => removeIface(i)} className="text-gray-700 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                </div>
                {[
                  { label: 'IP Address', field: 'ipAddress' as const, placeholder: '192.168.1.1' },
                  { label: 'Subnet Mask', field: 'subnetMask' as const, placeholder: '255.255.255.0' },
                  { label: 'Default Gateway', field: 'defaultGateway' as const, placeholder: '192.168.1.254' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-[10px] text-gray-600 mb-0.5">{label}</label>
                    <input
                      type="text"
                      value={iface[field]}
                      onChange={e => updateIface(i, { [field]: e.target.value })}
                      onBlur={field !== 'defaultGateway' ? e => validateField(i, field as 'ipAddress' | 'subnetMask', e.target.value) : undefined}
                      placeholder={placeholder}
                      className={`w-full bg-gray-800 border rounded px-2 py-1 text-xs font-mono text-white focus:outline-none ${
                        (field === 'ipAddress' && errors[i]?.ipAddress) || (field === 'subnetMask' && errors[i]?.subnetMask)
                          ? 'border-red-600' : 'border-gray-700 focus:border-blue-500'
                      }`}
                    />
                    {field === 'ipAddress' && errors[i]?.ipAddress && <p className="text-red-400 text-[10px] mt-0.5">{errors[i].ipAddress}</p>}
                    {field === 'subnetMask' && errors[i]?.subnetMask && <p className="text-red-400 text-[10px] mt-0.5">{errors[i].subnetMask}</p>}
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={() => setInterfaces(prev => [...prev, newInterface()])}
              className="w-full border border-dashed border-gray-700 text-gray-600 hover:text-gray-300 hover:border-gray-500 rounded-lg py-2 text-xs transition-colors"
            >
              + Add Interface
            </button>
          </>
        )}

        {/* ── VLAN tab (switches only) ── */}
        {tab === 'vlan' && (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-300">
              VLANs logically segment a switch into isolated broadcast domains. Devices in different VLANs cannot communicate without a router.
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">VLAN ID (1–4094)</label>
              <input
                type="number"
                min={1} max={4094}
                value={vlan}
                onChange={e => setVlan(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 10"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">VLAN Description</label>
              <input
                type="text"
                value={vlanDesc}
                onChange={e => setVlanDesc(e.target.value)}
                placeholder="e.g. Management VLAN"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-400 space-y-1">
              <p className="text-gray-600 text-[10px] uppercase tracking-wide mb-2">Cisco IOS equivalent</p>
              <p className="text-green-400">Switch# configure terminal</p>
              <p className="text-green-400">Switch(config)# vlan {vlan || '10'}</p>
              <p className="text-green-400">Switch(config-vlan)# name {vlanDesc || 'VLAN_NAME'}</p>
            </div>
          </div>
        )}

        {/* ── Routing table tab (routers only) ── */}
        {tab === 'routing' && (
          <div className="space-y-3">
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-300">
              Static routes tell the router where to forward packets for networks it's not directly connected to.
            </div>
            {routes.map((route, i) => (
              <div key={i} className="border border-gray-800 rounded-lg p-3 bg-gray-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Route {i + 1}</span>
                  <button onClick={() => setRoutes(prev => prev.filter((_, j) => j !== i))} className="text-gray-700 hover:text-red-400 text-xs">✕</button>
                </div>
                {[
                  { label: 'Destination Network', field: 'network' as const, placeholder: '10.0.0.0' },
                  { label: 'Subnet Mask', field: 'mask' as const, placeholder: '255.0.0.0' },
                  { label: 'Next Hop', field: 'nextHop' as const, placeholder: '192.168.1.2 or "directly connected"' },
                  { label: 'Exit Interface', field: 'interface' as const, placeholder: 'fa0/1' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-[10px] text-gray-600 mb-0.5">{label}</label>
                    <input
                      type="text"
                      value={route[field]}
                      onChange={e => updateRoute(i, { [field]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">Metric (AD)</label>
                  <input
                    type="number"
                    value={route.metric}
                    onChange={e => updateRoute(i, { metric: Number(e.target.value) })}
                    className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setRoutes(prev => [...prev, newRoute()])}
              className="w-full border border-dashed border-gray-700 text-gray-600 hover:text-gray-300 hover:border-gray-500 rounded-lg py-2 text-xs transition-colors"
            >
              + Add Static Route
            </button>
            {routes.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-400 space-y-1">
                <p className="text-gray-600 text-[10px] uppercase tracking-wide mb-2">Cisco IOS equivalent</p>
                {routes.filter(r => r.network).map((r, i) => (
                  <p key={i} className="text-green-400">ip route {r.network} {r.mask} {r.nextHop}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DHCP tab (routers only) ── */}
        {tab === 'dhcp' && (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-300">
              DHCP automatically assigns IP addresses to devices. The router acts as the DHCP server for the subnet.
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={dhcpEnabled} onChange={e => setDhcpEnabled(e.target.checked)} className="accent-blue-500 w-4 h-4" />
              <span className="text-sm text-gray-300">Enable DHCP Server</span>
            </label>
            {dhcpEnabled && (
              <div className="space-y-3">
                {[
                  { label: 'Pool Name', value: dhcpPool, set: setDhcpPool, placeholder: 'LAN_POOL' },
                  { label: 'Start IP', value: dhcpStart, set: setDhcpStart, placeholder: '192.168.1.10' },
                  { label: 'End IP', value: dhcpEnd, set: setDhcpEnd, placeholder: '192.168.1.100' },
                  { label: 'Default Gateway', value: dhcpGateway, set: setDhcpGateway, placeholder: '192.168.1.1' },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
                <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-400 space-y-1">
                  <p className="text-gray-600 text-[10px] uppercase tracking-wide mb-2">Cisco IOS equivalent</p>
                  <p className="text-green-400">ip dhcp pool {dhcpPool || 'LAN_POOL'}</p>
                  <p className="text-green-400"> network {dhcpStart || '192.168.1.0'} 255.255.255.0</p>
                  <p className="text-green-400"> default-router {dhcpGateway || '192.168.1.1'}</p>
                  <p className="text-green-400"> dns-server 8.8.8.8</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 flex gap-2 shrink-0">
        <button
          onClick={handleSave}
          disabled={hasErrors}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          Save
        </button>
        <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
