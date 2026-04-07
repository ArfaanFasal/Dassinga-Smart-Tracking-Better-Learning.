import { Link } from 'react-router-dom';

const LOGO_SRC = '/branding/dassinga-logo.svg';

export function BrandLogo({ layout = 'horizontal', className = '', to = null }) {
  const inner = (
    <div
      className={`flex gap-3 ${layout === 'stacked' ? 'flex-col' : 'items-center'} ${className}`}
    >
      <img src={LOGO_SRC} alt="" className="h-10 w-auto shrink-0 md:h-12" width={48} height={56} />
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-tight text-[#1A365D] dark:text-[#90cdf4]">
          Dassinga
        </p>
        <p className="text-xs font-medium text-[#2F855A] dark:text-[#68d391]">
          Smart Tracking. Better Learning.
        </p>
      </div>
    </div>
  );
  if (to) {
    return (
      <Link to={to} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-dassinga-blue/40">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function BrandLogoMark({ className = '' }) {
  return (
    <img
      src="/branding/dassinga-icon.svg"
      alt="Dassinga"
      className={`h-9 w-9 ${className}`}
      width={36}
      height={36}
    />
  );
}
