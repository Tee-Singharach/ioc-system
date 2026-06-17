import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: "gray" | "blue" | "green" | "yellow" | "red" | "purple";
}

const colors: Record<NonNullable<BadgeProps["color"]>, string> = {
  gray: "bg-zinc-100 text-zinc-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ color = "gray", className = "", children, ...props }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]} ${className}`} {...props}>
      {children}
    </span>
  );
}
