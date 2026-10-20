
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SpecularButton from '../components/SpecularButton';
import TargetCursor from '../components/TargetCursor';

const Home = () => {
  const coursesSectionRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses?sort=price-desc');
        setCourses(data.data.slice(0, 6));
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div>
      {/* Target Cursor: Featured Courses section only */}
      <TargetCursor
  targetSelector=".cursor-target"
  container={coursesSectionRef}
  cursorColor="#2563eb"
  cursorColorOnTarget="#2563eb"
  blendMode="normal"
  showLabel
  hideDefaultCursor
/>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Learn new skills online with expert instructors
            </h1>

            <p className="mb-8 text-lg text-primary-100">
              Browse courses, learn at your own pace, and track your learning
              progress — all in one place.
            </p>

            {/* Animated Hero Buttons */}
            <div className="relative z-10 flex flex-wrap items-center gap-4">
              <SpecularButton
                size="lg"
                radius={12}
                tint="#ffffff"
                tintOpacity={0.12}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#4f46e5"
                intensity={1}
                idleIntensity={0.35}
                shineSize={10}
                shineFade={34}
                thickness={1.2}
                glow={1}
                followMouse
                proximity={250}
                onClick={() => navigate('/courses')}
              >
                Browse Courses
              </SpecularButton>

              <SpecularButton
                size="lg"
                radius={12}
                tint="#ffffff"
                tintOpacity={0.12}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#4f46e5"
                intensity={1}
                idleIntensity={0.35}
                shineSize={10}
                shineFade={34}
                thickness={1.2}
                glow={1}
                followMouse
                proximity={250}
                onClick={() => navigate('/register')}
              >
                Get Started Free
              </SpecularButton>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
<section
  ref={coursesSectionRef}
  className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
>
  <div className="mb-8 flex items-center justify-between">
    <h2
  className="cursor-target text-2xl font-bold text-gray-900"
  data-cursor-label=""
>
  Featured Courses
</h2>

   <Link
  to="/courses"
  className="cursor-target text-sm font-medium text-primary-600 hover:underline"
  data-cursor-label=""
>
  View all →
</Link>
  </div>

  {/* Course cards */}
  {loading ? (
    <div className="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  ) : (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  )}
</section>
    </div>
  );
};

export default Home;
