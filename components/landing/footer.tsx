import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/10" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">
                Footer
            </h2>
            <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                                <MessageSquare className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white">
                                Chat Interfacer
                            </span>
                        </div>
                        <p className="text-sm leading-6 text-zinc-400">
                            Building the next generation of conversational interfaces for AI workflows.
                        </p>
                        <div className="flex space-x-6">
                            {/* Social links could go here */}
                        </div>
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Features
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Integrations
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Pricing
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Documentation
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            API Reference
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Status
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            About
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Blog
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Privacy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-sm leading-6 text-zinc-400 hover:text-white">
                                            Terms
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
                    <p className="text-xs leading-5 text-zinc-400">
                        &copy; {new Date().getFullYear()} Chat Interfacer. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
