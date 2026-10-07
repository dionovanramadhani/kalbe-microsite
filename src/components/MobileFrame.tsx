import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="app-viewport">
      <div className="mobile-frame">
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
};
