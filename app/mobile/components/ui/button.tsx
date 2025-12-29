import { cva, type VariantProps } from 'class-variance-authority';
import { Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-xl',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
      },
      size: {
        default: 'h-14 px-6',
        sm: 'h-10 px-3',
        lg: 'h-14 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  'text-base font-bold',
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-destructive-foreground',
        outline: 'text-foreground',
        secondary: 'text-secondary-foreground',
        ghost: 'text-foreground',
        link: 'text-primary underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ButtonProps
  extends TouchableOpacityProps,
    VariantProps<typeof buttonVariants> {
    label?: string;
    labelClasses?: string;
}

export function Button({
  className,
  variant,
  size,
  label,
  labelClasses,
  children,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(buttonVariants({ variant, size, className }))}
      activeOpacity={0.8}
      {...props}
    >
      {label ? (
          <Text className={cn(buttonTextVariants({ variant }), labelClasses)}>
            {label}
          </Text>
      ) : (
          // If children are passed, we assume they handle their own text styling or use <Text> inside
          // But to be helpful, if the child is a string, we wrap it?
          // React Native children are usually components.
          // Let's just render children.
          children
      )}
    </TouchableOpacity>
  );
}
