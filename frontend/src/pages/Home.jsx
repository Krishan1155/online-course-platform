import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Learn new skills online with expert instructors
            </h1>
            <p className="mb-8 text-lg text-primary-100">
              Browse courses, learn at your own pace, and track your learning progress — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/courses" className="rounded-lg bg-white px-6 py-3 font-semibold text-primary-700 hover:bg-primary-50">
                Browse Courses
              </Link>
              <Link to="/register" className="rounded-lg border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
          <Link to="/courses" className="text-sm font-medium text-primary-600 hover:underline">
            View all →
          </Link>
        </div>

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

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: 'Expert Instructors', desc: 'Learn from industry professionals with real-world experience.' },
              { title: 'Flexible Learning', desc: 'Study at your own pace with lifetime access to course content.' },
              { title: 'Secure Payments', desc: 'Pay safely with Razorpay and start learning immediately.' },
            ].map((item) => (
              <div key={item.title} className="card text-center">
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
