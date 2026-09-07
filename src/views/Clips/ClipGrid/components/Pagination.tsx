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
        const pageButtons: React.ReactNode[] = [];
        
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
    const renderPageButton = (page: number) => (
        <motion.button
            key={page}
            whileTap={{ scale: 0.95 }}
            whileHover={!disabled ? { scale: 1.05, y: -1 } : undefined}
            onClick={() => !disabled && onPageChange(page)}
            className={`mx-1 min-w-[38px] h-9.5 px-2 flex items-center justify-center rounded-[10px] text-sm font-semibold transition-all duration-150 ${
                page === currentPage
                ? 'bg-[#f23030] text-white font-bold shadow-lg shadow-[#f23030]/30'
                : 'bg-[#161d21] text-[#b3b3b3] border border-[#263238] hover:bg-[#263238] hover:text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={disabled}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
        >
            {page}
        </motion.button>
    );
    
    // Navigation button component
    const NavButton = ({ onClick, disabled: navDisabled, icon, label }: any) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={!navDisabled && !disabled ? { scale: 1.05, y: -1 } : undefined}
            onClick={onClick}
            className={`mx-1 h-9.5 w-9.5 flex items-center justify-center rounded-[10px] border border-[#263238] text-sm ${
                navDisabled || disabled
                ? 'bg-[#0e1315]/50 text-[#626262] cursor-not-allowed opacity-50'
                : 'bg-[#161d21] text-[#b3b3b3] hover:bg-[#263238] hover:text-white'
            } transition-all duration-150`}
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