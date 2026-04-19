/**
 * @deprecated This module re-exports Card primitives under the Glass* names
 * so the rest of the codebase keeps compiling during the rebrand. New code
 * should import from "@/components/ui/card" directly.
 */
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { cn } from "../../lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'elevated' | 'subtle';
  hover?: boolean;
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', hover: _hover, ...props }, ref) => {
    const variantClass =
      variant === 'elevated'
        ? 'shadow-sm-tinted'
        : variant === 'subtle'
          ? 'shadow-none border-border/60'
          : '';
    return (
      <Card
        ref={ref}
        className={cn(variantClass, className)}
        {...props}
      />
    );
  },
);
GlassCard.displayName = "GlassCard";

const GlassCardHeader = CardHeader;
const GlassCardTitle = CardTitle;
const GlassCardDescription = CardDescription;
const GlassCardContent = CardContent;
const GlassCardFooter = CardFooter;

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
};
