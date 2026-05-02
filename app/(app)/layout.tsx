import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Shell } from '@/components/layout/shell';

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Shell>
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </Shell>
  );
}

// Made with Bob
