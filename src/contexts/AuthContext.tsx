
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
    
    const appOptions = auth.app.options;
    const configuredApiKeyPartial = appOptions.apiKey ? appOptions.apiKey.substring(0,5) + '...' : 'NOT_CONFIGURED';
    const configuredAuthDomain = appOptions.authDomain || 'NOT_CONFIGURED';
    const configuredProjectId = appOptions.projectId || 'NOT_CONFIGURED';

    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Signed In', description: 'Successfully signed in with Google.' });
    } catch (error: any) {
      console.error("Firebase Auth Error:", error); // Log the full error object
      
      let toastTitle = 'Sign In Error';
      let toastDescription = `An error occurred: ${error.message || 'Could not sign in with Google.'}`;
      if (error.code) {
        toastTitle = `Sign In Error (${error.code})`;
      }

      let toastDuration = 9000;

      if (error.code === 'auth/unauthorized-domain') {
        const currentHostname = window.location.hostname;
        toastTitle = 'Sign In Error: Unauthorized Domain';
        toastDescription = `The domain '${currentHostname}' is not authorized. Check the browser console for details to add to your Firebase project's 'Authorized domains' list.`;
        toastDuration = 20000;

        console.error("UNAUTHORIZED DOMAIN DETAILS FOR FIREBASE CONFIGURATION:");
        console.error(`Current Hostname (add this to Firebase 'Authorized domains'): ${currentHostname}`);
        console.error(`Firebase Project ID your app is using: ${configuredProjectId}`);
        console.error(`Firebase Auth Domain your app is using: ${configuredAuthDomain}`);
        console.error(`Firebase API Key your app is using (starts with): ${configuredApiKeyPartial}`);
        console.error("INSTRUCTIONS: 1. Copy the 'Current Hostname' above. 2. Go to your Firebase project console > Authentication > Sign-in method > Authorized domains. 3. Add the copied hostname. 4. Ensure the Project ID and Auth Domain match your target project.");
      }

      toast({ 
        title: toastTitle, 
        description: toastDescription, 
        variant: 'destructive',
        duration: toastDuration
      });
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: 'Signed Out', description: 'Successfully signed out.' });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: 'Sign Out Error', description: error.message || 'Could not sign out.', variant: 'destructive' });
      setLoading(false);
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

