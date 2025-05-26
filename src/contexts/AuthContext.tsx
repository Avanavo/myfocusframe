
'use client';

import type { User } from 'firebase/auth';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, reauthenticateWithPopup } from 'firebase/auth';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { app } from '@/lib/firebase'; // Firebase app instance
import { useToast } from '@/hooks/use-toast';
import { deleteAllUserActionItems } from '@/lib/firestoreService'; // Import the new function

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  forgetUserAccount: () => Promise<void>; // New function
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
      toast({ title: 'Signed In', description: 'Successfully signed in with Google.' });
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      
      let toastTitle = 'Sign In Error';
      let toastDescription = `An error occurred: ${error.message || 'Could not sign in with Google.'}`;
      if (error.code) {
        toastTitle = `Sign In Error (${error.code})`;
      }
      let toastDuration = 9000;

      if (error.code === 'auth/unauthorized-domain') {
        const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        toastTitle = 'Sign In Error: Unauthorized Domain';
        toastDescription = `The domain '${currentHostname}' is not authorized. Check the browser console for details to add to your Firebase project's 'Authorized domains' list. The app is configured with Project ID: ${auth.app.options.projectId || 'NOT_CONFIGURED'} and Auth Domain: ${auth.app.options.authDomain || 'NOT_CONFIGURED'}.`;
        toastDuration = 20000;
        console.error("UNAUTHORIZED DOMAIN DETAILS FOR FIREBASE CONFIGURATION:");
        console.error(`Current Hostname (add this to Firebase 'Authorized domains'): ${currentHostname}`);
        console.error(`Firebase Project ID your app is using: ${auth.app.options.projectId}`);
        console.error(`Firebase Auth Domain your app is using: ${auth.app.options.authDomain}`);
        console.error(`Firebase API Key your app is using (starts with): ${(auth.app.options.apiKey || '').substring(0,5)}...`);
      }
      toast({ 
        title: toastTitle, 
        description: toastDescription, 
        variant: 'destructive',
        duration: toastDuration
      });
    } finally {
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
    const userDisplayName = currentUser.displayName || 'your';

    try {
      // 1. Delete all user's action items from Firestore
      await deleteAllUserActionItems(userId);
      toast({ title: 'Data Deleted', description: `All action items for ${userDisplayName} account have been deleted.` });

      // 2. Delete the Firebase Auth user
      // This might require re-authentication if the user hasn't signed in recently.
      await currentUser.delete();
      toast({ title: 'Account Deleted', description: `${userDisplayName} account has been permanently deleted.` });
      // onAuthStateChanged will handle setting currentUser to null

    } catch (error: any) {
      console.error("Error during 'Forget Me' process:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast({
          title: 'Re-authentication Required',
          description: 'To delete your account, please sign in again first, then try "Forget Me" immediately.',
          variant: 'destructive',
          duration: 10000,
        });
        // Optionally, prompt for re-authentication here
        // For simplicity, we'll ask the user to manually re-login and retry.
        // await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
        // await currentUser.delete(); // Retry delete
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
      // Ensure user is signed out if account deletion succeeded or even if only data was deleted.
      // onAuthStateChanged should handle currentUser being null if user.delete() succeeds.
      // If user.delete() failed but data deletion succeeded, we might still want to sign them out.
      if (auth.currentUser?.uid === userId) { // if the user wasn't deleted by error or other means
         // signOut(auth); // Let onAuthStateChanged handle this after user.delete()
      }
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
