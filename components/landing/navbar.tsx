import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">
                        Chat Interfacer
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link href="/auth/login">
                        <Button variant="ghost" className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth/signup">
                        <Button className="bg-white text-black hover:bg-zinc-200">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
