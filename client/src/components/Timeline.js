import React, { useState, useEffect } from 'react';
import { getTimeline } from '../services/supabaseService';
import Post from './Post';

const Timeline = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const userPosts = await getTimeline(userId);
      setPosts(userPosts);
      setLoading(false);
    };

    fetchPosts();
  }, [userId]);

  if (loading) {
    return <p>Loading timeline...</p>;
  }

  return (
    <div>
      {posts.length > 0 ? (
        posts.map(post => <Post key={post.id} post={post} />)
      ) : (
        <p>This user hasn't posted anything yet.</p>
      )}
    </div>
  );
};

export default Timeline;
