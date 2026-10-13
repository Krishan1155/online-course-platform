import { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch((err) => {
        console.error(err);
        setError(
          err.response?.data?.message || 'Failed to load users.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = (userId, role) => {
    const user = users.find((u) => u._id === userId);

    if (!user || user.role === role) {
      return;
    }

    // Ask for confirmation before changing any user's role.
    setError('');
    setPendingRoleChange({
      userId,
      name: user.name,
      currentRole: user.role,
      newRole: role,
    });
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange || updatingRole) {
      return;
    }

    setUpdatingRole(true);
    setError('');

    try {
      const { userId, newRole } = pendingRoleChange;

      const { data } = await api.put(
        `/admin/users/${userId}/role`,
        { role: newRole }
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === userId ? data.data : user
        )
      );

      setPendingRoleChange(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to update user role. Please try again.'
      );
    } finally {
      setUpdatingRole(false);
    }
  };

  const cancelRoleChange = () => {
    if (updatingRole) {
      return;
    }

    setPendingRoleChange(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Users
      </h2>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Verified
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Joined
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {user.name}
                </td>

                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.email}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      user.isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.isVerified ? 'Yes' : 'No'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user._id, e.target.value)
                    }
                    className="input-field w-auto py-1"
                    aria-label={`Change role for ${user.name}`}
                    disabled={updatingRole}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>

                <td className="px-4 py-3 text-sm text-gray-500">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Role change confirmation modal */}
      {pendingRoleChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !updatingRole
            ) {
              cancelRoleChange();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-confirmation-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 text-amber-700"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.9 1.9 18.2A1.8 1.8 0 0 0 3.5 21h17a1.8 1.8 0 0 0 1.6-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <h3
                id="role-confirmation-title"
                className="text-xl font-bold text-gray-900"
              >
                Confirm Role Change
              </h3>
            </div>

            <p className="mb-2 text-gray-700">
              Are you sure you want to change the role of{' '}
              <strong>{pendingRoleChange.name}</strong> from{' '}
              <strong>
                {pendingRoleChange.currentRole === 'admin'
                  ? 'Admin'
                  : 'Student'}
              </strong>{' '}
              to{' '}
              <strong>
                {pendingRoleChange.newRole === 'admin'
                  ? 'Admin'
                  : 'Student'}
              </strong>
              ?
            </p>

            {pendingRoleChange.newRole === 'admin' && (
              <p className="mb-5 text-sm text-amber-800">
                Admins can access administrative features and
                manage users. Only proceed if you trust this
                person with those permissions.
              </p>
            )}

            {pendingRoleChange.newRole === 'student' && (
              <p className="mb-5 text-sm text-gray-600">
                This user will lose admin access after the
                change.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelRoleChange}
                disabled={updatingRole}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRoleChange}
                disabled={updatingRole}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingRole
                  ? 'Updating...'
                  : pendingRoleChange.newRole === 'admin'
                    ? 'Yes, Make Admin'
                    : 'Yes, Change Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;