import { useEffect } from 'react';
import { FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaEllipsisH } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false }) => {
    // Add keyboard navigation for better accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === 'ArrowRight' && currentPage < totalPages) {
                onPageChange(currentPage + 1);
            } else if (e.key === 'ArrowLeft' && currentPage > 1) {
                onPageChange(currentPage - 1);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, onPageChange]);

    // Smart pagination buttons logic
    const renderPageButtons = () => {
        const pageButtons = [];
        
        // For small number of pages, show all
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pageButtons.push(renderPageButton(i));
            }
            return pageButtons;
        }
        
        // Always show first page
        pageButtons.push(renderPageButton(1));
        
        // Show ellipsis if not near start
        if (currentPage > 3) {
            pageButtons.push(
                <div key="ellipsis-start" className="flex items-center px-2 text-neutral-400">
                    <FaEllipsisH />
                </div>
            );
        }
        
        // Calculate visible numbered pages
        let startPage = Math.max(currentPage - 1, 2);
        let endPage = Math.min(currentPage + 1, totalPages - 1);
        
        // Adjust if at edges
        if (currentPage <= 3) {
            endPage = 4;
        } else if (currentPage >= totalPages - 2) {
            startPage = totalPages - 3;
        }
        
        // Show visible pages
        for (let i = startPage; i <= endPage; i++) {
            pageButtons.push(renderPageButton(i));
        }
        
        // Show ellipsis if not near end
        if (currentPage < totalPages - 2) {
            pageButtons.push(
                <div key="ellipsis-end" className="flex items-center px-2 text-neutral-400">
                    <FaEllipsisH />
                </div>
            );
        }
        
        // Always show last page
        pageButtons.push(renderPageButton(totalPages));
        
        return pageButtons;
    };
    
    // Individual page button with animation
    const renderPageButton = (page) => (
        <motion.button
            key={page}
            whileTap={{ scale: 0.95 }}
            onClick={() => !disabled && onPageChange(page)}
            className={`mx-1 min-w-[40px] h-10 flex items-center justify-center rounded-md transition-all duration-200 ${
                page === currentPage
                ? 'bg-blue-500 text-white font-bold shadow-md'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-blue-400 hover:text-white'
            } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={disabled}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
        >
            {page}
        </motion.button>
    );
    
    // Navigation button component
    const NavButton = ({ onClick, disabled: navDisabled, icon, label }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`mx-1 h-10 w-10 flex items-center justify-center rounded-md ${
                navDisabled || disabled
                ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-blue-400 hover:text-white'
            } transition-all duration-200`}
            disabled={navDisabled || disabled}
            aria-label={label}
        >
            {icon}
        </motion.button>
    );

    // Show nothing if there's only 1 or 0 pages
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-wrap justify-center items-center my-4 gap-1">
            <NavButton
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                icon={<FaAngleDoubleLeft className="text-lg" />}
                label="First page"
            />
            
            <NavButton
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                icon={<FaAngleLeft className="text-lg" />}
                label="Previous page"
            />
            
            <div className="flex mx-1">
                {renderPageButtons()}
            </div>
            
            <NavButton
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                icon={<FaAngleRight className="text-lg" />}
                label="Next page"
            />
            
            <NavButton
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                icon={<FaAngleDoubleRight className="text-lg" />}
                label="Last page"
            />
        </div>
    );
};

export default Pagination;