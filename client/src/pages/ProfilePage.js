import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProfile,
  getReceivedGifts,
  getFollowerCount,
  getFollowingCount,
  isFollowing,
  followUser,
  unfollowUser,
  blockUser
} from '../services/supabaseService';
import CreatePostForm from '../components/CreatePostForm';
import Timeline from '../components/Timeline';
import GiftModal from '../components/GiftModal';
import ReportModal from '../components/ReportModal';

const ProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    setIsOwnProfile(currentUser.uid === userId);

    const fetchProfileData = async () => {
      setLoading(true);
      const userProfile = await getProfile(userId);
      setProfile(userProfile);
      const receivedGifts = await getReceivedGifts(userId);
      setGifts(receivedGifts);
      const followers = await getFollowerCount(userId);
      setFollowerCount(followers);
      const following = await getFollowingCount(userId);
      setFollowingCount(following);
      if (currentUser.uid !== userId) {
        const followingStatus = await isFollowing(currentUser.uid, userId);
        setIsFollowingUser(followingStatus);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    await followUser(currentUser.uid, userId);
    setIsFollowingUser(true);
    setFollowerCount(followerCount + 1);
  };

  const handleUnfollow = async () => {
    await unfollowUser(currentUser.uid, userId);
    setIsFollowingUser(false);
    setFollowerCount(followerCount - 1);
  };

  const handleBlock = async () => {
    if (window.confirm(`Are you sure you want to block ${profile.name}? This action cannot be undone.`)) {
      await blockUser(currentUser.uid, userId);
      alert(`${profile.name} has been blocked.`);
      // Redirect to dashboard after blocking
      window.location.href = '/';
    }
  };

  const handlePostCreated = () => {
    window.location.reload();
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found.</div>;
  }

  return (
    <div>
      {showGiftModal && <GiftModal receiverId={userId} onClose={() => setShowGiftModal(false)} />}
      {showReportModal && <ReportModal reportedId={userId} onClose={() => setShowReportModal(false)} />}
      <Link to="/">Back to Dashboard</Link>
      <div style={{ textAlign: 'center', margin: '20px' }}>
        <img
          src={profile.photos && profile.photos.length > 0 ? profile.photos[0] : 'https://via.placeholder.com/150'}
          alt={profile.name}
          style={{ width: '150px', height: '150px', borderRadius: '50%' }}
        />
        <h1>{profile.name} {profile.is_verified && <span style={{ color: 'green' }}>✔</span>}</h1>
        <p>Followers: {followerCount} | Following: {followingCount}</p>
        <p>Tier: {profile.subscription_tier}</p>
        <p>Age: {profile.age}</p>
        <p>Bio: {profile.bio}</p>
        <p>Interests: {profile.interests ? profile.interests.join(', ') : ''}</p>
        {!isOwnProfile && (
          <div>
            {isFollowingUser ? (
              <button onClick={handleUnfollow}>Unfollow</button>
            ) : (
              <button onClick={handleFollow}>Follow</button>
            )}
            <button onClick={() => setShowGiftModal(true)} style={{marginLeft: '8px'}}>Send Gift</button>
            <button onClick={handleBlock} style={{marginLeft: '8px', backgroundColor: '#f44336', color: 'white'}}>Block</button>
            <button onClick={() => setShowReportModal(true)} style={{marginLeft: '8px'}}>Report</button>
          </div>
        )}
      </div>

      <hr />

      <div>
        <h3>Gifts Received</h3>
        {gifts.length > 0 ? (
          <ul>
            {gifts.map(gift => (
              <li key={gift.id}>
                Received a {gift.gift.name} from {gift.sender.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>No gifts received yet.</p>
        )}
      </div>

      <hr />

      <div>
        <h2>Timeline</h2>
        {isOwnProfile && <CreatePostForm onPostCreated={handlePostCreated} />}
        <Timeline userId={userId} />
      </div>
    </div>
  );
};

export default ProfilePage;
