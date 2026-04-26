export default function Button({ children, variant = 'primary', className = '', loading = false, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm px-4 py-2.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-sm',
    secondary: 'bg-white text-primary border border-primary hover:bg-primary/5 focus:ring-primary',
    accent: 'bg-accent text-white hover:bg-orange-600 focus:ring-accent shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    'ghost-white': 'bg-transparent text-white border border-white/40 hover:bg-white/10 focus:ring-white',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}