export default function Button({ children, variant = 'primary', className = '', loading = false, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg px-4 py-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed text-sm'
  const variants = {
    primary:   'bg-primary text-white hover:bg-primary-dark active:scale-95',
    secondary: 'bg-white text-primary border border-primary hover:bg-purple-50 active:scale-95',
    accent:    'bg-accent text-white hover:bg-orange-600 active:scale-95',
    danger:    'bg-red-500 text-white hover:bg-red-600 active:scale-95',
    ghost:     'text-gray-600 hover:bg-gray-100 active:scale-95',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </button>
  )
}