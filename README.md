# 🌐 AI-Assisted Network Simulator & Automation Platform

![Network Lab](docs/screenshots/dark-theme-full.png)

> Interactive network simulator combining topology visualization, CLI simulation, AI-assisted troubleshooting, device health monitoring, and automation workflows — built for network engineering learning and operational efficiency.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

---

## 🎯 Demo

![Demo GIF](docs/demo.gif)

---

## ✨ Features

### Topology Visualization
- Drag-and-drop network topology builder
- Device types: Routers, Switches, PCs, Firewalls, Cloud nodes
- Interactive link creation with cable type selection (Ethernet/Serial)
- Interface labeling and VLAN visualization
- Real-time device status indicators

![Topology Builder](docs/screenshots/topology-builder.png)

### CLI Terminal Simulation
- Simulated Cisco IOS-style CLI per device
- Dynamic output based on live topology state
- Supported commands:
  - `show ip interface brief` · `show running-config` · `show vlan`
  - `show ip route` · `show interfaces` · `show spanning-tree`
  - `show arp` · `show cdp neighbors` · `show version`
  - `ping <ip>` · `traceroute <ip>` · `ipconfig`

![CLI Terminal](docs/screenshots/cli-terminal.png)

### AI-Assisted Troubleshooting Engine
- Automatic issue detection across the topology
- Root cause analysis correlating multiple symptoms
- Suggested CLI commands for diagnosis
- Educational explanations for each issue
- Incident severity classification (Critical / Warning / Info)

![AI Troubleshooting](docs/screenshots/ai-troubleshoot.png)

### Device Health Dashboard
- Real-time metrics: CPU, Memory, Latency, Packet Drops
- Network health score (0-100)
- Per-device status monitoring
- Interface error tracking
- Auto-refreshing every 5 seconds

![Health Dashboard](docs/screenshots/health-dashboard.png)

### Configuration Risk Analyzer
- Pre-deployment configuration validation
- Detects: duplicate IPs, subnet mismatches, missing gateways
- Identifies single points of failure
- Risk severity levels with recommendations

![Config Risk](docs/screenshots/config-risk.png)

### Packet Flow Simulation
- Visual packet traversal between devices
- Shows successful delivery, drops, and routing decisions
- Protocol-aware (ICMP, ARP)
- Hop-by-hop path tracing

![Packet Flow](docs/screenshots/packet-flow.png)

### Traffic Analyzer
- Real-time traffic event logging
- Protocol breakdown (ICMP, ARP, TCP)
- Source/destination tracking
- Latency and hop count metrics

![Traffic Analyzer](docs/screenshots/traffic-analyzer.png)

### Educational Mode
- Beginner-friendly explanations for networking concepts
- Topics: VLANs, Routing, OSPF, STP, ARP, DHCP, DNS, ACLs, Subnetting, NAT
- Related CLI commands for each topic
- Translates technical outputs into plain language

![Educational Mode](docs/screenshots/educational-mode.png)

### Incident Timeline Generator
- Automated event timelines for detected issues
- Severity-coded events (Critical, Warning, Info)
- Correlated incident chains
- Timestamp-based event ordering

### Logging System
- Centralized log viewer
- Categories: Interface changes, routing changes, failed pings, automation tasks
- Filterable by severity and source

