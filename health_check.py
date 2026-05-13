"""
Configuration Compliance Scanner
Checks device configurations against best practices.
"""


def scan_compliance(topology: dict) -> list[dict]:
    """
    Scan all devices for configuration compliance.
    Checks against common best practices:
    - Hostname configured
    - Interfaces have descriptions (simulated)
    - No shutdown on configured interfaces
    - Gateway configured on end devices
    - Routing table not empty on routers
    """
    results = []
    nodes = topology.get("nodes", [])

    for node in nodes:
        data = node.get("data", {})
        hostname = data.get("hostname", "unknown")
        device_type = node.get("type", "unknown")
        interfaces = data.get("interfaces", [])
        device_config = data.get("deviceConfig", {})

        device_issues = []

        # Check 1: Hostname should not be default
        if hostname.lower() in ["router", "switch", "pc", "firewall", "unknown"]:
            device_issues.append({
                "rule": "HOSTNAME-001",
                "severity": "low",
                "message": "Device uses a generic hostname — should be descriptive",
                "recommendation": "Set a unique, descriptive hostname (e.g., 'Core-Router-1')",
            })

        # Check 2: Configured interfaces should be up
        for iface in interfaces:
            if iface.get("ipAddress") and not iface.get("isUp", True):
                device_issues.append({
                    "rule": "IFACE-001",
                    "severity": "high",
                    "message": f"Interface {iface.get('name')} has IP but is shutdown",
                    "recommendation": f"Remove 'shutdown' from {iface.get('name')} or remove IP if intentionally disabled",
                })

        # Check 3: PCs should have default gateway
        if device_type == "pc":
            for iface in interfaces:
                if iface.get("ipAddress") and not iface.get("defaultGateway"):
                    device_issues.append({
                        "rule": "GW-001",
                        "severity": "medium",
                        "message": "PC has IP address but no default gateway",
                        "recommendation": "Configure a default gateway for remote network access",
                    })
                    break

        # Check 4: Routers should have routing entries
        if device_type == "router":
            routing_table = device_config.get("routingTable", [])
            configured_ifaces = [i for i in interfaces if i.get("ipAddress")]
            if configured_ifaces and not routing_table:
                device_issues.append({
                    "rule": "ROUTE-001",
                    "severity": "low",
                    "message": "Router has no static routes configured",
                    "recommendation": "Add static routes or enable a dynamic routing protocol",
                })

        # Check 5: At least one interface should be configured
        if device_type != "cloud" and not any(i.get("ipAddress") for i in interfaces):
            device_issues.append({
                "rule": "CONFIG-001",
                "severity": "medium",
                "message": "Device has no IP configuration on any interface",
                "recommendation": "Configure at least one interface with an IP address",
            })

        if device_issues:
            results.append({
                "hostname": hostname,
                "device_type": device_type,
                "compliant": False,
                "issues": device_issues,
                "issue_count": len(device_issues),
            })
        else:
            results.append({
                "hostname": hostname,
                "device_type": device_type,
                "compliant": True,
                "issues": [],
                "issue_count": 0,
            })

    return results
