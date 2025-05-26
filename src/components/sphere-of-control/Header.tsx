
'use client'; 

import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export function Header() {
  const { currentUser, signInWithGoogle, signOutUser, loading } = useAuth();

  return (
    <header className="py-4 px-4 md:px-6 border-b border-border/60 shadow-sm">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-semibold text-foreground">Sphere of Control</h1>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : currentUser ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
                <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hidden sm:inline">{currentUser.displayName}</span>
              <Button variant="outline" size="icon" onClick={signOutUser} aria-label="Sign out" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={signInWithGoogle} size="sm">
              <LogIn className="mr-1 h-4 w-4" />
              Sign in with Google
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

