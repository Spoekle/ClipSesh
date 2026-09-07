'use client';

import dynamic from 'next/dynamic';
import RequireAuth from '@/components/RequireAuth';

const EditorDash = dynamic(() => import('@/views/EditorDash'), { ssr: false });

export default function EditorPage() {
  return (
    <RequireAuth isEditorRequired={true}>
      <EditorDash />
    </RequireAuth>
  );
}