export function Footer() {
    return (
        <footer className="rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-sm text-gray-300">
                            Created and Managed by{' '}
                            <span className="font-semibold text-white">Parallax Machine Inc</span>
                        </p>
                    </div>

                    <div>
                        <a
                            href="mailto:parallaxmachineinc@gmail.com"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                            Contact Us
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
