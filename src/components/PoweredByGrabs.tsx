export default function PoweredByGrabs() {
    return (
        <div className="transition duration-200 bg-[#0f0f0f] pb-8">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
                <div className="bg-[#141414] rounded-xl border border-[#262626] py-3 px-4 text-center">
                    <div className="text-[#aaaaaa] text-xs">
                        This website is powered by
                        <a
                            href="https://grabssoftware.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-[#f23030] hover:underline font-medium transition-colors duration-150"
                        >
                            Grabs Software
                        </a>
                        .
                    </div>
                </div>
            </div>
        </div>
    );
}