import React from 'react';

// Common visual props
interface ArtworkProps {
  className?: string;
  size?: number;
}

/**
 * 1. X3DH Illustration:
 * Emerald & Mint 3D isometric cylinders with fine concentric flute rings,
 * floating ephemeral key orb, and an authenticated prekey portal.
 * (Directly inspired by Mallik Dashboard Card 1 in user reference)
 */
export const X3DHIllustration: React.FC<ArtworkProps> = ({ className = '', size = 160 }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="emeraldGrad1" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" />
        <stop offset="0.5" stopColor="#059669" />
        <stop offset="1" stopColor="#064E3B" />
      </linearGradient>
      <linearGradient id="mintLight" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#A7F3D0" />
        <stop offset="1" stopColor="#34D399" />
      </linearGradient>
      <linearGradient id="tealBody" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <radialGradient id="sphereGrad" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#D1FAE5" />
        <stop offset="45%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#065F46" />
      </radialGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#064E3B" floodOpacity="0.18" />
      </filter>
    </defs>

    {/* Soft ground ambient shadow */}
    <ellipse cx="115" cy="170" rx="65" ry="16" fill="#047857" fillOpacity="0.12" filter="url(#softShadow)" />

    {/* Main Vertical Fluted Cylinder (Bob's Prekey Pool) */}
    <g transform="translate(100, 50)">
      {/* Cylinder body */}
      <path
        d="M -30,35 L 30,35 L 30,110 A 30 14 0 0 1 -30 110 Z"
        fill="url(#tealBody)"
      />
      {/* Cylinder texture lines (concentric flutes matching reference) */}
      <path d="M -18,36 L -18,111" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M -6,37 L -6,112" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 6,37 L 6,112" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 18,36 L 18,111" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Top cap */}
      <ellipse cx="0" cy="35" rx="30" ry="14" fill="url(#mintLight)" />
      <ellipse cx="0" cy="35" rx="20" ry="9" fill="none" stroke="#059669" strokeWidth="1.2" strokeOpacity="0.5" />
      <ellipse cx="0" cy="35" rx="10" ry="4.5" fill="#065F46" fillOpacity="0.3" />
    </g>

    {/* Secondary Horizontal Cylinder (Alice Ephemeral Key) */}
    <g transform="translate(45, 115)">
      <path
        d="M 10,0 L 55,0 A 15 25 0 0 1 55 50 L 10,50 A 15 25 0 0 1 10 0 Z"
        fill="#059669"
        fillOpacity="0.85"
      />
      <ellipse cx="10" cy="25" rx="15" ry="25" fill="url(#mintLight)" />
      {/* Hatching stripes */}
      <path d="M 22,1 L 22,49" stroke="#A7F3D0" strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M 34,2 L 34,48" stroke="#A7F3D0" strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M 46,3 L 46,47" stroke="#A7F3D0" strokeWidth="1.5" strokeOpacity="0.4" />
    </g>

    {/* 3D Ephemeral Entropy Orb (DH4 fresh entropy) */}
    <circle cx="68" cy="148" r="24" fill="url(#sphereGrad)" filter="url(#softShadow)" />
    <ellipse cx="60" cy="140" rx="9" ry="5" fill="#FFFFFF" fillOpacity="0.45" />

    {/* Mini Key Token Orb */}
    <circle cx="145" cy="138" r="14" fill="url(#mintLight)" filter="url(#softShadow)" />
    <circle cx="145" cy="138" r="7" fill="none" stroke="#065F46" strokeWidth="1.5" />
  </svg>
);

/**
 * 2. Double Ratchet Illustration:
 * Indigo & Violet interlocking 3D ratchet curves, continuous helical chain rings,
 * and root ratchet gear arcs.
 * (Directly inspired by Mallik Dashboard Card 4 & 5 in user reference)
 */
