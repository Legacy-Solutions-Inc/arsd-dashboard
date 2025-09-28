# Universal Loading Component

A comprehensive, reusable loading state system that provides consistent UI/UX across all pages and components in the ARSD Dashboard application.

## Features

- 🎨 **Beautiful Design**: Modern glass morphism with gradient backgrounds
- 🔄 **Multiple Types**: Pre-configured loading states for different content types
- 📱 **Responsive**: Works perfectly on all screen sizes
- ⚡ **Performance**: Optimized animations and transitions
- 🎯 **Flexible**: Highly customizable with props
- 🚀 **Easy to Use**: Simple API with sensible defaults

## Components

### Main Components

#### `UniversalLoading`
The main loading component with full customization options.

```tsx
import { UniversalLoading } from '@/components/ui/universal-loading';

<UniversalLoading
  type="dashboard"
  message="Loading Dashboard"
  subtitle="Preparing your project overview"
  size="lg"
  fullScreen={true}
  showProgress={true}
  progress={75}
/>
```

#### Convenience Components
Pre-configured components for common use cases:

- `DashboardLoading` - For dashboard pages
- `ProjectLoading` - For project-related pages
- `ReportLoading` - For report and data pages
- `DataLoading` - For data processing with progress
- `InlineLoading` - For small inline loading states
- `SkeletonCard` - For card content placeholders
- `SkeletonTable` - For table content placeholders

## Props

### UniversalLoading Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'dashboard' \| 'project' \| 'report' \| 'user' \| 'general' \| 'data' \| 'chart'` | `'general'` | Content type for appropriate icon and styling |
| `message` | `string` | Type-specific default | Custom loading message |
| `subtitle` | `string` | Type-specific default | Additional context subtitle |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the loading component |
| `fullScreen` | `boolean` | `false` | Whether to show full screen overlay |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showProgress` | `boolean` | `false` | Whether to show progress bar |
| `progress` | `number` | `0` | Progress percentage (0-100) |

## Usage Examples

### Basic Usage

```tsx
// Simple loading state
<UniversalLoading type="dashboard" />

// Custom message
<UniversalLoading 
  type="project" 
  message="Loading Project Details"
  subtitle="Fetching financial data and reports"
/>

// With progress
<DataLoading 
  showProgress={true} 
  progress={65}
  message="Processing Data"
/>
```

### Page-Level Loading

```tsx
// In a page component
export default function MyPage() {
  const { data, loading } = useData();
  
  if (loading) {
    return <DashboardLoading 
      message="Loading Dashboard"
      subtitle="Preparing your project overview"
      size="lg"
      fullScreen={true}
    />;
  }
  
  return <div>Your content here</div>;
}
```

### Inline Loading

```tsx
// For small loading states
<InlineLoading message="Saving changes..." size="sm" />

// In forms or buttons
<button disabled={loading}>
  {loading ? <InlineLoading message="Saving..." size="sm" /> : "Save"}
</button>
```

### Skeleton Loading

```tsx
// Card placeholders
<div className="grid grid-cols-3 gap-4">
  <SkeletonCard />
  <SkeletonCard />
  <SkeletonCard />
</div>

// Table placeholders
<SkeletonTable rows={5} columns={4} />
```

## Content Types

Each type has its own icon, colors, and default messages:

| Type | Icon | Colors | Default Message |
|------|------|--------|-----------------|
| `dashboard` | BarChart3 | Blue | "Loading Dashboard" |
| `project` | Building2 | Red (ARSD) | "Loading Project" |
| `report` | FileText | Green | "Loading Reports" |
| `user` | Users | Purple | "Loading Users" |
| `data` | DollarSign | Orange | "Loading Data" |
| `chart` | BarChart3 | Indigo | "Loading Charts" |
| `general` | Loader2 | Gray | "Loading" |

## Size Variants

| Size | Icon Size | Text Size | Padding | Use Case |
|------|-----------|-----------|---------|----------|
| `sm` | 6x6 | text-lg | p-4 | Inline, small spaces |
| `md` | 8x8 | text-xl | p-6 | Standard loading |
| `lg` | 12x12 | text-2xl | p-8 | Full screen, important |

## Styling

The component uses Tailwind CSS with custom classes:

- **Background**: Glass morphism with backdrop blur
- **Colors**: Type-specific gradient colors
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design approach
- **Accessibility**: Proper contrast and focus states

## Best Practices

1. **Use appropriate types** - Choose the type that best matches your content
2. **Provide meaningful messages** - Help users understand what's happening
3. **Consider context** - Use fullScreen for page loads, inline for actions
4. **Show progress when possible** - Especially for long operations
5. **Use skeletons for content** - Better than spinners for content loading
6. **Keep messages concise** - Avoid overly long loading messages

## Migration Guide

### From Old Loading States

```tsx
// Old way
if (loading) {
  return <div>Loading...</div>;
}

// New way
if (loading) {
  return <DashboardLoading fullScreen={true} />;
}
```

### From Custom Loading Components

```tsx
// Old custom component
<CustomProjectLoader />

// New universal component
<ProjectLoading 
  message="Loading Project Details"
  subtitle="Fetching project information"
/>
```

## Performance

- **Optimized animations** - Uses CSS transforms and opacity
- **Minimal re-renders** - Stable component structure
- **Lazy loading** - Components only render when needed
- **Memory efficient** - No unnecessary DOM elements

## Accessibility

- **Screen reader friendly** - Proper ARIA labels
- **Keyboard navigation** - Focus management
- **Color contrast** - WCAG compliant colors
- **Reduced motion** - Respects user preferences

## Browser Support

- **Modern browsers** - Chrome, Firefox, Safari, Edge
- **Mobile browsers** - iOS Safari, Chrome Mobile
- **CSS Grid** - Fallback for older browsers
- **Backdrop blur** - Graceful degradation

## Troubleshooting

### Common Issues

1. **Icons not showing** - Ensure Lucide React is installed
2. **Styles not applying** - Check Tailwind CSS configuration
3. **Animations not working** - Verify CSS animations are enabled
4. **Type errors** - Ensure TypeScript types are properly imported

### Debug Mode

```tsx
<UniversalLoading 
  type="dashboard"
  className="debug-loading" // Add custom class for debugging
/>
```

## Contributing

When adding new loading types or features:

1. Update the `loadingConfig` object
2. Add appropriate TypeScript types
3. Update this documentation
4. Test across different screen sizes
5. Ensure accessibility compliance

## License

Part of the ARSD Dashboard project. See main project license for details.
