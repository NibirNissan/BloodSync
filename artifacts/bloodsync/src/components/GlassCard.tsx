import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn("glass-card p-6 shadow-2xl shadow-black/50 transition-all duration-300", className)}
      {...props}
    />
  );
}
