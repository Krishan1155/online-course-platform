import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getImageUrl } from '../../utils/helpers';

const EditCourse = () => {
  const { id } = useParams();
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
  const [modules, setModules] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '' });
  const [lessonForms, setLessonForms] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCourse = async () => {
    try {
      const { data } = await api.get(`/courses/admin/${id}`);
      const c = data.data;
      setCourse(c);
      setForm({
        title: c.title,
        description: c.description,
        price: c.price,
        category: c.category,
        level: c.level,
        instructor: c.instructor,
        isPublished: c.isPublished,
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
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
      fetchCourse();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/modules/course/${id}`, moduleForm);
      setModules([...modules, { ...data.data, lessons: [] }]);
      setModuleForm({ title: '' });
      setSuccess('Module added');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      setModules(modules.filter((m) => m._id !== moduleId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddLesson = async (moduleId) => {
    const lessonForm = lessonForms[moduleId];
    if (!lessonForm?.title || !lessonForm?.videoUrl) {
      setError('Lesson title and video URL are required');
      return;
    }

    try {
      const { data } = await api.post(`/lessons/module/${moduleId}`, lessonForm);
      setModules(
        modules.map((m) =>
          m._id === moduleId ? { ...m, lessons: [...(m.lessons || []), data.data] } : m
        )
      );
      setLessonForms({ ...lessonForms, [moduleId]: { title: '', videoUrl: '', duration: 0, description: '' } });
      setSuccess('Lesson added');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      setModules(
        modules.map((m) =>
          m._id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l._id !== lessonId) } : m
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const updateLessonForm = (moduleId, field, value) => {
    setLessonForms({
      ...lessonForms,
      [moduleId]: {
        ...(lessonForms[moduleId] || { title: '', videoUrl: '', duration: 0, description: '' }),
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/courses" className="text-sm text-primary-600 hover:underline">
          ← Back to Courses
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Edit Course</h2>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Course Details</h3>
          {course?.thumbnail && (
            <img src={getImageUrl(course.thumbnail)} alt="" className="mb-4 h-32 w-full rounded-lg object-cover" />
          )}
          <form onSubmit={handleUpdateCourse} className="space-y-3">
            <input name="title" required className="input-field" value={form.title} onChange={handleChange} />
            <textarea name="description" required rows={3} className="input-field" value={form.description} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-3">
              <input name="price" type="number" min="0" className="input-field" value={form.price} onChange={handleChange} />
              <input name="category" required className="input-field" value={form.category} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select name="level" className="input-field" value={form.level} onChange={handleChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input name="instructor" required className="input-field" value={form.instructor} onChange={handleChange} />
            </div>
            <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} className="input-field" />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} />
              <span className="text-sm">Published</span>
            </label>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Update Course'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 font-semibold">Add Module</h3>
            <form onSubmit={handleAddModule} className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Module title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ title: e.target.value })}
                required
              />
              <button type="submit" className="btn-primary shrink-0">
                Add
              </button>
            </form>
          </div>

          {modules.map((module, mIdx) => (
            <div key={module._id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">
                  Module {mIdx + 1}: {module.title}
                </h4>
                <button onClick={() => handleDeleteModule(module._id)} className="text-sm text-red-600 hover:underline">
                  Delete
                </button>
              </div>

              <ul className="mb-4 space-y-1">
                {module.lessons?.map((lesson) => (
                  <li key={lesson._id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                    <span>{lesson.title}</span>
                    <button onClick={() => handleDeleteLesson(module._id, lesson._id)} className="text-red-500 hover:underline">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3">
                <input
                  className="input-field"
                  placeholder="Lesson title"
                  value={lessonForms[module._id]?.title || ''}
                  onChange={(e) => updateLessonForm(module._id, 'title', e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Video URL (YouTube or direct)"
                  value={lessonForms[module._id]?.videoUrl || ''}
                  onChange={(e) => updateLessonForm(module._id, 'videoUrl', e.target.value)}
                />
                <input
                  className="input-field"
                  type="number"
                  placeholder="Duration (minutes)"
                  value={lessonForms[module._id]?.duration || ''}
                  onChange={(e) => updateLessonForm(module._id, 'duration', Number(e.target.value))}
                />
                <button onClick={() => handleAddLesson(module._id)} className="btn-secondary w-full">
                  Add Lesson
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditCourse;
