import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMatches } from '../services/supabaseService';
import { Link } from 'react-router-dom';

const Matches = () => {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      const userMatches = await getMatches(currentUser.uid);
      setMatches(userMatches);
      setLoading(false);
    }
    loadMatches();
  }, [currentUser]);

  if (loading) {
    return <div>Loading matches...</div>;
  }

  return (
    <div>
      <h2>Your Matches</h2>
      <Link to="/">Back to Dashboard</Link>
      {matches.length > 0 ? (
        <ul>
          {matches.map(match => (
            <li key={match.match_id}>
              <img
                src={match.other_user.photo || 'https://via.placeholder.com/50'}
                alt={match.other_user.name}
                style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '16px' }}
              />
              <span>{match.other_user.name}</span>
              <Link to={`/chat/${match.match_id}`} style={{ marginLeft: '16px' }}>
                <button>Open Chat</button>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no matches yet.</p>
      )}
    </div>
  );
};

export default Matches;
