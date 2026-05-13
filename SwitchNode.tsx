import { RouterNode } from './RouterNode'
import { SwitchNode } from './SwitchNode'
import { PCNode } from './PCNode'
import { CloudNode } from './CloudNode'
import { FirewallNode } from './FirewallNode'

export { RouterNode, SwitchNode, PCNode, CloudNode, FirewallNode }

export const nodeTypes = {
  router: RouterNode,
  switch: SwitchNode,
  pc: PCNode,
  cloud: CloudNode,
  firewall: FirewallNode,
}
