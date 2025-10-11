import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ScreenWrapperProps = {
  children: ReactNode;
  className?: string;
};

export default function ScreenWrapper({ children, className }: ScreenWrapperProps) {
  return (
    <div className={cn("h-full w-full flex flex-col", className)}>
      {children}
    </div>
  );
}
