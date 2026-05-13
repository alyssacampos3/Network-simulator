"""
Configuration Compliance Scanner
Validates device configurations against security and operational best practices.
"""

import yaml
import os
from datetime import datetime


def run_compliance_scan(hostname: str) -> dict:
    """
    Run a compliance scan against best-practice rules.
    Checks for:
    - Password encryption
    - Banner configuration
    - SSH vs Telnet
    - Logging configuration
    - NTP configuration
    - ACL presence
    """
    inventory = _load_inventory()
    device = next((d for d in inventory.get("devices", []) if d["hostname"] == hostname), None)

    if not device:
        return {"success": False, "error": f"Device {hostname} not found in inventory"}

    violations = []
    recommendations = []

    # Simulated compliance checks
    checks = [
        {
            "rule": "SEC-001",
            "name": "Password Encryption",
            "description": "All passwords should be encrypted",
            "compliant": True,
        },
        {
            "rule": "SEC-002",
            "name": "SSH Enabled",
            "description": "SSH should be enabled, Telnet disabled",
            "compliant": True,
        },
        {
            "rule": "SEC-003",
            "name": "Login Banner",
            "description": "A login banner should be configured",
            "compliant": False,
        },
        {
            "rule": "OPS-001",
            "name": "Logging Server",
            "description": "Syslog server should be configured",
            "compliant": False,
        },
        {
            "rule": "OPS-002",
            "name": "NTP Configuration",
            "description": "NTP server should be configured for time sync",
            "compliant": False,
        },
        {
            "rule": "SEC-004",
            "name": "ACL on VTY Lines",
            "description": "Access control lists should restrict VTY access",
            "compliant": True,
        },
        {
            "rule": "OPS-003",
            "name": "Interface Descriptions",
            "description": "All active interfaces should have descriptions",
            "compliant": len(device.get("interfaces", [])) > 0,
        },
    ]

    for check in checks:
        if not check["compliant"]:
            violations.append({
                "rule": check["rule"],
                "name": check["name"],
                "description": check["description"],
            })
            recommendations.append(f"[{check['rule']}] Configure {check['name'].lower()}")

    compliant = len(violations) == 0
    score = int(((len(checks) - len(violations)) / len(checks)) * 100)

    return {
        "success": True,
        "hostname": hostname,
        "compliant": compliant,
        "compliance_score": score,
        "total_checks": len(checks),
        "passed": len(checks) - len(violations),
        "failed": len(violations),
        "violations": violations,
        "recommendations": recommendations,
        "timestamp": datetime.now().isoformat(),
    }


def _load_inventory() -> dict:
    """Load the YAML inventory file."""
    path = os.path.join(os.path.dirname(__file__), "..", "inventory", "devices.yaml")
    if not os.path.exists(path):
        return {"devices": []}
    with open(path, "r") as f:
        return yaml.safe_load(f) or {"devices": []}
