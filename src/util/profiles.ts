import type { ProfileType } from "@/types/profile"

export function profileDurations(type: ProfileType): number[] {
    if (type === "cpu") return [5, 10, 30]
    if (type === "trace") return [1, 5]
    return [0]
}
