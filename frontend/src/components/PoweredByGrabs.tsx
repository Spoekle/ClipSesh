export default function PoweredByGrabs() {

    return (
        <footer className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white transition duration-200">
            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Social Media & Copyright */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 rounded-xl py-4 px-4 justify-between items-center text-center transition duration-200">
                    <div className="text-neutral-400 text-md">
                        This website is powered by
                        <a
                            href="https://grabssoftware.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                        >
                            Grabs Software
                        </a>
                        .
                    </div>
                </div>
            </div>
        </footer>
    );
}