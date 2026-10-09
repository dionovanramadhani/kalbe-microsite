import React from 'react';
import { AssetPreloader } from './AssetPreloader';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="app-viewport">
      <div className="mobile-frame">
        <div className="main-content">
          <AssetPreloader>
            {children}
          </AssetPreloader>
        </div>
      </div>
    </div>
  );
};
