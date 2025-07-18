import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export const VirtualScroll = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loadMore,
  hasMore = false,
  isLoading = false,
}: VirtualScrollProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const newScrollTop = element.scrollTop;
      
      setScrollTop(newScrollTop);
      setIsScrolling(true);
      
      onScroll?.(newScrollTop);

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after 150ms of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      // Load more when approaching the end
      if (loadMore && hasMore && !isLoading) {
        const scrollPercentage = (newScrollTop + containerHeight) / totalHeight;
        if (scrollPercentage > 0.8) {
          loadMore();
        }
      }
    },
    [onScroll, loadMore, hasMore, isLoading, containerHeight, totalHeight]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: items.length * itemHeight,
              left: 0,
              right: 0,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading more...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for virtual scrolling with dynamic item heights
export const useVirtualScroll = (
  items: any[],
  containerHeight: number,
  estimateItemHeight: (index: number) => number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [heights, setHeights] = useState<number[]>([]);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const measureElementRef = useRef<HTMLDivElement>(null);

  // Calculate cumulative heights
  const offsets = useMemo(() => {
    const result: number[] = [0];
    for (let i = 0; i < items.length; i++) {
      const height = heights[i] || estimateItemHeight(i);
      result.push(result[i] + height);
    }
    return result;
  }, [items.length, heights, estimateItemHeight]);

  const totalHeight = offsets[offsets.length - 1];

  // Binary search to find the start index
  const findStartIndex = useCallback(
    (scrollTop: number) => {
      let low = 0;
      let high = offsets.length - 1;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (offsets[mid] <= scrollTop) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      
      return Math.max(0, high - overscan);
    },
    [offsets, overscan]
  );

  // Find visible range
  const startIndex = findStartIndex(scrollTop);
  const endIndex = useMemo(() => {
    let index = startIndex;
    while (index < items.length && offsets[index] < scrollTop + containerHeight) {
      index++;
    }
    return Math.min(items.length, index + overscan);
  }, [startIndex, items.length, offsets, scrollTop, containerHeight, overscan]);

  // Measure item height
  const measureItem = useCallback(
    (index: number, element: HTMLElement) => {
      const height = element.offsetHeight;
      setHeights(prev => {
        const newHeights = [...prev];
        newHeights[index] = height;
        return newHeights;
      });
    },
    []
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: offsets[startIndex + index],
    }));
  }, [items, startIndex, endIndex, offsets]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
    []
  );

  return {
    scrollElementRef,
    measureElementRef,
    visibleItems,
    totalHeight,
    handleScroll,
    measureItem,
  };
};

// Optimized clip list component using virtual scrolling
export const VirtualClipList = ({
  clips,
  onClipClick,
  containerHeight = 600,
  itemHeight = 120,
  className = '',
}: {
  clips: any[];
  onClipClick: (clip: any) => void;
  containerHeight?: number;
  itemHeight?: number;
  className?: string;
}) => {
  const renderClipItem = useCallback(
    (clip: any, _index: number) => (
      <div
        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
        onClick={() => onClipClick(clip)}
      >
        <div className="w-20 h-16 bg-gray-200 rounded mr-4 flex-shrink-0">
          {clip.thumbnail && (
            <img
              src={clip.thumbnail}
              alt={clip.title}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{clip.title}</h3>
          <p className="text-sm text-gray-500 truncate">{clip.description}</p>
          <div className="flex items-center mt-1 text-xs text-gray-400">
            <span>{clip.author}</span>
            <span className="mx-2">•</span>
            <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {clip.rating || 'N/A'}
          </span>
        </div>
      </div>
    ),
    [onClipClick]
  );

  return (
    <VirtualScroll
      items={clips}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      renderItem={renderClipItem}
      className={className}
      overscan={3}
    />
  );
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    itemsRendered: 0,
    scrollEvents: 0,
  });

  const trackRender = useCallback((itemCount: number, startTime: number) => {
    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime,
      itemsRendered: itemCount,
    }));
  }, []);

  const trackScroll = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      scrollEvents: prev.scrollEvents + 1,
    }));
  }, []);

  return {
    metrics,
    trackRender,
    trackScroll,
  };
};
