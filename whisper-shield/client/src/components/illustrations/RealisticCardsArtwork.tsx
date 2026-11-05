import React from 'react';

interface CardArtworkProps {
  className?: string;
  size?: number;
}

/**
 * 1. Bob's Cryptographic Identity FaceCard
 * (Directly modeled on Reference 3: PsBank FaceCards with holographic chip,
 * avatar portrait, metallic security traces, and lens reflections)
 */
export const BobSecurityIDCard: React.FC<CardArtworkProps> = ({ className = '', size = 200 }) => (
  <svg
    viewBox="0 0 240 160"
    width={size}
    height={(size * 160) / 240}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      {/* Card Gradient: Rich Teal & Emerald with glassmorphism */}
      <linearGradient id="cardBgBob" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0F766E" />
        <stop offset="0.6" stopColor="#047857" />
        <stop offset="1" stopColor="#064E3B" />
      </linearGradient>
      {/* Holographic Specular Sheen */}
      <linearGradient id="holoShine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <stop offset="30%" stopColor="#A7F3D0" stopOpacity="0.6" />
        <stop offset="60%" stopColor="#67E8F9" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#C084FC" stopOpacity="0.2" />
      </linearGradient>
      {/* Gold Chip Gradient */}
      <linearGradient id="goldChip" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FDE047" />
        <stop offset="0.5" stopColor="#CA8A04" />
        <stop offset="1" stopColor="#854D0E" />
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#064E3B" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Realistic Floating 3D Credit/ID Card Body */}
    <rect
      x="8"
      y="8"
      width="224"
      height="144"
      rx="16"
      fill="url(#cardBgBob)"
      filter="url(#cardShadow)"
      stroke="rgba(255, 255, 255, 0.25)"
      strokeWidth="1.2"
    />

    {/* Holographic Specular Diagonal Light Band */}
    <path
      d="M 8 70 L 90 8 L 130 8 L 48 152 L 8 152 Z"
      fill="url(#holoShine)"
      opacity="0.35"
    />

    {/* Gold Security Microchip (EMV Chip) */}
    <g transform="translate(24, 28)">
      <rect width="34" height="26" rx="5" fill="url(#goldChip)" stroke="#FEF08A" strokeWidth="0.8" />
      {/* Chip traces */}
      <path d="M 0 9 L 14 9 M 0 17 L 14 17 M 34 9 L 20 9 M 34 17 L 20 17 M 17 0 L 17 26" stroke="#713F12" strokeWidth="1" />
      <rect x="13" y="7" width="8" height="12" rx="2" fill="#CA8A04" />
    </g>

    {/* Contactless / NFC Wave Icon */}
    <g transform="translate(68, 33)" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
      <path d="M0 4 A 8 8 0 0 1 0 16" />
      <path d="M4 1 A 14 14 0 0 1 4 19" />
      <path d="M8 -2 A 20 20 0 0 1 8 22" />
    </g>

    {/* Stylized Illustrated Avatar Portrait of Bob (Reference 3 face-card style) */}
    <g transform="translate(164, 24)">
      <circle cx="28" cy="28" r="26" fill="#042F2E" stroke="#34D399" strokeWidth="2" />
      {/* Avatar Head & Torso */}
      <circle cx="28" cy="22" r="11" fill="#A7F3D0" />
      <path d="M 12 50 C 12 37, 44 37, 44 50 Z" fill="#2DD4BF" />
      {/* Verified Shield Badge on Avatar */}
      <circle cx="44" cy="42" r="8" fill="#10B981" />
      <path d="M 41 42 L 43 44 L 47 40" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Card Holder Name & Identity Key Fingerprint */}
    <text x="24" y="98" fill="#F0FDFA" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" letterSpacing="0.5">
      BOB V. RESPONDER
    </text>
    <text x="24" y="114" fill="#99F6E4" fontFamily="JetBrains Mono, monospace" fontWeight="600" fontSize="9" opacity="0.9">
      IK: 25519 · 8F42 9B10 C78A
    </text>

    {/* Bottom Status & PreKey Entropy Pool Tag */}
    <g transform="translate(24, 126)">
      <rect width="88" height="16" rx="8" fill="#042F2E" fillOpacity="0.8" stroke="#2DD4BF" strokeWidth="0.8" />
      <circle cx="8" cy="8" r="3" fill="#10B981" />
      <text x="16" y="11" fill="#CCFBF1" fontFamily="JetBrains Mono, monospace" fontWeight="600" fontSize="7.5">
        120 OPKs POOL
      </text>
    </g>

    {/* Top Right Brand Pill */}
    <text x="178" y="138" fill="#A7F3D0" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="8" opacity="0.8">
      X3DH PROTOCOL
    </text>
  </svg>
);

