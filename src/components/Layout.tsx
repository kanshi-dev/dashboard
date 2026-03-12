import { ReactNode } from "react"
import { Link } from "react-router-dom"
import { 
    ChevronDown, 
    User,
    LogOut,
    Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Top Menu Bar */}
            <header className="border-b bg-card text-card-foreground">
                <div className="flex h-16 items-center px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-lg">K</span>
                            </div>
                            <span className="hidden font-bold md:inline-block">Kanshi</span>
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent/50">
                                    <span className="hidden text-sm font-medium md:inline-block">Admin</span>
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarImage src="" />
                                        <AvatarFallback>A</AvatarFallback>
                                    </Avatar>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
