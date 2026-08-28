import type { FC } from 'react';
import { Card } from '../../ui/card';
import { useAuthStore } from '../../../store/AuthStore';

interface WelcomeWidgetProps {
  percentage: number;
}

export const WelcomeWidget: FC<WelcomeWidgetProps> = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 via-card to-card">
      <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0]}!</h2>
      <p className="text-muted-foreground mb-4">
        Ready to ace your next technical interview? Keep pushing forward!
      </p>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Today's Goal: Complete an AI Mock Interview</p>
        </div>
      </div>
    </Card>
  );
};
