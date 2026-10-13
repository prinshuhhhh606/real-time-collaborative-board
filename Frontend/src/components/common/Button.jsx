export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantClass = variant === 'ghost' ? 'ghost-btn' : variant === 'danger' ? 'danger-btn' : 'primary-btn';
  return (
    <button className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
