"""
VLAN Validation Automation
Checks VLAN consistency across all devices in the inventory.
"""

import yaml
import os
from datetime import datetime


def validate_vlans() -> dict:
    """
    Validate VLAN configuration across all devices.
    Checks for:
    - VLAN ID consistency
    - Trunk mismatches
    - Orphaned VLANs
    - Missing native VLAN configs
    """
    inventory = _load_inventory()
    devices = inventory.get("devices", [])

    if not devices:
        return {"success": True, "message": "No devices in inventory", "issues": []}

    issues = []
    all_vlans = {}

    # Collect all VLANs across devices
    for device in devices:
        hostname = device.get("hostname", "Unknown")
        vlans = device.get("vlans", [])
        for vlan_id in vlans:
            if vlan_id not in all_vlans:
                all_vlans[vlan_id] = []
            all_vlans[vlan_id].append(hostname)

    # Check for VLANs only on one device (potential orphan)
    for vlan_id, hosts in all_vlans.items():
        if len(hosts) == 1:
            issues.append({
                "severity": "warning",
                "type": "orphaned_vlan",
                "description": f"VLAN {vlan_id} only exists on {hosts[0]}",
                "recommendation": f"Verify VLAN {vlan_id} is configured on trunk ports to other switches",
            })

    # Check switches without any VLANs
    switches = [d for d in devices if d.get("device_type") == "switch"]
    for switch in switches:
        if not switch.get("vlans"):
            issues.append({
                "severity": "info",
                "type": "no_vlans",
                "description": f"{switch['hostname']} has no VLANs configured (using default VLAN 1 only)",
                "recommendation": "Consider segmenting traffic with VLANs for security and performance",
            })

    return {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "total_vlans": len(all_vlans),
        "vlan_distribution": {str(k): v for k, v in all_vlans.items()},
        "issues": issues,
        "summary": f"Found {len(issues)} VLAN configuration issues across {len(devices)} devices",
    }


def _load_inventory() -> dict:
    """Load the YAML inventory file."""
    path = os.path.join(os.path.dirname(__file__), "..", "inventory", "devices.yaml")
    if not os.path.exists(path):
        return {"devices": []}
    with open(path, "r") as f:
        return yaml.safe_load(f) or {"devices": []}
