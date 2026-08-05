export function bytesToGB(bytes: number): string {
    const gb = bytes / (1024 ** 3)
    return `${gb.toFixed(1)} GB`
}

export function bytesPerSecond(value: number): string {
    const units = ["B/s", "KiB/s", "MiB/s", "GiB/s"]
    let amount = value
    let unit = 0
    while (amount >= 1024 && unit < units.length - 1) {
        amount /= 1024
        unit++
    }
    return `${amount.toFixed(amount >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}
