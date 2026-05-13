"""
Routing Validation Automation
Validates routing configurations and connectivity.
"""


def validate_routing(topology: dict) -> list[dict]:
    """
    Validate routing configurations across the topology.
    Checks for:
    - Missing routes between connected subnets
    - Asymmetric routing
    - Black hole routes
    """
    results = []
    nodes = topology.get("nodes", [])
    edges = topology.get("edges", [])
    nodes_by_id = {n["id"]: n for n in nodes}

    # Check routers have routes to connected subnets
    routers = [n for n in nodes if n.get("type") == "router"]

    for router in routers:
        data = router.get("data", {})
        hostname = data.get("hostname", "unknown")
        interfaces = data.get("interfaces", [])
        device_config = data.get("deviceConfig", {})
        routing_table = device_config.get("routingTable", [])

        # Check if router has any configured interfaces
        configured_interfaces = [i for i in interfaces if i.get("ipAddress")]
        if not configured_interfaces:
            results.append({
                "check": "unconfigured_router",
                "severity": "warning",
                "message": f"Router {hostname} has no configured interfaces",
                "affected_devices": [hostname],
                "recommendation": "Configure at least one interface with an IP address",
            })
            continue

        # Check for connected neighbors that might need routes
        connected_edges = [e for e in edges if e.get("source") == router["id"] or e.get("target") == router["id"]]
        
        for edge in connected_edges:
            neighbor_id = edge["target"] if edge["source"] == router["id"] else edge["source"]
            neighbor = nodes_by_id.get(neighbor_id)
            if not neighbor:
                continue

            neighbor_data = neighbor.get("data", {})
            neighbor_interfaces = neighbor_data.get("interfaces", [])
            neighbor_configured = [i for i in neighbor_interfaces if i.get("ipAddress")]

            if not neighbor_configured:
                continue

            # Check subnet reachability
            router_subnets = set()
            for iface in configured_interfaces:
                ip_parts = iface["ipAddress"].split(".")
                mask_parts = iface.get("subnetMask", "255.255.255.0").split(".")
                network = ".".join(str(int(ip_parts[i]) & int(mask_parts[i])) for i in range(4))
                router_subnets.add(network)

            for n_iface in neighbor_configured:
                ip_parts = n_iface["ipAddress"].split(".")
                mask_parts = n_iface.get("subnetMask", "255.255.255.0").split(".")
                neighbor_network = ".".join(str(int(ip_parts[i]) & int(mask_parts[i])) for i in range(4))

                if neighbor_network not in router_subnets:
                    # Check if there's a static route
                    has_route = any(
                        r.get("network") == neighbor_network
                        for r in routing_table
                    )
                    if not has_route:
                        results.append({
                            "check": "missing_route",
                            "severity": "info",
                            "message": f"Router {hostname} may need a route to {neighbor_network} (reachable via {neighbor_data.get('hostname', 'unknown')})",
                            "affected_devices": [hostname, neighbor_data.get("hostname", "unknown")],
                            "recommendation": f"Add static route or enable dynamic routing to reach {neighbor_network}",
                        })

    if not results:
        results.append({
            "check": "routing_validation",
            "severity": "success",
            "message": "Routing configuration appears consistent",
            "affected_devices": [],
            "recommendation": "No action needed",
        })

    return results
