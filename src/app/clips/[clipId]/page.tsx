import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getClipByIdServer } from '@/lib/server/clips';
import SingleClipClient from './SingleClipClient';

interface SingleClipPageProps {
  params: Promise<{ clipId: string }>;
}

export async function generateMetadata({
  params,
}: SingleClipPageProps): Promise<Metadata> {
  const { clipId } = await params;
  const clip = await getClipByIdServer(clipId);

  if (!clip) {
    return {
      title: 'Clip Not Found • ClipSesh',
      description: 'The requested Beat Saber clip could not be found or has been unlisted.',
    };
  }

  const title = `${clip.title} • Clip by ${clip.streamer}`;
  const description = `Watch and rate "${clip.title}" on ClipSesh, submitted by ${clip.submitter || 'Community'} for ${clip.season || 'Season'} ${clip.year || ''}.`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clipsesh.spoekle.com';
  let imageUrl = clip.thumbnail || '/media/banner1.png';
  if (!imageUrl.startsWith('http')) {
    imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  const rawVideo = (clip as any).videoUrl || clip.url;
  const videoUrl = rawVideo
    ? rawVideo.startsWith('http')
      ? rawVideo
      : `${baseUrl}${rawVideo.startsWith('/') ? '' : '/'}${rawVideo}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'video.other',
      images: [
        {
          url: imageUrl,
          width: 1280,
          height: 720,
          alt: clip.title,
        },
      ],
      videos: videoUrl
        ? [
            {
              url: videoUrl,
              type: 'video/mp4',
              width: 1280,
              height: 720,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SingleClipPage({ params }: SingleClipPageProps) {
  const { clipId } = await params;
  const clip = await getClipByIdServer(clipId);

  if (!clip) {
    notFound();
  }

  return <SingleClipClient initialClip={clip} clipId={clipId} />;
}