/**
 * 2. Charlie's Sealed Cryptographic Envelope Vault
 * (Directly modeled on realistic high-security tamper-evident sealed parcel
 * with wax seal, neon security tape, and offline queue status)
 */
export const CharlieSealedEnvelopeCard: React.FC<CardArtworkProps> = ({ className = '', size = 200 }) => (
  <svg
    viewBox="0 0 240 160"
    width={size}
    height={(size * 160) / 240}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="envelopeBg" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#312E81" />
        <stop offset="0.5" stopColor="#1E1B4B" />
        <stop offset="1" stopColor="#0F172A" />
      </linearGradient>
      <linearGradient id="neonTape" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#818CF8" />
        <stop offset="0.5" stopColor="#C084FC" />
        <stop offset="1" stopColor="#818CF8" />
      </linearGradient>
      <radialGradient id="waxSealGrad" cx="35%" cy="35%" r="65%">
        <stop stopColor="#F43F5E" />
        <stop offset="0.7" stopColor="#BE123C" />
        <stop offset="1" stopColor="#881337" />
      </radialGradient>
      <filter id="envelopeShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#1E1B4B" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Envelope Main Body */}
    <rect
      x="12"
      y="12"
      width="216"
      height="136"
      rx="14"
      fill="url(#envelopeBg)"
      filter="url(#envelopeShadow)"
      stroke="rgba(129, 140, 248, 0.3)"
      strokeWidth="1.2"
    />

    {/* Envelope Fold Flaps (Isometric realistic parcel lines) */}
    <path
      d="M 12 12 L 120 85 L 228 12"
      stroke="rgba(199, 210, 254, 0.25)"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M 12 148 L 95 80 M 228 148 L 145 80"
      stroke="rgba(199, 210, 254, 0.15)"
      strokeWidth="1.2"
    />

    {/* Tamper-Evident Neon Security Tape across envelope */}
    <g transform="translate(12, 54)">
      <rect width="216" height="18" fill="url(#neonTape)" fillOpacity="0.25" stroke="#818CF8" strokeWidth="0.8" />
      <text x="16" y="12" fill="#E0E7FF" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="8" letterSpacing="2">
        • ENCRYPTED SEAL • DOUBLE RATCHET • TAMPER PROOF •
      </text>
    </g>

    {/* Realistic Biometric Crimson Wax Seal Stamp */}
    <g transform="translate(100, 65)">
      {/* Seal Outer Scalloped Edge */}
      <circle cx="20" cy="20" r="22" fill="url(#waxSealGrad)" stroke="#FDA4AF" strokeWidth="1" filter="url(#envelopeShadow)" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="#FFE4E6" strokeWidth="1" strokeDasharray="3 2" />
      {/* Keyhole / Shield Icon in Wax */}
      <path
        d="M 20 12 L 25 15 L 25 21 C 25 25 20 28 20 28 C 20 28 15 25 15 21 L 15 15 Z"
        fill="#FFE4E6"
      />
      <circle cx="20" cy="18" r="2" fill="#881337" />
    </g>

    {/* Offline Transit Queue Tag / Barcode */}
    <g transform="translate(24, 96)">
      <text x="0" y="12" fill="#C7D2FE" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="12">
        @CHARLIE (OFFLINE)
      </text>
      <text x="0" y="26" fill="#A5B4FC" fontFamily="JetBrains Mono, monospace" fontSize="8.5">
        QUEUE: RELAY-SQLITE #0491
      </text>
      <text x="0" y="38" fill="#818CF8" fontFamily="JetBrains Mono, monospace" fontSize="8">
        RATCHET TURNS: Tx #0 · Rx #0
      </text>
    </g>

    {/* Offline Badge */}
    <g transform="translate(162, 118)">
      <rect width="54" height="16" rx="8" fill="#312E81" stroke="#6366F1" strokeWidth="0.8" />
      <circle cx="8" cy="8" r="2.5" fill="#A5B4FC" />
      <text x="15" y="11" fill="#E0E7FF" fontFamily="JetBrains Mono, monospace" fontWeight="600" fontSize="7">
        STORED
      </text>
    </g>
  </svg>
);

