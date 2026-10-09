import React, { useState, useEffect } from 'react';
import { BizcoreLogo } from './BizcoreLogo';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface AppStartingAnimationProps {
  onComplete: () => void;
  lang?: string;
}

export const AppStartingAnimation: React.FC<AppStartingAnimationProps> = ({
  onComplete,
  lang = 'en',
}) => {
  const isHindi = lang === 'hi';
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState(
    isHindi ? 'स्थानीय व्यापार डेटा लोड हो रहा है...' : 'Initializing BIZCORE Core Engine...'
  );
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusText(
        isHindi ? 'डेटाबेस सुरक्षा व लेजर सत्यापित...' : 'Verifying offline storage & khata ledger...'
      );
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStatusText(
        isHindi ? 'जीएसटी और बिलिंग मॉड्यूल तैयार...' : 'Configuring GST tax & inventory modules...'
      );
    }, 850);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText(isHindi ? 'तैयार! BIZCORE में आपका स्वागत है' : 'Ready! Welcome to BIZCORE');
    }, 1250);

    const timer4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    const timer5 = setTimeout(() => {
      onComplete();
    }, 1850);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete, isHindi]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-350 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.18),rgba(15,23,42,0)_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(245,158,11,0.08),rgba(15,23,42,0)_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full mx-4 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
        {/* Animated Premium Logo Emblem */}
        <div className="relative group">
          <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 to-amber-500 rounded-3xl opacity-30 blur-xl group-hover:opacity-60 transition duration-500 animate-pulse" />
          <div className="relative p-2 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
            <BizcoreLogo variant="icon" size="xl" />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">BIZ</span>
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400">
              CORE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            {isHindi
              ? 'सम्पूर्ण व्यापार प्रबंधन, बिलिंग व अकाउंटिंग सॉफ्टवेयर'
              : 'Complete Business Management, Billing & Accounting Software'}
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-amber-400 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
            <span className="font-mono text-slate-300 truncate max-w-[240px] text-left">
              {statusText}
            </span>
            <span className="font-mono font-bold text-amber-400">{progress}%</span>
          </div>
        </div>

        {/* Security badge and Skip shortcut */}
        <div className="pt-2 flex items-center justify-between w-full text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Offline Safe</span>
          </span>
          <button
            type="button"
            onClick={onComplete}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{isHindi ? 'शुरू करें' : 'Skip'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
