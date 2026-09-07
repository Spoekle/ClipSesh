import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Performance metrics type
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  networkTime: number;
  cacheHits: number;
  cacheMisses: number;
  totalQueries: number;
  errorRate: number;
  averageResponseTime: number;
}

// Loading state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingStateProps {
  state: LoadingState;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
}

// Smart loading component that adapts to content
export const SmartLoader = ({
  state,
  message,
  progress,
  showProgress = false,
  size = 'md',
  variant = 'spinner',
  className = '',
}: LoadingStateProps) => {
  const [displayMessage, setDisplayMessage] = useState(message || 'Loading...');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update message based on elapsed time
  useEffect(() => {
    if (state !== 'loading') {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      if (elapsed > 3000) {
        setDisplayMessage('Taking longer than expected...');
      } else if (elapsed > 1000) {
        setDisplayMessage('Still loading...');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`bg-blue-600 rounded-full ${sizeClasses[size]}`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <motion.div
            className={`bg-blue-600 rounded-full ${sizeClasses[size]}`}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        );
      
      case 'skeleton':
        return (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
        );
    }
  };

  if (state === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex flex-col items-center justify-center p-4 ${className}`}
      >
        {renderVariant()}
        
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm text-gray-600 text-center"
          >
            {displayMessage}
          </motion.p>
        )}
        
        {showProgress && progress !== undefined && (
          <div className="w-full max-w-xs mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
        
        {elapsedTime > 5000 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Performance monitor component
export const PerformanceMonitor = ({ 
  metrics, 
  isVisible = false 
}: { 
  metrics: PerformanceMetrics; 
  isVisible?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPerformanceStatus = () => {
    if (metrics.averageResponseTime > 2000) return 'poor';
    if (metrics.averageResponseTime > 1000) return 'fair';
    return 'good';
  };

  const statusColors = {
    good: 'text-green-600 bg-green-100',
    fair: 'text-yellow-600 bg-yellow-100',
    poor: 'text-red-600 bg-red-100',
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border z-50"
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[getPerformanceStatus()]}`} />
            <span className="text-sm font-medium">Performance</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 text-xs text-gray-600 space-y-1"
            >
              <div>Load Time: {metrics.loadTime}ms</div>
              <div>Render Time: {metrics.renderTime}ms</div>
              <div>Network Time: {metrics.networkTime}ms</div>
              <div>Cache Hit Rate: {((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)}%</div>
              <div>Total Queries: {metrics.totalQueries}</div>
              <div>Error Rate: {(metrics.errorRate * 100).toFixed(1)}%</div>
              <div>Avg Response: {metrics.averageResponseTime}ms</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Hook to track performance metrics
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    networkTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalQueries: 0,
    errorRate: 0,
    averageResponseTime: 0,
  });

  const [isTracking, setIsTracking] = useState(false);

  const startTracking = () => {
    setIsTracking(true);
    // Reset metrics
    setMetrics({
      loadTime: 0,
      renderTime: 0,
      networkTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalQueries: 0,
      errorRate: 0,
      averageResponseTime: 0,
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const updateMetric = (key: keyof PerformanceMetrics, value: number) => {
    if (!isTracking) return;
    
    setMetrics(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const recordQuery = (duration: number, fromCache: boolean, hadError: boolean) => {
    if (!isTracking) return;

    setMetrics(prev => ({
      ...prev,
      totalQueries: prev.totalQueries + 1,
      cacheHits: fromCache ? prev.cacheHits + 1 : prev.cacheHits,
      cacheMisses: !fromCache ? prev.cacheMisses + 1 : prev.cacheMisses,
      errorRate: hadError ? (prev.errorRate * prev.totalQueries + 1) / (prev.totalQueries + 1) : prev.errorRate,
      averageResponseTime: (prev.averageResponseTime * prev.totalQueries + duration) / (prev.totalQueries + 1),
      networkTime: !fromCache ? prev.networkTime + duration : prev.networkTime,
    }));
  };

  return {
    metrics,
    isTracking,
    startTracking,
    stopTracking,
    updateMetric,
    recordQuery,
  };
};

// Loading states for different components
export const ClipListLoader = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex space-x-4">
          <div className="w-20 h-16 bg-gray-300 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ClipViewerLoader = () => (
  <div className="animate-pulse">
    <div className="aspect-video bg-gray-300 rounded-lg mb-4"></div>
    <div className="space-y-2">
      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="flex space-x-2 mt-4">
        <div className="h-8 w-16 bg-gray-300 rounded"></div>
        <div className="h-8 w-16 bg-gray-300 rounded"></div>
        <div className="h-8 w-20 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

export const NotificationLoader = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex space-x-3 p-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            <div className="h-2 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Error boundary with loading state
export const ErrorBoundaryWithLoading = ({ 
  children, 
  onRetry 
}: { 
  children: React.ReactNode;
  onRetry?: () => void;
}) => {
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setHasError(false);
    
    try {
      await onRetry?.();
    } catch (error) {
      setHasError(true);
    } finally {
      setIsRetrying(false);
    }
  };

  if (hasError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg mb-2">Something went wrong</div>
        <div className="text-gray-600 text-sm mb-4">
          There was an error loading this content
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// Progressive loading indicator
export const ProgressiveLoader = ({ 
  steps, 
  currentStep, 
  stepMessages 
}: { 
  steps: number;
  currentStep: number;
  stepMessages?: string[];
}) => {
  const progress = (currentStep / steps) * 100;

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Step {currentStep} of {steps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {stepMessages && stepMessages[currentStep - 1] && (
        <p className="text-sm text-gray-600 text-center">
          {stepMessages[currentStep - 1]}
        </p>
      )}
    </div>
  );
};
