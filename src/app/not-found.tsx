import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="max-w-md w-full shadow-2xl text-white">
        <h1 className="text-7xl sm:text-8xl font-black text-[#f23030] mb-3 tracking-tight">
          404
        </h1>
        <h2 className="text-xl font-bold text-white mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-[#8b98a5] mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/clips"
          className="btn btn-primary w-full py-3 rounded-[10px] font-semibold inline-flex items-center justify-center text-sm shadow-lg shadow-[#f23030]/20"
        >
          Return to Clips
        </Link>
      </div>
    </div>
  );
}
