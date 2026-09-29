import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDuration } from '../../utils/helpers';

const Learn = () => {
  const { courseId } = useParams();
  const [content, setContent] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchContent = async () => {
    try {
      const { data } = await api.get(`/enrollments/content/${courseId}`);
      setContent(data.data);

      const progress = data.data.progress;
      let lessonToPlay = null;

      if (progress?.lastAccessedLesson) {
        for (const mod of data.data.modules) {
          const found = mod.lessons.find((l) => l._id === progress.lastAccessedLesson);
          if (found) {
            lessonToPlay = found;
            break;
          }
        }
      }

      if (!lessonToPlay && data.data.modules[0]?.lessons[0]) {
        lessonToPlay = data.data.modules[0].lessons[0];
      }

      setActiveLesson(lessonToPlay);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [courseId]);

  const isLessonCompleted = (lessonId) => {
    return content?.progress?.completedLessons?.some(
      (id) => id.toString() === lessonId.toString()
    );
  };

  const selectLesson = async (lesson) => {
    setActiveLesson(lesson);
    try {
      await api.put(`/progress/${courseId}/lesson/${lesson._id}/access`);
    } catch (err) {
      console.error(err.message);
    }
  };

  const markComplete = async () => {
    if (!activeLesson) return;
    setCompleting(true);
    try {
      const { data } = await api.post(`/progress/${courseId}/lesson/${activeLesson._id}/complete`);
      setContent((prev) => ({
        ...prev,
        progress: data.data,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Alert type="error" message={error || 'Unable to load course content'} />
        <Link to="/my-courses" className="btn-primary mt-4 inline-block">
          Back to My Courses
        </Link>
      </div>
    );
  }

  const progressPercent = content.progress?.progressPercentage || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/my-courses" className="text-sm text-primary-600 hover:underline">
            ← My Courses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{content.course.title}</h1>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500">Progress</span>
          <div className="text-lg font-bold text-primary-600">{progressPercent}%</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 overflow-hidden rounded-xl bg-black aspect-video">
            {activeLesson ? (
              activeLesson.videoUrl.includes('youtube') || activeLesson.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(activeLesson.videoUrl)}
                  title={activeLesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeLesson.videoUrl} controls className="h-full w-full" />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-white">Select a lesson</div>
            )}
          </div>

          {activeLesson && (
            <div className="card">
              <h2 className="mb-2 text-xl font-semibold">{activeLesson.title}</h2>
              {activeLesson.description && (
                <p className="mb-4 text-gray-600">{activeLesson.description}</p>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={markComplete}
                  disabled={completing || isLessonCompleted(activeLesson._id)}
                  className="btn-primary"
                >
                  {isLessonCompleted(activeLesson._id)
                    ? '✓ Completed'
                    : completing
                    ? 'Saving...'
                    : 'Mark as Complete'}
                </button>
                <span className="text-sm text-gray-500">{formatDuration(activeLesson.duration)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card max-h-[calc(100vh-200px)] overflow-y-auto">
          <h3 className="mb-4 font-semibold">Course Content</h3>
          {content.modules.map((module, mIdx) => (
            <div key={module._id} className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Module {mIdx + 1}: {module.title}
              </p>
              <ul className="space-y-1">
                {module.lessons.map((lesson, lIdx) => {
                  const completed = isLessonCompleted(lesson._id);
                  const active = activeLesson?._id === lesson._id;

                  return (
                    <li key={lesson._id}>
                      <button
                        onClick={() => selectLesson(lesson)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          active
                            ? 'bg-primary-100 text-primary-800'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {completed ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">{lIdx + 1}</span>
                          )}
                          {lesson.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Learn;
