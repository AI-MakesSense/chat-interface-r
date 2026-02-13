import { Palette, Smartphone, Zap, Lock, Globe, MessageSquare, LucideIcon } from 'lucide-react';

interface Feature {
    name: string;
    description: string;
    icon: LucideIcon;
    gradient: string;
}

const features: Feature[] = [
    {
        name: 'Visual Configurator',
        description: 'Customize every aspect of your widget with our real-time visual editor. Change colors, fonts, and layout instantly.',
        icon: Palette,
        gradient: 'from-violet-500/20 to-purple-500/20',
    },
    {
        name: 'Multi-Device Preview',
        description: 'Ensure your widget looks perfect on every screen. Preview on desktop, tablet, and mobile devices with a single click.',
        icon: Smartphone,
        gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
        name: 'Workflow Integration',
        description: 'Connect seamlessly to your AI workflows via webhooks. Send and receive messages, files, and custom data.',
        icon: Zap,
        gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
        name: 'Enterprise Security',
        description: 'Built with security in mind. Role-based access control, secure authentication, and data encryption.',
        icon: Lock,
        gradient: 'from-emerald-500/20 to-green-500/20',
    },
    {
        name: 'Global Deployment',
        description: 'Deploy your widget anywhere. Get a hosted link, embed code, or download a standalone package.',
        icon: Globe,
        gradient: 'from-sky-500/20 to-blue-500/20',
    },
    {
        name: 'Rich Interactions',
        description: 'Support for file attachments, markdown, code blocks, and rich media responses out of the box.',
        icon: MessageSquare,
        gradient: 'from-pink-500/20 to-rose-500/20',
    },
];

export function Features() {
    return (
        <div className="bg-black py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-400">Everything you need</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Powerful features for modern chat interfaces
                    </p>
                    <p className="mt-6 text-lg leading-8 text-zinc-400">
                        Stop building chat widgets from scratch. Our platform gives you a production-ready widget engine that connects directly to your AI workflows.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-8 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => (
                            <div
                                key={feature.name}
                                className="group relative flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-lg hover:shadow-black/20"
                            >
                                {/* Gradient accent */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                <dt className="relative flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                                        <feature.icon className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="relative mt-4 flex flex-auto flex-col text-sm leading-6 text-zinc-400">
                                    <p className="flex-auto">{feature.description}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