/**
 * 3. Safety Number Biometric Holographic Scanner Card
 * (Directly modeled on biometric fingerprint scanning terminal with
 * laser sweep line and 60-digit PoW breakdown)
 */
export const SafetyNumberBiometricCard: React.FC<CardArtworkProps> = ({ className = '', size = 200 }) => (
  <svg
    viewBox="0 0 240 160"
    width={size}
    height={(size * 160) / 240}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="amberScanBg" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#78350F" />
        <stop offset="0.6" stopColor="#451A03" />
        <stop offset="1" stopColor="#1C1917" />
      </linearGradient>
      <linearGradient id="laserBeam" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="rgba(245, 158, 11, 0)" />
        <stop offset="50%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
      </linearGradient>
      <filter id="scanShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#78350F" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Scanner Chassis */}
    <rect
      x="12"
      y="12"
      width="216"
      height="136"
      rx="14"
      fill="url(#amberScanBg)"
      filter="url(#scanShadow)"
      stroke="rgba(245, 158, 11, 0.35)"
      strokeWidth="1.2"
    />

    {/* Realistic Biometric Fingerprint Ridges */}
    <g transform="translate(30, 28)" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" fill="none">
      <ellipse cx="28" cy="38" rx="22" ry="32" strokeOpacity="0.8" />
      <ellipse cx="28" cy="38" rx="16" ry="24" strokeOpacity="0.9" />
      <ellipse cx="28" cy="38" rx="10" ry="16" strokeOpacity="1" />
      <path d="M 28 28 L 28 48" strokeOpacity="1" />
      <path d="M 22 24 A 12 18 0 0 1 34 24" strokeOpacity="0.7" />
      <path d="M 18 18 A 18 24 0 0 1 38 18" strokeOpacity="0.5" />
    </g>

    {/* Horizontal Laser Sweep Line across fingerprint */}
    <g transform="translate(16, 62)">
      <line x1="0" y1="0" x2="80" y2="0" stroke="url(#laserBeam)" strokeWidth="3" />
      <circle cx="40" cy="0" r="3" fill="#FEF08A" filter="url(#scanShadow)" />
    </g>

    {/* 12-Block Numeric Digest Matrix HUD */}
    <g transform="translate(100, 28)">
      <text x="0" y="10" fill="#FEF3C7" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="11">
        60-DIGIT SAFETY MATRIX
      </text>
      <text x="0" y="24" fill="#FCD34D" fontFamily="JetBrains Mono, monospace" fontWeight="600" fontSize="8">
        5,200x SHA-512 PROOF-OF-WORK
      </text>

      {/* Mini block preview chips */}
      <g transform="translate(0, 32)">
        <rect width="52" height="14" rx="4" fill="#78350F" stroke="#F59E0B" strokeWidth="0.8" />
        <text x="6" y="10" fill="#FEF3C7" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="bold">
          23847
        </text>

        <rect x="58" width="52" height="14" rx="4" fill="#78350F" stroke="#F59E0B" strokeWidth="0.8" />
        <text x="64" y="10" fill="#FEF3C7" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="bold">
          91028
        </text>

        <rect y="18" width="52" height="14" rx="4" fill="#78350F" stroke="#F59E0B" strokeWidth="0.8" />
        <text x="6" y="28" fill="#FEF3C7" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="bold">
          47192
        </text>

        <rect x="58" y="18" width="52" height="14" rx="4" fill="#78350F" stroke="#F59E0B" strokeWidth="0.8" />
        <text x="64" y="28" fill="#FEF3C7" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="bold">
          03819
        </text>
      </g>
    </g>

    {/* Bottom Verified Status Bar */}
    <g transform="translate(24, 122)">
      <rect width="192" height="18" rx="6" fill="#451A03" stroke="#D97706" strokeWidth="0.8" />
      <circle cx="12" cy="9" r="4" fill="#10B981" />
      <text x="22" y="13" fill="#FEF3C7" fontFamily="JetBrains Mono, monospace" fontWeight="600" fontSize="8">
        AUDIT PASS: 0 COLLISION PROBABILITY
      </text>
    </g>
  </svg>
);

