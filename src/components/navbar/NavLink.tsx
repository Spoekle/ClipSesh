'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLinkProps {
  to: string;
  end?: boolean;
  className?: string | ((props: { isActive: boolean }) => string);
  children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
  onClick?: () => void;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, end, className, children, onClick }) => {
  const pathname = usePathname();
  const isActive = end || to === '/' ? pathname === to : pathname.startsWith(to);
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;
  const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children;

  return (
    <Link href={to} className={resolvedClass} onClick={onClick}>
      {resolvedChildren}
    </Link>
  );
};

export default NavLink;
