import { Link } from 'react-router-dom';
import { formatPrice, getImageUrl, getLevelColor, formatDuration } from '../utils/helpers';

const CourseCard = ({ course }) => {
  return (
    <Link
      to={`/courses/${course._id}`}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-video overflow-hidden bg-gray-100">
        <img
          src={getImageUrl(course.thumbnail)}
          alt={course.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
          <span className="text-xs text-gray-500">{course.category}</span>
        </div>
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 group-hover:text-primary-600">
          {course.title}
        </h3>
        <p className="mb-3 text-sm text-gray-500">By {course.instructor}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">
            {course.price === 0 ? 'Free' : formatPrice(course.price)}
          </span>
          <span className="text-xs text-gray-500">
            {course.totalLessons || 0} lessons · {formatDuration(course.totalDuration)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
