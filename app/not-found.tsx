import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-100">404</h1>
          <h2 className="text-2xl font-semibold text-gray-300">
            Page Not Found
          </h2>
          <p className="text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
          <Link href="/chat">
            <Button variant="secondary">Start Chatting</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
