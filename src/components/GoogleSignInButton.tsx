import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, Cloud, CheckCircle2, Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  user: User | null;
  isLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenDriveModal?: () => void;
  compact?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  user,
  isLoading,
  onSignIn,
  onSignOut,
  onOpenDriveModal,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-500 font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
        <button
          type="button"
          onClick={onOpenDriveModal}
          className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
          title="Open Google Drive Cloud Hub"
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-5 h-5 rounded-full border border-slate-300"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user.displayName ? user.displayName[0] : 'G'}
            </div>
          )}
          <span className="hidden md:inline font-medium max-w-[120px] truncate text-slate-700">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
            <Cloud className="w-3 h-3 text-blue-600" />
            <span className="hidden sm:inline">Drive Sync</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
          title="Sign out from Google Drive"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Official Google Sign-in Button styling matching GSI guidelines
  return (
    <button
      type="button"
      onClick={onSignIn}
      className={`group relative flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 hover:border-slate-400 rounded-lg transition-all shadow-xs cursor-pointer ${
        compact ? 'px-2.5 py-1.5' : 'px-3.5 py-1.5'
      }`}
    >
      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="w-4 h-4"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
      </div>
      <span>Sign in with Google</span>
    </button>
  );
};
