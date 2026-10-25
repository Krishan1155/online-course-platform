import { useEffect, useState } from 'react';



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

// YOUTUBE URL

// =====================================================



const getEmbedUrl = (url) => {

  if (!url) {

    return '';

  }



  if (url.includes('/embed/')) {

    return url;

  }



  try {

    const parsedUrl = new URL(url);



    if (parsedUrl.hostname.includes('youtube.com')) {

      const videoId = parsedUrl.searchParams.get('v');



      if (videoId) {

        return `https://www.youtube.com/embed/${videoId}`;

      }

    }



    if (parsedUrl.hostname === 'youtu.be') {

      const videoId = parsedUrl.pathname.substring(1);



      if (videoId) {

        return `https://www.youtube.com/embed/${videoId}`;

      }

    }

  } catch {

    return url;

  }



  return url;

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

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [savingProgress, setSavingProgress] = useState(false);

  const [savedPlaybackPosition, setSavedPlaybackPosition] = useState(0);



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



      const allLessons = courseModules.flatMap((module) =>
  [...(module.lessons || [])].sort(
    (a, b) => a.order - b.order
  )
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



     setSavedPlaybackPosition(0);

if (firstLesson?._id) {
  try {
    const { data: playbackData } = await api.get(
      `/progress/${courseId}?lessonId=${firstLesson._id}`
    );

    setSavedPlaybackPosition(
      playbackData.data?.lastPlaybackPosition || 0
    );
  } catch (err) {
    console.error('Failed to load playback position:', err);
  }
}

setActiveLesson(firstLesson);



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



  const handleSelectLesson = async (lesson) => {

    setActiveLesson(lesson);



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

    throw err;
  } finally {
    setSavingProgress(false);
  }
};


// This function sends the current video time to your new backend endpoint.
const saveVideoPosition = async (currentTime) => {
  if (!activeLesson || !courseId) return;

  try {
    await api.put(
      `/progress/${courseId}/lesson/${activeLesson._id}/playback`,
      { currentTime }
    );
  } catch (err) {
    console.error('Failed to save video position:', err);
  }
};


// AUTO-COMPLETE DOCUMENT LESSON AFTER 9 SECONDS
useEffect(() => {
  if (!activeLesson || savingProgress) return;

  if (
    activeLesson.contentType !== 'document' ||
    isLessonCompleted(activeLesson._id)
  ) {
    return;
  }

  const timer = setTimeout(() => {
    handleMarkComplete().catch((err) => {
      console.error('Failed to complete document lesson:', err);
    });
  },9000);

  return () => clearTimeout(timer);
}, [activeLesson, progress.completedLessons, savingProgress]);



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
  className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition-colors duration-200 hover:bg-indigo-100"
>
  <span aria-hidden="true">←</span>
  My Courses
</Link>


      </div>

    );

  }



  // ===================================================

  // CURRENT LESSON

  // ===================================================



  const documentUrl = activeLesson?.documentPlaybackUrl ||
    (activeLesson?.documentUrl
      ? getBackendUrl(activeLesson.documentUrl)
      : '');



  const completed = activeLesson

    ? isLessonCompleted(activeLesson._id)

    : false;



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

  console.error('PDF download failed:', error);

  setError(
    error.message || 'Failed to download PDF'
  );
}

  };



  // ===================================================

  // UI

  // ===================================================



  return (

    <div className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* =================================================

            TOP

        ================================================= */}



        <div className="mb-6 flex items-start justify-between">

          <div>

          
<Link
  to="/my-courses"
  className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition-colors duration-200 hover:bg-indigo-100"
>
  <span aria-hidden="true">←</span>
  My Courses
