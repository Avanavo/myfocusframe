
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/sphere-of-control/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert } from 'lucide-react';
import { ConfirmDialog } from '@/components/sphere-of-control/ConfirmDeleteDialog';
import type { ActionItem, BucketType } from '@/types';
import { getActionItemsStream } from '@/lib/firestoreService';
import { useToast } from '@/hooks/use-toast';

export default function AccountPage() {
  const { currentUser, loading: authLoading, signOutUser, forgetUserAccount } = useAuth();
  const router = useRouter();
  const [isForgetMeDialogOpen, setIsForgetMeDialogOpen] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/'); // Redirect to home if not logged in
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setActionItems([]);
      setIsLoadingItems(false);
      return;
    }

    setIsLoadingItems(true);
    const unsubscribe = getActionItemsStream(
      currentUser.uid,
      (items) => {
        setActionItems(items);
        setIsLoadingItems(false);
      },
      (error) => {
        console.error("Failed to load items for account page:", error);
        toast({ title: 'Error Loading Data', description: 'Could not fetch your action items to determine style.', variant: 'destructive' });
        setIsLoadingItems(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser, toast]);

  const handleForgetMe = () => {
    setIsForgetMeDialogOpen(true);
  };

  const confirmForgetMe = async () => {
    if (currentUser) {
      await forgetUserAccount();
    }
    setIsForgetMeDialogOpen(false);
  };

  const personality = useMemo(() => {
    if (isLoadingItems && authLoading) return "Calculating...";
    if (!currentUser || actionItems.length === 0) return "Balanced Individual";

    const counts: Record<BucketType, number> = {
      control: 0,
      influence: 0,
      acceptance: 0,
    };

    actionItems.forEach(item => {
      if (counts[item.bucket] !== undefined) {
        counts[item.bucket]++;
      }
    });

    const maxCount = Math.max(counts.control, counts.influence, counts.acceptance);

    if (maxCount === 0) return "Balanced Individual";

    if (counts.control === maxCount) return "Control Freak";
    if (counts.influence === maxCount) return "Influencer";
    if (counts.acceptance === maxCount) return "Master of Zen";
    
    return "Balanced Individual";
  }, [actionItems, currentUser, isLoadingItems, authLoading]);
  

  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  if (!currentUser) {
     router.push('/');
     return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 flex items-center justify-center">
          <p>Redirecting...</p>
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
                
                <div className="mt-4 mb-2"> {/* Adjusted margins */}
                  {isLoadingItems ? (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating your style...
                    </div>
                  ) : (
                    <p className="text-xl text-primary font-semibold">{personality}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Account Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Account Created</p>
                      <p className="text-sm text-foreground">
                        {new Date(currentUser.metadata.creationTime || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Sign In</p>
                      <p className="text-sm text-foreground">
                        {new Date(currentUser.metadata.lastSignInTime || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4 border-t border-border/50 mt-6">
                  <Button variant="outline" onClick={signOutUser} className="mt-4 sm:mt-0">
                    Sign Out
                  </Button>
                  <Button variant="destructive" onClick={handleForgetMe} className="mt-4 sm:mt-0">
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