export const DoubleRatchetIllustration: React.FC<ArtworkProps> = ({ className = '', size = 160 }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="indigoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#818CF8" />
        <stop offset="0.6" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#312E81" />
      </linearGradient>
      <linearGradient id="violetLight" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#C7D2FE" />
        <stop offset="1" stopColor="#818CF8" />
      </linearGradient>
      <radialGradient id="indigoSphere" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#E0E7FF" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#312E81" />
      </radialGradient>
      <filter id="indigoShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#312E81" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Ambient base shadow */}
    <ellipse cx="100" cy="172" rx="70" ry="15" fill="#312E81" fillOpacity="0.1" filter="url(#indigoShadow)" />

    {/* Large 3D Arch / Ratchet Turn Portal */}
    <g transform="translate(45, 60)">
      <path
        d="M 10,105 L 10,50 A 45 45 0 0 1 100 50 L 100,105 L 75,105 L 75,50 A 20 20 0 0 0 35 50 L 35,105 Z"
        fill="url(#indigoGrad)"
      />
      {/* Archway perspective top bevel */}
      <path
        d="M 10,50 A 45 45 0 0 1 100 50 L 115,35 A 45 45 0 0 0 25 35 Z"
        fill="url(#violetLight)"
      />
      {/* Fine concentric grooves on the arch (mechanical ratchet teeth) */}
      <path d="M 20,40 A 35 35 0 0 1 90 40" stroke="#C7D2FE" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="4 3" />
      <path d="M 26,45 A 28 28 0 0 1 84 45" stroke="#C7D2FE" strokeWidth="1.2" strokeOpacity="0.4" />
    </g>

    {/* Ratchet Gear 3D Disc (Root Ratchet advancement) */}
    <g transform="translate(110, 115)">
      <ellipse cx="25" cy="20" rx="35" ry="18" fill="url(#indigoGrad)" />
      <ellipse cx="25" cy="16" rx="35" ry="18" fill="url(#violetLight)" />
      <ellipse cx="25" cy="16" rx="20" ry="10" fill="#3730A3" />
      <ellipse cx="25" cy="16" rx="10" ry="5" fill="#E0E7FF" />
    </g>

    {/* Symmetric Chain Key Spheres (Continuous Forward Secrecy) */}
    <circle cx="55" cy="145" r="22" fill="url(#indigoSphere)" filter="url(#indigoShadow)" />
    <ellipse cx="48" cy="138" rx="8" ry="5" fill="#FFFFFF" fillOpacity="0.45" />

    {/* Second smaller message key orb */}
    <circle cx="152" cy="95" r="14" fill="url(#indigoSphere)" filter="url(#indigoShadow)" />
    <ellipse cx="147" cy="90" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.5" />
  </svg>
);

/**
 * 3. Safety Number Illustration:
 * Warm Terracotta / Amber 3D biometric vault, 5200-round concentric SHA-512 hardness rings,
 * and golden verification seal.
 * (Directly inspired by Mallik Dashboard Card 2 & 6 in user reference)
 */
export const SafetyNumberIllustration: React.FC<ArtworkProps> = ({ className = '', size = 160 }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="amberGrad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FBBF24" />
        <stop offset="0.6" stopColor="#D97706" />
        <stop offset="1" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="terracottaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#FCD34D" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
      <radialGradient id="amberSphere" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#78350F" />
      </radialGradient>
      <filter id="amberShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#78350F" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Soft ground shadow */}
    <ellipse cx="105" cy="170" rx="65" ry="15" fill="#78350F" fillOpacity="0.12" filter="url(#amberShadow)" />

    {/* 3D Isometric Segmented Half-Cylinder / Vault Arch */}
    <g transform="translate(60, 50)">
      <path
        d="M 10,40 L 60,10 L 100,50 L 50,80 Z"
        fill="url(#terracottaGrad)"
      />
      <path
        d="M 10,40 L 50,80 L 50,115 L 10,75 Z"
        fill="#B45309"
      />
      <path
        d="M 50,80 L 100,50 L 100,85 L 50,115 Z"
        fill="url(#amberGrad)"
      />
      {/* Grooved hash lines (representing 5200 rounds of SHA-512) */}
      <path d="M 20,46 L 70,16" stroke="#FEF3C7" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 30,52 L 80,22" stroke="#FEF3C7" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 40,58 L 90,28" stroke="#FEF3C7" strokeWidth="1.5" strokeOpacity="0.5" />
    </g>

    {/* Concentric Biometric Rings / Verification Matrix */}
    <g transform="translate(115, 120)">
      <ellipse cx="25" cy="25" rx="36" ry="18" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 3" />
      <ellipse cx="25" cy="25" rx="26" ry="13" fill="none" stroke="#FBBF24" strokeWidth="1.8" />
      <ellipse cx="25" cy="25" rx="16" ry="8" fill="none" stroke="#D97706" strokeWidth="1.5" />
      <ellipse cx="25" cy="25" rx="6" ry="3" fill="#78350F" />
    </g>

    {/* Golden Cryptographic Seal Orb */}
    <circle cx="55" cy="145" r="22" fill="url(#amberSphere)" filter="url(#amberShadow)" />
    <ellipse cx="48" cy="138" rx="8" ry="5" fill="#FFFFFF" fillOpacity="0.5" />
  </svg>
);

