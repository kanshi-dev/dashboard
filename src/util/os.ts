const icons: Record<string, string> = {
    ubuntu: "/images/os-icons/ubuntu.svg",
    centos: "/images/os-icons/centos.svg",
    debian: "/images/os-icons/debian.svg",
    amzn: "/images/os-icons/amazon-linux.svg",
    darwin: "/images/os-icons/apple.svg",
    windows: "/images/os-icons/windows.svg",
    linux: "/images/os-icons/linux.svg",
}

export const osIcon = (platform: string) => icons[platform] ?? icons.linux
