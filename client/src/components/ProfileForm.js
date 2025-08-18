import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, upsertProfile } from '../services/supabaseService';

const ProfileForm = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [photos, setPhotos] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile(currentUser.uid);
      if (profile) {
        setName(profile.name || '');
        setAge(profile.age || '');
        setBio(profile.bio || '');
        setInterests(profile.interests ? profile.interests.join(', ') : '');
        setPhotos(profile.photos ? profile.photos.join(', ') : '');
      }
      setLoading(false);
    }
    loadProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const profileData = {
      name,
      age: parseInt(age, 10),
      bio,
      interests: interests.split(',').map(item => item.trim()),
      photos: photos.split(',').map(item => item.trim()),
    };
    await upsertProfile(currentUser.uid, profileData);
    setLoading(false);
    alert('Profile saved!');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Edit Your Profile</h2>
      <div>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Age</label>
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
      </div>
      <div>
        <label>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div>
        <label>Interests (comma-separated)</label>
        <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} />
      </div>
       <div>
        <label>Photo URLs (comma-separated)</label>
        <input type="text" value={photos} onChange={(e) => setPhotos(e.target.value)} />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default ProfileForm;
