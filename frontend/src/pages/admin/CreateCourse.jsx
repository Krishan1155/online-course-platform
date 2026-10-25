// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import api from '../../api/axios';
// import Alert from '../../components/Alert';
// import LoadingSpinner from '../../components/LoadingSpinner';

// const CreateCourse = () => {
//   const navigate = useNavigate();
//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     price: 0,
//     category: '',
//     level: 'beginner',
//     instructor: '',
//     isPublished: false,
//   });
//   const [thumbnail, setThumbnail] = useState(null);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const formData = new FormData();
//       Object.entries(form).forEach(([key, value]) => formData.append(key, value));
//       if (thumbnail) formData.append('thumbnail', thumbnail);

//       const { data } = await api.post('/courses', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       navigate(`/admin/courses/edit/${data.data._id}`);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <div className="mb-6">
//         <Link to="/admin/courses" className="text-sm text-primary-600 hover:underline">
//           ← Back to Courses
//         </Link>
//         <h2 className="text-2xl font-bold text-gray-900">Create Course</h2>
//       </div>

//       <div className="card max-w-2xl">
//         <Alert type="error" message={error} onClose={() => setError('')} />

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="mb-1 block text-sm font-medium">Title</label>
//             <input name="title" required className="input-field" value={form.title} onChange={handleChange} />
//           </div>
//           <div>
//             <label className="mb-1 block text-sm font-medium">Description</label>
//             <textarea name="description" required rows={4} className="input-field" value={form.description} onChange={handleChange} />
//           </div>
//           <div className="grid gap-4 sm:grid-cols-2">
//             <div>
//               <label className="mb-1 block text-sm font-medium">Price (INR)</label>
//               <input name="price" type="number" min="0" className="input-field" value={form.price} onChange={handleChange} />
//             </div>
//             <div>
//               <label className="mb-1 block text-sm font-medium">Category</label>
//               <input name="category" required className="input-field" placeholder="e.g. Web Development" value={form.category} onChange={handleChange} />
//             </div>
//           </div>
//           <div className="grid gap-4 sm:grid-cols-2">
//             <div>
//               <label className="mb-1 block text-sm font-medium">Level</label>
//               <select name="level" className="input-field" value={form.level} onChange={handleChange}>
//                 <option value="beginner">Beginner</option>
//                 <option value="intermediate">Intermediate</option>
//                 <option value="advanced">Advanced</option>
//               </select>
//             </div>
//             <div>
//               <label className="mb-1 block text-sm font-medium">Instructor</label>
//               <input name="instructor" required className="input-field" value={form.instructor} onChange={handleChange} />
//             </div>
//           </div>
//           <div>
//             <label className="mb-1 block text-sm font-medium">Thumbnail</label>
//             <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} className="input-field" />
//           </div>
//           <label className="flex items-center gap-2">
//             <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} />
//             <span className="text-sm">Publish immediately</span>
//           </label>
//           <button type="submit" disabled={loading} className="btn-primary">
//             {loading ? <LoadingSpinner size="sm" /> : 'Create Course'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateCourse;





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

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const { data } = await api.post('/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/admin/courses/edit/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

  return (
    <div className="pb-6">
      {/* Page Heading */}
      <div className="mb-5">
        <Link
          to="/admin/courses"
          className="text-sm font-medium text-primary-600 transition hover:text-primary-800 hover:underline"
        >
          ← Back to Courses
        </Link>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          Create Course
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add the details below to create your course.
        </p>
      </div>

      {/* Form Card */}
      <div className="card max-w-3xl rounded-xl border border-gray-100 shadow-sm">
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className={labelClass}>
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. Complete Web Development"
              className="input-field transition focus:ring-2 focus:ring-primary-500/20"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={labelClass}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              placeholder="Describe what students will learn..."
              className="input-field resize-y transition focus:ring-2 focus:ring-primary-500/20"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className={labelClass}>
                Price (INR)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="any"
                className="input-field transition focus:ring-2 focus:ring-primary-500/20"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>
                Category <span className="text-red-500">*</span>
              </label>
              <input
                id="category"
                name="category"
                required
                placeholder="e.g. Web Development"
                className="input-field transition focus:ring-2 focus:ring-primary-500/20"
                value={form.category}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Level and Instructor */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="level" className={labelClass}>
                Difficulty Level
              </label>
              <select
                id="level"
                name="level"
                className="input-field cursor-pointer transition focus:ring-2 focus:ring-primary-500/20"
                value={form.level}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label htmlFor="instructor" className={labelClass}>
                Instructor <span className="text-red-500">*</span>
              </label>
              <input
                id="instructor"
                name="instructor"
                required
                placeholder="Enter instructor name"
                className="input-field transition focus:ring-2 focus:ring-primary-500/20"
                value={form.instructor}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label htmlFor="thumbnail" className={labelClass}>
              Course Thumbnail
            </label>
            <input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setThumbnail(e.target.files?.[0] || null)
              }
              className="input-field cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
            />
            {thumbnail && (
              <p className="mt-1.5 truncate text-xs text-gray-500">
                Selected: {thumbnail.name}
              </p>
            )}
          </div>

          {/* Publish Option */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
            <input
              id="isPublished"
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
              className="h-4 w-4 cursor-pointer rounded accent-primary-600"
            />
            <label
              htmlFor="isPublished"
              className="ml-2.5 cursor-pointer text-sm font-medium text-gray-700"
            >
              Publish immediately
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-4 sm:flex-row">
            <Link
              to="/admin/courses"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;

