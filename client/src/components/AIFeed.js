import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { getAIFeed, trackUserInteraction } from '../services/advancedFeatures';
import Post from './Post';
import ReelCard from './ReelCard';
import { useAuth } from '../context/AuthContext';

const FeedContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
`;

const FeedToggle = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 25px;
  padding: 4px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const ToggleButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 20px;
  background-color: ${({ active, theme }) => active ? theme.colors.primary : 'transparent'};
  color: ${({ active, theme }) => active ? 'white' : theme.colors.text};
  font-weight: ${({ active }) => active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.backgroundLight};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid ${({ theme }) => theme.colors.border};
    border-top: 4px solid ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FeedItem = styled.div`
  margin-bottom: 2rem;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: ${({ index }) => index * 0.1}s;

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  h3 {
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.text};
  }

  p {
    margin-bottom: 2rem;
    line-height: 1.6;
  }
`;

const RefreshButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const AIFeed = () => {
  const { currentUser } = useAuth();
  const [feedType, setFeedType] = useState('post');
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();

  // Intersection Observer for infinite scroll
  const lastFeedElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreFeed();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  const loadFeed = async (type = feedType, reset = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getAIFeed(type, 20);
      
      if (result.success) {
        if (reset) {
          setFeedData(result.data);
        } else {
          setFeedData(prev => [...prev, ...result.data]);
        }
        setHasMore(result.data.length === 20);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load feed. Please try again.');
      console.error('Feed loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFeed = async () => {
    if (!hasMore || loading) return;
    await loadFeed(feedType, false);
  };

  const handleFeedTypeChange = (type) => {
    if (type !== feedType) {
      setFeedType(type);
      setFeedData([]);
      setHasMore(true);
      loadFeed(type, true);
    }
  };

  const handleInteraction = async (contentType, contentId, interactionType, value = 1) => {
    // Track interaction for AI algorithm
    await trackUserInteraction(contentType, contentId, interactionType, value);
  };

  const handlePostView = (postId) => {
    handleInteraction('post', postId, 'view');
  };

  const handleReelView = (reelId, watchTime) => {
    handleInteraction('reel', reelId, 'watch_time', watchTime);
  };

  useEffect(() => {
    if (currentUser) {
      loadFeed(feedType, true);
    }
  }, [currentUser, feedType]);

  if (!currentUser) {
    return (
      <FeedContainer>
        <EmptyState>
          <h3>Please log in to see your personalized feed</h3>
        </EmptyState>
      </FeedContainer>
    );
  }

  return (
    <FeedContainer>
      <FeedToggle>
        <ToggleButton 
          active={feedType === 'post'} 
          onClick={() => handleFeedTypeChange('post')}
        >
          📝 Posts
        </ToggleButton>
        <ToggleButton 
          active={feedType === 'reel'} 
          onClick={() => handleFeedTypeChange('reel')}
        >
          🎥 Reels
        </ToggleButton>
      </FeedToggle>

      {error && (
        <EmptyState>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <RefreshButton onClick={() => loadFeed(feedType, true)}>
            Try Again
          </RefreshButton>
        </EmptyState>
      )}

      {feedData.length === 0 && !loading && !error && (
        <EmptyState>
          <h3>Your AI-powered feed is empty</h3>
          <p>
            Start interacting with content to help our AI learn your preferences! 
            Like posts, watch reels, and engage with other users to get personalized recommendations.
          </p>
          <RefreshButton onClick={() => loadFeed(feedType, true)}>
            Refresh Feed
          </RefreshButton>
        </EmptyState>
      )}

      {feedData.map((item, index) => (
        <FeedItem 
          key={`${feedType}-${item.id}`} 
          index={index}
          ref={index === feedData.length - 1 ? lastFeedElementRef : null}
        >
          {feedType === 'post' ? (
            <Post 
              post={item} 
              onView={() => handlePostView(item.id)}
              onLike={() => handleInteraction('post', item.id, 'like')}
              onComment={() => handleInteraction('post', item.id, 'comment')}
              onShare={() => handleInteraction('post', item.id, 'share')}
            />
          ) : (
            <ReelCard 
              reel={item}
              onView={(watchTime) => handleReelView(item.id, watchTime)}
              onLike={() => handleInteraction('reel', item.id, 'like')}
              onComment={() => handleInteraction('reel', item.id, 'comment')}
              onShare={() => handleInteraction('reel', item.id, 'share')}
            />
          )}
        </FeedItem>
      ))}

      {loading && <LoadingSpinner />}

      {!hasMore && feedData.length > 0 && (
        <EmptyState>
          <p>You've reached the end of your personalized feed!</p>
          <RefreshButton onClick={() => loadFeed(feedType, true)}>
            Refresh for New Content
          </RefreshButton>
        </EmptyState>
      )}
    </FeedContainer>
  );
};

export default AIFeed;