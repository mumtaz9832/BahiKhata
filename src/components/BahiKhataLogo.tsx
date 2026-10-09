import React from 'react';
import { BizcoreLogo, BizcoreLogoProps } from './BizcoreLogo';

export type BahiKhataLogoProps = BizcoreLogoProps;

export const BahiKhataLogo: React.FC<BahiKhataLogoProps> = (props) => {
  return <BizcoreLogo {...props} />;
};

export { BizcoreLogo };