/**
 * 4. Zero-Knowledge Blind Relay High-Density Cluster Card
 * (Directly modeled on realistic cloud server blade chassis with
 * glowing LEDs, SQLite transaction ledger, and blind packet routes)
 */
export const BlindRelayClusterCard: React.FC<CardArtworkProps> = ({ className = '', size = 200 }) => (
  <svg
    viewBox="0 0 240 160"
    width={size}
    height={(size * 160) / 240}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="serverChassis" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0C4A6E" />
        <stop offset="0.6" stopColor="#082F49" />
        <stop offset="1" stopColor="#020617" />
      </linearGradient>
      <filter id="serverShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0C4A6E" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Rack Chassis Body */}
    <rect
      x="12"
      y="12"
      width="216"
      height="136"
      rx="14"
      fill="url(#serverChassis)"
      filter="url(#serverShadow)"
      stroke="rgba(56, 189, 248, 0.35)"
      strokeWidth="1.2"
    />

    {/* Server Blade 1 */}
    <g transform="translate(24, 26)">
      <rect width="192" height="26" rx="6" fill="#075985" stroke="#38BDF8" strokeWidth="0.8" />
      {/* Activity LEDs */}
      <circle cx="12" cy="13" r="3" fill="#10B981" />
      <circle cx="22" cy="13" r="3" fill="#06B6D4" />
      <circle cx="32" cy="13" r="3" fill="#38BDF8" />
      <text x="44" y="16" fill="#E0F2FE" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="9">
        RELAY-NODE-01 · WEBSOCKET: 8080
      </text>
      <rect x="156" y="6" width="28" height="14" rx="4" fill="#0C4A6E" />
      <text x="162" y="16" fill="#38BDF8" fontFamily="JetBrains Mono, monospace" fontSize="8">
        LIVE
      </text>
    </g>

    {/* Server Blade 2 */}
    <g transform="translate(24, 58)">
      <rect width="192" height="26" rx="6" fill="#0369A1" stroke="#38BDF8" strokeWidth="0.8" />
      <circle cx="12" cy="13" r="3" fill="#10B981" />
      <circle cx="22" cy="13" r="3" fill="#F59E0B" />
      <circle cx="32" cy="13" r="3" fill="#10B981" />
      <text x="44" y="16" fill="#E0F2FE" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="9">
        SQLITE WAL · ZERO-KNOWLEDGE
      </text>
      <rect x="156" y="6" width="28" height="14" rx="4" fill="#0C4A6E" />
      <text x="160" y="16" fill="#7DD3FC" fontFamily="JetBrains Mono, monospace" fontSize="8">
        SYNC
      </text>
    </g>

    {/* Server Blade 3 / Invariant Proof */}
    <g transform="translate(24, 90)">
      <rect width="192" height="42" rx="6" fill="#082F49" stroke="#0284C7" strokeWidth="0.8" />
      <text x="12" y="18" fill="#BAE6FD" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="10">
        BLIND PACKET FORWARDING GUARANTEE
      </text>
      <text x="12" y="32" fill="#7DD3FC" fontFamily="JetBrains Mono, monospace" fontSize="8">
        ✓ 0 Private Keys · 0 Master Secrets · 0 Plaintext
      </text>
    </g>
  </svg>
);

