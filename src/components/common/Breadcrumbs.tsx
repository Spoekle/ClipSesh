import React from 'react';
import { Link } from '@/lib/routerCompat';

export interface BreadcrumbItem {
    label: string;
    path?: string;
    icon?: React.ReactNode;
    onClick?: (e?: React.MouseEvent) => void;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

/**
 * Breadcrumbs navigation component
 * 
 * Usage:
 * ```tsx
 * <Breadcrumbs items={[
 *   { label: 'Home', path: '/', icon: <FaHome /> },
 *   { label: 'Clips', path: '/clips' },
 *   { label: 'Current Clip' } // No path = current page
 * ]} />
 * ```
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
    if (items.length === 0) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            className={`flex items-center text-xs sm:text-sm ${className}`}
        >
            <ol className="flex items-center flex-wrap gap-1.5">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const isFirst = index === 0;

                    return (
                        <li key={index} className="flex items-center">
                            {/* CC Slash Separator */}
                            {!isFirst && (
                                <span
                                    className="mx-1.5 text-[#626262] select-none text-xs font-mono"
                                    aria-hidden="true"
                                >
                                    /
                                </span>
                            )}

                            {/* Breadcrumb item */}
                            {isLast || !item.path ? (
                                // Current page (non-clickable)
                                <span
                                    className="flex items-center gap-1.5 text-white font-medium truncate max-w-[200px] sm:max-w-[300px]"
                                    aria-current="page"
                                >
                                    {item.icon && (
                                        <span className="flex-shrink-0 text-[#8b98a5]">{item.icon}</span>
                                    )}
                                    <span className="truncate">{item.label}</span>
                                </span>
                            ) : (
                                // Clickable link
                                <Link
                                    to={item.path}
                                    onClick={item.onClick}
                                    className="flex items-center gap-1.5 text-[#8b98a5] hover:text-white transition-colors duration-150"
                                >
                                    {item.icon && (
                                        <span className="flex-shrink-0 text-[#8b98a5]">{item.icon}</span>
                                    )}
                                    <span className="truncate max-w-[150px] sm:max-w-none">{item.label}</span>
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
