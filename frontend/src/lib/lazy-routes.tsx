import { lazy } from 'react';
import { LazyWrapper } from '../components/common/LazyWrapper';

// Lazy load route components with proper error boundaries
export const LazyRoutes = {
  // Main pages
  Home: lazy(() => import('../pages/Home')),
  ClipSearch: lazy(() => import('../pages/ClipSearch')),
  NotificationsPage: lazy(() => import('../pages/NotificationsPage')),
  UserReportsPage: lazy(() => import('../pages/UserReportsPage')),
  PrivacyStatement: lazy(() => import('../pages/PrivacyStatement')),
  ResetPassword: lazy(() => import('../pages/ResetPassword')),
  EditorDash: lazy(() => import('../pages/EditorDash')),
  
  // Clip pages
  ClipIndex: lazy(() => import('../pages/Clips/Index')),
  ClipView: lazy(() => import('../pages/Clips/ClipView/Index')),
  ClipGrid: lazy(() => import('../pages/Clips/ClipGrid/Index')),
  
  // Profile pages
  ProfileIndex: lazy(() => import('../pages/Profile/Index')),
  ProfileEditModal: lazy(() => import('../pages/Profile/EditModal')),
  
  // Admin pages
  AdminIndex: lazy(() => import('../pages/Admin/Index')),
  
  // Admin components
  ProcessClipsModal: lazy(() => import('../components/admin/ProcessClipsModal')),
  LiveProcessingView: lazy(() => import('../components/admin/LiveProcessingView')),
  CustomCriteriaBuilder: lazy(() => import('../components/admin/CustomCriteriaBuilder')),
  TrophyPreviewModal: lazy(() => import('../components/admin/TrophyPreviewModal')),
  
  // Clip components
  ClipViewerHeader: lazy(() => import('../pages/Clips/components/ClipViewerHeader')),
  ClipViewerContent: lazy(() => import('../pages/Clips/components/ClipViewerContent')),
  
  // Large feature components
  TrophyDisplay: lazy(() => import('../components/TrophyDisplay')),
  
  // Navbar components
  DefaultNav: lazy(() => import('../components/navbar/DefaultNav')),
  MobileNav: lazy(() => import('../components/navbar/MobileNav')),
  
  // Common components that are heavy
  DateRangePicker: lazy(() => import('../components/DateRangePicker')),
  NotificationContainer: lazy(() => import('../components/PopupAlerts/NotificationContainer')),
  AlertItem: lazy(() => import('../components/PopupAlerts/AlertItem')),
  
  // Notification components
  NotificationDropdown: lazy(() => import('../components/Notification/NotificationDropdown')),
  NotificationBadge: lazy(() => import('../components/Notification/NotificationBadge')),
  
  // Layout components
  PageLayout: lazy(() => import('../components/layouts/PageLayout')),
  
  // Common components
  ConfirmationDialog: lazy(() => import('../components/common/ConfirmationDialog')),
};

// Preload configuration for better UX
export const preloadRoutes = {
  // Critical routes to preload immediately
  critical: [
    () => import('../pages/Home'),
    () => import('../pages/Clips/Index'),
    () => import('../components/Navbar'),
  ],
  
  // Routes to preload on user interaction
  onHover: {
    '/clips': () => import('../pages/Clips/Index'),
    '/search': () => import('../pages/ClipSearch'),
    '/profile': () => import('../pages/Profile/Index'),
    '/admin': () => import('../pages/Admin/Index'),
    '/notifications': () => import('../pages/NotificationsPage'),
  },
  
  // Heavy components to preload when needed
  heavy: {
    clipViewer: () => import('../pages/Clips/ClipView/Index'),
    trophyDisplay: () => import('../components/TrophyDisplay'),
    dateRangePicker: () => import('../components/DateRangePicker'),
    adminProcessing: () => import('../components/admin/ProcessClipsModal'),
  }
};

// Utility to wrap components with lazy loading
export const withLazy = (Component: any, name: string) => {
  const WrappedComponent = (props: any) => (
    <LazyWrapper>
      <Component {...props} />
    </LazyWrapper>
  );
  
  WrappedComponent.displayName = `Lazy(${name})`;
  return WrappedComponent;
};
