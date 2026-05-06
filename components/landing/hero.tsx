import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BRAND_DESCRIPTION } from '@/lib/brand';
import { HeroPreview } from './hero-preview';

export function Hero() {
    return (
        <div className="relative isolate overflow-hidden pt-14">
            {/* Background Gradients */}
            <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                aria-hidden="true"
            >
                <div
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>

            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-zinc-400 ring-1 ring-white/10 hover:ring-white/20">
                            <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                                New: AI-Powered Widget Generation
                                <Link href="/auth/signup" className="font-semibold text-indigo-400 ml-2">
                                    <span className="absolute inset-0" aria-hidden="true" />
                                    Try it out <span aria-hidden="true">&rarr;</span>
                                </Link>
                            </span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                        Build Beautiful Chat Widgets in Minutes
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-zinc-400">
                        {BRAND_DESCRIPTION}
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/auth/signup">
                            <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border-0">
                                Start Building Free
                            </Button>
                        </Link>
                        <Link href="/demo">
                            <Button variant="link" className="text-white gap-2">
                                View Demo <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Hero Image / Preview */}
                <div className="mt-16 flow-root sm:mt-24">
                    <div className="-m-2 rounded-xl bg-white/5 p-2 ring-1 ring-inset ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4 backdrop-blur-sm">
                        <div className="rounded-md bg-zinc-900/50 shadow-2xl ring-1 ring-white/10 overflow-hidden">
                            <HeroPreview />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Gradient */}
            <div
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                aria-hidden="true"
            >
                <div
                    className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>
        </div>
    );
}
