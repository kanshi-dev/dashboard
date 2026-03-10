export function bytesToGB(bytes: number): string {
    const gb = bytes / (1024 ** 3)
    return `${gb.toFixed(1)} GB`
}