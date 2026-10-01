import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-controle bg-trait", className)}
      {...props}
    />
  );
}

export { Skeleton };
