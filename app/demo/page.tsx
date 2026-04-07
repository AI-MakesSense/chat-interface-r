'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles, Zap, Download, Code, Chrome, Globe } from 'lucide-react';

export default function DemoPage() {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: 'Welcome to N8n Widget Designer',
            description: 'Create beautiful, customizable chat widgets for your N8n workflows without writing code.',
            icon: Sparkles,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'Design Your Widget',
            description: 'Use our visual configurator with 70+ customization options. Customize colors, fonts, positioning, and features.',
            icon: Zap,
            color: 'from-purple-500 to-pink-500',
            link: '/configurator',
            linkText: 'Try Configurator',
        },
        {
            title: 'Preview in Real-Time',
            description: 'See your changes instantly across desktop, mobile, and tablet views. What you see is what you get.',
            icon: Globe,
            color: 'from-green-500 to-emerald-500',
        },
        {
            title: 'Download & Deploy',
            description: 'Get ready-to-use packages: Website widget, Portal page, or Chrome extension. All with one click.',
            icon: Download,
            color: 'from-orange-500 to-red-500',
        },
        {
            title: 'Embed Anywhere',
            description: 'Add a single script tag to your website. Your widget loads instantly with all your custom settings.',
            icon: Code,
            color: 'from-indigo-500 to-purple-500',
        },
    ];

    const features = [
        { name: 'Visual Configurator', description: '70+ customization options' },
        { name: 'Real-time Preview', description: 'Desktop, mobile, tablet views' },
        { name: 'Multi-tier Licensing', description: 'Basic, Pro, and Agency plans' },
        { name: 'Domain Security', description: 'Authorize specific domains' },
        { name: 'Version Control', description: 'Track widget deployments' },
        { name: 'Package Downloads', description: 'Website, Portal, Extension' },
    ];

    const currentStepData = steps[currentStep];
    const Icon = currentStepData.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200/50 bg-white/50 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/50">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            N8n Widget Designer
                        </Link>
                        <div className="flex gap-4">
                            <Link
                                href="/auth/login"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Current Step Display */}
                <div className="mb-16 text-center">
                    <div className="mb-8 flex justify-center">
                        <div className={`rounded-2xl bg-gradient-to-br ${currentStepData.color} p-4 shadow-2xl shadow-${currentStepData.color.split('-')[1]}-500/30`}>
                            <Icon className="h-12 w-12 text-white" strokeWidth={2} />
                        </div>
                    </div>

                    <h1 className="mb-4 text-5xl font-bold text-slate-900 dark:text-white">
                        {currentStepData.title}
                    </h1>

                    <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                        {currentStepData.description}
                    </p>

                    {currentStepData.link && (
                        <Link
                            href={currentStepData.link}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                        >
                            {currentStepData.linkText}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>

                {/* Step Navigation */}
                <div className="mb-16 flex justify-center gap-2">
                    {steps.map((step, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={`h-3 rounded-full transition-all ${index === currentStep
                                    ? 'w-12 bg-gradient-to-r from-blue-600 to-indigo-600'
                                    : 'w-3 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                                }`}
                            aria-label={`Go to step ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="mb-16 flex justify-center gap-4">
                    <button
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                        disabled={currentStep === steps.length - 1}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Features Grid */}
                <div className="mb-16">
                    <h2 className="mb-8 text-center text-3xl font-bold text-slate-900 dark:text-white">
                        Platform Features
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 p-2">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {feature.name}
                                    </h3>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 text-center shadow-2xl shadow-blue-500/30">
                    <h2 className="mb-4 text-4xl font-bold text-white">
                        Ready to Get Started?
                    </h2>
                    <p className="mb-8 text-xl text-blue-100">
                        Create your first widget in less than 5 minutes
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-medium text-blue-600 shadow-xl transition-all hover:scale-105"
                        >
                            Sign Up Free
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
                        >
                            View Dashboard
                        </Link>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-16 grid gap-6 sm:grid-cols-3">
                    <Link
                        href="/auth/login"
                        className="group rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        <div className="mb-2 text-2xl">🔐</div>
                        <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Login</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Access your account
                        </p>
                    </Link>

                    <Link
                        href="/dashboard"
                        className="group rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        <div className="mb-2 text-2xl">📊</div>
                        <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Dashboard</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Manage your widgets
                        </p>
                    </Link>

                    <Link
                        href="/configurator"
                        className="group rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        <div className="mb-2 text-2xl">⚙️</div>
                        <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Configurator</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Design your widget
                        </p>
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-24 border-t border-slate-200 bg-white/50 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                        <p className="mb-2">N8n Widget Designer Platform</p>
                        <p>
                            Read the{' '}
                            <a
                                href="/DEMOGUIDE.md"
                                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                Full Demo Guide
                            </a>
                            {' '}or{' '}
                            <a
                                href="/QUICKSTART.md"
                                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                Quick Start Guide
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
