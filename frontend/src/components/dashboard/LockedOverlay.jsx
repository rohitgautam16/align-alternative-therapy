import React from 'react';

export default function LockedOverlay() {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
      <span className="text-white uppercase">Locked</span>
    </div>
  );
}
