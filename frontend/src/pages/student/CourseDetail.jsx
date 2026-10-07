import { useEffect, useState } from 'react';

import {

  Link,

  useNavigate,

  useParams,

} from 'react-router-dom';



import api from '../../api/axios';

import { useAuth } from '../../context/AuthContext';



import Alert from '../../components/Alert';

import LoadingSpinner from '../../components/LoadingSpinner';



import {

  formatPrice,

  getImageUrl,

  getLevelColor,

  formatDuration,

} from '../../utils/helpers';



const CourseDetail = () => {

  const { id } = useParams();



  const {

    isAuthenticated,

    user,

  } = useAuth();



  const navigate = useNavigate();



  const [course, setCourse] =

    useState(null);



  const [reviews, setReviews] =

    useState([]);



  const [userReview, setUserReview] =

    useState(null);



  const [loading, setLoading] =

    useState(true);



  const [reviewsLoading, setReviewsLoading] =

    useState(true);



  const [enrolling, setEnrolling] =

    useState(false);



  const [reviewSubmitting, setReviewSubmitting] =

    useState(false);



  const [error, setError] =

    useState('');



  const [success, setSuccess] =

    useState('');



  const [rating, setRating] =

    useState(5);



  const [comment, setComment] =

    useState('');



  // =====================================================

  // FETCH COURSE

  // =====================================================



  useEffect(() => {

    const fetchCourse = async () => {

      try {

        const { data } =

          await api.get(

            `/courses/${id}`

          );



        setCourse(data.data);

      } catch (err) {

        setError(

          err.message

        );

      } finally {

        setLoading(false);

      }

    };



    fetchCourse();

  }, [

    id,

    isAuthenticated,

  ]);



  // =====================================================

  // FETCH REVIEWS

  // PUBLIC

  // =====================================================



  const fetchReviews = async () => {

    try {

      setReviewsLoading(true);



      const { data } =

        await api.get(

          `/reviews/course/${id}`

        );



      setReviews(

        data.data.reviews || []

      );



      setUserReview(

        data.data.userReview || null

      );



      if (

        data.data.userReview

      ) {

        setRating(

          data.data.userReview.rating

        );



        setComment(

          data.data.userReview.comment

        );

      }

    } catch (err) {

      console.error(

        'Failed to load reviews:',

        err

      );

    } finally {

      setReviewsLoading(false);

    }

  };



  useEffect(() => {

    fetchReviews();

  }, [id, isAuthenticated]);



  // =====================================================

  // FREE ENROLL

  // =====================================================



  const handleFreeEnroll =

    async () => {

      if (!isAuthenticated) {

        navigate('/login', {

          state: {

            from: `/courses/${id}`,

          },

        });



        return;

      }



      setEnrolling(true);

      setError('');



      try {

        await api.post(

          `/enrollments/free/${id}`

        );



        setSuccess(

          'Successfully enrolled! Redirecting...'

        );



        setCourse((prev) => ({

          ...prev,

          isEnrolled: true,

        }));



        setTimeout(() => {

          navigate(

            `/learn/${id}`

          );

        }, 1500);

      } catch (err) {

        setError(

          err.message

        );

      } finally {

        setEnrolling(false);

      }

    };



  // =====================================================

  // PAYMENT

  // =====================================================



  const handlePayment =

    async () => {

      if (!isAuthenticated) {

        navigate('/login', {

          state: {

            from: `/courses/${id}`,

          },

        });



        return;

      }



      setEnrolling(true);

      setError('');



      try {

        const { data } =

          await api.post(

            '/payments/create-order',

            {

              courseId: id,

            }

          );



        const orderData =

          data.data;



        const options = {

          key:

            orderData.keyId ||

            import.meta.env

              .VITE_RAZORPAY_KEY_ID,



          amount:

            orderData.amount,



          currency:

            orderData.currency,



          name: 'CoursePlatform',



          description:

            orderData.courseTitle,



          order_id:

            orderData.orderId,



          handler: async (

            response

          ) => {

            try {

              await api.post(

                '/payments/verify',

                {

                  razorpay_order_id:

                    response.razorpay_order_id,



                  razorpay_payment_id:

                    response.razorpay_payment_id,



                  razorpay_signature:

                    response.razorpay_signature,



                  paymentId:

                    orderData.paymentId,

                }

              );



              setSuccess(

                'Payment successful! Redirecting to course...'

              );



              setCourse(

                (prev) => ({

                  ...prev,

                  isEnrolled:

                    true,

                })

              );



              setTimeout(() => {

                navigate(

                  `/learn/${id}`

                );

              }, 1500);

            } catch (err) {

              setError(

                err.message

              );

            } finally {

              setEnrolling(false);

            }

          },



          prefill: {

            name: user?.name,

            email: user?.email,

          },



          theme: {

            color: '#4f46e5',

          },



          modal: {

            ondismiss: () =>

              setEnrolling(false),

          },

        };



        const razorpay =

          new window.Razorpay(

            options

          );



        razorpay.on(

          'payment.failed',

          (response) => {

            setError(

              response.error

                .description ||

                'Payment failed'

            );



            setEnrolling(false);

          }

        );



        razorpay.open();

      } catch (err) {

        setError(

          err.message

        );



        setEnrolling(false);

      }

    };



  // =====================================================

  // SUBMIT REVIEW

  // =====================================================



  const handleSubmitReview =

    async (event) => {

      event.preventDefault();



      if (!isAuthenticated) {

        navigate('/login', {

          state: {

            from: `/courses/${id}`,

          },

        });



        return;

      }



      if (!course?.isEnrolled) {

        setError(

          'You must enroll in this course before reviewing it.'

        );



        return;

      }



      if (!comment.trim()) {

        setError(

          'Please write a review.'

        );



        return;

      }



      setReviewSubmitting(true);

      setError('');

      setSuccess('');



      try {

        if (userReview) {

          await api.put(

            `/reviews/${userReview._id}`,

            {

              rating,

              comment,

            }

          );



          setSuccess(

            'Review updated successfully.'

          );

        } else {

          await api.post(

            `/reviews/course/${id}`,

            {

              rating,

              comment,

            }

          );



          setSuccess(

            'Review submitted successfully.'

          );

        }



        await fetchReviews();



        const courseResponse =

          await api.get(

            `/courses/${id}`

          );



        setCourse(

          courseResponse.data.data

        );

      } catch (err) {

        setError(

          err.message

        );

      } finally {

        setReviewSubmitting(false);

      }

    };



  // =====================================================

  // DELETE REVIEW

  // =====================================================



  const handleDeleteReview =

    async () => {

      if (!userReview) {

        return;

      }



      const confirmed =

        window.confirm(

          'Are you sure you want to delete your review?'

        );



      if (!confirmed) {

        return;

      }



      try {

        setError('');

        setSuccess('');



        await api.delete(

          `/reviews/${userReview._id}`

        );



        setUserReview(null);

        setRating(5);

        setComment('');



        await fetchReviews();



        const courseResponse =

          await api.get(

            `/courses/${id}`

          );



        setCourse(

          courseResponse.data.data

        );



        setSuccess(

          'Review deleted successfully.'

        );

      } catch (err) {

        setError(

          err.message

        );

      }

    };



  // =====================================================

  // HELPFUL

  // =====================================================



  const handleHelpful =

    async (

      reviewId,

      helpful

    ) => {

      if (!isAuthenticated) {

        navigate('/login', {

          state: {

            from: `/courses/${id}`,

          },

        });



        return;

      }



      try {

        await api.post(

          `/reviews/${reviewId}/helpful`,

          {

            helpful,

          }

        );



        await fetchReviews();

      } catch (err) {

        setError(

          err.message

        );

      }

    };



  // =====================================================

  // DATE

  // =====================================================



  const getRelativeDate = (

    date

  ) => {

    const now =

      new Date();



    const created =

      new Date(date);



    const diff =

      now.getTime() -

      created.getTime();



    const days = Math.floor(

      diff /

        (1000 *

          60 *

          60 *

          24)

    );



    if (days < 1) {

      return 'today';

    }



    if (days === 1) {

      return '1 day ago';

    }



    if (days < 30) {

      return `${days} days ago`;

    }



    const months =

      Math.floor(

        days / 30

      );



    if (months === 1) {

      return '1 month ago';

    }



    if (months < 12) {

      return `${months} months ago`;

    }



    const years =

      Math.floor(

        months / 12

      );



    if (years === 1) {

      return '1 year ago';

    }



    return `${years} years ago`;

  };



  // =====================================================

  // STAR DISPLAY

  // =====================================================



  const renderStars = (

    value,

    size = 'text-base'

  ) => {

    const rounded =

      Math.round(value);



    return (

      <span

        className={`${size} tracking-wide text-amber-500`}

      >

        {Array.from(

          { length: 5 },

          (_, index) =>

            index < rounded

              ? '★'

              : '☆'

        ).join('')}

      </span>

    );

  };



  // =====================================================

  // LOADING

  // =====================================================



  if (loading) {

    return (

      <div className="flex justify-center py-24">

        <LoadingSpinner size="lg" />

      </div>

    );

  }



  // =====================================================

  // COURSE NOT FOUND

  // =====================================================



  if (!course) {

    return (

      <div className="mx-auto max-w-7xl px-4 py-16 text-center">

        <Alert

          type="error"

          message={

            error ||

            'Course not found'

          }

        />



        <Link

          to="/courses"

          className="btn-primary mt-4 inline-block"

        >

          Browse Courses

        </Link>

      </div>

    );

  }



  const totalLessons =

    course.modules?.reduce(

      (sum, module) =>

        sum +

        (module.lessons

          ?.length || 0),

      0

    ) || 0;



  const courseRating = Number(
    course.ratingAverage || 0
  );



  const ratingCount =

    course.ratingCount || 0;



  const distribution =

    course.ratingDistribution || {

      five: 0,

      four: 0,

      three: 0,

      two: 0,

      one: 0,

    };



  const getPercentage = (

    count

  ) => {

    if (!ratingCount) {

      return 0;

    }



    return Math.round(

      (count / ratingCount) *

        100

    );

  };



  return (

    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

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

      />



      <div className="grid gap-8 lg:grid-cols-3">

        {/* =====================================================

            LEFT SIDE

        ===================================================== */}



        <div className="lg:col-span-2">

          <div className="mb-6 overflow-hidden rounded-xl">

            <img

              src={getImageUrl(

                course.thumbnail

              )}

              alt={course.title}

              className="aspect-video w-full object-cover"

            />

          </div>



          <h1 className="mb-2 text-3xl font-bold text-gray-900">

            {course.title}

          </h1>



          <p className="mb-4 text-gray-600">

            By {course.instructor}

          </p>



          <div className="mb-6 flex flex-wrap gap-2">

            <span

              className={`rounded-full px-3 py-1 text-sm font-medium ${getLevelColor(

                course.level

              )}`}

            >

              {course.level}

            </span>



            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">

              {course.category}

            </span>



            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">

              {totalLessons} lessons

            </span>



            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">

              {formatDuration(

                course.totalDuration

              )}

            </span>

          </div>



          {/* =====================================================

              COURSE RATING SUMMARY

          ===================================================== */}



          <div className="card mb-6">

            <h2 className="mb-6 text-xl font-semibold text-gray-900">

              Student feedback

            </h2>



            {ratingCount === 0 ? (

              <div className="py-6 text-center text-gray-500">

                <div className="mb-2 text-4xl">

                  ☆

                </div>



                <p>

                  No ratings yet.

                </p>



                <p className="text-sm">

                  Be the first student

                  to review this course!

                </p>

              </div>

            ) : (

              <div className="grid gap-6 sm:grid-cols-[150px_1fr]">

                {/* Average */}

                <div className="text-center sm:text-left">

                  <div className="text-6xl font-bold text-amber-600">

                    {courseRating.toFixed(1)}

                  </div>



                  <div className="mt-2">

                    {renderStars(

                      courseRating,
                      'text-xl'

                    )}

                  </div>



                  <p className="mt-2 text-sm font-medium text-amber-700">

                    Course Rating

                  </p>



                  <p className="mt-1 text-xs text-gray-500">

                    {ratingCount}{' '}

                    {ratingCount ===

                    1

                      ? 'rating'

                      : 'ratings'}

                  </p>

                </div>



                {/* Distribution */}

                <div className="space-y-3">

                  {[

                    {

                      star: 5,

                      count:

                        distribution.five,

                    },

                    {

                      star: 4,

                      count:

                        distribution.four,

                    },

                    {

                      star: 3,

                      count:

                        distribution.three,

                    },

                    {

                      star: 2,

                      count:

                        distribution.two,

                    },

                    {

                      star: 1,

                      count:

                        distribution.one,

                    },

                  ].map(

                    ({

                      star,

                      count,

                    }) => {

                      const percentage =

                        getPercentage(

                          count

                        );



                      return (

                        <div

                          key={star}

                          className="flex items-center gap-3"

                        >

                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">

                            <div

                              className="h-full rounded-full bg-gray-400"

                              style={{

                                width: `${percentage}%`,

                              }}

                            />

                          </div>



                          <span className="w-24 text-sm text-amber-600">

                            {'★'.repeat(

                              star

                            )}

                            {'☆'.repeat(

                              5 - star

                            )}

                          </span>



                          <span className="w-10 text-right text-sm text-primary-600">

                            {percentage}%

                          </span>

                        </div>

                      );

                    }

                  )}

                </div>

              </div>

            )}

          </div>



          {/* =====================================================

              ABOUT COURSE

          ===================================================== */}



          <div className="card mb-6">

            <h2 className="mb-3 text-lg font-semibold">

              About this course

            </h2>



            <p className="whitespace-pre-wrap text-gray-600">

              {course.description}

            </p>

          </div>



          {/* =====================================================

              COURSE CONTENT

          ===================================================== */}



          <div className="card mb-6">

            <h2 className="mb-4 text-lg font-semibold">

              Course Content

            </h2>



            <div className="space-y-4">

              {course.modules?.map(

                (module, idx) => (

                  <div

                    key={module._id}

                    className="rounded-lg border border-gray-200"

                  >

                    <div className="bg-gray-50 px-4 py-3 font-medium">

                      Module {idx + 1}:{' '}

                      {module.title}

                    </div>



                    <ul className="divide-y divide-gray-100">

                      {module.lessons?.map(

                        (

                          lesson,

                          lIdx

                        ) => (

                          <li

                            key={

                              lesson._id

                            }

                            className="flex items-center justify-between px-4 py-2 text-sm"

                          >

                            <span>

                              {lIdx +

                                1}.{' '}

                              {

                                lesson.title

                              }



                              {lesson.isFree && (

                                <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">

                                  Preview

                                </span>

                              )}

                            </span>



                            <span className="text-gray-400">

                              {formatDuration(

                                lesson.duration

                              )}

                            </span>

                          </li>

                        )

                      )}

                    </ul>

                  </div>

                )

              )}

            </div>

          </div>



          {/* =====================================================

              WRITE REVIEW

          ===================================================== */}



          {isAuthenticated &&

            course.isEnrolled && (

              <div className="card mb-6">

                <h2 className="mb-4 text-xl font-semibold">

                  {userReview

                    ? 'Your Review'

                    : 'Write a Review'}

                </h2>



                <form

                  onSubmit={

                    handleSubmitReview

                  }

                >

                  <div className="mb-4">

                    <label className="mb-2 block text-sm font-medium text-gray-700">

                      Your Rating

                    </label>



                    <div className="flex gap-1">

                      {[

                        1,

                        2,

                        3,

                        4,

                        5,

                      ].map(

                        (star) => (

                          <button

                            key={star}

                            type="button"

                            onClick={() =>

                              setRating(

                                star

                              )

                            }

                            className="text-3xl transition hover:scale-110"

                          >

                            <span

                              className={

                                star <=

                                rating

                                  ? 'text-amber-500'

                                  : 'text-gray-300'

                              }

                            >

                              ★

                            </span>

                          </button>

                        )

                      )}

                    </div>

                  </div>



                  <div className="mb-4">

                    <label className="mb-2 block text-sm font-medium text-gray-700">

                      Your Review

                    </label>



                    <textarea

                      rows={5}

                      value={comment}

                      onChange={(e) =>

                        setComment(

                          e.target.value

                        )

                      }

                      placeholder="Share your experience with this course..."

                      className="input-field w-full"

                      maxLength={1000}

                    />



                    <p className="mt-1 text-right text-xs text-gray-400">

                      {comment.length}/1000

                    </p>

                  </div>



                  <div className="flex gap-3">

                    <button

                      type="submit"

                      disabled={

                        reviewSubmitting

                      }

                      className="btn-primary"

                    >

                      {reviewSubmitting

                        ? 'Saving...'

                        : userReview

                        ? 'Update Review'

                        : 'Submit Review'}

                    </button>



                    {userReview && (

                      <button

                        type="button"

                        onClick={

                          handleDeleteReview

                        }

                        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"

                      >

                        Delete Review

                      </button>

                    )}

                  </div>

                </form>

              </div>

            )}



          {/* =====================================================

              REVIEWS

          ===================================================== */}



          <div className="card">

            <h2 className="mb-6 text-xl font-semibold">

              Student Reviews

            </h2>



            {reviewsLoading ? (

              <div className="flex justify-center py-10">

                <LoadingSpinner />

              </div>

            ) : reviews.length ===

              0 ? (

              <div className="py-8 text-center text-gray-500">

                No reviews yet.

              </div>

            ) : (

              <div>

                {reviews.map(

                  (review) => (

                    <div

                      key={

                        review._id

                      }

                      className="border-b border-gray-200 py-6 first:pt-0 last:border-b-0"

                    >

                      <div className="flex gap-4">

                        {/* Avatar */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 font-semibold text-white">

                          {review.user?.name

                            ?.charAt(

                              0

                            )

                            ?.toUpperCase() ||

                            'U'}

                        </div>



                        <div className="min-w-0 flex-1">

                          <div className="mb-1 flex flex-wrap items-center gap-3">

                            <h3 className="font-semibold text-gray-900">

                              {review.user

                                ?.name ||

                                'Student'}

                            </h3>



                            <span className="text-sm text-gray-400">

                              {getRelativeDate(

                                review.createdAt

                              )}

                            </span>

                          </div>



                          <div className="mb-3">

                            {renderStars(

                              review.rating

                            )}

                          </div>



                          <p className="mb-4 whitespace-pre-wrap text-gray-600">

                            {

                              review.comment

                            }

                          </p>



                          <div className="flex items-center gap-3">

                            <span className="text-sm text-gray-500">

                              Was this review

                              helpful?

                            </span>



                            <button

                              type="button"

                              onClick={() =>

                                handleHelpful(

                                  review._id,

                                  true

                                )

                              }

                              className={`rounded-full border px-3 py-1.5 text-sm transition ${

                                review.isHelpful

                                  ? 'border-primary-600 bg-primary-50 text-primary-600'

                                  : 'border-gray-300 text-gray-600 hover:border-primary-500'

                              }`}

                            >

                              👍{' '}

                              {review.helpfulCount ||

                                0}

                            </button>



                            <button

                              type="button"

                              onClick={() =>

                                handleHelpful(

                                  review._id,

                                  false

                                )

                              }

                              className={`rounded-full border px-3 py-1.5 text-sm transition ${

                                review.isNotHelpful

                                  ? 'border-red-500 bg-red-50 text-red-500'

                                  : 'border-gray-300 text-gray-600 hover:border-red-400'

                              }`}

                            >

                              👎{' '}

                              {review.notHelpfulCount ||

                                0}

                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  )

                )}

              </div>

            )}

          </div>

        </div>



        {/* =====================================================

            RIGHT SIDE

        ===================================================== */}



        <div>

          <div className="sticky top-24 card">

            <div className="mb-4 text-3xl font-bold text-primary-600">

              {course.price === 0

                ? 'Free'

                : formatPrice(

                    course.price

                  )}

            </div>



            {course.isEnrolled ? (

              <Link

                to={`/learn/${course._id}`}

                className="btn-primary w-full"

              >

                Continue Learning

              </Link>

            ) : (

              <button

                onClick={

                  course.price === 0

                    ? handleFreeEnroll

                    : handlePayment

                }

                disabled={

                  enrolling

                }

                className="btn-primary w-full"

              >

                {enrolling ? (

                  <LoadingSpinner size="sm" />

                ) : course.price ===

                  0 ? (

                  'Enroll for Free'

                ) : (

                  'Pay with Razorpay'

                )}

              </button>

            )}



            {/* Rating in purchase card */}

            {ratingCount > 0 && (

              <div className="mt-5 border-t border-gray-200 pt-5">

                <div className="flex items-center gap-2">

                  <span className="text-lg font-bold text-gray-900">

                    {courseRating.toFixed(

                      1

                    )}

                  </span>



                  {renderStars(
                    courseRating
                  )}

                </div>



                <p className="mt-1 text-xs text-gray-500">

                  {ratingCount}{' '}

                  ratings

                </p>

              </div>

            )}



            <ul className="mt-6 space-y-2 text-sm text-gray-600">

              <li>

                ✓ Full lifetime access

              </li>



              <li>

                ✓ Progress tracking

              </li>

            </ul>

          </div>

        </div>

      </div>

    </div>

  );

};



export default CourseDetail;