'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  useRouter as useNextRouter,
  usePathname as useNextPathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';

export interface Location {
  pathname: string;
  search: string;
  state: any;
  hash: string;
}

export type NavigateTarget = string | number | { pathname?: string; search?: string };

export function useNavigate() {
  const router = useNextRouter();
  return (to: NavigateTarget, options?: { replace?: boolean; state?: any }) => {
    try {
      if (typeof to === 'number') {
        if (to === -1) router.back();
        else if (to === 1) router.forward();
      } else if (typeof to === 'object') {
        const url = `${to.pathname || ''}${to.search || ''}`;
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.pathname + (window.location.search || '');
          if (url === currentUrl) return;
        }
        if (options?.replace) {
          router.replace(url);
        } else {
          router.push(url);
        }
      } else {
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.pathname + (window.location.search || '');
          if (to === currentUrl) return;
        }
        if (options?.replace) {
          router.replace(to);
        } else {
          router.push(to);
        }
      }
    } catch (err) {
      console.warn('Navigation suppressed/error:', err);
    }
  };
}

export function useLocation(): Location {
  const pathname = useNextPathname() || '/';
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  return {
    pathname,
    search,
    state: null,
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
}

export function useParams<T extends Record<string, string | string[] | undefined> = Record<string, string>>(): T {
  const params = useNextParams();
  return (params || {}) as T;
}

const EMPTY_SEARCH_PARAMS = new URLSearchParams();

function normalizeQueryString(q: string): string {
  const clean = q.startsWith('?') ? q.slice(1) : q;
  if (!clean) return '';
  const sp = new URLSearchParams(clean);
  return Array.from(sp.entries())
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useNextRouter();
  const pathname = useNextPathname();

  const setSearchParams = React.useCallback((
    nextInit: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams),
    navigateOpts?: { replace?: boolean }
  ) => {
    let nextParams: URLSearchParams;
    if (typeof nextInit === 'function') {
      nextParams = nextInit(new URLSearchParams(searchParams?.toString() || ''));
    } else if (nextInit instanceof URLSearchParams) {
      nextParams = nextInit;
    } else {
      nextParams = new URLSearchParams(nextInit);
    }
    const query = nextParams.toString();
    const currentPath = pathname || '/';
    const currentQuery = searchParams?.toString() || '';
    
    // Guard against identical navigation to avoid infinite re-render loops
    if (normalizeQueryString(query) === normalizeQueryString(currentQuery)) {
      return;
    }

    const url = query ? `${currentPath}?${query}` : currentPath;
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + (window.location.search ? window.location.search : '');
      if (currentUrl === url || (window.location.pathname === currentPath && normalizeQueryString(window.location.search) === normalizeQueryString(query))) {
        return;
      }
    }

    try {
      if (navigateOpts?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    } catch (err) {
      console.warn('setSearchParams navigation error:', err);
    }
  }, [router, pathname, searchParams]);

  return [searchParams || EMPTY_SEARCH_PARAMS, setSearchParams] as const;
}

export interface CompatLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string | { pathname?: string; search?: string };
  href?: string | { pathname?: string; search?: string };
  replace?: boolean;
  state?: any;
}

export const Link = React.forwardRef<HTMLAnchorElement, CompatLinkProps>(
  ({ to, href, children, ...props }, ref) => {
    const rawTarget = href || to;
    let targetHref = '#';
    if (typeof rawTarget === 'object' && rawTarget !== null) {
      targetHref = `${rawTarget.pathname || ''}${rawTarget.search || ''}`;
    } else if (typeof rawTarget === 'string') {
      targetHref = rawTarget;
    }

    return (
      <NextLink ref={ref} href={targetHref} {...props}>
        {children}
      </NextLink>
    );
  }
);
Link.displayName = 'Link';

export interface CompatNavLinkProps
  extends Omit<CompatLinkProps, 'className' | 'children'> {
  className?: string | ((props: { isActive: boolean }) => string);
  activeClassName?: string;
  end?: boolean;
  children?: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
}

export const NavLink = React.forwardRef<HTMLAnchorElement, CompatNavLinkProps>(
  (
    { to, href, className, activeClassName = 'active', end, children, ...props },
    ref
  ) => {
    const pathname = useNextPathname();
    const rawTarget = href || to;
    let targetHref = '#';
    if (typeof rawTarget === 'object' && rawTarget !== null) {
      targetHref = `${rawTarget.pathname || ''}${rawTarget.search || ''}`;
    } else if (typeof rawTarget === 'string') {
      targetHref = rawTarget;
    }

    const currentPath = pathname || '/';
    const isActive = end ? currentPath === targetHref : currentPath.startsWith(targetHref);

    let computedClassName = '';
    if (typeof className === 'function') {
      computedClassName = className({ isActive });
    } else if (className) {
      computedClassName = isActive && activeClassName ? `${className} ${activeClassName}` : className;
    }

    const renderedChildren =
      typeof children === 'function' ? children({ isActive }) : children;

    return (
      <NextLink ref={ref} href={targetHref} className={computedClassName} {...props}>
        {renderedChildren}
      </NextLink>
    );
  }
);
NavLink.displayName = 'NavLink';

export function Navigate({ to, replace }: { to: string; replace?: boolean; state?: any }) {
  const router = useNextRouter();
  React.useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}