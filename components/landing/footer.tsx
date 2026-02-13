import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/10" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">
                Footer
            </h2>
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight text-white">
                                {BRAND_NAME}
                            </span>
                            <p className="text-xs text-zinc-500">{BRAND_TAGLINE}</p>
                        </div>
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
                        <Link href="/demo" className="hover:text-white transition-colors">
                            Demo
                        </Link>
                        <Link href="/auth/login" className="hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link href="/auth/signup" className="hover:text-white transition-colors">
                            Get Started
                        </Link>
                    </nav>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-xs text-zinc-500">
                        &copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
