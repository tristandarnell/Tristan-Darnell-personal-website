import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-primary-foreground shadow-ring hover:translate-y-[-1px] hover:brightness-105 dark:from-blue-500 dark:via-sky-400 dark:to-blue-400",
        ghost:
          "border border-blue-200 bg-white/90 text-foreground hover:border-blue-400 hover:bg-blue-50 dark:border-blue-900 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-blue-600 dark:hover:bg-slate-800",
        subtle: "bg-secondary text-secondary-foreground hover:bg-blue-100"
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-5 py-3 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
