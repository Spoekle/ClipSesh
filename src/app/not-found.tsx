import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="max-w-md w-full shadow-2xl text-foreground">
        <h1 className="text-7xl sm:text-8xl font-black text-cc-red mb-3 tracking-tight">
          404
        </h1>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button render={<Link href="/clips" />} size="lg" className="w-full">
          Return to Clips
        </Button>
      </div>
    </div>
  );
}
