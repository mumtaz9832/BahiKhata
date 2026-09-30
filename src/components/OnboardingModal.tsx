import React from 'react';
import { BusinessProfile, AppMode, AppLanguage } from '../types';
import { BusinessRegistrationWizard } from './BusinessRegistrationWizard';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  mode: AppMode;
  onSaveProfile: (profile: BusinessProfile, mode: AppMode) => void;
  lang?: AppLanguage;
  initialUser?: {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  authMethod?: 'google' | 'email_mobile';
  canCancel?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  profile,
  mode,
  onSaveProfile,
  lang = 'en',
  initialUser,
  authMethod = 'google',
  canCancel = false,
}) => {
  return (
    <BusinessRegistrationWizard
      isOpen={isOpen}
      onClose={onClose}
      initialProfile={profile}
      initialMode={mode}
      initialUser={initialUser}
      authMethod={authMethod}
      onComplete={(updatedProf, recommendedMode) => {
        onSaveProfile(updatedProf, recommendedMode);
        onClose();
      }}
      lang={lang}
      canCancel={canCancel}
    />
  );
};
