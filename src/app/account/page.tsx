
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/sphere-of-control/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AccountPage() {
  const { currentUser, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/'); // Redirect to home if not logged in
    }
  }, [currentUser, authLoading, router]);

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
                  <strong>User ID:</strong> {currentUser.uid}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Email Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Account Created:</strong> {new Date(currentUser.metadata.creationTime || Date.now()).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Last Sign In:</strong> {new Date(currentUser.metadata.lastSignInTime || Date.now()).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={signOutUser}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
