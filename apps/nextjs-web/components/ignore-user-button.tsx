'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { UserX, UserCheck } from 'lucide-react';
import { addUserToIgnoreList, removeUserFromIgnoreList } from '@/app/dashboard/actions';
import { useRouter } from 'next/navigation';

interface IgnoreUserButtonProps {
  userId: string;
  username: string;
  isIgnored: boolean;
}

export function IgnoreUserButton({ userId, username, isIgnored: initialIsIgnored }: IgnoreUserButtonProps) {
  const [isIgnored, setIsIgnored] = useState(initialIsIgnored);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggleIgnore = () => {
    startTransition(async () => {
      try {
        if (isIgnored) {
          await removeUserFromIgnoreList(userId);
          setIsIgnored(false);
        } else {
          await addUserToIgnoreList(userId, `Manually ignored via dashboard`);
          setIsIgnored(true);
        }
        
        // Refresh the page to update the UI
        router.refresh();
      } catch (error) {
        console.error('Error toggling ignore status:', error);
        alert('Failed to update ignore status. Please try again.');
      }
    });
  };

  return (
    <Button
      onClick={handleToggleIgnore}
      disabled={isPending}
      variant={isIgnored ? 'outline' : 'destructive'}
      size="sm"
      className="gap-2"
    >
      {isIgnored ? (
        <>
          <UserCheck className="h-4 w-4" />
          Unignore User
        </>
      ) : (
        <>
          <UserX className="h-4 w-4" />
          Ignore User
        </>
      )}
    </Button>
  );
}

