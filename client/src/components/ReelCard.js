import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const ReelContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 15px;
  overflow: hidden;
  background-color: #000;
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
`;

const VideoElement = styled.video`
  width: 100%;
  height: 600px;
  object-fit: cover;
  cursor: pointer;
`;

const Overlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 2rem 1rem 1rem;
  color: white;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 0.75rem;
  border: 2px solid white;
`;

const UserName = styled.span`
  font-weight: bold;
  font-size: 1rem;
`;

const VerifiedBadge = styled.span`
  color: #1DA1F2;
  margin-left: 0.5rem;
`;

const Caption = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ActionButtons = styled.div`
  position: absolute;
  right: 1rem;
  bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &.liked {
    background: rgba(255, 59, 92, 0.8);
  }
`;

const ActionCount = styled.span`
  font-size: 0.8rem;
  margin-top: 0.25rem;
  text-align: center;
`;

const PlayPauseButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: ${({ show }) => show ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(10px);
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  width: 100%;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  width: ${({ progress }) => progress}%;
  transition: width 0.1s linear;
`;

const ReelCard = ({ reel, onView, onLike, onComment, onShare }) => {
  const { currentUser } = useAuth();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setShowPlayButton(false);
      if (!watchStartTime) {
        setWatchStartTime(Date.now());
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
      
      // Track watch time when paused
      if (watchStartTime && onView) {
        const watchTime = (Date.now() - watchStartTime) / 1000;
        onView(watchTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
      setProgress(100);
      
      // Track full watch time
      if (watchStartTime && onView) {
        const watchTime = video.duration;
        onView(watchTime);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [watchStartTime, onView]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLike) {
      onLike();
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment();
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <ReelContainer>
      <VideoElement
        ref={videoRef}
        src={reel.video_url}
        loop
        muted
        playsInline
        onClick={togglePlayPause}
        onMouseEnter={() => setShowPlayButton(true)}
        onMouseLeave={() => setShowPlayButton(false)}
      />

      <PlayPauseButton show={showPlayButton} onClick={togglePlayPause}>
        {isPlaying ? '⏸️' : '▶️'}
      </PlayPauseButton>

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>

      <Overlay>
        <UserInfo>
          <Avatar
            src={reel.author?.photos?.[0] || 'https://via.placeholder.com/40'}
            alt={reel.author?.name}
          />
          <UserName>{reel.author?.name}</UserName>
          {reel.author?.is_verified && (
            <VerifiedBadge>✓</VerifiedBadge>
          )}
        </UserInfo>

        {reel.caption && (
          <Caption>{reel.caption}</Caption>
        )}
      </Overlay>

      <ActionButtons>
        <div>
          <ActionButton className={isLiked ? 'liked' : ''} onClick={handleLike}>
            {isLiked ? '❤️' : '🤍'}
          </ActionButton>
          <ActionCount>{formatCount(reel.like_count || 0)}</ActionCount>
        </div>

        <div>
          <ActionButton onClick={handleComment}>
            💬
          </ActionButton>
          <ActionCount>{formatCount(reel.comment_count || 0)}</ActionCount>
        </div>

        <div>
          <ActionButton onClick={handleShare}>
            📤
          </ActionButton>
          <ActionCount>{formatCount(reel.share_count || 0)}</ActionCount>
        </div>

        <div>
          <ActionButton>
            👁️
          </ActionButton>
          <ActionCount>{formatCount(reel.view_count || 0)}</ActionCount>
        </div>
      </ActionButtons>
    </ReelContainer>
  );
};

export default ReelCard;