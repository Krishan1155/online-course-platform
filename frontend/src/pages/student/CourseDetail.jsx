import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice, getImageUrl, getLevelColor, formatDuration } from '../../utils/helpers';

const CourseDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/courses/${id}`);
        setCourse(data.data);

        if (isAuthenticated && data.data.price > 0 && !data.data.isEnrolled) {
          try {
            const statusRes = await api.get(`/payment-requests/status/${id}`);
            setPaymentStatus(statusRes.data.data.paymentStatus);   
          } catch {
            setPaymentStatus(null);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, isAuthenticated]);

  const handleFreeEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    setEnrolling(true);
    setError('');
    try {
      await api.post(`/enrollments/free/${id}`);
      setSuccess('Successfully enrolled! Redirecting...');
      setCourse((prev) => ({ ...prev, isEnrolled: true }));
      setTimeout(() => navigate(`/learn/${id}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleManualPayment = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}/payment` } });
      return;
    }
    navigate(`/courses/${id}/payment`);
  };

  const handlePayment = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    setEnrolling(true);
    setError('');

    try {
      const { data } = await api.post('/payments/create-order', { courseId: id });
      const orderData = data.data;

      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CoursePlatform',
        description: orderData.courseTitle,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: orderData.paymentId,
            });
            setSuccess('Payment successful! Redirecting to course...');
            setCourse((prev) => ({ ...prev, isEnrolled: true }));
            setTimeout(() => navigate(`/learn/${id}`), 1500);
          } catch (err) {
            setError(err.message);
          } finally {
            setEnrolling(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => setEnrolling(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setError(response.error.description || 'Payment failed');
        setEnrolling(false);
      });
      razorpay.open();
    } catch (err) {
      setError(err.message);
      setEnrolling(false);
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
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Alert type="error" message={error || 'Course not found'} />
        <Link to="/courses" className="btn-primary mt-4 inline-block">
          Browse Courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 overflow-hidden rounded-xl">
            <img src={getImageUrl(course.thumbnail)} alt={course.title} className="aspect-video w-full object-cover" />
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="mb-4 text-gray-600">By {course.instructor}</p>

          <div className="mb-6 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${getLevelColor(course.level)}`}>
              {course.level}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {course.category}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {totalLessons} lessons
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {formatDuration(course.totalDuration)}
            </span>
          </div>

          <div className="card mb-6">
            <h2 className="mb-3 text-lg font-semibold">About this course</h2>
            <p className="whitespace-pre-wrap text-gray-600">{course.description}</p>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Course Content</h2>
            <div className="space-y-4">
              {course.modules?.map((module, idx) => (
                <div key={module._id} className="rounded-lg border border-gray-200">
                  <div className="bg-gray-50 px-4 py-3 font-medium">
                    Module {idx + 1}: {module.title}
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {module.lessons?.map((lesson, lIdx) => (
                      <li key={lesson._id} className="flex items-center justify-between px-4 py-2 text-sm">
                        <span>
                          {lIdx + 1}. {lesson.title}
                          {lesson.isFree && (
                            <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                              Preview
                            </span>
                          )}
                        </span>
                        <span className="text-gray-400">{formatDuration(lesson.duration)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-24 card">
            <div className="mb-4 text-3xl font-bold text-primary-600">
              {course.price === 0 ? 'Free' : formatPrice(course.price)}
            </div>

            {course.isEnrolled ? (
              <Link to={`/learn/${course._id}`} className="btn-primary w-full">
                Continue Learning
              </Link>
            ) : paymentStatus === 'pending' ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  Your payment request has been submitted successfully. Please wait until admin
                  verifies your payment.
                </div>
                <Link to={`/courses/${course._id}/payment`} className="btn-secondary w-full">
                  View Payment Details
                </Link>
              </div>
            ) : paymentStatus === 'rejected' ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  Your payment was rejected. Please upload a valid payment screenshot.
                </div>
                <button onClick={handleManualPayment} className="btn-primary w-full">
                  Submit Payment Again
                </button>
              </div>
            ) : (
              <button
                onClick={course.price === 0 ? handleFreeEnroll : handleManualPayment}
                disabled={enrolling}
                className="btn-primary w-full"
              >
                {enrolling ? (
                  <LoadingSpinner size="sm" />
                ) : course.price === 0 ? (
                  'Enroll for Free'
                ) : (
                  'Enroll Course'
                )}
              </button>
            )}

            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li>✓ Full lifetime access</li>
              <li>✓ Progress tracking</li>
              <li>✓ Certificate on completion</li>
              <li>✓ Mobile friendly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
