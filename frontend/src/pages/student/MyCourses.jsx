import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getImageUrl, formatDuration } from '../../utils/helpers';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const { data } = await api.get('/enrollments/my');
        setEnrollments(data.data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">My Courses</h1>
      <p className="mb-8 text-gray-500">Continue where you left off</p>

      {enrollments.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="mb-4 text-gray-500">You haven&apos;t enrolled in any courses yet.</p>
          <Link to="/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const progress = enrollment.progress?.progressPercentage || 0;

            return (
              <div key={enrollment._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-gray-900">{course.title}</h3>
                  <p className="mb-3 text-sm text-gray-500">By {course.instructor}</p>

                  <div className="mb-3">
  <div className="mb-1 flex justify-between text-xs">
    <span className={progress === 100 ? 'font-medium text-green-600' : 'text-gray-500'}>
      {progress === 100 ? '✓ Completed' : 'Progress'}
    </span>

    <span className="font-medium text-gray-600">
      {progress}%
    </span>
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
    <div
      className="h-full rounded-full bg-primary-600 transition-all"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>

                  <div className="mb-4 text-xs text-gray-500">
                    {course.totalLessons || 0} lessons · {formatDuration(course.totalDuration)}
                  </div>

                 <Link
  to={`/learn/${course._id}`}
  className="btn-primary w-full text-center"
>
  {progress === 100 ? 'View Course' : 'Continue Learning'}
</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
