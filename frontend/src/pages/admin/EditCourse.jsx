import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getImageUrl } from '../../utils/helpers';

// ============================================================
// CONSTANTS + HELPERS
// ============================================================

const emptyLessonForm = {
  title: '',
  contentType: 'video',
  videoUrl: '',
  videoFile: null,
  documentType: 'pdf',
  documentUrl: '',
  documentFile: null,
  documentText: '',
  duration: 0,
  description: '',
};

/** Returns an error message, or '' when the lesson form is valid. */
const validateLesson = (f, isEdit) => {
  if (!f?.title?.trim()) return 'Content title is required';
  if (!f.contentType) return 'Content type is required';

  if (f.contentType === 'video') {
    const hasExisting = isEdit && (f.videoUrl?.trim() || f.videoKey);
    if (!f.videoFile && !hasExisting) {
      return isEdit
        ? 'Please upload a video file for this lesson.'
        : 'Please select a video file to upload.';
    }
  }

  if (f.contentType === 'document') {
    if (f.documentType === 'pdf') {
      const hasExisting = isEdit && (f.documentUrl || f.documentKey);
      if (!f.documentFile && !hasExisting) return 'Please select a PDF document';
    }
    if (f.documentType === 'url' && !f.documentUrl?.trim()) {
      return 'Please enter a documentation URL';
    }
    if (f.documentType === 'text' && !f.documentText?.trim()) {
      return 'Please enter document content';
    }
  }

  return '';
};

const buildLessonFormData = (f) => {
  const fd = new FormData();
  fd.append('title', f.title);
  fd.append('contentType', f.contentType);
  fd.append('description', f.description || '');

  if (f.contentType === 'video' && f.videoFile) {
    fd.append('video', f.videoFile);
  }

  if (f.contentType === 'document') {
    fd.append('duration', f.duration || 0);
    fd.append('documentType', f.documentType);

    if (f.documentType === 'pdf' && f.documentFile) fd.append('document', f.documentFile);
    if (f.documentType === 'url') fd.append('documentUrl', f.documentUrl);
    if (f.documentType === 'text') fd.append('documentText', f.documentText);
  }

  return fd;
};

// ============================================================
// SHARED LESSON FIELDS (used by both "Add content" and "Edit content")
// ============================================================

// Fixed 16:9 thumbnail frame. The whole image always fits inside (object-fit: contain),
// so nothing is cropped. Inline styles so the size can't be lost to CSS/Tailwind config.
const thumbBoxStyle = { width: 'min(192px, 40vw)', aspectRatio: '16 / 9' };
const thumbImgStyle = { display: 'block', width: '100%', height: '100%', objectFit: 'contain' };

const labelCls = 'mb-1 block text-sm font-medium';
const hintCls = 'mt-1 text-xs text-gray-500';

const LessonFields = ({ form, onChange, isEdit = false }) => (
  <div className="space-y-4">
    <div>
      <label className={labelCls}>Content Type</label>
      <select
        className="input-field"
        value={form.contentType}
        onChange={(e) => onChange('contentType', e.target.value)}
      >
        <option value="video">🎥 Video</option>
        <option value="document">📄 Document</option>
      </select>
    </div>

    <div>
      <label className={labelCls}>Content Title</label>
      <input
        className="input-field"
        placeholder="Content title"
        value={form.title}
        onChange={(e) => onChange('title', e.target.value)}
      />
    </div>

    {/* Video */}
    {form.contentType === 'video' && (
      <div>
        <label className={labelCls}>
          {isEdit ? 'Upload replacement video' : 'Upload Video'} (MP4, WebM, MOV, or M4V)
        </label>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
          className="input-field"
          onChange={(e) => onChange('videoFile', e.target.files?.[0] || null)}
        />
        <p className={hintCls}>
          {isEdit
            ? 'Leave empty to keep the current video. Uploaded video duration is detected automatically.'
            : 'Video duration is detected automatically after upload. Maximum file size: 1 GB.'}
        </p>
      </div>
    )}

    {/* Document */}
    {form.contentType === 'document' && (
      <>
        <div>
          <label className={labelCls}>Document Type</label>
          <select
            className="input-field"
            value={form.documentType || 'pdf'}
            onChange={(e) => onChange('documentType', e.target.value)}
          >
            <option value="pdf">📕 PDF</option>
            <option value="url">🔗 Web URL</option>
            <option value="text">📝 Text Content</option>
          </select>
        </div>

        {form.documentType === 'pdf' && (
          <div>
            <label className={labelCls}>{isEdit ? 'Replace PDF' : 'Upload PDF Document'}</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="input-field"
              onChange={(e) => onChange('documentFile', e.target.files?.[0] || null)}
            />
            <p className={hintCls}>
              {isEdit ? 'Leave empty to keep the existing PDF.' : 'PDF only. Maximum size: 20 MB.'}
            </p>
          </div>
        )}

        {form.documentType === 'url' && (
          <div>
            <label className={labelCls}>Documentation URL</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://react.dev/learn"
              value={form.documentUrl || ''}
              onChange={(e) => onChange('documentUrl', e.target.value)}
            />
            <p className={hintCls}>Student will open this webpage.</p>
          </div>
        )}

        {form.documentType === 'text' && (
          <div>
            <label className={labelCls}>Document Content</label>
            <textarea
              rows={isEdit ? 10 : 12}
              className="input-field"
              placeholder="Write or paste your lesson content here..."
              value={form.documentText || ''}
              onChange={(e) => onChange('documentText', e.target.value)}
            />
            <p className={hintCls}>This content will be shown directly to students.</p>
          </div>
        )}

        <div>
          <label className={labelCls}>Estimated Duration (minutes)</label>
          <input
            type="number"
            min="0"
            className="input-field"
            value={form.duration}
            onChange={(e) => onChange('duration', Number(e.target.value))}
          />
        </div>
      </>
    )}

    <div>
      <label className={labelCls}>Description</label>
      <textarea
        rows={3}
        className="input-field"
        placeholder="Content description"
        value={form.description}
        onChange={(e) => onChange('description', e.target.value)}
      />
    </div>
  </div>
);

