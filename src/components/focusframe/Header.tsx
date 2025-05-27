
'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShieldAlert, Loader2, Info } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDeleteDialog'; 
import { AboutDialog } from './AboutDialog';

export function Header() {
  const { currentUser, signOutUser, forgetUserAccount, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isForgetMeDialogOpen, setIsForgetMeDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);

  const handleMyAccount = () => {
    router.push('/account');
  };

  const handleForgetMe = () => {
    setIsForgetMeDialogOpen(true);
  };

  const confirmForgetMe = async () => {
    if (currentUser) {
      await forgetUserAccount();
    }
    setIsForgetMeDialogOpen(false);
  };

  return (
    <>
      <header className="py-4 px-4 md:px-6 border-b border-border/60 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <Logo />
            <h1 className="text-2xl font-semibold text-foreground">My FocusFrame</h1>
          </div>
          <div className="flex items-center gap-3">
            {authLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
                      <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMyAccount}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOutUser}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleForgetMe} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <ShieldAlert className="mr-2 h-4 w-4" /> 
                    <span>Forget Me</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAboutDialogOpen(true)}>
                    <Info className="mr-2 h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              null
            )}
          </div>
        </div>
      </header>

      <ConfirmDialog
        isOpen={isForgetMeDialogOpen}
        onClose={() => setIsForgetMeDialogOpen(false)}
        onConfirm={confirmForgetMe}
        title="Are you absolutely sure?"
        description="This action cannot be undone. All your items will be permanently deleted, and your account will be removed. This is for GDPR compliance."
        confirmButtonText="Yes, Forget Me"
        confirmButtonVariant="destructive"
      />
      <AboutDialog 
        isOpen={isAboutDialogOpen}
        onClose={() => setIsAboutDialogOpen(false)}
      />
    </>
  );
}