/**
 * 5. Cryptographic Labs Silicon Accelerator (ASIC) Card
 * (Directly modeled on realistic microchip with wire-bonds,
 * live bit-flip pulse wave, and AEAD test harness)
 */
export const CryptoLabsAcceleratorCard: React.FC<CardArtworkProps> = ({ className = '', size = 200 }) => (
  <svg
    viewBox="0 0 240 160"
    width={size}
    height={(size * 160) / 240}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="chipBg" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#881337" />
        <stop offset="0.6" stopColor="#4C0519" />
        <stop offset="1" stopColor="#1E1B4B" />
      </linearGradient>
      <filter id="chipShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#881337" floodOpacity="0.4" />
      </filter>
    </defs>

    <rect
      x="12"
      y="12"
      width="216"
      height="136"
      rx="14"
      fill="url(#chipBg)"
      filter="url(#chipShadow)"
      stroke="rgba(251, 113, 133, 0.35)"
      strokeWidth="1.2"
    />

    {/* Silicon Processor Die */}
    <g transform="translate(24, 24)">
      <rect width="64" height="64" rx="8" fill="#9F1239" stroke="#FDA4AF" strokeWidth="1.2" />
      {/* Gold bond wires radiating outwards */}
      <line x1="32" y1="0" x2="32" y2="-12" stroke="#FDE047" strokeWidth="1.2" />
      <line x1="16" y1="0" x2="16" y2="-12" stroke="#FDE047" strokeWidth="1.2" />
      <line x1="48" y1="0" x2="48" y2="-12" stroke="#FDE047" strokeWidth="1.2" />
      <line x1="0" y1="32" x2="-12" y2="32" stroke="#FDE047" strokeWidth="1.2" />
      <line x1="64" y1="32" x2="76" y2="32" stroke="#FDE047" strokeWidth="1.2" />
      {/* Chip Center Label */}
      <text x="12" y="30" fill="#FFF1F2" fontFamily="JetBrains Mono, monospace" fontWeight="800" fontSize="9">
        AES-256
      </text>
      <text x="18" y="44" fill="#FECDD3" fontFamily="JetBrains Mono, monospace" fontSize="8">
        GCM
      </text>
    </g>

    {/* Oscilloscope Waveform / Live Bit-Flip Monitor */}
    <g transform="translate(104, 26)">
      <rect width="112" height="60" rx="6" fill="#4C0519" stroke="#FB7185" strokeWidth="0.8" />
      {/* Grid lines */}
      <path d="M 0 30 L 112 30 M 56 0 L 56 60" stroke="rgba(251, 113, 133, 0.2)" strokeWidth="1" />
      {/* Square pulse wave */}
      <path
        d="M 6 30 L 20 30 L 20 12 L 36 12 L 36 48 L 52 48 L 52 30 L 72 30 L 72 14 L 88 14 L 88 30 L 106 30"
        stroke="#F43F5E"
        strokeWidth="1.8"
        fill="none"
      />
    </g>

    {/* Test Harness Status Bar */}
    <g transform="translate(24, 102)">
      <rect width="192" height="34" rx="6" fill="#4C0519" stroke="#E11D48" strokeWidth="0.8" />
      <text x="10" y="16" fill="#FFE4E6" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="10">
        INTERACTIVE CRYPTO HARNESS
      </text>
      <text x="10" y="28" fill="#FDA4AF" fontFamily="JetBrains Mono, monospace" fontSize="8">
        ✓ 4-DH Stepper · Ratchet History · Bit-Flip Injection
      </text>
    </g>
  </svg>
);

