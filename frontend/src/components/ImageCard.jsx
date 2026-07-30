/**
 * ImageCard - card with photo background, icon, title, description.
 * Uses real <img> so CSS dark mode overrides cannot block the photo.
 * The fallback color is set via CSS class, not inline style, so
 * html.dark .img-card can override it to transparent.
 */
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ImageCard({
  image, icon: Icon, title, description,
  onClick, linkTo, color = '#0f766e',
  badge, className = '',
}) {
  return (
    <_Inner
      image={image} icon={Icon} title={title} description={description}
      onClick={onClick} linkTo={linkTo} color={color}
      badge={badge} className={className}
    />
  );
}

function _Inner({ image, icon: Icon, title, description, onClick, linkTo, color, badge, className }) {
  const inner = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`img-card relative rounded-2xl overflow-hidden shadow-md cursor-pointer h-full min-h-[140px] ${className}`}
      /* NO backgroundColor in style  --  CSS handles fallback via data-color */
      style={{ '--img-card-color': color }}
      onClick={onClick}
    >
      {/* Fallback bg color  --  overridden to transparent in dark by CSS */}
      <div
        className="img-card-bg absolute inset-0"
        style={{ backgroundColor: color, zIndex: 0 }}
      />

      {/* Real <img>  --  sits above fallback bg, immune to CSS overrides */}
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 1 }}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Dark gradient overlay  --  above photo, below content */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(0,0,0,0.48), rgba(0,0,0,0.28), rgba(0,0,0,0.08))',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Teal border ring */}
      <div
        className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
        style={{ borderColor: 'rgba(45,212,191,0.55)', zIndex: 3 }}
      />

      {/* Content */}
      <div className="relative p-5 h-full flex flex-col justify-between" style={{ zIndex: 4 }}>
        <div>
          {Icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border"
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(4px)',
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Icon size={20} className="text-white" strokeWidth={2} />
            </div>
          )}
          {badge && (
            <span
              className="inline-block mb-2 px-2.5 py-0.5 text-white text-xs font-bold rounded-full border"
              style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.30)' }}
            >
              {badge}
            </span>
          )}
          <h3
            className="img-heading font-bold text-lg leading-tight mb-1 text-white"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
          >
            {title}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.5)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            {description}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold mt-3 self-start text-white/90">
          Open <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );

  if (linkTo) return <Link to={linkTo} className="block h-full">{inner}</Link>;
  return inner;
}
