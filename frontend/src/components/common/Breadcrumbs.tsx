import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';

export interface BreadcrumbItem {
    label: string;
    path?: string;
    icon?: React.ReactNode;
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
            className={`flex items-center text-sm ${className}`}
        >
            <ol className="flex items-center flex-wrap gap-1">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const isFirst = index === 0;

                    return (
                        <li key={index} className="flex items-center">
                            {/* Separator */}
                            {!isFirst && (
                                <FaChevronRight
                                    className="w-3 h-3 mx-2 text-neutral-400 dark:text-neutral-500 flex-shrink-0"
                                    aria-hidden="true"
                                />
                            )}

                            {/* Breadcrumb item */}
                            {isLast || !item.path ? (
                                // Current page (non-clickable)
                                <span
                                    className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 font-medium truncate max-w-[200px] sm:max-w-[300px]"
                                    aria-current="page"
                                >
                                    {item.icon && (
                                        <span className="flex-shrink-0">{item.icon}</span>
                                    )}
                                    <span className="truncate">{item.label}</span>
                                </span>
                            ) : (
                                // Clickable link
                                <Link
                                    to={item.path}
                                    className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                >
                                    {item.icon && (
                                        <span className="flex-shrink-0">{item.icon}</span>
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
