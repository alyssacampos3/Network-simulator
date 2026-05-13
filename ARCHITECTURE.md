---
# Network Device Inventory
# This file defines all managed network devices.
# Used by automation scripts for config backup, health checks, and compliance.

devices:
  - hostname: Router1
    ip: 192.168.1.1
    device_type: router
    interfaces:
      - name: GigabitEthernet0/0
        ip: 192.168.1.1
        mask: 255.255.255.0
      - name: GigabitEthernet0/1
        ip: 10.0.0.1
        mask: 255.255.255.0
    vlans: []

  - hostname: Router2
    ip: 10.0.0.2
    device_type: router
    interfaces:
      - name: GigabitEthernet0/0
        ip: 10.0.0.2
        mask: 255.255.255.0
      - name: GigabitEthernet0/1
        ip: 172.16.0.1
        mask: 255.255.255.0
    vlans: []

  - hostname: Switch1
    ip: 192.168.1.2
    device_type: switch
    interfaces:
      - name: FastEthernet0/1
        ip: 192.168.1.2
        mask: 255.255.255.0
      - name: FastEthernet0/2
      - name: FastEthernet0/3
      - name: FastEthernet0/4
    vlans: [10, 20, 30]

  - hostname: Switch2
    ip: 172.16.0.2
    device_type: switch
    interfaces:
      - name: FastEthernet0/1
        ip: 172.16.0.2
        mask: 255.255.255.0
      - name: FastEthernet0/2
      - name: FastEthernet0/3
    vlans: [10, 20]

  - hostname: Firewall1
    ip: 192.168.1.254
    device_type: firewall
    interfaces:
      - name: outside
        ip: 203.0.113.1
        mask: 255.255.255.0
      - name: inside
        ip: 192.168.1.254
        mask: 255.255.255.0
      - name: dmz
        ip: 172.16.100.1
        mask: 255.255.255.0
    vlans: []

  - hostname: PC1
    ip: 192.168.1.10
    device_type: pc
    interfaces:
      - name: Ethernet0
        ip: 192.168.1.10
        mask: 255.255.255.0
    vlans: []

  - hostname: PC2
    ip: 172.16.0.10
    device_type: pc
    interfaces:
      - name: Ethernet0
        ip: 172.16.0.10
        mask: 255.255.255.0
    vlans: []
