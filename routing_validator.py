"""
Config Backup Automation
Simulates backing up device running configurations.
In production, this would use Netmiko/Paramiko to SSH into devices.
"""

import os
import yaml
from datetime import datetime


def backup_device_config(hostname: str) -> dict:
    """
    Backup the running configuration of a device.
    Simulates what Netmiko would do with a real device.
    """
    inventory = _load_inventory()
    device = next((d for d in inventory.get("devices", []) if d["hostname"] == hostname), None)

    if not device:
        return {"success": False, "error": f"Device {hostname} not found in inventory"}

    # Simulate config generation based on device type
    config_lines = _generate_config(device)

    # Save backup
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{hostname}_{timestamp}.cfg"
    filepath = os.path.join(backup_dir, filename)

    with open(filepath, "w") as f:
        f.write("\n".join(config_lines))

    return {
        "success": True,
        "hostname": hostname,
        "backup_file": filename,
        "timestamp": datetime.now().isoformat(),
        "config_lines": len(config_lines),
        "message": f"Configuration backed up successfully to {filename}",
    }


def _generate_config(device: dict) -> list:
    """Generate a simulated running config for a device."""
    lines = [
        "!",
        f"! Configuration for {device['hostname']}",
        f"! Generated: {datetime.now().isoformat()}",
        "!",
        "version 15.2",
        "service timestamps debug datetime msec",
        "service timestamps log datetime msec",
        "!",
        f"hostname {device['hostname']}",
        "!",
    ]

    # Interfaces
    for iface in device.get("interfaces", []):
        lines.append(f"interface {iface.get('name', 'FastEthernet0/0')}")
        if iface.get("ip"):
            lines.append(f" ip address {iface['ip']} {iface.get('mask', '255.255.255.0')}")
        lines.append(" no shutdown")
        lines.append("!")

    # VLANs (for switches)
    for vlan in device.get("vlans", []):
        lines.append(f"vlan {vlan}")
        lines.append(f" name VLAN{vlan}")
        lines.append("!")

    lines.append("end")
    return lines


def _load_inventory() -> dict:
    """Load the YAML inventory file."""
    path = os.path.join(os.path.dirname(__file__), "..", "inventory", "devices.yaml")
    if not os.path.exists(path):
        return {"devices": []}
    with open(path, "r") as f:
        return yaml.safe_load(f) or {"devices": []}
