
'use client';

import type { User } from 'firebase/auth';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { app } from '@/lib/firebase'; // Firebase app instance
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Diagnostic logging
    console.log('Attempting Google Sign-In with Firebase project:');
    console.log('Auth Domain from SDK config:', auth.app.options.authDomain);
    console.log('Project ID from SDK config:', auth.app.options.projectId);
    console.log('API Key from SDK config (first 5 chars):', auth.app.options.apiKey?.substring(0,5));


    try {
      await signInWithPopup(auth, provider);
      // User state will be updated by onAuthStateChanged
      toast({ title: 'Signed In', description: 'Successfully signed in with Google.' });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      // Check specifically for auth/unauthorized-domain to provide more targeted advice
      if (error.code === 'auth/unauthorized-domain') {
        toast({ 
          title: 'Sign In Error: Unauthorized Domain', 
          description: 'The domain localhost is not authorized for this Firebase project. Please check your Firebase console > Authentication > Sign-in method > Authorized domains. Also, verify the Firebase project ID and Auth Domain logged in the console match your intended project.', 
          variant: 'destructive',
          duration: 10000 // Longer duration for this important message
        });
      } else {
        toast({ title: 'Sign In Error', description: error.message || 'Could not sign in with Google.', variant: 'destructive' });
      }
      setLoading(false); // Reset loading on error
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // User state will be updated by onAuthStateChanged
      toast({ title: 'Signed Out', description: 'Successfully signed out.' });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: 'Sign Out Error', description: error.message || 'Could not sign out.', variant: 'destructive' });
      setLoading(false); // Reset loading on error
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
