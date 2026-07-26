import type { ReactNode } from "react"
import { ChevronDown, LogOut } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { clearDashboardKey } from "@/api/api"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/60">
                <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-2 font-medium">
                        <span className="grid h-7 w-7 place-items-center rounded bg-primary font-mono text-sm font-bold text-primary-foreground">K</span>
                        <span>Kanshi</span>
                    </Link>
                    <nav className="ml-6 flex items-center gap-1 text-sm">
                        <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>Fleet</NavLink>
                        <NavLink to="/alerts" className={({ isActive }) => navClass(isActive)}>Alerts</NavLink>
                    </nav>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground">
                                Admin
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Dashboard access</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={clearDashboardKey}>
                                <LogOut />
                                Clear key
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main>{children}</main>
        </div>
    )
}

function navClass(isActive: boolean) {
    return `rounded-md px-2.5 py-1 ${isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`
}
