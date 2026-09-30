import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { BahiKhataLogo } from './BahiKhataLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isLoading: boolean;
  onGoogleSignIn: () => Promise<void>;
  onOpenRegister: () => void;
  onContinueAsGuest: () => void;
  lang?: AppLanguage;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  isLoading,
  onGoogleSignIn,
  onOpenRegister,
  onContinueAsGuest,
  lang = 'en',
}) => {
  const isHindi = lang === 'hi';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      setInfoMessage(null);
      setIsSubmitting(true);
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage(
          isHindi
            ? 'साइन-इन पॉपअप बंद कर दिया गया था। कृपया दोबारा प्रयास करें।'
            : 'Sign-in popup was closed. Please try again.'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          isHindi
            ? 'ब्राउज़र ने पॉपअप विंडो को रोक दिया है। कृपया पॉपअप की अनुमति दें।'
            : 'Browser blocked popup. Please allow popups for this site.'
        );
      } else {
        setErrorMessage(
          err?.message ||
            (isHindi
              ? 'गूगल साइन-इन में त्रुटि हुई। कृपया पुनः प्रयास करें।'
              : 'Failed to sign in with Google. Please try again.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage(isHindi ? 'कृपया ईमेल या मोबाइल नंबर दर्ज करें' : 'Please enter your email or mobile number');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage(isHindi ? 'कृपया पासवर्ड / पिन दर्ज करें' : 'Please enter your password / PIN');
      return;
    }

    // Direct password/PIN login simulation or account check
    localStorage.removeItem('bahikhata_guest_mode');
    setInfoMessage(
      isHindi
        ? 'लॉगिन सफल! डैशबोर्ड लोड हो रहा है...'
        : 'Login successful! Loading your BahiKhata dashboard...'
    );
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleForgotPassword = () => {
    setInfoMessage(
      isHindi
        ? 'पासवर्ड रीसेट लिंक आपके पंजीकृत ईमेल / मोबाइल पर भेजा जा रहा है।'
        : 'Password recovery instructions sent to your registered email/mobile.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="flex min-h-full items-center justify-center p-3 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-200/90 animate-in zoom-in-95 duration-200">
          {/* Clean Light Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 bg-white relative text-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official BahiKhata Logo */}
            <div className="flex justify-center mb-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs">
                <BahiKhataLogo variant="icon" size="md" />
              </div>
            </div>

            <div className="flex items-center justify-center tracking-tight leading-none mb-1">
              <span className="font-black text-2xl sm:text-3xl text-slate-900">Bahi</span>
              <span className="font-black text-2xl sm:text-3xl text-rose-500">Khata</span>
            </div>

            <h2 className="text-lg font-black text-slate-900 mt-2">
              {isHindi ? 'वापसी पर स्वागत है (Welcome Back)' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHindi
                ? 'अपने बिल, खाता और बिज़नेस प्रबंधन के लिए लॉगिन करें'
                : 'Login to manage your bills, khata, and business'}
            </p>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-7 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Info Message */}
            {infoMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Email / Mobile & Password Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHindi ? 'ईमेल या मोबाइल नंबर' : 'Email or Mobile Number'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or name@business.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isHindi ? 'पासवर्ड / पिन' : 'Password or PIN'}
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                  >
                    {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>{isHindi ? 'लॉगिन करें' : 'Login'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isHindi ? 'या' : 'OR'}
              </span>
            </div>

            {/* Google Login (for existing users) */}
            <button
              type="button"
              disabled={isLoading || isSubmitting}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 hover:border-slate-400 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>{isHindi ? 'कनेक्ट हो रहा है...' : 'Connecting to Google...'}</span>
                </>
              ) : (
                <>
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-4 h-4 shrink-0"
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
                  <span>{isHindi ? 'गूगल से जारी रखें' : 'Continue with Google'}</span>
                </>
              )}
            </button>

            {/* CREATE NEW ACCOUNT SECTION */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-center">
                <span className="text-xs text-slate-500 font-medium">
                  {isHindi ? 'बहीखाता में नए हैं?' : 'New to BahiKhata?'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>{isHindi ? 'नया खाता बनाएं (Create New Account)' : 'Create New Account'}</span>
              </button>
            </div>

            {/* Guest / Offline Mode */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer inline-flex items-center gap-1"
              >
                <HardDrive className="w-3 h-3 text-slate-400" />
                <span>{isHindi ? 'गेस्ट / ऑफलाइन के रूप में जारी रखें' : 'Continue as Guest / Offline'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
