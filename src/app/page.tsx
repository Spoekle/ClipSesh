import { getLatestClipsServer, getPublicConfigServer } from '@/lib/server/clips';
import HomePageClient from './HomePageClient';

export default async function HomePage() {
  const [initialConfig, initialClips] = await Promise.all([
    getPublicConfigServer(),
    getLatestClipsServer(4),
  ]);

  return (
    <HomePageClient
      initialConfig={initialConfig}
      initialClips={initialClips}
    />
  );
}