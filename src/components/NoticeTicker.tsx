import React, { useState } from 'react';
import { Volume2, Pause, Play } from 'lucide-react';

export const NoticeTicker: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  const notices = [
    "★ APPROVAL PROCESS 2025-26: Automated Preliminary Scrutiny & Document Verification Portal active for Chapter I & II applications.",
    "★ Circular Ref AICTE/AB/APH/2025-26/04: Mandatory submission of Fire Safety NOC and Land Revenue Encumbrance Certificate prior to committee review.",
    "★ National Education Policy (NEP 2020): Multidisciplinary program additions and AI & Data Science intake expansion guidelines released.",
    "★ Vigilance Notice: All reviewer overrides and stage transitions are cryptographically sealed in an append-only SHA-256 audit ledger."
  ];

  return (
    <div className="notice-ticker-bar">
      <div className="ticker-badge">
        <Volume2 size={13} />
        <span>OFFICIAL CIRCULARS</span>
      </div>

      <div className="ticker-marquee-wrapper" style={{ cursor: 'pointer' }} onClick={() => setIsPaused(!isPaused)}>
        <div
          className="ticker-marquee-text"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {notices.join('   |   ')}
        </div>
      </div>

      <button
        onClick={() => setIsPaused(!isPaused)}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center'
        }}
        title={isPaused ? 'Resume Ticker' : 'Pause Ticker'}
      >
        {isPaused ? <Play size={12} color="#ffffff" /> : <Pause size={12} />}
      </button>
    </div>
  );
};