// ============================================================
// PAGE
// ============================================================

const EditCourse = () => {
  const { id } = useParams();

  // ---------- Course ----------
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    level: 'beginner',
    instructor: '',
    isPublished: false,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [editingCourseDetails, setEditingCourseDetails] = useState(false);
  const [thumbPreview, setThumbPreview] = useState('');

  // ---------- Modules + lessons ----------
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState({ title: '' });
  const [expandedModules, setExpandedModules] = useState({});
  const [addingContentModuleId, setAddingContentModuleId] = useState(null);
  const [lessonForms, setLessonForms] = useState({});
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingLessonModuleId, setEditingLessonModuleId] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({ ...emptyLessonForm });
  const [updatingLesson, setUpdatingLesson] = useState(false);

  // ---------- UI ----------
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ============================================================
  // COURSE
  // ============================================================

  const fetchCourse = async () => {
    try {
      const { data } = await api.get(`/courses/admin/${id}`);
      const c = data.data;

      setCourse(c);
      setForm({
        title: c.title || '',
        description: c.description || '',
        price: c.price || 0,
        category: c.category || '',
        level: c.level || 'beginner',
        instructor: c.instructor || '',
        isPublished: c.isPublished || false,
      });
      setModules(c.modules || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  // Local preview of a newly chosen thumbnail (before it is uploaded)
  useEffect(() => {
    if (!thumbnail) {
      setThumbPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(thumbnail);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (thumbnail) formData.append('thumbnail', thumbnail);

      await api.put(`/courses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Course updated successfully');
      setEditingCourseDetails(false);
      setThumbnail(null);
      await fetchCourse();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // MODULES
  // ============================================================

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.post(`/modules/course/${id}`, moduleForm);
      const newModule = { ...data.data, lessons: [] };

      setModules((prev) => [...prev, newModule]);
      setExpandedModules((prev) => ({ ...prev, [newModule._id]: true })); // open it right away
      setModuleForm({ title: '' });
      setSuccess('Module added successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;

    try {
      await api.delete(`/modules/${moduleId}`);
      setModules((prev) => prev.filter((m) => m._id !== moduleId));
      setSuccess('Module deleted successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // LESSONS: add
  // ============================================================

  const updateLessonForm = (moduleId, field, value) => {
    setLessonForms((prev) => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] || emptyLessonForm), [field]: value },
    }));
  };

  const handleAddLesson = async (moduleId) => {
    const lessonForm = lessonForms[moduleId];

    const message = validateLesson(lessonForm, false);
    if (message) {
      setError(message);
      return;
    }

    try {
      setError('');

      const { data } = await api.post(
        `/lessons/module/${moduleId}`,
        buildLessonFormData(lessonForm)
      );

      setModules((prev) =>
        prev.map((m) =>
          m._id === moduleId ? { ...m, lessons: [...(m.lessons || []), data.data] } : m
        )
      );
      setLessonForms((prev) => ({ ...prev, [moduleId]: { ...emptyLessonForm } }));
      setSuccess('Content added successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // LESSONS: delete
  // ============================================================

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this content?')) return;

    try {
      await api.delete(`/lessons/${lessonId}`);

      setModules((prev) =>
        prev.map((m) =>
          m._id === moduleId
            ? { ...m, lessons: (m.lessons || []).filter((l) => l._id !== lessonId) }
            : m
        )
      );
      setSuccess('Content deleted successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // LESSONS: edit
  // ============================================================

  const handleStartEditLesson = (moduleId, lesson) => {
    setEditingLessonId(lesson._id);
    setEditingLessonModuleId(moduleId);
    setEditLessonForm({
      title: lesson.title || '',
      contentType: lesson.contentType || 'video',
      videoUrl: lesson.videoUrl || '',
      videoKey: lesson.videoKey || '',
      videoFile: null,
      documentType: lesson.documentType || 'pdf',
      documentUrl: lesson.documentUrl || '',
      documentKey: lesson.documentKey || '',
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

    const message = validateLesson(editLessonForm, true);
    if (message) {
      setError(message);
      return;
    }

    try {
      setUpdatingLesson(true);
      setError('');

      const { data } = await api.put(
        `/lessons/${editingLessonId}`,
        buildLessonFormData(editLessonForm)
      );

      setModules((prev) =>
        prev.map((m) =>
          m._id === editingLessonModuleId
            ? {
                ...m,
                lessons: (m.lessons || []).map((l) => (l._id === editingLessonId ? data.data : l)),
              }
            : m
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

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  const statusBadge = (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
        form.isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {form.isPublished ? 'Published' : 'Draft'}
    </span>
  );

  return (
    <div>
      {/* ---------- Header ---------- */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/admin/courses"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            ← Back to Courses
          </Link>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Edit Course</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage course details, modules, and lesson content.
          </p>
        </div>
        {course && statusBadge}
      </div>

      {/* ---------- Alerts (stay visible while scrolling) ---------- */}
      <div className="sticky top-2 z-20 space-y-2">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />
      </div>

      <div className="space-y-6">
        {/* ==================================================
            COURSE OVERVIEW
        ================================================== */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-start gap-4">
              {course?.thumbnail ? (
                <a
                  href={getImageUrl(course.thumbnail)}
                  target="_blank"
                  rel="noreferrer"
                  title="Open full image"
                  className="block shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                  style={thumbBoxStyle}
                >
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt="Course thumbnail"
                    style={thumbImgStyle}
                  />
                </a>
              ) : (
                <div
                  className="flex shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-500"
                  style={thumbBoxStyle}
                >
                  No thumbnail
                </div>
              )}

              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-gray-900 sm:text-xl">
                  {form.title || 'Untitled course'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {[form.category, form.level, form.instructor].filter(Boolean).join(' · ')}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    ₹{Number(form.price || 0).toLocaleString('en-IN')}
                  </span>
                  {statusBadge}
                </div>

                {form.description && (
                  <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-gray-600">
                    {form.description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditingCourseDetails((prev) => !prev)}
              className="inline-flex shrink-0 items-center justify-center self-start rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {editingCourseDetails ? 'Close details' : 'Update details'}
            </button>
          </div>

          {/* Details form (opens on "Update details") */}
          {editingCourseDetails && (
            <div className="border-t border-gray-200 bg-gray-50/60 p-5 sm:p-6">
              <form onSubmit={handleUpdateCourse} className="space-y-4">
                <div>
                  <label className={`${labelCls} text-gray-700`}>Course title</label>
                  <input
                    name="title"
                    required
                    className="input-field"
                    value={form.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className={`${labelCls} text-gray-700`}>Course description</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="input-field"
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={`${labelCls} text-gray-700`}>Price (INR)</label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      className="input-field"
                      value={form.price}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={`${labelCls} text-gray-700`}>Category</label>
                    <input
                      name="category"
                      required
                      className="input-field"
                      value={form.category}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={`${labelCls} text-gray-700`}>Level</label>
                    <select
                      name="level"
                      className="input-field"
                      value={form.level}
                      onChange={handleChange}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className={`${labelCls} text-gray-700`}>Instructor</label>
                    <input
                      name="instructor"
                      required
                      className="input-field"
                      value={form.instructor}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className={`${labelCls} text-gray-700`}>Course thumbnail</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                  />
                  <p className={hintCls}>
                    Best size: 1280 × 720 (16:9). The full image is always shown, never cropped.
                  </p>
                  {thumbPreview && (
                    <div
                      className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                      style={thumbBoxStyle}
                    >
                      <img src={thumbPreview} alt="New thumbnail preview" style={thumbImgStyle} />
                    </div>
                  )}
                  {thumbnail && <p className={hintCls}>Selected: {thumbnail.name}</p>}
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={form.isPublished}
                    onChange={handleChange}
                  />
                  Published
                </label>

                <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCourseDetails(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" /> Saving...
                      </>
                    ) : (
                      'Save course details'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* ==================================================
            COURSE CONTENT
        ================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Course Content</h3>
              <p className="mt-1 text-sm text-gray-500">Organize your modules and lessons below.</p>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>
                {modules.length} {modules.length === 1 ? 'module' : 'modules'}
              </span>
            </div>
          </div>

          {/* ---------- Add module ---------- */}
          <div className="card rounded-xl border border-gray-100 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Add Module</h3>

            <form onSubmit={handleAddModule} className="flex gap-2">
              <input
                required
                className="input-field flex-1"
                placeholder="Module title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ title: e.target.value })}
              />
              <button type="submit" className="btn-primary shrink-0">
                Add
              </button>
            </form>
          </div>

          {/* ---------- Module list ---------- */}
          {modules.map((module, mIdx) => {
            const isExpanded = Boolean(expandedModules[module._id]);
            const isAddingContent = addingContentModuleId === module._id;
            const lessonForm = lessonForms[module._id] || emptyLessonForm;

            return (
              <div
                key={module._id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Module header */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleModule(module._id)}
                    aria-expanded={isExpanded}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        Module {mIdx + 1}: {module.title}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {module.lessons?.length || 0} lessons · click to{' '}
                        {isExpanded ? 'collapse' : 'expand'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteModule(module._id)}
                    className="mr-3 shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>

                {/* Module body */}
                {isExpanded && (
                  <div className="space-y-4 border-t border-gray-100 bg-white p-4 sm:p-5">
                    {/* ---------- Existing content ---------- */}
                    {module.lessons?.length > 0 && (
                      <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                        {module.lessons.map((lesson) => (
                          <li key={lesson._id}>
                            <div className="flex items-center justify-between gap-3 bg-white px-3 py-3 text-sm transition hover:bg-gray-50">
                              <span className="flex min-w-0 items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm">
                                  {lesson.contentType === 'video' && '🎥'}
                                  {lesson.contentType === 'document' && '📄'}
                                </span>
                                <span className="truncate font-medium text-gray-800">
                                  {lesson.title}
                                </span>
                              </span>

                              <div className="flex shrink-0 items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditLesson(module._id, lesson)}
                                  className="rounded-md px-2 py-1 font-medium text-primary-600 transition hover:bg-primary-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(module._id, lesson._id)}
                                  className="rounded-md px-2 py-1 font-medium text-red-600 transition hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* Inline edit panel */}
                            {editingLessonId === lesson._id && (
                              <div className="px-3 pb-3">
                                <div className="rounded-lg border border-primary-200 bg-white p-4 shadow-sm">
                                  <div className="mb-4 flex items-center justify-between">
                                    <h4 className="font-semibold">Edit Content</h4>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditLesson}
                                      className="text-sm text-gray-500 hover:underline"
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  <LessonFields
                                    form={editLessonForm}
                                    onChange={handleEditLessonFormChange}
                                    isEdit
                                  />

                                  <div className="mt-4 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handleUpdateLesson}
                                      disabled={updatingLesson}
                                      className="btn-primary"
                                    >
                                      {updatingLesson ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditLesson}
                                      disabled={updatingLesson}
                                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* ---------- Add content ---------- */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          setAddingContentModuleId((current) =>
                            current === module._id ? null : module._id
                          )
                        }
                        aria-expanded={isAddingContent}
                        className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-50/40"
                      >
                        <span>
                          {isAddingContent ? 'Cancel adding content' : '+ Add lesson or content'}
                        </span>
                        <span className="text-lg leading-none">{isAddingContent ? '−' : '+'}</span>
                      </button>

                      {isAddingContent && (
                        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                          <h3 className="text-sm font-semibold text-gray-900">
                            New lesson or learning resource
                          </h3>

                          <LessonFields
                            form={lessonForm}
                            onChange={(field, value) => updateLessonForm(module._id, field, value)}
                          />

                          <button
                            type="button"
                            onClick={() => handleAddLesson(module._id)}
                            className="btn-secondary w-full"
                          >
                            Add Content
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default EditCourse;
