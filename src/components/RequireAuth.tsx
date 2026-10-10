'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../hooks/useUser';

interface RequireAuthProps {
  children: ReactNode;
  isAdminRequired?: boolean;
  isEditorRequired?: boolean;
  isVerifiedRequired?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  isAdminRequired = false,
  isEditorRequired = false,
  isVerifiedRequired = false,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const { data: user, isLoading: authLoading } = useCurrentUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasAdminRole = Boolean(user?.roles?.includes('admin'));
  const hasEditorRole = Boolean(user?.roles?.includes('editor'));
  const hasClipTeamRole = Boolean(user?.roles?.includes('clipteam'));

  const isAuthorized = Boolean(
    user &&
      (!isAdminRequired || hasAdminRole) &&
      (!isEditorRequired || (hasAdminRole || hasEditorRole || hasClipTeamRole)) &&
      (!isVerifiedRequired || (hasAdminRole || hasClipTeamRole))
  );

  // Redirect if mounted, auth loading is finished, and user is not authorized
  useEffect(() => {
    if (!mounted || authLoading) return;

    if (!isAuthorized) {
      router.replace('/clips');
    }
  }, [mounted, authLoading, isAuthorized, router]);

  if (!mounted || authLoading) {
    return null;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;