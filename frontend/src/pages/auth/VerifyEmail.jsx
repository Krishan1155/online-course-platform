import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const { setToken } = useAuth();

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const verify = async () => {
      try {
        const { data } = await api.get(
          `/auth/verify-email/${token}`
        );

        setToken(data.data.token);
        setStatus('success');
        setMessage(data.message);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          err.message ||
          'Email verification failed'
        );
      }
    };

    verify();
  }, [token, setToken]);

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="card">

          {status === 'loading' && (
            <div className="py-8">
              <LoadingSpinner
                size="lg"
                className="mx-auto"
              />

              <p className="mt-4 text-gray-500">
                Verifying your email...
              </p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 text-4xl">
                ✅
              </div>

              <h1 className="mb-2 text-2xl font-bold text-green-700">
                Email Verified!
              </h1>

              <Alert
                type="success"
                message={message}
              />

              <Link
                to="/"
                className="btn-primary mt-4 inline-block"
              >
                Go to Homepage
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 text-4xl">
                ❌
              </div>

              <h1 className="mb-2 text-2xl font-bold text-red-700">
                Verification Failed
              </h1>

              <Alert
                type="error"
                message={message}
              />

              <Link
                to="/login"
                className="btn-primary mt-4 inline-block"
              >
                Go to Login
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;