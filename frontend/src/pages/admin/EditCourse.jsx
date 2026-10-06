import { useEffect, useState } from 'react';

import { Link, useParams } from 'react-router-dom';



import api from '../../api/axios';



import Alert from '../../components/Alert';

import LoadingSpinner from '../../components/LoadingSpinner';



import { getImageUrl } from '../../utils/helpers';





// =====================================================

// EMPTY LESSON FORM

// =====================================================



const emptyLessonForm = {

  title: '',



  contentType: 'video',



  videoUrl: '',



  documentType: 'pdf',

  documentUrl: '',

  documentFile: null,

  documentText: '',






  duration: 0,



  description: '',

};





// =====================================================

// COMPONENT

// =====================================================



const EditCourse = () => {

  const { id } = useParams();





  // ===================================================

  // COURSE

  // ===================================================



  const [course, setCourse] =

    useState(null);





  const [form, setForm] =

    useState({

      title: '',

      description: '',

      price: 0,

      category: '',

      level: 'beginner',

      instructor: '',

      isPublished: false,

    });





  // ===================================================

  // MODULES

  // ===================================================



  const [modules, setModules] =

    useState([]);





  const [moduleForm, setModuleForm] =

    useState({

      title: '',

    });





  // ===================================================

  // LESSON FORMS

  // ===================================================



  const [lessonForms, setLessonForms] =

    useState({});

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingLessonModuleId, setEditingLessonModuleId] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({ ...emptyLessonForm });
  const [updatingLesson, setUpdatingLesson] = useState(false);





  // ===================================================

  // COURSE THUMBNAIL

  // ===================================================



  const [thumbnail, setThumbnail] =

    useState(null);





  // ===================================================

  // UI

  // ===================================================



  const [error, setError] =

    useState('');



  const [success, setSuccess] =

    useState('');



  const [loading, setLoading] =

    useState(true);



  const [saving, setSaving] =

    useState(false);





  // ===================================================

  // GET COURSE

  // ===================================================



  const fetchCourse = async () => {

    try {

      const { data } =

        await api.get(

          `/courses/admin/${id}`

        );



      const c = data.data;



      setCourse(c);



      setForm({

        title: c.title || '',

        description: c.description || '',

        price: c.price || 0,

        category: c.category || '',

        level: c.level || 'beginner',

        instructor: c.instructor || '',

        isPublished:

          c.isPublished || false,

      });



      setModules(

        c.modules || []

      );

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };





  useEffect(() => {

    fetchCourse();

  }, [id]);





  // ===================================================

  // COURSE FORM CHANGE

  // ===================================================



  const handleChange = (e) => {

    const {

      name,

      value,

      type,

      checked,

    } = e.target;



    setForm({

      ...form,



      [name]:

        type === 'checkbox'

          ? checked

          : value,

    });

  };





  // ===================================================

  // UPDATE COURSE

  // ===================================================



  const handleUpdateCourse = async (e) => {

    e.preventDefault();



    setSaving(true);

    setError('');



    try {

      const formData =

        new FormData();



      Object.entries(form).forEach(

        ([key, value]) => {

          formData.append(

            key,

            value

          );

        }

      );



      if (thumbnail) {

        formData.append(

          'thumbnail',

          thumbnail

        );

      }



      await api.put(

        `/courses/${id}`,

        formData,

        {

          headers: {

            'Content-Type':

              'multipart/form-data',

          },

        }

      );



      setSuccess(

        'Course updated successfully'

      );



      await fetchCourse();

    } catch (err) {

      setError(err.message);

    } finally {

      setSaving(false);

    }

  };





  // ===================================================

  // ADD MODULE

  // ===================================================



  const handleAddModule = async (e) => {

    e.preventDefault();



    setError('');



    try {

      const { data } =

        await api.post(

          `/modules/course/${id}`,

          moduleForm

        );



      setModules([

        ...modules,

        {

          ...data.data,

          lessons: [],

        },

      ]);



      setModuleForm({

        title: '',

      });



      setSuccess(

        'Module added successfully'

      );

    } catch (err) {

      setError(err.message);

    }

  };





  // ===================================================

  // DELETE MODULE

  // ===================================================



  const handleDeleteModule =

    async (moduleId) => {

      if (

        !window.confirm(

          'Delete this module and all its lessons?'

        )

      ) {

        return;

      }



      try {

        await api.delete(

          `/modules/${moduleId}`

        );



        setModules(

          modules.filter(

            (m) =>

              m._id !== moduleId

          )

        );



        setSuccess(

          'Module deleted successfully'

        );

      } catch (err) {

        setError(err.message);

      }

    };





  // ===================================================

  // ADD LESSON / CONTENT

  // ===================================================



  const handleAddLesson =

    async (moduleId) => {

      const lessonForm =

        lessonForms[moduleId];





      // -----------------------------------------------

      // Basic validation

      // -----------------------------------------------



      if (!lessonForm?.title?.trim()) {

        setError(

          'Content title is required'

        );



        return;

      }





      if (!lessonForm?.contentType) {

        setError(

          'Content type is required'

        );



        return;

      }





      // -----------------------------------------------

      // Video validation

      // -----------------------------------------------



      if (

        lessonForm.contentType ===

        'video' &&

        !lessonForm.videoUrl?.trim()

      ) {

        setError(

          'Video URL is required'

        );



        return;

      }





      // -----------------------------------------------

      // Document validation

      // -----------------------------------------------



      if (

        lessonForm.contentType ===

        'document'

      ) {

        if (

          lessonForm.documentType ===

          'pdf' &&

          !lessonForm.documentFile

        ) {

          setError(

            'Please select a PDF document'

          );



          return;

        }





        if (

          lessonForm.documentType ===

          'url' &&

          !lessonForm.documentUrl?.trim()

        ) {

          setError(

            'Please enter a documentation URL'

          );



          return;

        }





        if (

          lessonForm.documentType ===

          'text' &&

          !lessonForm.documentText?.trim()

        ) {

          setError(

            'Please enter document content'

          );



          return;

        }

      }





      // -----------------------------------------------






      try {

        setError('');





        // ---------------------------------------------

        // FormData

        // ---------------------------------------------



        const formData =

          new FormData();





        formData.append(

          'title',

          lessonForm.title

        );





        formData.append(

          'contentType',

          lessonForm.contentType

        );





        formData.append(

          'description',

          lessonForm.description ||

          ''

        );





        formData.append(

          'duration',

          lessonForm.duration || 0

        );







        // ---------------------------------------------

        // VIDEO

        // ---------------------------------------------



        if (

          lessonForm.contentType ===

          'video'

        ) {

          formData.append(

            'videoUrl',

            lessonForm.videoUrl

          );

        }





        // ---------------------------------------------

        // DOCUMENT

        // ---------------------------------------------



        if (

          lessonForm.contentType ===

          'document'

        ) {

          formData.append(

            'documentType',

            lessonForm.documentType

          );





          // PDF

          if (

            lessonForm.documentType ===

            'pdf'

          ) {

            formData.append(

              'document',

              lessonForm.documentFile

            );

          }





          // WEB URL

          if (

            lessonForm.documentType ===

            'url'

          ) {

            formData.append(

              'documentUrl',

              lessonForm.documentUrl

            );

          }





          // TEXT

          if (

            lessonForm.documentType ===

            'text'

          ) {

            formData.append(

              'documentText',

              lessonForm.documentText

            );

          }

        }





        // ---------------------------------------------



        // ---------------------------------------------

        // API

        // ---------------------------------------------



        const { data } =

          await api.post(

            `/lessons/module/${moduleId}`,

            formData

          );





        // ---------------------------------------------

        // Update UI

        // ---------------------------------------------



        setModules(

          modules.map((m) =>

            m._id === moduleId

              ? {

                ...m,



                lessons: [

                  ...(m.lessons ||

                    []),



                  data.data,

                ],

              }

              : m

          )

        );





        // ---------------------------------------------

        // Reset form

        // ---------------------------------------------



        setLessonForms({

          ...lessonForms,



          [moduleId]: {

            ...emptyLessonForm,

          },

        });





        setSuccess(

          'Content added successfully'

        );

      } catch (err) {

        setError(err.message);

      }

    };


  // ===================================================

  // DELETE LESSON

  // ===================================================



  const handleDeleteLesson =

    async (

      moduleId,

      lessonId

    ) => {

      if (

        !window.confirm(

          'Delete this content?'

        )

      ) {

        return;

      }



      try {

        await api.delete(

          `/lessons/${lessonId}`

        );



        setModules(

          modules.map((m) =>

            m._id === moduleId

              ? {

                ...m,



                lessons:

                  (

                    m.lessons ||

                    []

                  ).filter(

                    (lesson) =>

                      lesson._id !==

                      lessonId

                  ),

              }

              : m

          )

        );



        setSuccess(

          'Content deleted successfully'

        );

      } catch (err) {

        setError(err.message);

      }

    };



  // ===================================================

  // EDIT LESSON

  const handleStartEditLesson = (moduleId, lesson) => {
    setEditingLessonId(lesson._id);
    setEditingLessonModuleId(moduleId);
    setEditLessonForm({
      title: lesson.title || '',
      contentType: lesson.contentType || 'video',
      videoUrl: lesson.videoUrl || '',
      documentType: lesson.documentType || 'pdf',
      documentUrl: lesson.documentUrl || '',
      documentFile: null,
      documentText: lesson.documentText || '',
      duration: lesson.duration || 0,
      description: lesson.description || '',
    });
    setError('');
  };

  const handleEditLessonFormChange = (field, value) => {
    setEditLessonForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelEditLesson = () => {
    setEditingLessonId(null);
    setEditingLessonModuleId(null);
    setEditLessonForm({ ...emptyLessonForm });
  };

  const handleUpdateLesson = async () => {
    if (!editingLessonId) return;

    const lessonForm = editLessonForm;

    if (!lessonForm.title?.trim()) {
      setError('Content title is required');
      return;
    }

    if (lessonForm.contentType === 'video' && !lessonForm.videoUrl?.trim()) {
      setError('Video URL is required');
      return;
    }

    if (lessonForm.contentType === 'document') {
      if (lessonForm.documentType === 'url' && !lessonForm.documentUrl?.trim()) {
        setError('Please enter a documentation URL');
        return;
      }

      if (lessonForm.documentType === 'text' && !lessonForm.documentText?.trim()) {
        setError('Please enter document content');
        return;
      }

      if (
        lessonForm.documentType === 'pdf' &&
        !lessonForm.documentFile &&
        !lessonForm.documentUrl
      ) {
        setError('Please select a PDF document');
        return;
      }
    }


    try {
      setUpdatingLesson(true);
      setError('');

      const formData = new FormData();
      formData.append('title', lessonForm.title);
      formData.append('contentType', lessonForm.contentType);
      formData.append('description', lessonForm.description || '');
      formData.append('duration', lessonForm.duration || 0);

      if (lessonForm.contentType === 'video') {
        formData.append('videoUrl', lessonForm.videoUrl);
      }

      if (lessonForm.contentType === 'document') {
        formData.append('documentType', lessonForm.documentType);
        if (lessonForm.documentType === 'pdf' && lessonForm.documentFile) {
          formData.append('document', lessonForm.documentFile);
        }
        if (lessonForm.documentType === 'url') {
          formData.append('documentUrl', lessonForm.documentUrl);
        }
        if (lessonForm.documentType === 'text') {
          formData.append('documentText', lessonForm.documentText);
        }
      }


      const { data } = await api.put(
        `/lessons/${editingLessonId}`,
        formData
      );

      setModules((currentModules) =>
        currentModules.map((module) =>
          module._id === editingLessonModuleId
            ? {
              ...module,
              lessons: (module.lessons || []).map((lesson) =>
                lesson._id === editingLessonId ? data.data : lesson
              ),
            }
            : module
        )
      );

      setSuccess('Content updated successfully');
      handleCancelEditLesson();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingLesson(false);
    }
  };

  // ===================================================

  // LESSON FORM UPDATE

  // ===================================================



  const updateLessonForm = (

    moduleId,

    field,

    value

  ) => {

    setLessonForms({

      ...lessonForms,



      [moduleId]: {

        ...(lessonForms[

          moduleId

        ] || {

          ...emptyLessonForm,

        }),



        [field]: value,

      },

    });

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

  // UI

  // ===================================================



  return (

    <div>



      {/* ==============================================

          HEADER

      ============================================== */}



      <div className="mb-6">



        <Link

          to="/admin/courses"

          className="text-sm text-primary-600 hover:underline"

        >

          ← Back to Courses

        </Link>



        <h2 className="text-2xl font-bold text-gray-900">

          Edit Course

        </h2>



      </div>





      {/* ==============================================

          ALERTS

      ============================================== */}



      <Alert

        type="error"

        message={error}

        onClose={() =>

          setError('')

        }

      />



      <Alert

        type="success"

        message={success}

        onClose={() =>

          setSuccess('')

        }

      />





      <div className="grid gap-6 lg:grid-cols-2">





        {/* ============================================

            COURSE DETAILS

        ============================================ */}



        <div className="card">



          <h3 className="mb-4 font-semibold">

            Course Details

          </h3>





          {course?.thumbnail && (

            <img

              src={getImageUrl(

                course.thumbnail

              )}

              alt=""

              className="mb-4 h-32 w-full rounded-lg object-cover"

            />

          )}





          <form

            onSubmit={

              handleUpdateCourse

            }

            className="space-y-3"

          >



            <div>



              <label className="mb-1 block text-sm font-medium">

                Course Title

              </label>



              <input

                name="title"

                required

                className="input-field"

                value={form.title}

                onChange={

                  handleChange

                }

              />



            </div>





            <div>



              <label className="mb-1 block text-sm font-medium">

                Course Description

              </label>



              <textarea

                name="description"

                required

                rows={3}

                className="input-field"

                value={

                  form.description

                }

                onChange={

                  handleChange

                }

              />



            </div>





            <div className="grid grid-cols-2 gap-3">



              <div>



                <label className="mb-1 block text-sm font-medium">

                  Price (INR)

                </label>



                <input

                  name="price"

                  type="number"

                  min="0"

                  className="input-field"

                  value={form.price}

                  onChange={

                    handleChange

                  }

                />



              </div>





              <div>



                <label className="mb-1 block text-sm font-medium">

                  Category

                </label>



                <input

                  name="category"

                  required

                  className="input-field"

                  value={

                    form.category

                  }

                  onChange={

                    handleChange

                  }

                />



              </div>



            </div>





            <div className="grid grid-cols-2 gap-3">



              <div>



                <label className="mb-1 block text-sm font-medium">

                  Level

                </label>



                <select

                  name="level"

                  className="input-field"

                  value={form.level}

                  onChange={

                    handleChange

                  }

                >

                  <option value="beginner">

                    Beginner

                  </option>



                  <option value="intermediate">

                    Intermediate

                  </option>



                  <option value="advanced">

                    Advanced

                  </option>

                </select>



              </div>





              <div>



                <label className="mb-1 block text-sm font-medium">

                  Instructor

                </label>



                <input

                  name="instructor"

                  required

                  className="input-field"

                  value={

                    form.instructor

                  }

                  onChange={

                    handleChange

                  }

                />



              </div>



            </div>





            <div>



              <label className="mb-1 block text-sm font-medium">

                Course Thumbnail

              </label>



              <input

                type="file"

                accept="image/*"

                onChange={(e) =>

                  setThumbnail(

                    e.target.files[0] ||

                    null

                  )

                }

                className="input-field"

              />



            </div>





            <label className="flex items-center gap-2">



              <input

                type="checkbox"

                name="isPublished"

                checked={

                  form.isPublished

                }

                onChange={

                  handleChange

                }

              />



              <span className="text-sm">

                Published

              </span>



            </label>





            <button

              type="submit"

              disabled={saving}

              className="btn-primary"

            >

              {saving

                ? 'Saving...'

                : 'Update Course'}

            </button>



          </form>



        </div>





        {/* ============================================

            MODULES

        ============================================ */}



        <div className="space-y-6">





          {/* ==========================================

              ADD MODULE

          ========================================== */}



          <div className="card">



            <h3 className="mb-4 font-semibold">

              Add Module

            </h3>



            <form

              onSubmit={

                handleAddModule

              }

              className="flex gap-2"

            >



              <input

                className="input-field flex-1"

                placeholder="Module title"

                value={

                  moduleForm.title

                }

                onChange={(e) =>

                  setModuleForm({

                    title:

                      e.target.value,

                  })

                }

                required

              />



              <button

                type="submit"

                className="btn-primary shrink-0"

              >

                Add

              </button>



            </form>



          </div>





          {/* ==========================================

              MODULE LIST

          ========================================== */}



          {modules.map(

            (module, mIdx) => {



              const lessonForm =

                lessonForms[

                module._id

                ] || {

                  ...emptyLessonForm,

                };





              return (

                <div

                  key={module._id}

                  className="card"

                >



                  {/* MODULE HEADER */}



                  <div className="mb-3 flex items-center justify-between">



                    <h4 className="font-medium">

                      Module {mIdx + 1}:{' '}

                      {module.title}

                    </h4>



                    <button

                      onClick={() =>

                        handleDeleteModule(

                          module._id

                        )

                      }

                      className="text-sm text-red-600 hover:underline"

                    >

                      Delete

                    </button>



                  </div>





                  {/* EXISTING CONTENT */}



                  <ul className="mb-4 space-y-1">



                    {module.lessons?.map((lesson) => (
                      <div key={lesson._id} className="space-y-2">
                        <li className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2">
                            {lesson.contentType === 'video' && '🎥'}
                            {lesson.contentType === 'document' && '📄'}
                            <span>{lesson.title}</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => handleStartEditLesson(module._id, lesson)} className="text-primary-600 hover:underline">
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDeleteLesson(module._id, lesson._id)} className="text-red-500 hover:underline">
                              Remove
                            </button>
                          </div>
                        </li>

                        {editingLessonId === lesson._id && (
                          <div className="rounded-lg border border-primary-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                              <h4 className="font-semibold">Edit Content</h4>
                              <button type="button" onClick={handleCancelEditLesson} className="text-sm text-gray-500 hover:underline">
                                Cancel
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="mb-1 block text-sm font-medium">Content Type</label>
                                <select className="input-field" value={editLessonForm.contentType} onChange={(e) => handleEditLessonFormChange('contentType', e.target.value)}>
                                  <option value="video">🎥 Video</option>
                                  <option value="document">📄 Document</option>
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium">Content Title</label>
                                <input className="input-field" value={editLessonForm.title} onChange={(e) => handleEditLessonFormChange('title', e.target.value)} />
                              </div>

                              {editLessonForm.contentType === 'video' && (
                                <div>
                                  <label className="mb-1 block text-sm font-medium">Video URL</label>
                                  <input className="input-field" value={editLessonForm.videoUrl} onChange={(e) => handleEditLessonFormChange('videoUrl', e.target.value)} />
                                </div>
                              )}

                              {editLessonForm.contentType === 'document' && (
                                <>
                                  <div>
                                    <label className="mb-1 block text-sm font-medium">Document Type</label>
                                    <select className="input-field" value={editLessonForm.documentType} onChange={(e) => handleEditLessonFormChange('documentType', e.target.value)}>
                                      <option value="pdf">📕 PDF</option>
                                      <option value="url">🔗 Web URL</option>
                                      <option value="text">📝 Text Content</option>
                                    </select>
                                  </div>

                                  {editLessonForm.documentType === 'pdf' && (
                                    <div>
                                      <label className="mb-1 block text-sm font-medium">Replace PDF</label>
                                      <input type="file" accept="application/pdf,.pdf" className="input-field" onChange={(e) => handleEditLessonFormChange('documentFile', e.target.files[0] || null)} />
                                      <p className="mt-1 text-xs text-gray-500">Leave empty to keep the existing PDF.</p>
                                    </div>
                                  )}

                                  {editLessonForm.documentType === 'url' && (
                                    <div>
                                      <label className="mb-1 block text-sm font-medium">Documentation URL</label>
                                      <input type="url" className="input-field" value={editLessonForm.documentUrl} onChange={(e) => handleEditLessonFormChange('documentUrl', e.target.value)} />
                                    </div>
                                  )}

                                  {editLessonForm.documentType === 'text' && (
                                    <div>
                                      <label className="mb-1 block text-sm font-medium">Document Content</label>
                                      <textarea rows={10} className="input-field" value={editLessonForm.documentText} onChange={(e) => handleEditLessonFormChange('documentText', e.target.value)} />
                                    </div>
                                  )}
                                </>
                              )}

                              <div>
                                <label className="mb-1 block text-sm font-medium">Duration (minutes)</label>
                                <input type="number" min="0" className="input-field" value={editLessonForm.duration} onChange={(e) => handleEditLessonFormChange('duration', Number(e.target.value))} />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium">Description</label>
                                <textarea rows={3} className="input-field" value={editLessonForm.description} onChange={(e) => handleEditLessonFormChange('description', e.target.value)} />
                              </div>

                              <div className="flex gap-2">
                                <button type="button" onClick={handleUpdateLesson} disabled={updatingLesson} className="btn-primary">
                                  {updatingLesson ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={handleCancelEditLesson} disabled={updatingLesson} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}


                  </ul>





                  {/* =================================

                      ADD CONTENT

                  ================================= */}



                  <div className="space-y-4 rounded-lg border border-dashed border-gray-300 p-4">



                    <h3 className="text-lg font-semibold">

                      Add Content

                    </h3>





                    {/* CONTENT TYPE */}



                    <div>



                      <label className="mb-1 block text-sm font-medium">

                        Content Type

                      </label>



                      <select

                        className="input-field"

                        value={

                          lessonForm.contentType

                        }

                        onChange={(e) =>

                          updateLessonForm(

                            module._id,

                            'contentType',

                            e.target.value

                          )

                        }

                      >



                        <option value="video">

                          🎥 Video

                        </option>



                        <option value="document">

                          📄 Document

                        </option>




                      </select>



                    </div>





                    {/* CONTENT TITLE */}



                    <div>



                      <label className="mb-1 block text-sm font-medium">

                        Content Title

                      </label>



                      <input

                        className="input-field"

                        placeholder="Content title"

                        value={

                          lessonForm.title

                        }

                        onChange={(e) =>

                          updateLessonForm(

                            module._id,

                            'title',

                            e.target.value

                          )

                        }

                      />



                    </div>





                    {/* =================================

                        VIDEO

                    ================================= */}



                    {lessonForm.contentType ===

                      'video' && (

                        <>

                          <div>



                            <label className="mb-1 block text-sm font-medium">

                              Video URL

                            </label>



                            <input

                              className="input-field"

                              placeholder="YouTube or direct video URL"

                              value={

                                lessonForm.videoUrl

                              }

                              onChange={(e) =>

                                updateLessonForm(

                                  module._id,

                                  'videoUrl',

                                  e.target.value

                                )

                              }

                            />



                          </div>





                          <div>



                            <label className="mb-1 block text-sm font-medium">

                              Duration (minutes)

                            </label>



                            <input

                              type="number"

                              min="0"

                              className="input-field"

                              value={

                                lessonForm.duration

                              }

                              onChange={(e) =>

                                updateLessonForm(

                                  module._id,

                                  'duration',

                                  Number(

                                    e.target.value

                                  )

                                )

                              }

                            />



                          </div>

                        </>

                      )}





                    {/* =================================

                        DOCUMENT

                    ================================= */}



                    {lessonForm.contentType ===

                      'document' && (

                        <>





                          {/* DOCUMENT TYPE */}



                          <div>



                            <label className="mb-1 block text-sm font-medium">

                              Document Type

                            </label>



                            <select

                              className="input-field"

                              value={

                                lessonForm.documentType ||

                                'pdf'

                              }

                              onChange={(e) =>

                                updateLessonForm(

                                  module._id,

                                  'documentType',

                                  e.target.value

                                )

                              }

                            >



                              <option value="pdf">

                                📕 PDF

                              </option>



                              <option value="url">

                                🔗 Web URL

                              </option>



                              <option value="text">

                                📝 Text Content

                              </option>



                            </select>



                          </div>





                          {/* PDF */}



                          {lessonForm.documentType ===

                            'pdf' && (

                              <div>



                                <label className="mb-1 block text-sm font-medium">

                                  Upload PDF Document

                                </label>



                                <input

                                  type="file"

                                  accept="application/pdf,.pdf"

                                  className="input-field"

                                  onChange={(e) =>

                                    updateLessonForm(

                                      module._id,

                                      'documentFile',

                                      e.target.files[0] ||

                                      null

                                    )

                                  }

                                />



                                <p className="mt-1 text-xs text-gray-500">

                                  PDF only. Maximum size:

                                  20 MB.

                                </p>



                              </div>

                            )}





                          {/* WEB URL */}



                          {lessonForm.documentType ===

                            'url' && (

                              <div>



                                <label className="mb-1 block text-sm font-medium">

                                  Documentation URL

                                </label>



                                <input

                                  type="url"

                                  className="input-field"

                                  placeholder="https://react.dev/learn"

                                  value={

                                    lessonForm.documentUrl ||

                                    ''

                                  }

                                  onChange={(e) =>

                                    updateLessonForm(

                                      module._id,

                                      'documentUrl',

                                      e.target.value

                                    )

                                  }

                                />



                                <p className="mt-1 text-xs text-gray-500">

                                  Student will open this

                                  webpage.

                                </p>



                              </div>

                            )}





                          {/* TEXT */}



                          {lessonForm.documentType ===

                            'text' && (

                              <div>



                                <label className="mb-1 block text-sm font-medium">

                                  Document Content

                                </label>



                                <textarea

                                  rows={12}

                                  className="input-field"

                                  placeholder="Write or paste your lesson content here..."

                                  value={

                                    lessonForm.documentText ||

                                    ''

                                  }

                                  onChange={(e) =>

                                    updateLessonForm(

                                      module._id,

                                      'documentText',

                                      e.target.value

                                    )

                                  }

                                />



                                <p className="mt-1 text-xs text-gray-500">

                                  This content will be shown

                                  directly to students.

                                </p>



                              </div>

                            )}





                          {/* DOCUMENT DURATION */}



                          <div>



                            <label className="mb-1 block text-sm font-medium">

                              Estimated Duration (minutes)

                            </label>



                            <input

                              type="number"

                              min="0"

                              className="input-field"

                              value={

                                lessonForm.duration

                              }

                              onChange={(e) =>

                                updateLessonForm(

                                  module._id,

                                  'duration',

                                  Number(

                                    e.target.value

                                  )

                                )

                              }

                            />



                          </div>



                        </>

                      )}










                    {/* =================================

                        DESCRIPTION

                    ================================= */}



                    <div>



                      <label className="mb-1 block text-sm font-medium">

                        Description

                      </label>



                      <textarea

                        rows={3}

                        className="input-field"

                        placeholder="Content description"

                        value={

                          lessonForm.description

                        }

                        onChange={(e) =>

                          updateLessonForm(

                            module._id,

                            'description',

                            e.target.value

                          )

                        }

                      />



                    </div>











                    {/* ADD BUTTON */}



                    <button

                      type="button"

                      onClick={() =>

                        handleAddLesson(

                          module._id

                        )

                      }

                      className="btn-secondary w-full"

                    >

                      Add Content

                    </button>



                  </div>



                </div>

              );

            }

          )}



        </div>



      </div>



    </div>

  );

};



export default EditCourse;
