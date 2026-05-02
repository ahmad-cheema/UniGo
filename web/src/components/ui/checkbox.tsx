import { type InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export function Checkbox({ label, id, className = "", ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={`flex items-start gap-2.5 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        id={id}
        className="mt-0.5 h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer"
        {...props}
      />
      <span className="text-sm text-text-secondary leading-snug">{label}</span>
    </label>
  );
}
