import { useEffect, useState, useRef } from 'react';

import { Link, useParams } from 'react-router-dom';

import api from '../../api/axios';

import Alert from '../../components/Alert';

import LoadingSpinner from '../../components/LoadingSpinner';

// =====================================================

// BACKEND URL

// =====================================================

const getBackendUrl = (url) => {

  if (!url) {

    return '';

  }

  if (url.startsWith('http://') || url.startsWith('https://')) {

    return url;

  }

  const apiBase = api.defaults.baseURL || '';

  const backendBase = apiBase.replace(/\/api\/?$/, '');

  if (url.startsWith('/')) {

    return `${backendBase}${url}`;

  }

  return `${backendBase}/${url}`;

};


// =====================================================

// ICON

// =====================================================

const getContentIcon = (contentType) => {

  if (contentType === 'video') {

    return '🎥';

  }

  if (contentType === 'document') {

    return '📄';

  }

  return '📚';

};

// =====================================================

// COMPONENT

// =====================================================

const Learn = () => {

  const params = useParams();

  const courseId = params.courseId || params.id;

  // ===================================================

  // STATE

  // ===================================================

  const [course, setCourse] = useState(null);

  const [modules, setModules] = useState([]);

  const [progress, setProgress] = useState({

    progressPercentage: 0,

    completedLessons: [],

  });

  const [activeLesson, setActiveLesson] = useState(null);

  const [expandedModules, setExpandedModules] = useState({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [savingProgress, setSavingProgress] = useState(false);

  const [savedPlaybackPosition, setSavedPlaybackPosition] = useState(0);
  const lastSavedTimeRef = useRef(0);

  const [playbackReady, setPlaybackReady] = useState(false); //Continues to manage the saved playback position as before.

  const [playbackUrl, setPlaybackUrl] = useState(''); //Stores the presigned URL for the currently selected lesson.
  const [playbackUrlLoading, setPlaybackUrlLoading] = useState(false); //Shows a loading message while the backend generates the URL.



  const playbackCache = useRef(new Map());   // This cache will store URLs by lesson ID and their expiry timestamps.


  const videoRef = useRef(null);
  const pendingPlaybackRestoreRef = useRef(null);
  const refreshingPlaybackRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const playbackRetryRef = useRef(false);
  const playbackRequestIdRef = useRef(0);



  // ===================================================

  // GET COURSE CONTENT

  // ===================================================

  const fetchContent = async () => {

    try {

      setLoading(true);

      setError('');

      const { data } = await api.get(

        `/enrollments/content/${courseId}`

      );

      const result = data.data || {};

      setCourse(result.course || null);

      const courseModules = result.modules || [];

      setModules(courseModules);

      // ------------------------------------------------

      // Progress

      // ------------------------------------------------

      if (result.progress) {

        setProgress({

          progressPercentage:

            result.progress.progressPercentage || 0,

          completedLessons:

            result.progress.completedLessons || [],

        });

      }

      // ------------------------------------------------

      // All lessons

      // ------------------------------------------------

      const allLessons = courseModules.flatMap(

        (module) => module.lessons || []

      );

      // ------------------------------------------------

      // First lesson

      // ------------------------------------------------

      let firstLesson = allLessons[0] || null;

      // ------------------------------------------------

      // Last accessed lesson

      // ------------------------------------------------

      if (result.progress?.lastAccessedLesson) {

        const lastAccessedId =

          typeof result.progress.lastAccessedLesson === 'object'

            ? result.progress.lastAccessedLesson?._id

            : result.progress.lastAccessedLesson;

        const lastLesson = allLessons.find(

          (lesson) =>

            String(lesson._id) === String(lastAccessedId)

        );

        if (lastLesson) {

          firstLesson = lastLesson;

        }

      }

      setActiveLesson(firstLesson);

      if (firstLesson) {

        const activeModule = courseModules.find((module) =>

          (module.lessons || []).some(

            (lesson) => String(lesson._id) === String(firstLesson._id)

          )

        );

        if (activeModule) {

          setExpandedModules({ [activeModule._id]: true });

        }

      }

      // ------------------------------------------------

      // Update last access

      // ------------------------------------------------

      if (firstLesson?._id) {

        try {

          await api.put(

            `/progress/${courseId}/lesson/${firstLesson._id}/access`

          );

        } catch {

          // Don't block page if last-access update fails.

        }

      }

    } catch (err) {

      setError(

        err.response?.data?.message ||

        err.message ||

        'Failed to load course content'

      );

    } finally {

      setLoading(false);

    }

  };

  // ===================================================

  // LOAD

  // ===================================================

  useEffect(() => {

    if (!courseId) {

      return;

    }

    fetchContent();

  }, [courseId]);


  

  const refreshPlaybackUrl = async (shouldResume = true) => {
  if (!courseId || !activeLesson?._id) return;
  if (refreshingPlaybackRef.current) return;

  const requestId = ++playbackRequestIdRef.current;
const lessonId = activeLesson._id;

  refreshingPlaybackRef.current = true;

  const video = videoRef.current;
  const currentTime = video
    ? video.currentTime
    : savedPlaybackPosition;

  try {
    const { data } = await api.get(
      `/lessons/${courseId}/${lessonId}/playback-url`
    );

    if (requestId !== playbackRequestIdRef.current) 
    {
       return;
     }

    const { playbackUrl, expiresAt } = data.data || {};

    if (!playbackUrl || !expiresAt) {
      throw new Error('New playback URL was not returned');
    }

    playbackCache.current.set(lessonId, {
      playbackUrl,
      expiresAt,
    });

    pendingPlaybackRestoreRef.current = {
      currentTime,
      shouldResume,
    };

    setPlaybackUrl(playbackUrl);
    setError('');
    } catch (err) {
    if (requestId === playbackRequestIdRef.current) {
      setError(
        err.response?.data?.message ||
        'Unable to refresh video access. Please try again.'
      );
    }
  } finally {
    if (requestId === playbackRequestIdRef.current) {
      refreshingPlaybackRef.current = false;
    }
  }
};


// ===================================================
// LOAD SELECTED LESSON MEDIA URL
// ===================================================

useEffect(() => {
  if (!courseId || !activeLesson?._id) {
    setPlaybackUrl('');
    setPlaybackUrlLoading(false);
    return;
  }

  const isVideo = activeLesson.contentType === 'video';

  const isS3Pdf =
    activeLesson.contentType === 'document' &&
    activeLesson.documentType === 'pdf' &&
    !activeLesson.documentUrl;

  if (!isVideo && !isS3Pdf) {
    setPlaybackUrl('');
    setPlaybackUrlLoading(false);
    return;
  }

  let cancelled = false;

  const fetchPlaybackUrl = async () => {
    try {
      setPlaybackUrlLoading(true);
      setError('');

      const cached = playbackCache.current.get(activeLesson._id);

      // Reuse cached URL if it is still valid.
      if (cached && cached.expiresAt > Date.now() + 60000) {
        if (!cancelled) {
          setPlaybackUrl(cached.playbackUrl);
        }
        return;
      }

      const { data } = await api.get(
        `/lessons/${courseId}/${activeLesson._id}/playback-url`
      );

      const { playbackUrl, expiresAt } = data.data || {};

      if (!playbackUrl || !expiresAt) {
        throw new Error('Playback URL or expiry was not returned');
      }


      if (!cancelled) {
        playbackCache.current.set(activeLesson._id, {
        playbackUrl,
        expiresAt,
      });
        setPlaybackUrl(playbackUrl);
      }
    } catch (err) {
      if (!cancelled) {
        setPlaybackUrl('');
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load lesson media. Please try again.'
        );
      }
    } finally {
      if (!cancelled) {
        setPlaybackUrlLoading(false);
      }
    }
  };

  fetchPlaybackUrl();

  return () => {
    cancelled = true;
  };
}, [
  courseId,
  activeLesson?._id,
  activeLesson?.contentType,
  activeLesson?.documentType,
  activeLesson?.documentUrl,
]);



  // Load saved playback position whenever the selected lesson changes
  useEffect(() => {
    if (!courseId || !activeLesson?._id) return;

    let cancelled = false;

    const loadPlaybackPosition = async () => {
  setPlaybackReady(false);
  setSavedPlaybackPosition(0);
  lastSavedTimeRef.current = 0;

  try {
    const { data } = await api.get(
      `/progress/${courseId}?lessonId=${activeLesson._id}`
    );

    if (!cancelled) {
      const position = Number(
        data.data?.lastPlaybackPosition || 0
      );

      setSavedPlaybackPosition(position);
      lastSavedTimeRef.current = position;
      setPlaybackReady(true);
    }
  } catch (err) {
    if (!cancelled) {
      setSavedPlaybackPosition(0);
      setPlaybackReady(true);
    }
  }
};
  loadPlaybackPosition();

  return () => {
    cancelled = true;
  };
}, [courseId, activeLesson?._id]);


  // ===================================================

  // CHECK COMPLETED

  // ===================================================

  const isLessonCompleted = (lessonId) => {

    return progress.completedLessons.some((item) => {

      const id =

        typeof item === 'object' ? item._id : item;

      return String(id) === String(lessonId);

    });

  };

  // ===================================================

  // SELECT LESSON

  // ===================================================

 

  const handleSelectLesson = async (lesson, moduleId) => {
    
  if (String(activeLesson?._id) === String(lesson._id)) {
    return;
  }

   playbackRequestIdRef.current += 1;
   refreshingPlaybackRef.current = false;

  setPlaybackReady(false);
  playbackRetryRef.current = false;
  wasPlayingRef.current = false;

  // Clear the previous lesson's media URL.
  setPlaybackUrl('');
  setPlaybackUrlLoading(false);

  setActiveLesson(lesson);

    if (moduleId) {

      setExpandedModules((prev) => ({ ...prev, [moduleId]: true }));

    }

    try {

      await api.put(

        `/progress/${courseId}/lesson/${lesson._id}/access`

      );

    } catch {

      // Ignore last-access errors.

    }

  };

  // ===================================================

  // MARK COMPLETE

  // ===================================================

  const handleMarkComplete = async () => {

    if (!activeLesson || savingProgress) {

      return;

    }

    if (isLessonCompleted(activeLesson._id)) {

      return;

    }

    try {

      setSavingProgress(true);

      setError('');

      const { data } = await api.post(

        `/progress/${courseId}/lesson/${activeLesson._id}/complete`

      );

      if (data.data) {

        setProgress(data.data);

      } else {

        setProgress((prev) => ({

          ...prev,

          completedLessons: [

            ...prev.completedLessons,

            activeLesson._id,

          ],

        }));

      }

    } catch (err) {

      setError(

        err.response?.data?.message ||

        err.message ||

        'Failed to update progress'

      );

    } finally {

      setSavingProgress(false);

    }

  };

  // ===================================================

  // LOADING

  // ===================================================

  if (loading) {

    return (

      <div className="flex justify-center py-16">

        <LoadingSpinner size="lg" />

      </div>

    );

  }

  // ===================================================

  // ERROR

  // ===================================================

  if (error && !course) {

    return (

      <div className="mx-auto max-w-6xl px-4 py-8">

        <Alert

          type="error"

          message={error}

          onClose={() => setError('')}

        />

        <Link

          to="/my-courses"

          className="mt-4 inline-block text-primary-600 hover:underline"

        >

          ← Back to My Courses

        </Link>

      </div>

    );

  }

  // ===================================================

  // CURRENT LESSON

  // ===================================================

  const documentUrl =playbackUrl || (activeLesson?.documentUrl ? 
    getBackendUrl(activeLesson.documentUrl): '');

  const completed = activeLesson

    ? isLessonCompleted(activeLesson._id)

    : false;

  const allCourseLessons = modules.flatMap((module) => module.lessons || []);

  const totalDurationMinutes = allCourseLessons.reduce(

    (total, lesson) => total + (Number(lesson.duration) || 0),

    0

  );

  const totalHours = Math.floor(totalDurationMinutes / 60);

  const remainingMinutes = totalDurationMinutes % 60;

  const courseRating =
    course?.ratingAverage ??
    course?.averageRating ??
    course?.rating ??
    course?.ratingsAverage ??
    null;

  const ratingCount =
    course?.ratingCount ??
    course?.ratingsCount ??
    course?.numReviews ??
    null;

  // ===================================================

  // DOWNLOAD PDF

  // ===================================================

  const handleDownloadPdf = async () => {

    if (!documentUrl) {

      return;

    }

    try {

      const response = await fetch(documentUrl);

      if (!response.ok) {

        throw new Error('Failed to download PDF');

      }

      const blob = await response.blob();

      const fileName =

        activeLesson?.title

          ?.replace(/[^a-z0-9]/gi, '_')

          .toLowerCase() || 'document';

      if ('showSaveFilePicker' in window) {

        const fileHandle = await window.showSaveFilePicker({

          suggestedName: `${fileName}.pdf`,

          types: [

            {

              description: 'PDF Document',

              accept: {

                'application/pdf': ['.pdf'],

              },

            },

          ],

        });

        const writable = await fileHandle.createWritable();

        await writable.write(blob);

        await writable.close();

        return;

      }

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = blobUrl;

      link.download = `${fileName}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {

      if (error.name === 'AbortError') {

        return;

      }

      setError('Failed to download PDF');

    }

  };

  // ===================================================

  // UI

  // ===================================================

  return (

    <div className="fixed left-0 right-0 top-[88px] z-[999] h-[calc(100dvh-88px)] w-screen max-w-none overflow-hidden bg-white text-slate-900">

      <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">

        {/* LEFT PANE: this scrolls independently and contains the footer */}

        <main className="min-h-0 overflow-y-auto overscroll-contain bg-white">

          <div className="w-full">

            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-8">

              <div className="min-w-0">

                <Link

                  to="/my-courses"

                  className="text-sm font-medium text-primary-600 hover:underline"

                >

                  ← My Courses

                </Link>

                <h1 className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">

                  {course?.title || 'Course'}

                </h1>

              </div>

              <div className="shrink-0 text-right">

                <p className="text-xs text-slate-500">Your progress</p>

                <p className="text-lg font-bold text-primary-600">

                  {progress.progressPercentage || 0}%

                </p>

              </div>

            </div>

            {error && (

              <div className="px-5 pt-4 sm:px-8">

                <Alert type="error" message={error} onClose={() => setError('')} />

              </div>

            )}

            {/* Player */}

            <div className="bg-black">

              {!activeLesson ? (

                <div className="flex aspect-video items-center justify-center text-sm text-white">

                  No lessons available

                </div>

              ) : activeLesson.contentType === 'video' ? (

                <div className="aspect-video">

  {playbackUrlLoading || !playbackReady ? (
    <div className="flex aspect-video items-center justify-center text-white">
      Loading video...
    </div>
  ) : playbackUrl ? (
    <video
      key={activeLesson._id}
      src={playbackUrl}
      controls
      ref={videoRef}

      onEnded={() => handleMarkComplete()}

      onPlay={() => {
        wasPlayingRef.current = true;
      }}

      onError={() => {
        if (playbackRetryRef.current) {
          setError('Video could not be loaded. Please try again later.');
          return;
        }

        playbackRetryRef.current = true;
        refreshPlaybackUrl(wasPlayingRef.current);
      }}
      className="h-full w-full"
      onLoadedMetadata={(e) => {
        playbackRetryRef.current = false;

        const video = e.currentTarget;
        const pending = pendingPlaybackRestoreRef.current;

        if (pending) {
          video.currentTime = pending.currentTime;

          if (pending.shouldResume) 
          {
            video.play().catch((err) => {
              console.error('Video resume failed:', err);
            });
          }

          pendingPlaybackRestoreRef.current = null;
          return;
        }

        if (savedPlaybackPosition > 0 && savedPlaybackPosition < video.duration) 
        {
          video.currentTime = savedPlaybackPosition;
        }
      }}

      onTimeUpdate={async (e) => {
        const video = e.currentTarget;
        const currentTime = Math.floor(video.currentTime);

        if (Math.abs(currentTime - lastSavedTimeRef.current) >= 20) 
        {
          lastSavedTimeRef.current = currentTime;

          try {
            await api.put(
              `/progress/${courseId}/lesson/${activeLesson._id}/playback`,
              { currentTime }
            );
          } catch (err) {
            console.error('Failed to save playback position:', err);
          }
        }
      }}

      onPause={async (e) => {
        wasPlayingRef.current = false;

        const currentTime = Math.floor(e.currentTarget.currentTime);
        lastSavedTimeRef.current = currentTime;

        try {
          await api.put(
            `/progress/${courseId}/lesson/${activeLesson._id}/playback`,
            { currentTime }
          );
        } catch (err) {
          console.error('Failed to save playback position:', err);
        }
      }}
    />
  ) : (
    <div className="flex aspect-video items-center justify-center text-white">
      Video could not be loaded.
    </div>
  )}

</div>

              ) : activeLesson.contentType === 'document' ? (

                <div className="bg-white text-slate-900">

                  {activeLesson.documentType === 'pdf' && (

                    <div>

                      {playbackUrlLoading ? (
  <div className="flex min-h-[400px] items-center justify-center">
    Loading PDF...
  </div>
) : documentUrl ? (
  <iframe
    src={documentUrl}
    title={activeLesson.title}
    className="h-[65vh] min-h-[420px] w-full"
  />
) : (
  <div className="flex min-h-[400px] items-center justify-center">
    PDF not available
  </div>
)}

                      <div className="flex flex-wrap gap-3 border-t p-4">

                        {documentUrl && (

                          <>

                            <a

                              href={documentUrl}

                              target="_blank"

                              rel="noopener noreferrer"

                              className="btn-primary"

                            >

                              Open PDF

                            </a>

                            <button

                              type="button"

                              onClick={handleDownloadPdf}

                              className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"

                            >

                              Download PDF

                            </button>

                          </>

                        )}

                      </div>

                    </div>

                  )}

                  {activeLesson.documentType === 'url' && (

                    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">

                      <div className="mb-4 text-5xl">🔗</div>

                      <h2 className="mb-2 text-xl font-semibold">{activeLesson.title}</h2>

                      <p className="mb-5 text-slate-500">Web documentation</p>

                      <a

                        href={activeLesson.documentUrl}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="btn-primary"

                      >

                        Open documentation

                      </a>

                    </div>

                  )}

                  {activeLesson.documentType === 'text' && (

                    <div className="min-h-[420px] p-6 sm:p-8">

                      <h2 className="mb-5 text-2xl font-bold">{activeLesson.title}</h2>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                        <div className="whitespace-pre-wrap text-base leading-8 text-slate-700">

                          {activeLesson.documentText}

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              ) : (

                <div className="flex aspect-video items-center justify-center text-white">

                  This content type is not supported.

                </div>

              )}

            </div>

            {/* Current lesson details */}

            {activeLesson && (

              <section className="border-b border-gray-200 px-5 py-5 sm:px-8">

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>

                    <div className="flex items-center gap-2">

                      <span className="text-xl">{getContentIcon(activeLesson.contentType)}</span>

                      <h2 className="text-xl font-bold text-slate-900">{activeLesson.title}</h2>

                    </div>

                    {activeLesson.description && (

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                        {activeLesson.description}

                      </p>

                    )}

                    {Number(activeLesson.duration) > 0 && (

                      <p className="mt-2 text-sm text-slate-500">

                        duration: {activeLesson.duration} min

                      </p>

                    )}

                  </div>

                </div>

              </section>

            )}

            {/* Course overview below the player, like the reference */}


            {/* Course information below the video */}
            <section className="border-b border-gray-200 bg-white px-5 py-7 sm:px-8">

              {/* Course Title */}
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#2d2f31] sm:text-3xl">
                {course?.title || 'Course Title'}
              </h2>


              {/* Rating, Students, and Duration */}
              <div className="mt-5 flex flex-wrap items-start gap-x-10 gap-y-4 border-b border-gray-200 pb-6">

                {/* Rating */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#b4690e]">
                      {courseRating == null
                        ? 'New'
                        : Number(courseRating).toFixed(1)}
                    </span>
                    {courseRating != null && (
                      <span className="text-lg text-[#b4690e]">★</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#6a6f73]">
                    {ratingCount == null ? 'No ratings yet' : `${Number(ratingCount).toLocaleString()} ratings`}
                  </p>
                </div>


                {/* Duration */}
                <div>
                  <p className="text-lg font-bold text-[#2d2f31]">
                    {totalHours > 0
                      ? `${totalHours}.${String(Math.round(remainingMinutes / 60 * 10)).padStart(1, '0')} hours`
                      : `${totalDurationMinutes} min`}
                  </p>
                  <p className="mt-1 text-sm text-[#6a6f73]">Total</p>
                </div>

              </div>


              {/* About the Course */}
              <div className="mt-7">
                <h3 className="text-xl font-bold text-[#2d2f31]">
                  About the course
                </h3>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#2d2f31]">
                  {course?.description || 'No course description available.'}
                </p>
              </div>

              {/* Instructor */}
              <div className="mt-7">
                <h3 className="text-xl font-bold text-[#2d2f31]">
                  Instructor
                </h3>

                <p className="mt-3 text-base font-semibold text-[#5624d0]">
                  {course?.instructor || 'Instructor not specified'}
                </p>
              </div>

            </section>


            {/* Footer is inside the left scroll area only */}

            <footer className="bg-[#1c1d1f] px-6 py-8 text-sm text-white sm:px-8">

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

                <div className="space-y-3">

                  <p className="font-medium">Course Platform</p>

                  <Link to="/courses" className="block text-gray-300 hover:underline">Explore courses</Link>

                  <Link to="/my-courses" className="block text-gray-300 hover:underline">My courses</Link>

                </div>

                <div className="space-y-3">

                  <p className="font-medium">Learn & Grow</p>

                  <span className="block text-gray-300">Expert-Led Courses</span>

                  <span className="block text-gray-300">Build New Skills</span>

                </div>

                <div className="col-span-2 flex items-end text-xs text-gray-400 sm:col-span-1 sm:justify-end">

                  © {new Date().getFullYear()} Course Platform

                </div>

              </div>

            </footer>

          </div>

        </main>

        {/* RIGHT PANE: its own scroll container; no footer here */}

        <aside className="flex min-h-0 flex-col border-t border-gray-200 bg-white lg:border-l lg:border-t-0">

          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

            <h2 className="text-base font-bold text-slate-900">Course content</h2>

            <span className="text-xs text-slate-500">

              {progress.progressPercentage || 0}% complete

            </span>

          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

            {modules.length === 0 ? (

              <p className="p-5 text-sm text-slate-500">No course content available yet.</p>

            ) : (

              modules.map((module, mIdx) => {

                const isExpanded = Boolean(expandedModules[module._id]);

                const lessonCount = (module.lessons || []).length;

                const completedCount = (module.lessons || []).filter((lesson) =>

                  isLessonCompleted(lesson._id)

                ).length;

                return (

                  <section key={module._id} className="border-b border-gray-200">

                    <button

                      type="button"

                      onClick={() =>

                        setExpandedModules((prev) => ({

                          ...prev,

                          [module._id]: !prev[module._id],

                        }))

                      }

                      aria-expanded={isExpanded}

                      className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'

                        }`}

                    >

                      <svg

                        className={`mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''

                          }`}

                        viewBox="0 0 24 24"

                        fill="none"

                        stroke="currentColor"

                        strokeWidth="2"

                        aria-hidden="true"

                      >

                        <path d="m6 9 6 6 6-6" />

                      </svg>

                      <span className="min-w-0 flex-1">

                        <span className="block text-sm font-semibold leading-5 text-slate-900">

                          Module {mIdx + 1}: {module.title}

                        </span>

                        <span className="mt-1 block text-xs text-slate-500">

                          {completedCount} / {lessonCount} lessons completed

                        </span>

                      </span>

                    </button>

                    {isExpanded && (

                      <div className="bg-white pb-2">

                        {(module.lessons || []).map((lesson, lIdx) => {

                          const lessonCompleted = isLessonCompleted(lesson._id);

                          const isActive = activeLesson?._id === lesson._id;

                          return (

                            <button

                              key={lesson._id}

                              type="button"

                              onClick={() => handleSelectLesson(lesson, module._id)}

                              className={`flex w-full items-start gap-3 px-5 py-3 text-left transition ${isActive

                                ? 'bg-primary-50 text-primary-800'

                                : 'text-slate-700 hover:bg-gray-50'

                                }`}

                            >

                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">

                                {lessonCompleted ? (

                                  <span className="text-sm text-green-600">✓</span>

                                ) : (

                                  <span className="text-xs text-slate-400">{lIdx + 1}</span>

                                )}

                              </span>

                              <span className="pt-0.5">{getContentIcon(lesson.contentType)}</span>

                              <span className="min-w-0 flex-1">

                                <span className="block text-sm leading-5">{lesson.title}</span>

                                <span className="mt-1 block text-xs text-slate-500">

                                  {lesson.contentType === 'video' ? 'Video' : 'Resource'}

                                  {Number(lesson.duration) > 0 ? ` · ${lesson.duration} min` : ''}

                                </span>

                              </span>

                            </button>

                          );

                        })}

                        {lessonCount === 0 && (

                          <p className="px-12 py-3 text-sm text-slate-500">No lessons in this module yet.</p>

                        )}

                      </div>

                    )}

                  </section>

                );

              })

            )}

          </div>

        </aside>

      </div>

    </div>

  );

};

export default Learn;
