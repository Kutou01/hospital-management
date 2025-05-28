// import { cn } from "@/lib/utils"\nconst cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
