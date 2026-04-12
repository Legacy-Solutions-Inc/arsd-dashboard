# UI Rules

- Import Shadcn components from @/components/ui/ — never recreate them
- Use Tailwind utility classes, not inline styles or CSS modules
- Use cn() helper from @/lib/utils for conditional class merging
- Follow existing component patterns in the codebase before creating new ones
- Dark mode support uses next-themes with Tailwind's dark: prefix
- Icons come from lucide-react and @radix-ui/react-icons
- Animations use framer-motion — check existing patterns before adding new ones
