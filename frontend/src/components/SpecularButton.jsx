import { useState } from 'react';

const SIZES = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-7 py-3.5 text-base',
  lg: 'px-8 py-4 text-lg',
};

const SpecularButton = ({
  children = 'Get Started',
  size = 'lg',
  radius = 12,
  tint = '#ffffff',
  tintOpacity = 0.12,
  textColor = '#ffffff',
  lineColor = '#ffffff',
  baseColor = '#4f46e5',
  intensity = 1,
  idleIntensity = 0.35,
  shineSize = 10,
  shineFade = 34,
  thickness = 1.2,
  glow = 1,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  style,
  ...rest
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative isolate inline-flex items-center justify-center
        overflow-hidden border font-semibold
        transition-all duration-300
        hover:-translate-y-0.5
        active:translate-y-0
        disabled:cursor-not-allowed disabled:opacity-50
        focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-4 focus-visible:outline-white
        ${SIZES[size] || SIZES.lg}
        ${className}
      `}
      style={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        borderRadius: `${radius}px`,
        borderColor: lineColor,
        borderWidth: `${thickness}px`,
        backgroundColor: baseColor,
        color: textColor,
        boxShadow: hovered
          ? `0 0 ${12 * glow}px ${tint}`
          : `0 4px 14px rgba(0,0,0,0.12)`,
        ...style,
      }}
    >
      {/* Shine effect: CSS only, no WebGL canvas */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundColor: tint,
          opacity: hovered ? tintOpacity : tintOpacity * idleIntensity,
          borderRadius: `${radius}px`,
          transition: 'opacity 300ms ease',
        }}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `
            linear-gradient(
              110deg,
              transparent ${Math.max(0, 45 - shineSize / 2)}%,
              ${tint} ${50}%,
              transparent ${Math.min(100, 55 + shineFade / 2)}%
            )
          `,
          backgroundSize: '250% 100%',
          backgroundPosition: hovered ? '100% 0' : '0 0',
          opacity: hovered ? intensity : autoAnimate ? idleIntensity : 0,
          transition: `background-position ${Math.max(300, shineFade * 20)}ms ease, opacity 250ms ease`,
          mixBlendMode: 'screen',
        }}
      />

      <span className="relative z-20">
        {children}
      </span>
    </button>
  );
};

export default SpecularButton;