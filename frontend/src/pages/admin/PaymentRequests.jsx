import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice, getImageUrl } from '../../utils/helpers';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const AdminPaymentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/payment-requests/admin/all', { params });
      setRequests(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleView = async (id) => {
    try {
      const { data } = await api.get(`/payment-requests/${id}`);
      setSelected(data.data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this payment and enroll the student?')) return;

    setActionLoading(true);
    setError('');
    try {
      await api.put(`/payment-requests/admin/${id}/approve`);
      setSuccess('Payment approved and student enrolled successfully');
      setSelected(null);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this payment request?')) return;

    setActionLoading(true);
    setError('');
    try {
      await api.put(`/payment-requests/admin/${id}/reject`);
      setSuccess('Payment request rejected');
      setSelected(null);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Payment Requests</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Screenshot
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Transaction ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{req.studentName}</div>
                    <div className="text-sm text-gray-500">{req.studentEmail}</div>
                  </td>
                  <td className="px-4 py-3">{req.courseName}</td>
                  <td className="px-4 py-3">{formatPrice(req.coursePrice)}</td>
                  <td className="px-4 py-3">
                    <img
                      src={getImageUrl(req.paymentScreenshot)}
                      alt="Payment screenshot"
                      className="h-12 w-12 rounded border object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {req.transactionId || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusColors[req.paymentStatus]}`}
                    >
                      {req.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleView(req._id)} className="text-sm text-primary-600 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-200 md:hidden">
          {requests.map((req) => (
            <div key={req._id} className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-medium">{req.studentName}</p>
                  <p className="text-sm text-gray-500">{req.studentEmail}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusColors[req.paymentStatus]}`}
                >
                  {req.paymentStatus}
                </span>
              </div>
              <p className="text-sm text-gray-700">{req.courseName}</p>
              <p className="text-sm font-medium text-primary-600">{formatPrice(req.coursePrice)}</p>
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={getImageUrl(req.paymentScreenshot)}
                  alt="Payment screenshot"
                  className="h-16 w-16 rounded border object-cover"
                />
                <button onClick={() => handleView(req._id)} className="btn-secondary text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="py-12 text-center text-gray-500">No payment requests found.</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment Request Details</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Student Name</p>
                  <p className="font-medium">{selected.studentName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Student Email</p>
                  <p className="font-medium">{selected.studentEmail}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Course</p>
                  <p className="font-medium">{selected.courseName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Amount</p>
                  <p className="font-medium">{formatPrice(selected.coursePrice)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Transaction ID</p>
                  <p className="font-medium">{selected.transactionId || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Status</p>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${statusColors[selected.paymentStatus]}`}
                  >
                    {selected.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Payment Date</p>
                  <p className="font-medium">
                    {new Date(selected.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Submitted</p>
                  <p className="font-medium">
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase text-gray-500">Payment Screenshot</p>
                <img
                  src={getImageUrl(selected.paymentScreenshot)}
                  alt="Payment screenshot"
                  className="max-h-80 w-full rounded-lg border object-contain"
                />
              </div>

              {selected.paymentStatus === 'pending' && (
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    onClick={() => handleApprove(selected._id)}
                    disabled={actionLoading}
                    className="btn-primary flex-1"
                  >
                    {actionLoading ? <LoadingSpinner size="sm" /> : 'Approve Payment'}
                  </button>
                  <button
                    onClick={() => handleReject(selected._id)}
                    disabled={actionLoading}
                    className="btn-danger flex-1"
                  >
                    Reject Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentRequests;