/**
 * 6. Forward Secrecy Titanium Blast Vault Card
 * (Directly modeled on realistic brushed titanium safe with
 * rotating combination dial and key incinerator status)
 */
export const ForwardSecrecyTitaniumVaultCard: React.FC<CardArtworkProps> = ({ className = '', size = 200 }) => (
  <svg
    viewBox="0 0 240 160"
    width={size}
    height={(size * 160) / 240}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="vaultDoorBg" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#713F12" />
        <stop offset="0.6" stopColor="#451A03" />
        <stop offset="1" stopColor="#1E293B" />
      </linearGradient>
      <radialGradient id="dialGrad" cx="35%" cy="35%" r="65%">
        <stop stopColor="#FEF08A" />
        <stop offset="0.5" stopColor="#EAB308" />
        <stop offset="1" stopColor="#854D0E" />
      </radialGradient>
      <filter id="vaultShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#713F12" floodOpacity="0.4" />
      </filter>
    </defs>

    <rect
      x="12"
      y="12"
      width="216"
      height="136"
      rx="14"
      fill="url(#vaultDoorBg)"
      filter="url(#vaultShadow)"
      stroke="rgba(234, 179, 8, 0.35)"
      strokeWidth="1.2"
    />

    {/* Rotating Combination Dial Lock */}
    <g transform="translate(56, 68)">
      <circle cx="0" cy="0" r="34" fill="#3B230E" stroke="#EAB308" strokeWidth="2" />
      {/* Dial ticks */}
      <circle cx="0" cy="0" r="26" fill="url(#dialGrad)" stroke="#713F12" strokeWidth="1" />
      <line x1="0" y1="-26" x2="0" y2="-18" stroke="#713F12" strokeWidth="2" />
      <line x1="26" y1="0" x2="18" y2="0" stroke="#713F12" strokeWidth="2" />
      <line x1="0" y1="26" x2="0" y2="18" stroke="#713F12" strokeWidth="2" />
      <line x1="-26" y1="0" x2="-18" y2="0" stroke="#713F12" strokeWidth="2" />
      {/* Dial handle */}
      <circle cx="0" cy="0" r="10" fill="#713F12" />
      <circle cx="0" cy="0" r="4" fill="#FEF08A" />
    </g>

    {/* Vault Specifications */}
    <g transform="translate(108, 28)">
      <text x="0" y="12" fill="#FEF08A" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="11">
        TIME-LOCKED RATCHET
      </text>
      <text x="0" y="26" fill="#FDE047" fontFamily="JetBrains Mono, monospace" fontSize="8.5">
        CONTINUOUS FORWARD SECRECY
      </text>
      <text x="0" y="40" fill="#FACC15" fontFamily="JetBrains Mono, monospace" fontSize="8">
        BREAK-IN RECOVERY (PCS)
      </text>

      {/* Ephemeral key incinerator badge */}
      <g transform="translate(0, 50)">
        <rect width="104" height="26" rx="6" fill="#451A03" stroke="#CA8A04" strokeWidth="0.8" />
        <circle cx="10" cy="13" r="3" fill="#10B981" />
        <text x="18" y="16" fill="#FEF9C3" fontFamily="JetBrains Mono, monospace" fontSize="7.5" fontWeight="bold">
          SINGLE-USE KEY WIPE
        </text>
      </g>
    </g>

    {/* Bottom Security Guarantee */}
    <g transform="translate(24, 116)">
      <rect width="192" height="20" rx="6" fill="#291807" stroke="#A16207" strokeWidth="0.8" />
      <text x="12" y="13" fill="#FEF9C3" fontFamily="JetBrains Mono, monospace" fontSize="8">
        RFC 5869: Historical compromise cannot decrypt
      </text>
    </g>
  </svg>
);