</Link>




            <h1 className="mt-2 text-2xl font-bold text-gray-900">

              {course?.title || 'Course'}

            </h1>

          </div>



          <div className="text-right">

            <p className="text-sm text-gray-500">

              Progress

            </p>



            <p className="text-xl font-bold text-primary-600">

              {progress.progressPercentage || 0}%

            </p>

          </div>

        </div>



        {/* =================================================

            ERROR

        ================================================= */}



        {error && (

          <Alert

            type="error"

            message={error}

            onClose={() => setError('')}

          />

        )}



        {/* =================================================

            MAIN GRID

        ================================================= */}



        <div className="grid gap-6 lg:grid-cols-3">

          {/* =================================================

              MAIN CONTENT

          ================================================= */}



          <div className="lg:col-span-2">

            {/* =================================================

                CONTENT VIEWER

            ================================================= */}



            <div className="mb-4 overflow-hidden rounded-xl bg-black">

              {/* NO LESSON */}



              {!activeLesson ? (

                <div className="flex aspect-video items-center justify-center text-white">

                  No lessons available

                </div>

              ) : activeLesson.contentType === 'video' ? (

                /* =================================================

                   VIDEO

                ================================================= */



                <div className="aspect-video">

                  {activeLesson.videoUrl?.includes('youtube') ||

                  activeLesson.videoUrl?.includes('youtu.be') ? (

                    <iframe

                      src={getEmbedUrl(activeLesson.videoUrl)}

                      title={activeLesson.title}

                      className="h-full w-full"

                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

                      allowFullScreen

                    />

                  ) : (

                    


<video
  key={activeLesson._id}
  src={
    activeLesson.videoPlaybackUrl ||
    getBackendUrl(activeLesson.videoUrl)
  }
  controls
  preload="metadata"
  className="h-full w-full"
  onLoadedMetadata={(e) => {           // This tells the browser to seek to the saved timestamp once the video metadata is available.
  if (savedPlaybackPosition > 0) {
    e.currentTarget.currentTime = savedPlaybackPosition;
  }
}}
  onTimeUpdate={(e) => {        // onTimeUpdate: saves the position approximately every five seconds.
    const currentTime = e.currentTarget.currentTime;

    if (Math.floor(currentTime) % 5 === 0) {
      saveVideoPosition(currentTime);
    }
  }}
  onPause={(e) => {            // onPause: saves the current position when the student pauses or leaves the video player.
    saveVideoPosition(e.currentTarget.currentTime);
  }}
  onEnded={handleMarkComplete}  // onEnded: preserves your existing automatic lesson completion.
/>




                  )}

                </div>

              ) : activeLesson.contentType === 'document' ? (

                /* =================================================

                   DOCUMENT

                ================================================= */



                <div className="bg-white text-gray-900">

                  {/* =================================================

                      PDF

                  ================================================= */}



                  {activeLesson.documentType === 'pdf' && (

                    <div>

                      {documentUrl ? (

                        <iframe

                          src={documentUrl}

                          title={activeLesson.title}

                          className="h-[650px] w-full"

                        />

                      ) : (

                        <div className="flex min-h-[400px] items-center justify-center text-gray-500">

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

                              📕 Open PDF

                            </a>



                            <button

                              type="button"

                              onClick={handleDownloadPdf}

                              className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"

                            >

                              ⬇ Download PDF

                            </button>

                          </>

                        )}

                      </div>

                    </div>

                  )}



                  {/* =================================================

                      WEB URL

                  ================================================= */}



                  {activeLesson.documentType === 'url' && (

                    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">

                      <div className="mb-5 text-6xl">

                        🔗

                      </div>



                      <h2 className="mb-2 text-2xl font-semibold">

                        {activeLesson.title}

                      </h2>



                      <p className="mb-6 text-gray-500">

                        Web Documentation

                      </p>



                      <a

                        href={activeLesson.documentUrl}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="btn-primary"

                      >

                        🔗 Open Documentation

                      </a>

                    </div>

                  )}



                  {/* =================================================

                      TEXT / NOTES

                  ================================================= */}



                  {activeLesson.documentType === 'text' && (

                    <div className="min-h-[500px] p-8">

                      <div className="mb-6">

                        <div className="mb-3 text-5xl">

                          📝

                        </div>



                        <h2 className="text-2xl font-bold">

                          {activeLesson.title}

                        </h2>

                      </div>



                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">

                        <div className="whitespace-pre-wrap text-base leading-8 text-gray-700">

                          {activeLesson.documentText}

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              ) : null}

            </div>



            {/* =================================================

                LESSON INFORMATION

            ================================================= */}



            {activeLesson && (

              <div className="rounded-xl bg-white p-6 shadow-sm">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <div className="mb-2 flex items-center gap-2">

                      <span className="text-xl">

                        {getContentIcon(activeLesson.contentType)}

                      </span>



                      <h2 className="text-xl font-bold text-gray-900">

                        {activeLesson.title}

                      </h2>

                    </div>



                    {activeLesson.description && (

                      <p className="mb-4 whitespace-pre-wrap text-gray-600">

                        {activeLesson.description}

                      </p>

                    )}



                    {activeLesson.duration > 0 && (
  <p className="mt-2 text-sm text-gray-500">
    Estimated duration: {activeLesson.duration} min
  </p>
)}

                  </div>



                  {completed && (

                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">

                      ✓ Completed

                    </span>

                  )}

                </div>

              </div>

            )}

          </div>



          {/* =================================================

              SIDEBAR

          ================================================= */}



          <div className="rounded-xl bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold">

              Course Content

            </h2>



            {modules.map((module, mIdx) => (

              <div

                key={module._id}

                className="mb-5"

              >

                <h3 className="mb-3 font-medium text-gray-800">

                  Module {mIdx + 1}: {module.title}

                </h3>



                <div className="space-y-1">

                  {[...(module.lessons || [])]
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map((lesson, lIdx) => {

                      const lessonCompleted =

                        isLessonCompleted(lesson._id);



                      const isActive =

                        activeLesson?._id === lesson._id;



                      return (

                        <button

                          key={lesson._id}

                          type="button"

                          onClick={() =>

                            handleSelectLesson(lesson)

                          }

                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition ${

                            isActive

                              ? 'bg-primary-50 text-primary-700'

                              : 'hover:bg-gray-50'

                          }`}

                        >

                          <span className="w-5 shrink-0">

                            {lessonCompleted ? (

                              <span className="text-green-600">

                                ✓

                              </span>

                            ) : (

                              <span className="text-gray-400">

                                {lIdx + 1}

                              </span>

                            )}

                          </span>



                          <span>

                            {getContentIcon(

                              lesson.contentType

                            )}

                          </span>



                          <span className="flex-1">

                            {lesson.title}

                          </span>

                        </button>

                      );

                    }

                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

};



export default Learn;
