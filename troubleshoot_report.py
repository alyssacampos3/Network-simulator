"""
Device Health Check Automation
Simulates health monitoring that would use SNMP/SSH in production.
"""

import random
import yaml
import os
from datetime import datetime


def run_health_check(hostname: str) -> dict:
    """
    Run a comprehensive health check on a device.
    Simulates CPU, memory, interface status, and connectivity checks.
    """
    inventory = _load_inventory()
    device = next((d for d in inventory.get("devices", []) if d["hostname"] == hostname), None)

    if not device:
        return {"success": False, "error": f"Device {hostname} not found in inventory"}

    # Simulate health metrics
    cpu_usage = random.uniform(10, 85)
    memory_usage = random.uniform(25, 75)
    temperature = random.uniform(35, 65)
    uptime_hours = random.randint(24, 8760)

    # Interface checks
    interface_status = {}
    for iface in device.get("interfaces", []):
        name = iface.get("name", "Unknown")
        interface_status[name] = {
            "status": random.choice(["up", "up", "up", "down"]),
            "speed": "1000Mbps",
            "duplex": "full",
            "input_errors": random.randint(0, 10),
            "output_errors": random.randint(0, 5),
            "crc_errors": random.randint(0, 3),
        }

    # Determine overall health
    issues = []
    if cpu_usage > 80:
        issues.append("High CPU utilization")
    if memory_usage > 70:
        issues.append("Elevated memory usage")
    if temperature > 60:
        issues.append("High temperature warning")
    for name, status in interface_status.items():
        if status["status"] == "down":
            issues.append(f"Interface {name} is DOWN")
        if status["input_errors"] > 5:
            issues.append(f"Interface {name} has input errors")

    overall_status = "healthy" if not issues else "degraded" if len(issues) < 3 else "critical"

    return {
        "success": True,
        "hostname": hostname,
        "device_type": device.get("device_type", "unknown"),
        "overall_status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "cpu_usage": round(cpu_usage, 1),
            "memory_usage": round(memory_usage, 1),
            "temperature_celsius": round(temperature, 1),
            "uptime_hours": uptime_hours,
        },
        "interface_status": interface_status,
        "issues": issues,
        "recommendations": _get_recommendations(issues),
    }


def _get_recommendations(issues: list) -> list:
    """Generate recommendations based on detected issues."""
    recs = []
    for issue in issues:
        if "CPU" in issue:
            recs.append("Investigate running processes with 'show processes cpu'")
        elif "memory" in issue:
            recs.append("Check memory allocation with 'show memory statistics'")
        elif "temperature" in issue:
            recs.append("Verify fan operation and ambient temperature")
        elif "DOWN" in issue:
            recs.append(f"Check physical connectivity and run 'show interfaces'")
        elif "errors" in issue:
            recs.append("Check cable quality and duplex settings")
    return recs


def _load_inventory() -> dict:
    """Load the YAML inventory file."""
    path = os.path.join(os.path.dirname(__file__), "..", "inventory", "devices.yaml")
    if not os.path.exists(path):
        return {"devices": []}
    with open(path, "r") as f:
        return yaml.safe_load(f) or {"devices": []}
