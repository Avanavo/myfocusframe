
'use client';

import type { User } from 'firebase/auth';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, reauthenticateWithPopup } from 'firebase/auth';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { app } from '@/lib/firebase'; 
import { useToast } from '@/hooks/use-toast';
import { deleteAllUserItems } from '@/lib/firestoreService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  forgetUserAccount: () => Promise<void>; 
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
    try {
      await signInWithPopup(auth, provider);
      // Success toast for sign-in removed
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      
      let toastTitle = 'Sign In Error';
      let toastDescription = `An error occurred: ${error.message || 'Could not sign in with Google.'}`;
      
      const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown-host';
      const sdkConfig = {
        apiKey: auth.app.options.apiKey?.substring(0,5) + "...",
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
      };

      if (error.code === 'auth/unauthorized-domain') {
        toastTitle = 'Sign In Error: Unauthorized Domain';
        toastDescription = `The domain '${currentHostname}' is not authorized. Please check the browser console for details to add to your Firebase project's 'Authorized domains' list. Ensure your app's configured Project ID (${sdkConfig.projectId}) and Auth Domain (${sdkConfig.authDomain}) match the Firebase project where you are authorizing domains. API Key starts with: ${sdkConfig.apiKey}.`;
        console.error("UNAUTHORIZED DOMAIN DETAILS FOR FIREBASE CONFIGURATION:");
        console.error(`Current Hostname (add this to Firebase 'Authorized domains'): ${currentHostname}`);
        console.error("App is configured with ->");
        console.error(`Project ID: ${sdkConfig.projectId}`);
        console.error(`Auth Domain: ${sdkConfig.authDomain}`);
        console.error(`API Key (starts with): ${sdkConfig.apiKey}`);
      } else if (error.code) {
         toastTitle = `Sign In Error (${error.code})`;
      }

      toast({ 
        title: toastTitle, 
        description: toastDescription, 
        variant: 'destructive',
        duration: 15000 
      });
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // Success toast for sign-out removed
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: 'Sign Out Error', description: error.message || 'Could not sign out.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const forgetUserAccount = async () => {
    if (!currentUser) {
      toast({ title: 'Error', description: 'No user is currently signed in.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const userId = currentUser.uid;

    try {
      await deleteAllUserItems(userId);

      await currentUser.delete();

    } catch (error: any) {
      console.error("Error during 'Forget Me' process:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast({
          title: 'Re-authentication Required',
          description: 'To delete your account, please sign in again first, then try "Forget Me" immediately.',
          variant: 'destructive',
          duration: 10000,
        });
      } else {
        toast({
          title: 'Error Deleting Account',
          description: `Could not fully complete the 'Forget Me' process: ${error.message}`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, signOutUser, forgetUserAccount }}>
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
