
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GooeyNav from './GooeyNav';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Build navigation items based on the user's role.
  const navItems = [
    { label: 'Home', href: '#', route: '/' },
    { label: 'Courses', href: '#', route: '/courses' },

    ...(isAuthenticated
      ? [{ label: 'My Courses', href: '#', route: '/my-courses' }]
      : []),

    ...(isAdmin
      ? [{ label: 'Admin', href: '#', route: '/admin' }]
      : []),
  ];

  // Keep the active pill synchronized with the current URL.
  const activeIndex = Math.max(
    0,
    navItems.findIndex(({ route }) =>
      route === '/'
        ? location.pathname === '/'
        : location.pathname === route ||
          location.pathname.startsWith(`${route}/`)
    )
  );

  // Navigate to a page or scroll to the top if already on that page.
  const handleNavigation = (index, item) => {
    if (!item?.route) return;

    if (location.pathname === item.route) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      navigate(item.route);
    }
  };

  // Handle brand and mobile links when the current page is already active.
  const handleSamePageClick = (route) => {
    if (location.pathname === route) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to="/"
            onClick={() => handleSamePageClick('/')}
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white">
              C
            </span>

            <span className="text-xl font-bold text-gray-900">
              CoursePlatform
            </span>
          </Link>

          {/* Animated navigation */}
          <div className="hidden min-w-0 items-center justify-center md:flex">
            <GooeyNav
              items={navItems}
              activeIndex={activeIndex}
              onChange={handleNavigation}
              theme="light"
              color="#4f46e5"
              activeTextColor="#ffffff"
              size="lg"
              frame={false}
              particleCount={12}
              spread={42}
              animationTime={500}
              timeVariance={150}
              gooeyness={0.45}
              wobble={0.35}
              hoverEffect
              className="max-w-full"
            />
          </div>

          {/* Authentication controls */}
          <div className="flex shrink-0 items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-gray-600 sm:inline">
                  Hi, {user?.name?.split(' ')[0]}
                </span>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">
                  Login
                </Link>

                <Link to="/register" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 border-t border-gray-100 px-4 py-3 md:hidden">
          {navItems.map(({ label, route }) => (
            <Link
              key={route}
              to={route}
              onClick={() => handleSamePageClick(route)}
              className={`text-sm font-medium transition-colors ${
                location.pathname === route ||
                (route !== '/' &&
                  location.pathname.startsWith(`${route}/`))
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      {/* Logout confirmation modal */}
      {showLogoutModal && isAuthenticated && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !loggingOut
            ) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 text-red-600"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 17l5-5-5-5m5 5H3m9-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"
                  />
                </svg>
              </div>

              <h2
                id="logout-modal-title"
                className="text-xl font-bold text-gray-900"
              >
                Confirm Logout
              </h2>
            </div>

            <p className="mb-6 text-sm leading-6 text-gray-600">
              Are you sure you want to log out of your account?
              You will need to log in again to access your account.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? 'Logging out...' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
