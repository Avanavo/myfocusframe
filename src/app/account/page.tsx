
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/focusframe/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, Info, X, Brain } from 'lucide-react'; // Added Brain for fun
import { ConfirmDialog } from '@/components/focusframe/ConfirmDialog';
import type { Item, BucketType } from '@/types'; // Renamed from ActionItem
import { getItemsStream } from '@/lib/firestoreService'; // Renamed from getActionItemsStream
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PersonalityProfile {
  style: string;
  explanation: string;
  icon?: React.ElementType; 
}

export default function AccountPage() {
  const { currentUser, loading: authLoading, signOutUser, forgetUserAccount } = useAuth();
  const router = useRouter();
  const [isForgetMeDialogOpen, setIsForgetMeDialogOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]); // Renamed from actionItems
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/'); 
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setItems([]);
      setIsLoadingItems(false);
      return;
    }

    setIsLoadingItems(true);
    const unsubscribe = getItemsStream( // Renamed from getActionItemsStream
      currentUser.uid,
      (loadedItems) => { // Renamed for clarity
        setItems(loadedItems);
        setIsLoadingItems(false);
      },
      (error) => {
        console.error("Failed to load items for account page:", error);
        toast({ title: 'Error Loading Data', description: 'Could not fetch your items to determine style.', variant: 'destructive' });
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

  const personalityProfile: PersonalityProfile = useMemo(() => {
    if (isLoadingItems && authLoading) return { style: "Calculating...", explanation: "Analyzing your items...", icon: Loader2 };
    if (!currentUser || items.length === 0) return { style: "Balanced Individual", explanation: "Your items are quite evenly distributed, or you're just getting started! You show a flexible approach.", icon: Brain };

    const counts: Record<BucketType, number> = {
      control: 0,
      influence: 0,
      acceptance: 0,
    };

    items.forEach(item => { // Using items state
      if (counts[item.bucket] !== undefined) {
        counts[item.bucket]++;
      }
    });

    const maxCount = Math.max(counts.control, counts.influence, counts.acceptance);

    if (maxCount === 0) return { style: "Balanced Individual", explanation: "Your items are quite evenly distributed, or you're just getting started! You show a flexible approach.", icon: Brain };

    if (counts.control === maxCount) return { style: "Control Freak", explanation: "You tend to have the most items in your 'Control' bucket, focusing on what you can directly manage.", icon: Brain };
    if (counts.influence === maxCount) return { style: "Influencer", explanation: "Your focus seems to be on the 'Influence' bucket, aiming to affect outcomes indirectly.", icon: Brain };
    if (counts.acceptance === maxCount) return { style: "Master of Zen", explanation: "You often place items in the 'Acceptance' bucket, excelling at letting go of what you can't change.", icon: Brain };
    
    return { style: "Balanced Individual", explanation: "Your items are quite evenly distributed, or you're just getting started! You show a flexible approach.", icon: Brain };
  }, [items, currentUser, isLoadingItems, authLoading]); // Using items state
  

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
          <div className="max-w-2xl mx-auto relative">
            <Card className="shadow-xl">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => router.push('/')}
                aria-label="Close account page"
              >
                <X className="h-5 w-5" />
              </Button>
              <CardHeader className="text-center pt-8">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 text-3xl">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
                    <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{currentUser.displayName || 'User Account'}</CardTitle>
                <CardDescription>{currentUser.email}</CardDescription>
                
                <div className="mt-4 mb-2 flex items-center justify-center gap-2">
                  {isLoadingItems || (personalityProfile.icon === Loader2) ? (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating your style...
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <div className="flex items-center justify-center gap-2">
                           {personalityProfile.icon && <personalityProfile.icon className="h-6 w-6 text-primary" />}
                           <p className="text-xl text-primary font-semibold">{personalityProfile.style}</p>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Learn more about this style</span>
                            </Button>
                          </TooltipTrigger>
                        </div>
                        <TooltipContent className="w-auto max-w-xs p-3 text-sm" side="top" align="center">
                          <p>{personalityProfile.explanation}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
        description="This action cannot be undone. All your items will be permanently deleted, and your account will be removed. This is for GDPR compliance." // Changed "action items" to "items"
        confirmButtonText="Yes, Forget Me"
        confirmButtonVariant="destructive"
      />
    </>
  );
}
