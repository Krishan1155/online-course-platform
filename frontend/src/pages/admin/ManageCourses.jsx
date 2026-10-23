import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice, getImageUrl } from '../../utils/helpers';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses/admin/all');
      setCourses(data.data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {/* Page heading */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Manage Courses
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage courses, pricing, and publication status.
          </p>
        </div>

        <Link
          to="/admin/courses/create"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <span className="text-lg leading-none">+</span>
          Create Course
        </Link>
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="w-full overflow-x-auto">
    <table className="w-full table-auto divide-y divide-gray-200">
            <colgroup>
              <col className="w-[43%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[15%]" />
            </colgroup>

            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Course
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="w-[170px] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                 Actions
                 </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr
                  key={course._id}
                  className="transition-colors duration-200 hover:bg-indigo-50/40"
                >
                  {/* Course */}
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={getImageUrl(course.thumbnail)}
                        alt=""
                        className="h-12 w-16 shrink-0 rounded-lg border border-gray-100 bg-gray-50 object-cover"
                      />
                      <span className="min-w-0 break-words text-sm font-semibold leading-5 text-gray-900">
                        {course.title}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4 text-sm leading-5 text-gray-600">
                    <span className="break-words">{course.category}</span>
                  </td>

                  {/* Price */}
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-800">
                    {course.price === 0 ? 'Free' : formatPrice(course.price)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        course.isPublished
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-amber-50 text-amber-700 ring-amber-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          course.isPublished
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="w-[170px] whitespace-nowrap px-2 py-4">
                     <div className="flex items-center justify-center gap-1.5">

                      <Link
                        to={`/admin/courses/edit/${course._id}`}
                        aria-label={`Edit ${course.title}`}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 whitespace-nowrap">
                        <span aria-hidden="true">✎</span>
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(course._id, course.title)}
                        aria-label={`Delete ${course.title}`}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 whitespace-nowrap">
                         <span aria-hidden="true" className="text-sm leading-none">🗑️</span>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {courses.length === 0 && (
          <div className="px-6 py-14 text-center">
            <h3 className="font-semibold text-gray-900">No courses yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first course to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;