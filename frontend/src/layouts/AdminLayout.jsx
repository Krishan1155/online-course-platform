import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `group flex items-center rounded-xl px-4 py-3 text-sm font-medium
    transition-all duration-200 ease-out
    ${
      isActive
        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
        : 'text-gray-700 hover:translate-x-1 hover:bg-primary-50 hover:text-primary-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome, {user?.name || 'Admin'}
            </p>
          </div>

          {/* Back to Site */}
          <NavLink
            to="/"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:px-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 12H5m7 7-7-7 7-7"
              />
            </svg>

            <span>Back to Site</span>
          </NavLink>
        </div>
      </header>

      {/* Admin Content */}
      <main className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="w-56 shrink-0">
          <nav
            aria-label="Admin navigation"
            className="sticky top-28 space-y-1 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-sm"
          >
            <NavLink to="/admin" end className={linkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/admin/courses" className={linkClass}>
              Courses
            </NavLink>

            <NavLink to="/admin/users" className={linkClass}>
              Users
            </NavLink>

            <NavLink to="/admin/enrollments" className={linkClass}>
              Enrollments
            </NavLink>

            <NavLink to="/admin/revenue" className={linkClass}>
              Revenue
            </NavLink>
          </nav>
        </aside>

        {/* Page Content */}
        <section className="min-w-0 flex-1">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;