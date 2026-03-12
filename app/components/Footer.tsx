export function Footer() {
    return (
        <footer className="mt-12 pt-8 pb-6 border-t border-obsidian-800 text-industrial-400 font-mono text-[10px] uppercase tracking-widest" data-px-machine="true">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p>
                            SYSTEM DEPLOYED BY{' '}
                            <span className="font-bold text-industrial-50">PARALLAX MACHINE INC</span>
                        </p>
                    </div>

                    <div>
                        <a
                            href="mailto:parallaxmachineinc@gmail.com"
                            className="inline-flex items-center gap-2 group hover:text-electric-500 transition-colors"
                        >
                            <svg className="w-4 h-4 text-electric-500 group-hover:text-electric-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            CONTACT_SYS_ADMIN
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
