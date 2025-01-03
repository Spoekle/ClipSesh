import React from 'react';
import { FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePageClick = (page) => {
        console.log('Page clicked:', page);
        onPageChange(page);
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(currentPage - 2, 1);
        let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(endPage - maxPagesToShow + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers.map((page) => (
            <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`mx-1 px-3 py-1 rounded-md ${page === currentPage
                    ? 'bg-cc-red  text-white text-lg scale-110'
                    : 'bg-black/50 dark:bg-white/20 text-white text-lg hover:bg-cc-red/80 hover:scale-105 transition duration-200'
                    }`}
            >
                {page}
            </button>
        ));
    };

    return (
        <div className="flex justify-center items-center my-4">
            {currentPage !== 1 &&
                <button
                    onClick={() => currentPage > 1 && handlePageClick(1)}
                    className={`mx-1 px-3 py-2 rounded-md hidden md:flex ${currentPage === 1
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-black/50 dark:bg-white/20 text-white hover:bg-cc-blue hover:scale-105 transition duration-200'
                        }`}
                    disabled={currentPage === 1}
                >
                    <FaAngleDoubleLeft className='text-lg'/>
                </button>
            }
            <button
                onClick={() => currentPage > 1 && handlePageClick(currentPage - 1)}
                className={`mx-1 px-2 py-2 rounded-md ${currentPage === 1
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-black/50 dark:bg-white/20 text-white hover:bg-cc-blue hover:scale-105 transition duration-200'
                    }`}
                disabled={currentPage === 1}
            >
                <FaAngleLeft className='text-lg'/>
            </button>
            {renderPageNumbers()}
            <button
                onClick={() => currentPage < totalPages && handlePageClick(currentPage + 1)}
                className={`mx-1 px-2 py-2 rounded-md ${currentPage === totalPages
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-black/50 dark:bg-white/20 text-white hover:bg-cc-blue hover:scale-105 transition duration-200'
                    }`}
                disabled={currentPage === totalPages}
            >
                <FaAngleRight className='text-lg'/>
            </button>
            {currentPage !== totalPages &&

                <button
                    onClick={() => currentPage < totalPages && handlePageClick(totalPages)}
                    className={`mx-1 px-3 py-2 rounded-md hidden md:flex ${currentPage === totalPages
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-black/50 dark:bg-white/20 text-white hover:bg-cc-blue hover:scale-105 transition duration-200'
                        }`}
                    disabled={currentPage === totalPages}
                >
                    <FaAngleDoubleRight className='text-lg'/>
                </button>
            }
        </div>
    );
};

export default Pagination;