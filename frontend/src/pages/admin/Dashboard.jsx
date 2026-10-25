// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import api from '../../api/axios';
// import LoadingSpinner from '../../components/LoadingSpinner';
// import { formatPrice } from '../../utils/helpers';

// const StatCard = ({ title, value, subtitle }) => (
//   <div className="card">
//     <p className="text-sm text-gray-500">{title}</p>
//     <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
//     {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
//   </div>
// );

// const AdminDashboard = () => {
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     api
//       .get('/admin/dashboard')
//       .then(({ data }) => setStats(data.data))
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex justify-center py-16">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }

//   return (
//     <div>
//       <h2 className="mb-6 text-2xl font-bold text-gray-900">Dashboard Overview</h2>

//       <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//         <StatCard title="Total Users" value={stats?.totalUsers || 0} subtitle={`${stats?.totalStudents || 0} students`} />
//         <StatCard title="Total Courses" value={stats?.totalCourses || 0} subtitle={`${stats?.publishedCourses || 0} published`} />
//         <StatCard title="Total Enrollments" value={stats?.totalEnrollments || 0} />
//         <StatCard title="Total Revenue" value={formatPrice(stats?.totalRevenue ?? 0)} />
//       </div>

//       <div className="card">
//         <h3 className="mb-4 font-semibold">Quick Actions</h3>
//         <div className="flex flex-wrap gap-3">
//           <Link to="/admin/courses/create" className="btn-primary">
//             Create Course
//           </Link>
//           <Link to="/admin/courses" className="btn-secondary">
//             Manage Courses
//           </Link>
//           <Link to="/admin/users" className="btn-secondary">
//             View Users
//           </Link>
//           <Link to="/admin/revenue" className="btn-secondary">
//             Revenue Report
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;


import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/helpers';

const StatCard = ({ title, value, subtitle }) => (
  <div className="card min-w-0 transition-shadow duration-200 hover:shadow-md">
    <p className="text-sm font-medium text-gray-500">{title}</p>

    <p className="mt-3 break-words text-3xl font-bold tracking-tight text-gray-900">
      {value}
    </p>

    {subtitle && (
      <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
    )}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        // Load dashboard statistics and revenue concurrently.
        const [dashboardResult, revenueResult] = await Promise.allSettled([
          api.get('/admin/dashboard'),
          api.get('/payments/admin/revenue'),
        ]);

        if (!active) return;

        // Handle dashboard statistics.
        if (dashboardResult.status === 'fulfilled') {
          setStats(dashboardResult.value.data.data);
        } else {
          console.error(
            'Failed to load dashboard:',
            dashboardResult.reason
          );

          setError(
            dashboardResult.reason?.response?.data?.message ||
              'Unable to load dashboard data. Please try again.'
          );
        }

        // Handle monthly revenue independently.
        if (revenueResult.status === 'fulfilled') {
          const revenueData =
            revenueResult.value.data.data?.monthlyRevenue;

          const formattedRevenue = Array.isArray(revenueData)
            ? revenueData
                .filter(
                  (item) =>
                    item._id?.year != null &&
                    item._id?.month != null
                )
                .map((item) => ({
                  month: new Date(
                    item._id.year,
                    item._id.month - 1
                  ).toLocaleString('en-IN', {
                    month: 'short',
                    year: '2-digit',
                  }),
                  revenue: Number(item.revenue) || 0,
                  year: Number(item._id.year),
                  monthNumber: Number(item._id.month),
                }))
                .sort(
                  (a, b) =>
                    a.year - b.year ||
                    a.monthNumber - b.monthNumber
                )
            : [];

          setMonthlyRevenue(formattedRevenue);
        } else {
          console.error(
            'Failed to load revenue:',
            revenueResult.reason
          );

          setMonthlyRevenue([]);
        }
      } catch (err) {
        console.error('Unexpected dashboard error:', err);

        if (active) {
          setError('Something went wrong while loading the dashboard.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">
          Dashboard unavailable
        </h2>

        <p className="mt-2 text-sm text-gray-600">{error}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary mt-5"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard Overview
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Monitor your courses, students, and platform performance.
        </p>
      </header>

      {/* Statistics */}
      <section aria-label="Platform statistics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            subtitle={`${stats?.totalStudents ?? 0} students`}
          />

          <StatCard
            title="Total Courses"
            value={stats?.totalCourses ?? 0}
            subtitle={`${stats?.publishedCourses ?? 0} published`}
          />

          <StatCard
            title="Total Enrollments"
            value={stats?.totalEnrollments ?? 0}
          />

          <StatCard
            title="Total Revenue"
            value={formatPrice(stats?.totalRevenue ?? 0)}
            subtitle="All-time revenue"
          />
        </div>
      </section>

      {/* Revenue chart and Quick Actions */}
      <section className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        {/* Revenue Overview */}
        <div className="card min-w-0">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Monthly revenue generated by your platform.
            </p>
          </div>

          {monthlyRevenue.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyRevenue}
                  margin={{
                    top: 8,
                    right: 12,
                    left: 4,
                    bottom: 4,
                  }}
                >
                  <CartesianGrid
                    stroke="#E5E7EB"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                  />

                  <YAxis
                    tickFormatter={(value) =>
                      new Intl.NumberFormat('en-IN', {
                        notation: 'compact',
                        maximumFractionDigits: 1,
                      }).format(value)
                    }
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatPrice(Number(value) || 0),
                      'Revenue',
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  />

                  <Line
  type="monotone"
  dataKey="revenue"
  name="Revenue"
  stroke="#7C3AED"
  strokeWidth={2.5}
  dot={{ r: 5, fill: '#7C3AED', strokeWidth: 0 }}
  activeDot={{ r: 7 }}
  connectNulls
  isAnimationActive={false}
/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-gray-200 px-6 text-center">
              <div>
                <p className="font-medium text-gray-700">
                  No revenue data available
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Revenue information will appear here when available.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900">
            Quick Actions
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Manage your platform from one place.
          </p>

          <div className="mt-6 flex flex-1 flex-col gap-3">
            <Link
              to="/admin/courses/create"
              className="btn-primary flex items-center justify-center text-center"
            >
              Create Course
            </Link>

            <Link
              to="/admin/courses"
              className="btn-secondary flex items-center justify-center text-center"
            >
              Manage Courses
            </Link>

            <Link
              to="/admin/users"
              className="btn-secondary flex items-center justify-center text-center"
            >
              View Users
            </Link>

            <Link
              to="/admin/revenue"
              className="btn-secondary flex items-center justify-center text-center"
            >
              Revenue Report
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;