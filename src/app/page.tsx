import { getLatestClipsServer, getPublicConfigServer } from '@/lib/server/clips';
import HomePageClient from './HomePageClient';

// Latest clips and the season countdown must be computed per request, not baked in at build time.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [initialConfig, initialClips] = await Promise.all([
    getPublicConfigServer(),
    getLatestClipsServer(5),
  ]);

  return (
    <HomePageClient
      initialConfig={initialConfig}
      initialClips={initialClips}
    />
  );
}