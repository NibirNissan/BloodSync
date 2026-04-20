import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-300 hover:bg-white/[0.07] hover:border-white/15",
        className
      )}
      {...props}
    />
  );
}
