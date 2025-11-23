import { Palette, Smartphone, Zap, Lock, Globe, MessageSquare } from 'lucide-react';

const features = [
    {
        name: 'Visual Configurator',
        description: 'Customize every aspect of your widget with our real-time visual editor. Change colors, fonts, and layout instantly.',
        icon: Palette,
    },
    {
        name: 'Multi-Device Preview',
        description: 'Ensure your widget looks perfect on every screen. Preview on desktop, tablet, and mobile devices with a single click.',
        icon: Smartphone,
    },
    {
        name: 'N8n Integration',
        description: 'Connect seamlessly to your N8n workflows via webhooks. Send and receive messages, files, and custom data.',
        icon: Zap,
    },
    {
        name: 'Enterprise Security',
        description: 'Built with security in mind. Role-based access control, secure authentication, and data encryption.',
        icon: Lock,
    },
    {
        name: 'Global Deployment',
        description: 'Deploy your widget anywhere. Get a hosted link, embed code, or download a standalone package.',
        icon: Globe,
    },
    {
        name: 'Rich Interactions',
        description: 'Support for file attachments, markdown, code blocks, and rich media responses out of the box.',
        icon: MessageSquare,
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
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                                        <feature.icon className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-400">
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
