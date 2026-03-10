export interface Agent {
    agentId: string;
    hostName: string;
    os: string;
    platform: string
    arch: string;
    cpuCores: number;
    totalMemory: number;
    version: string;
    lastSeen: string;
    status: string;
    diskSize: number;
}