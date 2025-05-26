
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/sphere-of-control/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert } from 'lucide-react';
import { ConfirmDialog } from '@/components/sphere-of-control/ConfirmDeleteDialog';

export default function AccountPage() {
  const { currentUser, loading: authLoading, signOutUser, forgetUserAccount } = useAuth();
  const router = useRouter();
  const [isForgetMeDialogOpen, setIsForgetMeDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/'); // Redirect to home if not logged in
    }
  }, [currentUser, authLoading, router]);

  const handleForgetMe = () => {
    setIsForgetMeDialogOpen(true);
  };

  const confirmForgetMe = async () => {
    if (currentUser) {
      await forgetUserAccount();
      // AuthContext will handle user state changes, potentially redirecting or clearing UI
      // No need to router.push('/') here as onAuthStateChanged should trigger redirect if user becomes null
    }
    setIsForgetMeDialogOpen(false); // Close dialog regardless of outcome (toast will show error)
  };


  if (authLoading || !currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 text-3xl">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
                    <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{currentUser.displayName || 'User Account'}</CardTitle>
                <CardDescription>{currentUser.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Account Details</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Account Created:</strong> {new Date(currentUser.metadata.creationTime || Date.now()).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Last Sign In:</strong> {new Date(currentUser.metadata.lastSignInTime || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="outline" onClick={signOutUser}>
                    Sign Out
                  </Button>
                  <Button variant="destructive" onClick={handleForgetMe}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Forget Me
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <ConfirmDialog
        isOpen={isForgetMeDialogOpen}
        onClose={() => setIsForgetMeDialogOpen(false)}
        onConfirm={confirmForgetMe}
        title="Are you absolutely sure?"
        description="This action cannot be undone. All your action items will be permanently deleted, and your account will be removed. This is for GDPR compliance."
        confirmButtonText="Yes, Forget Me"
        confirmButtonVariant="destructive"
      />
    </>
  );
}
