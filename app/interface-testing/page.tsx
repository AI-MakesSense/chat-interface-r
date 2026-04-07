import React from 'react';

export default function InterfaceTestingPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Header */}
            <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            P
                        </div>
                        <span className="text-xl font-bold tracking-tight">polinger.ai</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                        <a href="#" className="hover:text-blue-600 transition-colors">Products</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Solutions</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Enterprise</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            Log in
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                            Get Started
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8">
                        The Future of <span className="text-blue-600">AI Interfaces</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Seamlessly integrate advanced conversational AI into your digital ecosystem.
                        Polinger.ai empowers your business with intelligent, context-aware interactions.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            Start Building Now
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-900 rounded-full text-lg font-semibold hover:bg-gray-200 transition-all">
                            View Documentation
                        </button>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Intelligent Context', desc: 'Our AI understands the full context of user conversations.' },
                                { title: 'Seamless Integration', desc: 'Deploy in minutes with our universal widget SDK.' },
                                { title: 'Real-time Analytics', desc: 'Gain insights into user behavior and engagement.' },
                            ].map((feature, i) => (
                                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Widget Script */}
            <div id="n8n-chat-undefined"></div>
            <script src="https://chat-interface-r.vercel.app/api/embed/bundle.js" defer></script>
        </div>
    );
}
