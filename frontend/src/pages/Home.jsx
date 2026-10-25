import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import TargetCursor from '../components/TargetCursor';
import heroVisual from './hero-visual.png';
import SpecularButton from '../components/SpecularButton';

/* ---------- small inline icons ---------- */
const Icon = ({ children, className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const BookIcon = (p) => (
  <Icon {...p}>
    <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H11v15H3.5A1.5 1.5 0 0 1 2 17.5v-12Z" />
    <path d="M22 5.5A1.5 1.5 0 0 0 20.5 4H13v15h7.5a1.5 1.5 0 0 0 1.5-1.5v-12Z" />
  </Icon>
);
const PlayIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8.5 5 3.5-5 3.5v-7Z" fill="currentColor" />
  </Icon>
);
const CapIcon = (p) => (
  <Icon {...p}>
    <path d="m2 9 10-5 10 5-10 5L2 9Z" />
    <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
  </Icon>
);
const LayersIcon = (p) => (
  <Icon {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </Icon>
);
const ChartIcon = (p) => (
  <Icon {...p}>
    <path d="M5 20V12M12 20V5M19 20v-9" />
  </Icon>
);

const features = [
  { icon: CapIcon, title: 'Expert Instructors', text: 'Learn from industry experts' },
  { icon: LayersIcon, title: 'Diverse Topics', text: 'Explore skills for your career' },
  { icon: ChartIcon, title: 'Track Progress', text: 'Learn and grow at your own pace' },
];

/* ---------- page ---------- */
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
        cursorColor="#4f46e5"
        cursorColorOnTarget="#4f46e5"
        blendMode="normal"
        showLabel
        hideDefaultCursor
      />

      {/*
        Hero
        - On desktop (lg+) the picture takes the right 55% of the hero at its natural
          shape (never cropped), so the hero is exactly as tall as the picture and the
          text, centred on the left, scales with the screen width.
        - On mobile/tablet the picture sits under the text.
      */}
      <section className="relative min-h-[680px] overflow-hidden bg-gradient-to-br from-[#f8f6ff] via-[#f2efff] to-[#e8e3ff] lg:min-h-[min(760px,calc(100vh-70px))]">
        {/* Left: copy */}
        <div className="relative z-10 px-4 pb-6 pt-10 sm:px-6 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-[52%] lg:flex-col lg:justify-center lg:py-[3vw] lg:pl-[3.3vw] lg:pr-0 lg:pt-[4.5vw] lg:pb-[2vw]">
          <div className="mb-[1.6vw] flex items-center gap-3 max-lg:mb-5">
            <span className="h-0.5 w-12 rounded bg-indigo-600 lg:w-[3.2vw]" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 lg:text-[max(11px,0.85vw)]">
              Your next chapter starts here
            </span>
          </div>

          <h1 className="text-[clamp(2.5rem,11vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#0f0b2e] lg:text-[4.3vw]">
            Learn new skills.
            <br />
            <span className="text-indigo-600">
  Build your future.
</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 lg:mt-[1.8vw] lg:max-w-[34vw] lg:text-[max(15px,1.25vw)] lg:leading-[1.6]">
            Learn from expert instructors, practice real skills, and track your progress in one
            place.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4 lg:mt-[2.4vw] lg:gap-[1.2vw]">
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
  Explore Courses →
</SpecularButton>

  <SpecularButton
  size="lg"
  radius={12}
  tint="#ffffff"
  tintOpacity={0.12}
  textColor="#4f46e5"
  lineColor="#c7d2fe"
  baseColor="#ffffff"
  intensity={0.7}
  idleIntensity={0.2}
  shineSize={10}
  shineFade={34}
  thickness={1.2}
  glow={0.5}
  followMouse
  proximity={250}
  onClick={() => navigate('/register')}
>
  Get Started Free
</SpecularButton>
</div>
          <ul className="mt-9 grid gap-5 sm:grid-cols-3 lg:mt-[2.6vw] lg:flex lg:gap-[2vw]">
            {features.map(({ icon: FeatureIcon, title, text }) => (
              <li key={title} className="flex items-center gap-3 lg:gap-[0.9vw]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100/80 text-indigo-600 lg:h-[3.1vw] lg:w-[3.1vw]">
                  <FeatureIcon className="h-5 w-5 lg:h-[1.5vw] lg:w-[1.5vw]" />
                </span>
                <div className="lg:whitespace-nowrap">
                  <p className="text-sm font-bold text-slate-900 lg:text-[max(12px,0.95vw)]">
                    {title}
                  </p>
                  <p className="text-xs leading-snug text-slate-500 lg:text-[max(10px,0.78vw)]">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: picture (laptop + floating cards) */}
        <img
          src={heroVisual}
          alt="CoursePlatform on a laptop showing progress, skills and certificates"
          draggable="false"
          className="mt-6 block h-auto w-full select-none lg:ml-auto lg:mt-0 lg:w-[60%] lg:translate-y-2 lg:scale-[1.08] lg:origin-right lg:[-webkit-mask-image:linear-gradient(to_right,transparent,#000_8%)] lg:[mask-image:linear-gradient(to_right,transparent,#000_8%)]"
        />
      </section>

      {/* Featured Courses */}
      <section
        ref={coursesSectionRef}
        className="relative mx-auto max-w-[1800px] px-4 py-14 sm:px-6 lg:px-[3vw]"
      >
        <div className="mb-8 flex items-center justify-between">
          <h2
            className="cursor-target text-3xl font-extrabold tracking-tight text-slate-900"
            data-cursor-label=""
          >
            Find your next skill
          </h2>

          <Link
            to="/courses"
            className="cursor-target inline-flex items-center gap-2 rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            data-cursor-label=""
          >
            View All Courses <span aria-hidden="true">→</span>
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
    </div>
  );
};

export default Home;
