import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/helpers';

const StatCard = ({ title, value, subtitle }) => (
  <div className="card">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Dashboard Overview</h2>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} subtitle={`${stats?.totalStudents || 0} students`} />
        <StatCard title="Total Courses" value={stats?.totalCourses || 0} subtitle={`${stats?.publishedCourses || 0} published`} />
        <StatCard title="Total Enrollments" value={stats?.totalEnrollments || 0} />
        <StatCard title="Total Revenue" value={formatPrice(stats?.totalRevenue ?? 0)} />
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/courses/create" className="btn-primary">
            Create Course
          </Link>
          <Link to="/admin/courses" className="btn-secondary">
            Manage Courses
          </Link>
          <Link to="/admin/users" className="btn-secondary">
            View Users
          </Link>
          <Link to="/admin/revenue" className="btn-secondary">
            Revenue Report
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