/**
 * 4. Zero-Knowledge Blind Relay Illustration:
 * Sapphire & Cobalt Blue 3D crystalline envelope, blind routing nodes,
 * and isolated SQLite vault.
 * (Directly inspired by Mallik Dashboard Card 5 in user reference)
 */
export const BlindRelayIllustration: React.FC<ArtworkProps> = ({ className = '', size = 160 }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="cobaltGrad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#38BDF8" />
        <stop offset="0.5" stopColor="#0284C7" />
        <stop offset="1" stopColor="#0C4A6E" />
      </linearGradient>
      <linearGradient id="skyLight" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#BAE6FD" />
        <stop offset="1" stopColor="#38BDF8" />
      </linearGradient>
      <radialGradient id="cobaltSphere" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#082F49" />
      </radialGradient>
      <filter id="cobaltShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0C4A6E" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Ambient floor shadow */}
    <ellipse cx="105" cy="170" rx="65" ry="15" fill="#0C4A6E" fillOpacity="0.12" filter="url(#cobaltShadow)" />

    {/* 3D Geometric Sealed Crystalline Envelope Cube */}
    <g transform="translate(60, 48)">
      {/* Top Diamond Facet */}
      <path d="M 40,10 L 80,35 L 40,60 L 0,35 Z" fill="url(#skyLight)" />
      {/* Left Wall */}
      <path d="M 0,35 L 40,60 L 40,115 L 0,90 Z" fill="#0369A1" />
      {/* Right Wall */}
      <path d="M 40,60 L 80,35 L 80,90 L 40,115 Z" fill="url(#cobaltGrad)" />
      {/* Sealed Flap Wireframe Accent */}
      <path d="M 40,60 L 40,115" stroke="#BAE6FD" strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M 0,35 L 40,75 L 80,35" stroke="#BAE6FD" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
      {/* Flute texture on right wall */}
      <path d="M 50,68 L 50,110" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M 60,60 L 60,102" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M 70,50 L 70,95" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.4" />
    </g>

    {/* Routing Node Sphere 1 */}
    <circle cx="50" cy="145" r="22" fill="url(#cobaltSphere)" filter="url(#cobaltShadow)" />
    <ellipse cx="44" cy="138" rx="8" ry="4" fill="#FFFFFF" fillOpacity="0.5" />

    {/* Routing Node Sphere 2 */}
    <circle cx="150" cy="130" r="15" fill="url(#skyLight)" filter="url(#cobaltShadow)" />
    <circle cx="150" cy="130" r="7" fill="none" stroke="#0369A1" strokeWidth="1.5" />
  </svg>
);

/**
 * 5. Cryptographic Labs Illustration:
 * Coral & Rose 3D hardware security accelerator, silicon vector bus,
 * and interactive bit-flip injector.
 * (Directly inspired by Mallik Dashboard Card 3 in user reference)
 */
