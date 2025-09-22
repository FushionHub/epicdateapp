import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getUserBadges, getDailyStreak, getUserAchievements, updateDailyStreak } from '../services/advancedFeatures';
import { useAuth } from '../context/AuthContext';

const DashboardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Section = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
`;

const StreakCard = styled.div`
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
`;

const StreakNumber = styled.div`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

const StreakText = styled.p`
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
`;

const StreakReward = styled.div`
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const BadgesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
`;

const BadgeCard = styled.div`
  background-color: ${({ theme, earned }) => earned ? theme.colors.primary + '20' : theme.colors.backgroundLight};
  border: 2px solid ${({ theme, earned }) => earned ? theme.colors.primary : theme.colors.border};
  border-radius: 15px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  opacity: ${({ earned }) => earned ? 1 : 0.6};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }

  ${({ earned }) => earned && `
    &::before {
      content: '✨';
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 1rem;
      animation: sparkle 2s ease-in-out infinite;
    }

    @keyframes sparkle {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
  `}
`;

const BadgeIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  
  img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
`;

const BadgeName = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
`;

const BadgePoints = styled.p`
  margin: 0;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: bold;
`;

const RarityBadge = styled.span`
  position: absolute;
  top: 0.3rem;
  left: 0.3rem;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: bold;
  text-transform: uppercase;
  
  ${({ rarity }) => {
    switch (rarity) {
      case 'legendary':
        return 'background: linear-gradient(45deg, #FFD700, #FFA500); color: #000;';
      case 'epic':
        return 'background: linear-gradient(45deg, #9B59B6, #8E44AD); color: #fff;';
      case 'rare':
        return 'background: linear-gradient(45deg, #3498DB, #2980B9); color: #fff;';
      default:
        return 'background: linear-gradient(45deg, #95A5A6, #7F8C8D); color: #fff;';
    }
  }}
`;

const AchievementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AchievementCard = styled.div`
  background-color: ${({ theme, completed }) => completed ? theme.colors.primary + '20' : theme.colors.backgroundLight};
  border: 2px solid ${({ theme, completed }) => completed ? theme.colors.primary : theme.colors.border};
  border-radius: 15px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
`;

const AchievementIcon = styled.div`
  font-size: 2.5rem;
  
  img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
`;

const AchievementInfo = styled.div`
  flex: 1;
`;

const AchievementName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.1rem;
`;

const AchievementDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
`;

const ProgressBar = styled.div`
  background-color: ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div`
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primary}dd);
  height: 100%;
  width: ${({ progress }) => progress}%;
  transition: width 0.3s ease;
  border-radius: 10px;
`;

const RewardBadge = styled.div`
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-align: center;
  min-width: 80px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;

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

const GamificationDashboard = () => {
  const { currentUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [streak, setStreak] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streakReward, setStreakReward] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadGamificationData();
      handleDailyLogin();
    }
  }, [currentUser]);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      
      const [badgesResult, userBadgesResult, streakResult, achievementsResult] = await Promise.all([
        getBadges(),
        getUserBadges(currentUser.uid),
        getDailyStreak(),
        getUserAchievements()
      ]);

      if (badgesResult.success) {
        setBadges(badgesResult.data);
      }

      if (userBadgesResult.success) {
        setUserBadges(userBadgesResult.data);
      }

      if (streakResult.success && streakResult.data) {
        setStreak(streakResult.data);
      }

      if (achievementsResult.success) {
        setAchievements(achievementsResult.data);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyLogin = async () => {
    try {
      const result = await updateDailyStreak();
      if (result.success && result.reward > 0) {
        setStreakReward(result.reward);
        // Show reward notification
        setTimeout(() => setStreakReward(null), 5000);
      }
    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  };

  const isBadgeEarned = (badgeId) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  const getAchievementProgress = (achievement) => {
    // This would calculate progress based on achievement criteria
    // For now, return 100% if completed, 0% otherwise
    return achievement.completed_at ? 100 : 0;
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Daily Streak Section */}
      <Section>
        <SectionTitle>
          🔥 Daily Streak
        </SectionTitle>
        
        {streak ? (
          <StreakCard>
            <StreakNumber>{streak.current_streak}</StreakNumber>
            <StreakText>
              {streak.current_streak === 1 ? 'Day' : 'Days'} in a row!
            </StreakText>
            
            {streak.longest_streak > streak.current_streak && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                Personal best: {streak.longest_streak} days
              </p>
            )}

            {streakReward && (
              <StreakReward>
                🎉 Streak reward: {streakReward} NGN added to your wallet!
              </StreakReward>
            )}
          </StreakCard>
        ) : (
          <StreakCard>
            <StreakNumber>0</StreakNumber>
            <StreakText>Start your streak today!</StreakText>
          </StreakCard>
        )}
      </Section>

      {/* Badges Section */}
      <Section>
        <SectionTitle>
          🏆 Badges ({userBadges.length}/{badges.length})
        </SectionTitle>
        
        <BadgesGrid>
          {badges.map((badge) => {
            const earned = isBadgeEarned(badge.id);
            return (
              <BadgeCard key={badge.id} earned={earned}>
                <RarityBadge rarity={badge.rarity}>
                  {badge.rarity}
                </RarityBadge>
                
                <BadgeIcon>
                  {badge.icon_url ? (
                    <img src={badge.icon_url} alt={badge.name} />
                  ) : (
                    '🏅'
                  )}
                </BadgeIcon>
                
                <BadgeName>{badge.name}</BadgeName>
                <BadgePoints>{badge.points} pts</BadgePoints>
              </BadgeCard>
            );
          })}
        </BadgesGrid>
      </Section>

      {/* Achievements Section */}
      <Section>
        <SectionTitle>
          🎯 Achievements
        </SectionTitle>
        
        <AchievementsList>
          {achievements.map((userAchievement) => {
            const achievement = userAchievement.achievement;
            const completed = !!userAchievement.completed_at;
            const progress = getAchievementProgress(userAchievement);
            
            return (
              <AchievementCard key={achievement.id} completed={completed}>
                <AchievementIcon>
                  {achievement.icon_url ? (
                    <img src={achievement.icon_url} alt={achievement.name} />
                  ) : (
                    '🎯'
                  )}
                </AchievementIcon>
                
                <AchievementInfo>
                  <AchievementName>{achievement.name}</AchievementName>
                  <AchievementDescription>
                    {achievement.description}
                  </AchievementDescription>
                  
                  {!completed && (
                    <ProgressBar>
                      <ProgressFill progress={progress} />
                    </ProgressBar>
                  )}
                </AchievementInfo>
                
                <RewardBadge>
                  {completed ? '✅ Complete' : 
                   achievement.reward_type === 'wallet_credit' ? `${achievement.reward_value} NGN` :
                   achievement.reward_type === 'premium_days' ? `${achievement.reward_value} days` :
                   'Reward'}
                </RewardBadge>
              </AchievementCard>
            );
          })}
        </AchievementsList>
      </Section>
    </DashboardContainer>
  );
};

export default GamificationDashboard;