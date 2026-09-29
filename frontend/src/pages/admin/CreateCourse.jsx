import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

const CreateCourse = () => {
  const navigate = useNavigate();
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (thumbnail) formData.append('thumbnail', thumbnail);

      const { data } = await api.post('/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/admin/courses/edit/${data.data._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/courses" className="text-sm text-primary-600 hover:underline">
          ← Back to Courses
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create Course</h2>
      </div>

      <div className="card max-w-2xl">
        <Alert type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input name="title" required className="input-field" value={form.title} onChange={handleChange} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea name="description" required rows={4} className="input-field" value={form.description} onChange={handleChange} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Price (INR)</label>
              <input name="price" type="number" min="0" className="input-field" value={form.price} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <input name="category" required className="input-field" placeholder="e.g. Web Development" value={form.category} onChange={handleChange} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Level</label>
              <select name="level" className="input-field" value={form.level} onChange={handleChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Instructor</label>
              <input name="instructor" required className="input-field" value={form.instructor} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Thumbnail</label>
            <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} className="input-field" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} />
            <span className="text-sm">Publish immediately</span>
          </label>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <LoadingSpinner size="sm" /> : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
