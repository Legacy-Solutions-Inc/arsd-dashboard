Create a new component matching this project's conventions:

1. Ask for: component name, target directory under `src/components/<domain>/`, whether it needs client-side interactivity (state, effects, browser APIs)
2. Before creating: check `src/components/ui/` and the target domain folder for an existing component you can reuse or extend
3. Create the component file with explicit prop types — define a named `interface <Name>Props` above the component
4. Add `"use client"` only when client-side interactivity is required
5. Compose with Shadcn primitives from `@/components/ui/`; use Tailwind utilities and `cn()` from `@/lib/utils` for conditional classes; never inline-style
6. Use the `@/*` path alias for all imports
7. Export as a **named export** (no default exports for non-page components)
8. If animation is needed, use `framer-motion` and check `src/lib/motion.ts` and existing components for patterns before introducing new variants