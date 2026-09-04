import type { FlamegraphNode, ProfileType } from "@/types/profile"

export interface FlamegraphFrame {
    node: FlamegraphNode
    x: number
    y: number
    width: number
    depth: number
}

export function layoutFlamegraph(root: FlamegraphNode, canvasWidth = 1000): FlamegraphFrame[] {
    const frames: FlamegraphFrame[] = []
    const visit = (node: FlamegraphNode, x: number, depth: number, width: number) => {
        frames.push({ node, x, y: depth * 28, width, depth })
        let childX = x
        for (const child of node.children) {
            const childWidth = node.value > 0 ? width * Math.max(0, child.value) / node.value : 0
            if (childWidth > 0) visit(child, childX, depth + 1, childWidth)
            childX += childWidth
        }
    }
    visit(root, 0, 0, canvasWidth)
    return frames
}

export function topFunctions(root: FlamegraphNode, limit = 10): { name: string; value: number }[] {
    const totals = new Map<string, number>()
    const visit = (node: FlamegraphNode) => {
        if (node !== root) totals.set(node.name, (totals.get(node.name) ?? 0) + node.value)
        node.children.forEach(visit)
    }
    visit(root)
    return [...totals].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, limit)
}

export function profileSampleTypes(type: ProfileType): string[] {
    switch (type) {
    case "cpu": return ["cpu", "samples"]
    case "heap":
    case "allocs": return ["inuse_space", "inuse_objects", "alloc_space", "alloc_objects"]
    case "mutex":
    case "block": return ["delay", "contentions"]
    case "goroutine": return ["goroutine"]
    case "threadcreate": return ["threadcreate"]
    case "trace": return []
    }
}
