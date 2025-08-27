import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider as CustomThemeProvider, ThemeContext } from './context/ThemeContext';
import { lightTheme, darkTheme } from './theme';
import { GlobalStyle } from './GlobalStyle';

// All components from both branches
import Signup from './components/Signup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Verification from './components/Verification';
import Matches from './components/Matches';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import SubscriptionPage from './pages/SubscriptionPage';
import WalletPage from './pages/WalletPage';
import Notifications from './components/Notifications';
import CallManager from './components/CallManager';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import ConfirmLoginPage from './pages/ConfirmLoginPage';
import EmailSettingsPage from './pages/EmailSettingsPage';
import KYCPage from './pages/KYCPage';
import AdminPage from './pages/AdminPage';
import FindFriendsPage from './pages/FindFriendsPage';
import ReelsPage from './pages/ReelsPage';
import UploadReelPage from './pages/UploadReelPage';
import MarketplacePage from './pages/MarketplacePage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';

import { useAuth } from './context/AuthContext';
import AgeVerificationModal from './components/AgeVerificationModal';

const AppContent = () => {
  const { theme } = useContext(ThemeContext);
  const { userProfile, updateUserProfile } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    // Show the modal if the user is logged in but has no age set
    if (userProfile && !userProfile.age) {
      setShowAgeModal(true);
    }
  }, [userProfile]);

  const handleAgeVerified = (age) => {
    updateUserProfile({ age });
    setShowAgeModal(false);
  };

  return (
    <StyledThemeProvider theme={currentTheme}>
      <GlobalStyle />
      {showAgeModal && <AgeVerificationModal onVerified={handleAgeVerified} />}
      <Router>
        <Notifications />
        <CallManager />
        <Routes>
          {/* Public Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/confirm-login" element={<ConfirmLoginPage />} />

          {/* Private Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/chat/:matchId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySettingsPage /></ProtectedRoute>} />
          <Route path="/settings/email" element={<ProtectedRoute><EmailSettingsPage /></ProtectedRoute>} />
          <Route path="/verify-identity" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

          {/* Feature Routes */}
          <Route path="/find-friends" element={<ProtectedRoute><FindFriendsPage /></ProtectedRoute>} />
          <Route path="/reels" element={<ProtectedRoute><ReelsPage /></ProtectedRoute>} />
          <Route path="/reels/upload" element={<ProtectedRoute><UploadReelPage /></ProtectedRoute>} />

          {/* Marketplace Routes */}
          <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
          <Route path="/marketplace/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
          <Route path="/listing/:listingId" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </StyledThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </AuthProvider>
  );
}

export default App;
