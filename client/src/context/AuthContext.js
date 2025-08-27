import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { getProfile } from '../services/supabaseService'; // Import getProfile

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Add state for Supabase profile
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function loginWithEmailLink(email, actionCodeSettings) {
    return sendSignInLinkToEmail(auth, email, actionCodeSettings);
  }

  function confirmLoginWithEmailLink(email, url) {
      if (isSignInWithEmailLink(auth, url)) {
          return signInWithEmailLink(auth, email, url);
      }
      return Promise.reject(new Error("Invalid sign-in link."));
  }

  function logout() {
    setUserProfile(null); // Clear profile on logout
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        // If user is logged in, fetch their Supabase profile
        const profile = await getProfile(user.uid);
        setUserProfile(profile);
      } else {
        // If user is logged out, clear the profile
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateUserProfile = (updates) => {
    setUserProfile(prevProfile => ({ ...prevProfile, ...updates }));
  };

  const value = {
    currentUser,
    userProfile, // Expose profile in context
    updateUserProfile, // Expose the update function
    signup,
    login,
    loginWithGoogle,
    loginWithEmailLink,
    confirmLoginWithEmailLink,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
