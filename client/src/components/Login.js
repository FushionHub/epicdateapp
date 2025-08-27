import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const emailLinkRef = useRef();
  const { login, loginWithGoogle, loginWithEmailLink } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate('/');
    } catch {
      setError('Failed to log in. Check your email and password.');
    }

    setLoading(false);
  }

  async function handleEmailLinkSubmit(e) {
    e.preventDefault();
    const actionCodeSettings = {
      url: `${window.location.origin}/confirm-login`,
      handleCodeInApp: true,
    };

    try {
      setMessage('');
      setError('');
      setLoading(true);
      await loginWithEmailLink(emailLinkRef.current.value, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', emailLinkRef.current.value);
      setMessage('Check your email for the sign-in link!');
    } catch (e) {
      console.error(e);
      setError('Failed to send sign-in link.');
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (e) {
      console.error(e);
      setError('Failed to log in with Google.');
    }
    setLoading(false);
  }

  return (
    <div>
      <h2>Log In</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" ref={emailRef} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" ref={passwordRef} required />
        </div>
        <button disabled={loading} type="submit">
          Log In
        </button>
      </form>
      <div style={{marginTop: '20px'}}>
        Or sign in with a link:
        <form onSubmit={handleEmailLinkSubmit}>
           <input type="email" placeholder="Enter your email" ref={emailLinkRef} required />
           <button disabled={loading} type="submit">Send Sign-In Link</button>
        </form>
      </div>
      <hr />
      <button disabled={loading} onClick={handleGoogleLogin}>
        Sign In with Google
      </button>
      <div>
        Need an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
