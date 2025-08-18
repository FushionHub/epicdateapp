import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getProfile, getAllProfiles } from '../services/supabaseService';
import ProfileForm from './ProfileForm';
import UserProfileCard from './UserProfileCard';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      const userProfile = await getProfile(currentUser.uid);
      setProfile(userProfile);

      const otherProfiles = await getAllProfiles(currentUser.uid);
      setAllProfiles(otherProfiles);

      setLoading(false);
    }
    loadDashboard();
  }, [currentUser]);

  async function handleLogout() {
    setError('');
    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  }

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <nav>
          <Link to={`/profile/${currentUser.uid}`} style={{ marginRight: '16px' }}>My Profile</Link>
          <Link to="/matches" style={{ marginRight: '16px' }}>My Matches</Link>
          <Link to="/wallet" style={{ marginRight: '16px' }}>My Wallet</Link>
          <Link to="/subscriptions" style={{ marginRight: '16px' }}>Subscriptions</Link>
          <button onClick={handleLogout} style={{ marginLeft: '16px' }}>Log Out</button>
        </nav>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr />

      <div>
        <h3>
          Your Profile
          {profile && (profile.is_verified ? <span style={{color: 'green'}}> (Verified ✔)</span> : <span style={{color: 'red'}}> (Not Verified)</span>)}
        </h3>
        {profile && !profile.is_verified && (
          <p><Link to="/verify">Verify Your Profile Now</Link></p>
        )}
        {profile ? (
          <div>
            <p><strong>Name:</strong> {profile.name}</p>
          </div>
        ) : (
          <p>You have not created a profile yet. Please fill out the form below.</p>
        )}
        <ProfileForm />
      </div>

      <hr />

      <div>
        <h3>Discover Other Users</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {allProfiles.length > 0 ? (
            allProfiles.map(p => <UserProfileCard key={p.id} profile={p} />)
          ) : (
            <p>No other users to show right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}
