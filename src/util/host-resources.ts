export const hostResources = {
    cpu: { label: "CPU", chartTitle: "CPU usage", metric: "cpu.used_percent", network: false },
    memory: { label: "Memory", chartTitle: "Memory usage", metric: "mem.used_percent", network: false },
    disk: { label: "Disk", chartTitle: "Disk usage", metric: "disk.used_percent", network: false },
    networkSend: { label: "Network send", chartTitle: "Network send", metric: "net.bytes_sent_per_second", network: true },
    networkReceive: { label: "Network receive", chartTitle: "Network receive", metric: "net.bytes_recv_per_second", network: true },
} as const

export type HostResource = keyof typeof hostResources
