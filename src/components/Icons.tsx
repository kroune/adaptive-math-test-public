interface IconProps {
  className?: string;
}

export function WaveIcon({ className = 'w-10 h-10' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 8c-1.1 0-2 .9-2 2v14l-2-2c-.8-.8-2-.8-2.8 0s-.8 2 0 2.8l6 6c.4.4.9.6 1.4.6h8.4c1.1 0 2-.9 2-2V18c0-1.1-.9-2-2-2s-2 .9-2 2v6l-1-1V12c0-1.1-.9-2-2-2s-2 .9-2 2v10l-2-2V10c0-1.1-.9-2-2-2z" fill="currentColor" opacity="0.8"/>
      <path d="M10 18c0-1.1.9-2 2-2s2 .9 2 2v8c0 1.1-.9 2-2 2s-2-.9-2-2v-8z" fill="currentColor" opacity="0.5"/>
      <path d="M18 14c0-1.1.9-2 2-2s2 .9 2 2v12c0 1.1-.9 2-2 2s-2-.9-2-2V14z" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

export function TargetIcon({ className = 'w-10 h-10' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="3" opacity="0.5"/>
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="3" opacity="0.7"/>
      <circle cx="24" cy="24" r="3" fill="currentColor"/>
    </svg>
  );
}

export function RocketIcon({ className = 'w-10 h-10' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4c-4 8-6 16-6 24h12c0-8-2-16-6-24z" fill="currentColor" opacity="0.8"/>
      <path d="M18 28l-4 8h4v-8zm12 0l4 8h-4v-8z" fill="currentColor" opacity="0.5"/>
      <circle cx="24" cy="20" r="3" fill="currentColor" opacity="0.3"/>
      <path d="M20 36h8v4h-8z" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

export function ThoughtBubbleIcon({ className = 'w-10 h-10' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20c0-8.8 7.2-14 16-14s16 5.2 16 14-7.2 14-16 14c-2 0-3.8-.3-5.5-.8L12 38v-7.2C9.5 28.2 8 24.4 8 20z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.15"/>
      <circle cx="17" cy="20" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="24" cy="20" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="31" cy="20" r="2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

export function CheckCircleIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
      <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function AlertIcon({ className = 'w-10 h-10' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L4 40h40L24 4z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="currentColor" opacity="0.15"/>
      <path d="M24 18v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="24" cy="34" r="2" fill="currentColor"/>
    </svg>
  );
}

export function CelebrationIcon({ className = 'w-10 h-10' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 6l2.5 7.5H34l-6 4.5 2.5 7.5-6-4.5-6 4.5 2.5-7.5-6-4.5h7.5z" fill="currentColor" opacity="0.8"/>
      <circle cx="10" cy="12" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="38" cy="14" r="2.5" fill="currentColor" opacity="0.4"/>
      <circle cx="14" cy="36" r="1.5" fill="currentColor" opacity="0.3"/>
      <circle cx="36" cy="34" r="2" fill="currentColor" opacity="0.3"/>
      <path d="M8 24l3-2m26 6l3 2M20 38l-1 4m10-4l1 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

export function SunIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

export function MoonIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  );
}

export function MonitorIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  );
}

export function ExitIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" />
    </svg>
  );
}

export function SpinnerIcon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2"/>
      <path d="M12 2a10 10 0 019.8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
