export default function Input({ label, ...props }) {
  return (
    <label className="stack-form-label">
      {label}
      <input {...props} />
    </label>
  );
}
