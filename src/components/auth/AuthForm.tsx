import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { TacticalBackground } from './TacticalBackground';
import { StratikLogo } from '@/components/chat/StratikLogo';
import { toast } from 'sonner';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success('Check your email to confirm your account!');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <TacticalBackground />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-hero-rise">
          <StratikLogo game="valorant" size="lg" />
          <span className="font-display text-2xl font-bold tracking-wider">
            STRATIK
          </span>
        </div>

        {/* Form Card */}
        <div className="card-glow p-8 animate-hero-rise" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <h1 className="font-display text-xl font-bold tracking-wide text-center mb-2">
            {isSignUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
          </h1>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            {isSignUp 
              ? 'Start scouting competitive teams' 
              : 'Sign in to access your scouting reports'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@tactical.gg"
                className="tactical-input h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="tactical-input h-12"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-display font-semibold tracking-wider bg-primary hover:bg-primary-bright text-primary-foreground"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                'CREATE ACCOUNT'
              ) : (
                'SIGN IN'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp 
                ? <>Already have an account? <span className="underline text-primary hover:text-primary-bright">Sign in</span></> 
                : <>Don't have an account? <span className="underline text-primary hover:text-primary-bright">Sign up</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
