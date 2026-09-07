import { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

// Default loading component
const DefaultLoading = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Default error component
const DefaultError = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
    <div className="text-red-600 text-lg mb-2">Something went wrong</div>
    <div className="text-gray-600 text-sm mb-4">{error.message}</div>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Try again
    </button>
  </div>
);

// HOC for lazy loading with error boundary
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  loadingComponent?: ComponentType,
  errorComponent?: ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) => {
  return (props: P) => (
    <ErrorBoundary
      FallbackComponent={errorComponent || DefaultError}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={loadingComponent ? <Component {...(loadingComponent as any)} /> : <DefaultLoading />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

// Wrapper component
export const LazyWrapper = ({ 
  children, 
  fallback: Fallback = DefaultLoading,
  errorFallback: ErrorFallback = DefaultError
}: LazyWrapperProps) => (
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onReset={() => window.location.reload()}
  >
    <Suspense fallback={<Fallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Preload utility for better UX
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  // Trigger the import but don't wait for it
  componentLoader().catch(() => {
    // Silently fail - the component will be loaded when actually needed
  });
};

// Route-based preloading hook
export const useRoutePreload = (routes: Record<string, () => Promise<any>>) => {
  const preloadRoute = (routeName: string) => {
    if (routes[routeName]) {
      preloadComponent(routes[routeName]);
    }
  };

  return { preloadRoute };
};