export const CryptoLabsIllustration: React.FC<ArtworkProps> = ({ className = '', size = 160 }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="coralGrad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FB7185" />
        <stop offset="0.6" stopColor="#E11D48" />
        <stop offset="1" stopColor="#881337" />
      </linearGradient>
      <linearGradient id="roseLight" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#FECDD3" />
        <stop offset="1" stopColor="#FB7185" />
      </linearGradient>
      <radialGradient id="roseSphere" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF1F2" />
        <stop offset="50%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#881337" />
      </radialGradient>
      <filter id="roseShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#881337" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Floor shadow */}
    <ellipse cx="105" cy="170" rx="65" ry="15" fill="#881337" fillOpacity="0.12" filter="url(#roseShadow)" />

    {/* 3D Segmented Silicon Slab with Fluted Fins */}
    <g transform="translate(50, 60)">
      {/* Top face */}
      <path d="M 20,20 L 80,0 L 110,35 L 50,55 Z" fill="url(#roseLight)" />
      {/* Front Face */}
      <path d="M 20,20 L 50,55 L 50,95 L 20,60 Z" fill="#BE123C" />
      {/* Right Face */}
      <path d="M 50,55 L 110,35 L 110,75 L 50,95 Z" fill="url(#coralGrad)" />
      {/* Micro-bus fins */}
      <path d="M 60,52 L 60,90" stroke="#FECDD3" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 72,48 L 72,86" stroke="#FECDD3" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 84,44 L 84,82" stroke="#FECDD3" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 96,40 L 96,78" stroke="#FECDD3" strokeWidth="1.5" strokeOpacity="0.5" />
    </g>

    {/* Floating Test Payload Orb */}
    <circle cx="55" cy="145" r="22" fill="url(#roseSphere)" filter="url(#roseShadow)" />
    <ellipse cx="48" cy="138" rx="8" ry="4" fill="#FFFFFF" fillOpacity="0.5" />

    {/* Bit-Flip Indicator Disc */}
    <g transform="translate(130, 115)">
      <ellipse cx="20" cy="15" rx="25" ry="12" fill="url(#roseLight)" />
      <ellipse cx="20" cy="15" rx="14" ry="7" fill="none" stroke="#881337" strokeWidth="1.5" strokeDasharray="3 2" />
    </g>
  </svg>
);

/**
 * 6. Forward Secrecy Illustration:
 * Warm Gold & Ochre 3D time-capsule sphere with ratcheted domain boundaries,
 * sealed session boundaries, and post-compromise self-healing arcs.
 * (Directly inspired by Mallik Dashboard Card 6 in user reference)
 */
export const ForwardSecrecyIllustration: React.FC<ArtworkProps> = ({ className = '', size = 160 }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 ${className}`}
  >
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FDE047" />
        <stop offset="0.6" stopColor="#EAB308" />
        <stop offset="1" stopColor="#713F12" />
      </linearGradient>
      <linearGradient id="goldLight" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#FACC15" />
      </linearGradient>
      <radialGradient id="goldSphere" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#713F12" />
      </radialGradient>
      <filter id="goldShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#713F12" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Ground ambient shadow */}
    <ellipse cx="105" cy="170" rx="65" ry="15" fill="#713F12" fillOpacity="0.12" filter="url(#goldShadow)" />

    {/* 3D Segmented Cylinder Tower with Helical Slices */}
    <g transform="translate(60, 45)">
      {/* Lower Cylinder Tier */}
      <path d="M 15,60 L 65,60 L 65,110 A 25 12 0 0 1 15 110 Z" fill="#CA8A04" />
      <ellipse cx="40" cy="60" rx="25" ry="12" fill="url(#goldLight)" />
      {/* Upper Cylinder Tier (Shifted for ratcheted step effect) */}
      <path d="M 35,20 L 85,20 L 85,60 A 25 12 0 0 1 35 60 Z" fill="url(#goldGrad)" />
      <ellipse cx="60" cy="20" rx="25" ry="12" fill="url(#goldLight)" />
      {/* Textured grooves */}
      <path d="M 45,21 L 45,59" stroke="#FEF08A" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M 55,22 L 55,60" stroke="#FEF08A" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M 65,22 L 65,60" stroke="#FEF08A" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M 75,21 L 75,59" stroke="#FEF08A" strokeWidth="1.2" strokeOpacity="0.6" />
    </g>

    {/* Golden Time-Lock Sphere */}
    <circle cx="55" cy="145" r="22" fill="url(#goldSphere)" filter="url(#goldShadow)" />
    <ellipse cx="48" cy="138" rx="8" ry="4" fill="#FFFFFF" fillOpacity="0.5" />

    {/* Floating Ratchet Token */}
    <g transform="translate(130, 115)">
      <circle cx="15" cy="15" r="14" fill="url(#goldLight)" filter="url(#goldShadow)" />
      <circle cx="15" cy="15" r="7" fill="none" stroke="#713F12" strokeWidth="1.5" />
    </g>
  </svg>
);