### Python Automation Engine (Backend)
- FastAPI-based automation server
- Config backup automation
- Device health checks
- VLAN and routing validation
- Configuration compliance scanning
- YAML-based device inventory

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
├──────────┬──────────┬───────────┬───────────┬───────────┤
│ Topology │   CLI    │  Health   │    AI     │  Traffic  │
│  Canvas  │ Terminal │ Dashboard │ Troublesh │ Analyzer  │
├──────────┴──────────┴───────────┴───────────┴───────────┤
│              State Management (Zustand)                   │
├──────────┬──────────┬───────────┬───────────┬───────────┤
│ Network  │ Traffic  │ Animation │  Logger   │ Scheduler │
│  Store   │  Store   │   Store   │   Store   │   Store   │
├──────────┴──────────┴───────────┴───────────┴───────────┤
│                  Engine Layer                             │
├──────────┬──────────┬───────────┬───────────┬───────────┤
│   CLI    │   ARP    │Pathfinder │Troubleshoot│ Config   │
│  Engine  │  Engine  │  Engine   │  Engine   │  Risk    │
├──────────┴──────────┴───────────┴───────────┴───────────┤
│              Persistence Layer                            │
├──────────┬──────────┬───────────────────────────────────┤
│ Storage  │Serializer│  URL Encoder  │   Validator       │
└──────────┴──────────┴───────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────┐
│               Backend (Python / FastAPI)                  │
├──────────┬──────────┬───────────┬───────────────────────┤
│  Config  │  Health  │   VLAN    │   Compliance          │
│  Backup  │  Checks  │Validation │    Scanner            │
├──────────┴──────────┴───────────┴───────────────────────┤
│              YAML Device Inventory                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+ (for backend)

### Frontend

```bash
cd network-simulator
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Backend (Optional)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at **http://localhost:8000/docs**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Visualization | React Flow |
| State | Zustand |
| Build | Vite |
| Testing | Vitest |
| Backend | Python, FastAPI |
| Data | YAML, JSON |
| Deployment | Vercel (frontend), Docker (backend) |

---

## 📁 Project Structure

```
network-simulator/
├── src/
│   ├── components/          # React UI components
│   │   ├── nodes/           # Custom React Flow node types
│   │   ├── TopologyCanvas   # Main network canvas
│   │   ├── CLITerminal      # Device CLI simulation
│   │   ├── HealthDashboard  # Device monitoring
│   │   ├── TroubleshootPanel# AI diagnostics
│   │   ├── ConfigRiskPanel  # Config validation
│   │   └── EducationalPanel # Learning mode
│   ├── engine/              # Core simulation logic
│   │   ├── cli.ts           # CLI command processor
│   │   ├── pathfinder.ts    # Packet routing engine
│   │   ├── arp.ts           # ARP table simulation
│   │   ├── troubleshoot.ts  # AI troubleshooting
│   │   ├── configRisk.ts    # Config risk analysis
│   │   ├── incidents.ts     # Incident timeline
│   │   └── healthMetrics.ts # Device health simulation
│   ├── store/               # Zustand state stores
│   ├── persistence/         # Save/load/URL encoding
│   ├── types/               # TypeScript interfaces
│   └── data/                # Lab scenarios
├── backend/                 # Python FastAPI server
│   ├── main.py              # API entry point
│   ├── automation/          # Automation scripts
│   └── inventory/           # YAML device definitions
├── docs/                    # Screenshots & architecture
└── package.json
```

---

## 💡 What This Project Demonstrates

| Skill | How It's Shown |
|-------|---------------|
| **Network Automation** | Python automation scripts, config backup, compliance scanning |
| **Infrastructure Operations** | Health monitoring, device metrics, alerting |
| **Troubleshooting Workflows** | AI-assisted diagnostics, root cause analysis, incident timelines |
| **Python Scripting** | FastAPI backend, Netmiko-style automation concepts |
| **Systems Thinking** | End-to-end topology simulation with cascading failure detection |
| **Observability Engineering** | Health dashboard, traffic analysis, centralized logging |
| **AI-Assisted Diagnostics** | Automated issue detection, correlation, and recommendations |
| **Frontend Engineering** | React, TypeScript, state management, responsive UI |
| **Technical Documentation** | Architecture diagrams, feature docs, setup guides |

---

## 🔮 Future Roadmap

- [ ] Multi-user collaboration (WebSocket)
- [ ] Real device integration (SSH/Netmiko)
- [ ] AI chatbot assistant (LLM-powered)
- [ ] Configuration diff engine
- [ ] Security event simulation
- [ ] SIEM integration
- [ ] Cloud networking simulation (AWS VPC)
- [ ] Grafana/Prometheus integration
- [ ] Docker deployment
- [ ] SNMP polling

---

## 📄 License

MIT

---

*Built as a portfolio project demonstrating network engineering, automation, and full-stack development skills.*
