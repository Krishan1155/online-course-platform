import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import StarBorder from '../components/StarBorder';

const MainLayout = () => {
  const location = useLocation();

  // Scroll to top whenever the route changes.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [location.pathname]);

  // Scroll to top when clicking a link for the current page.
  const handleSamePageClick = (route) => {
    if (location.pathname === route) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }
  };

  // Keep your existing return (...) JSX unchanged.

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-gray-50">
        {/* Main Footer */}
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-14">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              onClick={() => handleSamePageClick('/')}
              className="group inline-flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-xl font-bold text-white shadow-md shadow-primary-600/20 transition-transform duration-300 group-hover:-translate-y-1">
                C
              </span>

              <span className="text-xl font-bold tracking-tight text-gray-900">
                CoursePlatform
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-gray-600">
              Learn new skills, explore expert-led courses, and build your
              future at your own pace. Your next learning journey starts here.
            </p>


<StarBorder
  as={Link}
  to="/courses"
  color="#4f46e5"
  trailColor="#818cf8"
  duration={4}
  direction="clockwise"
  stars={1}
  trailLength={0.3}
  thickness={1.5}
  radius={12}
  glow={0.4}
  hover="lap"
  sparkle={false}
  clickPulse
  theme="light"
  backgroundColor="#ffffff"
  textColor="#4f46e5"
  borderColor="rgba(79, 70, 229, 0.2)"
  className="mt-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
>
  Explore courses →
</StarBorder>

          </div>

          {/* Explore Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Explore
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/"
                  onClick={() => handleSamePageClick('/')}
                  className="text-sm text-gray-600 transition-colors hover:text-primary-600 hover:underline"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/courses"
                  onClick={() => handleSamePageClick('/courses')}
                  className="text-sm text-gray-600 transition-colors hover:text-primary-600 hover:underline"
                >
                  All Courses
                </Link>
              </li>

              <li>
                <Link
                  to="/my-courses"
                  onClick={() => handleSamePageClick('/my-courses')}
                  className="text-sm text-gray-600 transition-colors hover:text-primary-600 hover:underline"
                >
                  My Learning
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning Benefits */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Why CoursePlatform?
            </h3>

            <ul className="mt-5 space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="font-bold text-primary-600">✓</span>
                Expert instructors
              </li>

              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="font-bold text-primary-600">✓</span>
                Flexible learning
              </li>

              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="font-bold text-primary-600">✓</span>
                Secure payments
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} CoursePlatform. All rights reserved.
            </p>

            <p className="text-sm text-gray-500">
              Built for curious minds.
              <span className="ml-1 font-medium text-primary-600">
                Keep learning.
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
