import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from '@/lib/routerCompat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdHome,
  MdMovie,
  MdSearch,
  MdNotifications,
  MdDashboard,
  MdAdminPanelSettings,
  MdFlag,
  MdClose,
} from 'react-icons/md';
import {
  FaDiscord,
  FaGithub,
  FaYoutube,
  FaTwitter,
  FaShieldAlt,
  FaSun,
  FaMoon,
  FaSnowflake,
} from 'react-icons/fa';
import logo from '../media/CC_Logo_250px.png';
import { User } from '../types/adminTypes';
import { useUnreadCount } from '../hooks/useNotifications';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  user: User | null;
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  user,
}) => {
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadCount();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = safeLocalStorage.getItem('theme');
    return savedTheme !== 'light';
  });

  // Snow state (December / January)
  const [isSnowMonth] = useState(() => {
    const month = new Date().getMonth();
    return month === 11 || month === 0;
  });

  const [snow, setSnow] = useState(() => {
    const savedSnow = safeLocalStorage.getItem('snow');
    return savedSnow !== 'false';
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      safeLocalStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      safeLocalStorage.setItem('theme', 'light');
    }
  };

  const toggleSnow = () => {
    const newSnow = !snow;
    setSnow(newSnow);
    safeLocalStorage.setItem('snow', newSnow ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    if (isOpenMobile) {
      onCloseMobile();
    }
  }, [location.pathname, isOpenMobile, onCloseMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  // Primary navigation items
  const mainNavItems = [
    { label: 'Home', path: '/', icon: MdHome },
    { label: 'Clips', path: '/clips', icon: MdMovie },
    { label: 'Search', path: '/search', icon: MdSearch },
    ...(user
      ? [
          {
            label: 'Notifications',
            path: '/notifications',
            icon: MdNotifications,
            badge: unreadCount > 0 ? unreadCount : undefined,
          },
        ]
      : []),
  ];

  // Management items (role-based)
  const hasEditor =
    user && (user.roles.includes('admin') || user.roles.includes('editor'));
  const hasAdmin = user && user.roles.includes('admin');

  const manageItems = [
    ...(hasEditor
      ? [{ label: 'Editor', path: '/editor', icon: MdDashboard }]
      : []),
    ...(hasAdmin
      ? [{ label: 'Admin', path: '/admin', icon: MdAdminPanelSettings }]
      : []),
    ...(user
      ? [{ label: 'My Reports', path: '/my-reports', icon: MdFlag }]
      : []),
  ];

  // Community links (matching CC)
  const communityItems = [
    {
      label: 'Discord',
      href: 'https://discord.gg/dwe8mbC',
      icon: FaDiscord,
      external: true,
    },
    {
      label: 'YouTube',
      href: 'https://youtube.com/CubeCommunity',
      icon: FaYoutube,
      external: true,
    },
    {
      label: 'Twitter / X',
      href: 'https://twitter.com/CubeCommunityVR',
      icon: FaTwitter,
      external: true,
    },
    {
      label: 'GitHub',
      href: 'https://github.com/Spoekle/ClipSesh',
      icon: FaGithub,
      external: true,
    },
    {
      label: 'Privacy Policy',
      path: '/privacystatement',
      icon: FaShieldAlt,
    },
  ];

  const renderExpandedLink = (
    item: {
      label: string;
      path?: string;
      href?: string;
      icon: React.ComponentType<{ size?: number; className?: string }>;
      badge?: number;
      external?: boolean;
    },
    onClick?: () => void
  ) => {
    const Icon = item.icon;

    if (item.external && item.href) {
      return (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#aaaaaa] hover:text-white hover:bg-[#181818] transition-colors duration-150"
        >
          <div className="flex items-center gap-3.5">
            <Icon size={18} className="text-[#aaaaaa]" />
            <span>{item.label}</span>
          </div>
        </a>
      );
    }

    if (!item.path) return null;

    return (
      <NavLink
        key={item.label}
        to={item.path}
        onClick={onClick}
        end={item.path === '/'}
        className={({ isActive }) =>
          `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
            isActive
              ? 'text-white bg-[#1a1a1a] font-semibold border-l-2 border-[#f23030] rounded-r-xl rounded-l-none'
              : 'text-[#aaaaaa] hover:bg-[#181818] hover:text-white font-medium'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3.5">
              <Icon
                size={18}
                className={isActive ? 'text-[#f23030]' : 'text-[#aaaaaa]'}
              />
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-[#f23030] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-[#f23030]/30">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <AnimatePresence>
      {isOpenMobile && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 lg:hidden"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-[#0f0f0f] border-r border-[#262626] shadow-2xl flex flex-col lg:hidden"
          >
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={(logo as any)?.src || logo} alt="Logo" className="h-8 w-auto" />
                <span className="font-bold text-lg text-[#f1f1f1]">
                  ClipSesh
                </span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-full hover:bg-[#181818] text-[#aaaaaa] hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <MdClose size={22} />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              <div className="space-y-1">
                {mainNavItems.map((item) =>
                  renderExpandedLink(item, onCloseMobile)
                )}
              </div>

              {manageItems.length > 0 && (
                <>
                  <div className="border-t border-[#262626] pt-3" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#717171] px-3 mb-2">
                      Tools
                    </h4>
                    <div className="space-y-1">
                      {manageItems.map((item) =>
                        renderExpandedLink(item, onCloseMobile)
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="border-t border-[#262626] pt-3" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#717171] px-3 mb-2">
                  Community
                </h4>
                <div className="space-y-1">
                  {communityItems.map((item) =>
                    renderExpandedLink(item, onCloseMobile)
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Preferences */}
            <div className="p-3 border-t border-[#262626] space-y-2">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-sm font-medium text-[#aaaaaa] hover:bg-[#181818] hover:text-white transition-colors duration-150"
              >
                {isDarkMode ? (
                  <FaSun size={17} className="text-amber-400" />
                ) : (
                  <FaMoon size={17} className="text-[#aaaaaa]" />
                )}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {isSnowMonth && (
                <button
                  onClick={toggleSnow}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-[#aaaaaa] hover:bg-[#181818] hover:text-white transition-colors duration-150"
                >
                  <div className="flex items-center gap-3.5">
                    <FaSnowflake
                      size={17}
                      className={snow ? 'text-[#f23030]' : 'text-[#aaaaaa]'}
                    />
                    <span>Snow Effect</span>
                  </div>
                  {snow && (
                    <span className="text-[10px] font-bold text-[#f23030] bg-[#f23030]/15 px-1.5 py-0.5 rounded">
                      ON
                    </span>
                  )}
                </button>
              )}

              <div className="px-3 pt-2 text-[11px] text-[#717171]">
                <div>Version {(process.env.NEXT_PUBLIC_APP_VERSION || 'v3.0.0') || 'unknown'}</div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
