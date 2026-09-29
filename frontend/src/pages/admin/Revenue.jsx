import { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/helpers';

const AdminRevenue = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/payments/admin/revenue')
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
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Revenue Dashboard</h2>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-primary-600">{formatPrice(stats?.totalRevenue || 2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-3xl font-bold">{stats?.totalTransactions || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Enrollments</p>
          <p className="text-3xl font-bold">{stats?.totalEnrollments || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Courses</p>
          <p className="text-3xl font-bold">{stats?.totalCourses || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Monthly Revenue</h3>
          {stats?.monthlyRevenue?.length > 0 ? (
            <div className="space-y-2">
              {stats.monthlyRevenue.map((item) => (
                <div key={`${item._id.year}-${item._id.month}`} className="flex justify-between rounded-lg bg-gray-50 px-4 py-2">
                  <span className="text-sm">
                    {item._id.month}/{item._id.year}
                  </span>
                  <span className="font-medium">{formatPrice(item.revenue)} ({item.count} sales)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No revenue data yet.</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold">Recent Payments</h3>
          {stats?.recentPayments?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentPayments.map((payment) => (
                <div key={payment._id} className="flex justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm">
                  <span>{formatPrice(payment.amount)}</span>
                  <span className="text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No payments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
