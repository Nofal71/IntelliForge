import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, getUserData, saveUserData } from '../services/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { UserData } from '../types';

type AuthContextType = {
  user: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (user: User) => {
    let data = await getUserData(user.uid);
    if (!data || !data.uid) {
      data = {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        createdAt: new Date().toISOString(),
      };
      await saveUserData(data);
    }
    setUserData(data);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserData(userCredential.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    const userData: UserData = {
      uid: userCredential.user.uid,
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    await saveUserData(userData);
    setUserData(userData);
  };

  const logout = async () => {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  const reloadUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, login, signup, logout, reloadUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};