
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
    
    // Get Firebase config being used by the SDK for inclusion in error messages
    const appOptions = auth.app.options;
    const configuredApiKeyPartial = appOptions.apiKey ? appOptions.apiKey.substring(0,5) + '...' : 'NOT_CONFIGURED';
    const configuredAuthDomain = appOptions.authDomain || 'NOT_CONFIGURED';
    const configuredProjectId = appOptions.projectId || 'NOT_CONFIGURED';

    try {
      await signInWithPopup(auth, provider);
      // User state will be updated by onAuthStateChanged
      toast({ title: 'Signed In', description: 'Successfully signed in with Google.' });
    } catch (error: any) {
      // Log the full error object to console for developers
      console.error("Error signing in with Google:", error);
      
      let toastTitle = 'Sign In Error';
      let toastDescription = `An error occurred: ${error.message || 'Could not sign in with Google.'}`;
      if (error.code) {
        toastTitle = `Sign In Error (${error.code})`;
      }

      let toastDuration = 9000; // Default duration

      if (error.code === 'auth/unauthorized-domain') {
        toastTitle = 'Sign In Error: Unauthorized Domain';
        toastDescription = `Your app (from '${window.location.hostname}') is trying to authenticate with Firebase using:
          - Project ID: '${configuredProjectId}'
          - Auth Domain: '${configuredAuthDomain}'
          - API Key starts with: '${configuredApiKeyPartial}'
          
          VERIFY ALL THREE:
          1. These values EXACTLY match your target Firebase project in the Firebase console.
          2. In that Firebase project console (Authentication > Sign-in method), '${window.location.hostname}' (and 'localhost' for local dev) IS listed in 'Authorized domains'. Ensure your project's hosting domains (e.g., ${configuredProjectId}.web.app, ${configuredProjectId}.firebaseapp.com) are also listed.
          3. The Google sign-in provider IS enabled there.

          If all match, check for typos in your .env.local file or try an incognito browser window.`;
        toastDuration = 30000; // Longer duration for this detailed message
      }

      toast({ 
        title: toastTitle, 
        description: toastDescription, 
        variant: 'destructive',
        duration: toastDuration
      });
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
