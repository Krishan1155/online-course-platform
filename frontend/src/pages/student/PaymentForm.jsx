import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice, getImageUrl } from '../../utils/helpers';

const PaymentForm = () => {
  const { courseId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    studentName: '',
    studentEmail: '',
    transactionId: '',
  });
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}/payment` } });
      return;
    }

    const fetchData = async () => {
      try {
        const [courseRes, configRes, statusRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get('/payment-requests/config'),
          api.get(`/payment-requests/status/${courseId}`),
        ]);

        const courseData = courseRes.data.data;
        setCourse(courseData);
        setPaymentConfig(configRes.data.data);

        if (courseData.isEnrolled) {
          navigate(`/learn/${courseId}`);
          return;
        }

        if (courseData.price === 0) {
          navigate(`/courses/${courseId}`);
          return;
        }

        const status = statusRes.data.data;
        if (status.paymentStatus === 'pending') {
          setSuccess(
            'Your payment request has been submitted successfully. Please wait until admin verifies your payment.'
          );
        } else if (status.paymentStatus === 'rejected') {
          setError('Your payment was rejected. Please upload a valid payment screenshot.');
        }

        setForm({
          studentName: user?.name || '',
          studentEmail: user?.email || '',
          transactionId: '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, isAuthenticated, navigate, user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file only');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!screenshot) {
      setError('Please upload your payment screenshot');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('studentName', form.studentName);
      formData.append('studentEmail', form.studentEmail);
      formData.append('transactionId', form.transactionId);
      formData.append('paymentScreenshot', screenshot);

      const { data } = await api.post('/payment-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(data.message);
      setScreenshot(null);
      setPreview('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Alert type="error" message={error || 'Course not found'} />
        <Link to="/courses" className="btn-primary mt-4 inline-block">
          Browse Courses
        </Link>
      </div>
    );
  }

  const paymentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-sm text-primary-600 hover:underline">
          ← Back to Course
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Manual Payment</h1>
        <p className="text-gray-600">Complete payment and submit proof for verification</p>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} />

      {!success ? (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Student Name</label>
            <input
              type="text"
              name="studentName"
              value={form.studentName}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Student Email</label>
            <input
              type="email"
              name="studentEmail"
              value={form.studentEmail}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Course Name</label>
            <input type="text" value={course.title} readOnly className="input-field bg-gray-50" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Course Price</label>
            <input
              type="text"
              value={formatPrice(course.price)}
              readOnly
              className="input-field bg-gray-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Date</label>
            <input type="text" value={paymentDate} readOnly className="input-field bg-gray-50" />
          </div>

          <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
            <p className="mb-4 text-sm text-gray-700">
              Please scan the QR code or pay using the UPI ID. After successful payment, upload the
              payment screenshot and submit the form.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="text-center">
                <p className="mb-2 text-sm font-medium text-gray-700">UPI ID</p>
                <p className="rounded-lg bg-white px-4 py-2 font-mono text-sm font-semibold text-primary-700">
                  {paymentConfig?.upiId}
                </p>
              </div>

              <div className="text-center">
                <p className="mb-2 text-sm font-medium text-gray-700">Scan to Pay</p>
                <img
                  src={getImageUrl(paymentConfig?.qrCodePath)}
                  alt="GPay QR Code"
                  className="mx-auto h-40 w-40 rounded-lg border border-gray-200 bg-white object-contain p-2"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Upload Payment Screenshot <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              className="input-field"
              required
            />
            {preview && (
              <img
                src={preview}
                alt="Payment screenshot preview"
                className="mt-3 max-h-48 rounded-lg border border-gray-200"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Transaction ID (Optional)
            </label>
            <input
              type="text"
              name="transactionId"
              value={form.transactionId}
              onChange={handleChange}
              placeholder="Enter UPI transaction ID if available"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <LoadingSpinner size="sm" /> : 'Submit Payment Request'}
          </button>
        </form>
      ) : (
        <div className="card text-center">
          <p className="mb-4 text-gray-700">{success}</p>
          <Link to={`/courses/${courseId}`} className="btn-secondary">
            Back to Course
          </Link>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;
