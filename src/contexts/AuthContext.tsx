
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
    
    // Enhanced Diagnostic logging
    const appOptions = auth.app.options;
    const loggedApiKeyPartial = appOptions.apiKey ? appOptions.apiKey.substring(0,5) + '...' : 'NOT_CONFIGURED';
    const loggedAuthDomain = appOptions.authDomain || 'NOT_CONFIGURED';
    const loggedProjectId = appOptions.projectId || 'NOT_CONFIGURED';

    console.log('Attempting Google Sign-In with Firebase project (as configured in your app):');
    console.log('API Key (starts with):', loggedApiKeyPartial);
    console.log('Auth Domain:', loggedAuthDomain);
    console.log('Project ID:', loggedProjectId);

    try {
      await signInWithPopup(auth, provider);
      // User state will be updated by onAuthStateChanged
      toast({ title: 'Signed In', description: 'Successfully signed in with Google.' });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      
      if (error.code === 'auth/unauthorized-domain') {
        toast({ 
          title: 'Sign In Error: Unauthorized Domain', 
          description: `Your app (from 'localhost') is trying to authenticate with Firebase using:
          - Project ID: '${loggedProjectId}'
          - Auth Domain: '${loggedAuthDomain}'
          - API Key starts with: '${loggedApiKeyPartial}'
          
          VERIFY ALL THREE:
          1. These values EXACTLY match your target Firebase project in the Firebase console.
          2. In that Firebase project console (Authentication > Sign-in method), 'localhost' IS listed in 'Authorized domains'.
          3. The Google sign-in provider IS enabled there.

          If all match, check for typos in your .env.local file or try an incognito browser window.`, 
          variant: 'destructive',
          duration: 20000 // Longer duration for this detailed message
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

