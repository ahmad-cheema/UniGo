interface FormWrapperProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export function FormWrapper({ children, onSubmit, className = "" }: FormWrapperProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`w-full max-w-[400px] flex flex-col gap-5 ${className}`}
      noValidate
    >
      {children}
    </form>
  );
}
