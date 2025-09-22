import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AIFeed from '../components/AIFeed';
import GamificationDashboard from '../components/GamificationDashboard';
import VirtualGiftModal from '../components/VirtualGiftModal';
import ProfileBoostModal from '../components/ProfileBoostModal';
import { getActiveBoosts, getDailyStreak, trackFeatureUsage } from '../services/advancedFeatures';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.background} 0%, ${({ theme }) => theme.colors.backgroundLight} 100%);
`;

const Header = styled.header`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primary}dd);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
`;

const UserName = styled.span`
  font-weight: bold;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
`;

const FeedSection = styled.section`
  min-height: 600px;
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SidebarCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;

const SidebarTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.1rem;
`;

const BoostStatus = styled.div`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 1rem;

  h4 {
    margin: 0 0 0.5rem 0;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }
`;

const StreakDisplay = styled.div`
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-radius: 10px;
  margin-bottom: 1rem;

  .streak-number {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .streak-text {
    font-size: 0.9rem;
    opacity: 0.9;
  }
`;

const QuickActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const QuickActionButton = styled.button`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primary}dd);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }
`;

const TabContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 25px;
  padding: 4px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const TabButton = styled.button`
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

const AdvancedDashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadSidebarData();
      trackFeatureUsage('dashboard_view');
    }
  }, [currentUser]);

  const loadSidebarData = async () => {
    try {
      const [boostsResult, streakResult] = await Promise.all([
        getActiveBoosts(),
        getDailyStreak()
      ]);

      if (boostsResult.success) {
        setActiveBoosts(boostsResult.data);
      }

      if (streakResult.success && streakResult.data) {
        setDailyStreak(streakResult.data);
      }
    } catch (error) {
      console.error('Error loading sidebar data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBoostPurchased = () => {
    loadSidebarData(); // Refresh boost status
  };

  const hasActiveBoost = activeBoosts.length > 0;
  const nextBoostExpiry = hasActiveBoost ? new Date(activeBoosts[0].expires_at) : null;

  return (
    <DashboardContainer>
      <Header>
        <HeaderContent>
          <Logo>EuroMeet Online</Logo>
          
          <Navigation>
            <NavLink to="/matches">💕 Matches</NavLink>
            <NavLink to="/conversations">💬 Chat</NavLink>
            <NavLink to="/reels">🎥 Reels</NavLink>
            <NavLink to="/marketplace">🛍️ Shop</NavLink>
            <NavLink to="/wallet">💰 Wallet</NavLink>
          </Navigation>

          <UserSection>
            <UserAvatar
              src={userProfile?.photos?.[0] || 'https://via.placeholder.com/40'}
              alt={userProfile?.name}
            />
            <UserName>{userProfile?.name || 'User'}</UserName>
            <ActionButton onClick={handleLogout}>Logout</ActionButton>
          </UserSection>
        </HeaderContent>
      </Header>

      <MainContent>
        <FeedSection>
          <TabContainer>
            <TabButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')}>
              🤖 AI Feed
            </TabButton>
            <TabButton active={activeTab === 'gamification'} onClick={() => setActiveTab('gamification')}>
              🏆 Achievements
            </TabButton>
          </TabContainer>

          {activeTab === 'feed' && <AIFeed />}
          {activeTab === 'gamification' && <GamificationDashboard />}
        </FeedSection>

        <Sidebar>
          {/* Boost Status */}
          <SidebarCard>
            <SidebarTitle>🚀 Profile Boost</SidebarTitle>
            {hasActiveBoost ? (
              <BoostStatus>
                <h4>Boost Active!</h4>
                <p>Expires: {nextBoostExpiry?.toLocaleString()}</p>
              </BoostStatus>
            ) : (
              <QuickActionButton onClick={() => setShowBoostModal(true)}>
                🚀 Boost Profile
              </QuickActionButton>
            )}
          </SidebarCard>

          {/* Daily Streak */}
          <SidebarCard>
            <SidebarTitle>🔥 Daily Streak</SidebarTitle>
            <StreakDisplay>
              <div className="streak-number">
                {dailyStreak?.current_streak || 0}
              </div>
              <div className="streak-text">
                {dailyStreak?.current_streak === 1 ? 'Day' : 'Days'} in a row!
              </div>
            </StreakDisplay>
          </SidebarCard>

          {/* Quick Actions */}
          <SidebarCard>
            <SidebarTitle>⚡ Quick Actions</SidebarTitle>
            <QuickActions>
              <QuickActionButton onClick={() => setShowGiftModal(true)}>
                🎁 Send Gift
              </QuickActionButton>
              <QuickActionButton as={Link} to="/find-friends">
                👥 Find Friends
              </QuickActionButton>
              <QuickActionButton as={Link} to="/reels/upload">
                📹 Upload Reel
              </QuickActionButton>
              <QuickActionButton as={Link} to="/marketplace/new">
                🏪 Create Listing
              </QuickActionButton>
            </QuickActions>
          </SidebarCard>
        </Sidebar>
      </MainContent>

      {/* Modals */}
      <VirtualGiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        receiverId={currentUser?.uid} // This would be dynamic based on context
        receiverName="Someone Special"
      />

      <ProfileBoostModal
        isOpen={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        onBoostPurchased={handleBoostPurchased}
      />
    </DashboardContainer>
  );
};

export default AdvancedDashboard;