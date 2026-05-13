"""
Automated Troubleshooting Report Generator
Generates comprehensive network diagnostic reports.
"""

import yaml
import os
from datetime import datetime


def generate_troubleshoot_report() -> dict:
    """
    Generate an automated troubleshooting report for the entire network.
    Analyzes inventory and simulates common network issues.
    """
    inventory = _load_inventory()
    devices = inventory.get("devices", [])

    if not devices:
        return {
            "success": True,
            "report": "No devices in inventory to analyze.",
            "timestamp": datetime.now().isoformat(),
        }

    findings = []
    recommendations = []

    # Analyze each device
    for device in devices:
        hostname = device.get("hostname", "Unknown")
        interfaces = device.get("interfaces", [])

        # Check for unconfigured interfaces
        unconfigured = [i for i in interfaces if not i.get("ip")]
        if unconfigured:
            findings.append({
                "device": hostname,
                "severity": "warning",
                "finding": f"{len(unconfigured)} interface(s) without IP configuration",
                "detail": [i.get("name") for i in unconfigured],
            })

        # Check for potential routing issues (routers without multiple interfaces)
        if device.get("device_type") == "router" and len(interfaces) < 2:
            findings.append({
                "device": hostname,
                "severity": "info",
                "finding": "Router has fewer than 2 interfaces configured",
                "detail": "A router typically needs multiple interfaces to route between networks",
            })

    # Generate recommendations
    if findings:
        recommendations = [
            "Review interface configurations on flagged devices",
            "Verify IP addressing scheme matches network design",
            "Run 'show ip interface brief' on each device to confirm status",
            "Check physical connectivity for any DOWN interfaces",
            "Validate routing tables with 'show ip route'",
        ]

    return {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "total_devices_analyzed": len(devices),
        "total_findings": len(findings),
        "findings": findings,
        "recommendations": recommendations,
        "summary": _generate_summary(findings),
    }


def _generate_summary(findings: list) -> str:
    """Generate a human-readable summary."""
    if not findings:
        return "No issues detected. Network configuration appears healthy."

    critical = sum(1 for f in findings if f["severity"] == "critical")
    warnings = sum(1 for f in findings if f["severity"] == "warning")
    info = sum(1 for f in findings if f["severity"] == "info")

    parts = []
    if critical:
        parts.append(f"{critical} critical issue(s)")
    if warnings:
        parts.append(f"{warnings} warning(s)")
    if info:
        parts.append(f"{info} informational finding(s)")

    return f"Analysis complete: {', '.join(parts)}. Review recommendations for remediation steps."


def _load_inventory() -> dict:
    """Load the YAML inventory file."""
    path = os.path.join(os.path.dirname(__file__), "..", "inventory", "devices.yaml")
    if not os.path.exists(path):
        return {"devices": []}
    with open(path, "r") as f:
        return yaml.safe_load(f) or {"devices": []}
