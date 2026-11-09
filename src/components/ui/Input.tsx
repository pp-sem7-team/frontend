import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      rightElement,
      type = 'text',
      id,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isPassword = type === 'password';

    const inputType =
      isPassword && passwordVisible ? 'text' : type;

    const inputId = id ?? props.name;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-normal text-text-secondary"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={[
              'h-[42px] w-full rounded-lg',
              'border bg-background px-3',
              'text-[13px] text-text-primary',
              'placeholder:text-text-muted',
              'outline-none transition-colors',
              'focus:border-accent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-danger' : 'border-border-strong',
              isPassword || rightElement ? 'pr-10' : '',
              className,
            ].join(' ')}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              disabled={disabled}
              aria-label={
                passwordVisible ? 'Скрыть пароль' : 'Показать пароль'
              }
              aria-pressed={passwordVisible}
              className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary"
            >
              {passwordVisible ? (
                <Eye size={16} />
              ) : (
                <EyeOff size={16} />
              )}
            </button>
          ) : (
            rightElement && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                {rightElement}
              </div>
            )
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';