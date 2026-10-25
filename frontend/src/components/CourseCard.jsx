import { Link } from 'react-router-dom';
import {
  formatPrice,
  getImageUrl,
  getLevelColor,
  formatDuration,
} from '../utils/helpers';

const CourseCard = ({ course }) => {
  const rating = Number(course.ratingAverage || 0);
  const ratingCount = course.ratingCount || 0;
  const instructor = String(course.instructor || '');

  return (
    <Link
      to={`/courses/${course._id}`}
      className="cursor-target group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70"
      data-cursor-label="View Course"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video max-h-56 w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100">
        <img
          src={getImageUrl(course.thumbnail)}
          alt={course.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Level badge sits on the image */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize shadow-sm ring-1 ring-white/70 ${getLevelColor(
            course.level
          )}`}
        >
          {course.level}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {course.category && (
          <p className="mb-1 truncate text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {course.category}
          </p>
        )}

        <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary-600">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold uppercase text-indigo-600">
            {instructor.charAt(0) || '?'}
          </span>
          <span className="truncate text-sm text-gray-500">{instructor}</span>
        </div>

        {/* COURSE RATING (fixed height so every card lines up) */}
        <div className="mt-3 flex h-5 items-center gap-1.5">
          {ratingCount > 0 ? (
            <>
              <span className="text-sm leading-none text-amber-500">★</span>
              <span className="text-sm font-semibold text-gray-900">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">({ratingCount})</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No ratings yet</span>
          )}
        </div>

        {/* Footer pinned to the bottom of the card */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
          <span
            className={`text-lg font-bold ${
              course.price === 0 ? 'text-emerald-600' : 'text-primary-600'
            }`}
          >
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
