# PantryCRM UI/UX Style Reference Guide

## Overview

This guide outlines the UI/UX patterns, standards, and best practices for the PantryCRM application, a food service industry CRM optimized for touch devices and iPad sales representatives.

## Design System Foundation

### Color Palette

**Base Theme Colors (HSL Values)**
- `--background`: Light: `0 0% 100%`, Dark: `222.2 84% 4.9%`
- `--foreground`: Light: `222.2 84% 4.9%`, Dark: `210 40% 98%`
- `--primary`: Light: `222.2 47.4% 11.2%`, Dark: `210 40% 98%`
- `--secondary`: Light: `210 40% 96.1%`, Dark: `217.2 32.6% 17.5%`
- `--destructive`: Light: `0 84.2% 60.2%`, Dark: `0 62.8% 30.6%`
- `--border`: Light: `214.3 31.8% 91.4%`, Dark: `217.2 32.6% 17.5%`

**Food Service Industry Specific Colors**
- `--priority-a`: `142 71% 45%` (Green - Highest Priority)
- `--priority-b`: `45 93% 47%` (Yellow - High Priority)  
- `--priority-c`: `25 95% 53%` (Orange - Medium Priority)
- `--priority-d`: `0 84% 60%` (Red - Low Priority)

**Segment Colors**
- Fine Dining: `271 91% 65%`
- Fast Food: `346 77% 49%`
- Healthcare: `207 90% 54%`
- Catering: `47 96% 53%`
- Institutional: `262 52% 47%`

### Typography

**Base Font Sizes**
- Touch inputs: `16px` (prevents iOS zoom)
- Standard text: `text-sm` (14px)
- Headings: `text-2xl` (24px) for card titles
- Small text: `text-xs` (12px) for badges and secondary info

## Touch-First Design Principles

### Touch Target Standards

**Minimum Touch Target Sizes (WCAG 2.5.5 Level AAA)**
- Minimum: `44px × 44px`
- Preferred: `48px × 48px`
- Enhanced: `56px` height for primary actions

### Button Variants and Sizes

```tsx
// Button size variants
size: {
  default: "h-12 px-4 py-2",    // 48px - Enhanced for touch
  sm: "h-11 rounded-md px-3",   // 44px - WCAG AAA compliant
  lg: "h-14 rounded-md px-8",   // 56px - Enhanced accessibility
  icon: "h-11 w-11",            // 44px - Square touch targets
  touch: "h-12 w-full px-4",    // 48px - Full-width touch optimized
}
```

**Good UX Pattern**: All buttons include `button-touch touch-target` classes automatically

**Bad UX Pattern**: ❌ Using buttons smaller than 44px height
**Good UX Pattern**: ✅ Using minimum 48px height for primary actions

### Input Field Standards

**Touch-Optimized Input Properties**
- Height: `48px` (h-12)
- Font size: `16px` (prevents iOS zoom)
- Padding: `12px 16px`
- Classes: `touch-target form-input-touch`

```tsx
// Input component structure
className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target form-input-touch"
```

## Layout and Spacing

### Responsive Grid System

```css
.responsive-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 640px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Desktop and up */
@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}
```

### Spacing Standards

**Touch vs Mouse Spacing**
- Touch devices: `--spacing-unit: 16px`
- Mouse devices: `--spacing-unit: 12px`
- Minimum gap between touch targets: `8px` (WCAG requirement)

**Container Spacing**
- Touch padding: `p-4 md:p-6` (16px mobile, 24px tablet+)
- Default spacing: `space-y-6` (24px vertical)
- Max width: `max-w-7xl` (1280px)

## Component Patterns

### Card Components

**Standard Card Structure**
```tsx
<Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <CardHeader className="flex flex-col space-y-1.5 p-6">
    <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
    <CardDescription className="text-sm text-muted-foreground">
  </CardHeader>
  <CardContent className="p-6 pt-0">
  <CardFooter className="flex items-center p-6 pt-0">
</Card>
```

**Good UX Pattern**: Consistent 24px padding (`p-6`) for card sections
**Bad UX Pattern**: ❌ Inconsistent padding between card sections

### Modal Patterns

**Standard Modal Structure**
```tsx
<Dialog open={isOpen} onOpenChange={onChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <div>{children}</div>
  </DialogContent>
</Dialog>
```

**Good UX Pattern**: Always include descriptive titles and descriptions
**Bad UX Pattern**: ❌ Modals without clear context or close mechanisms

### Priority Badges

**Food Service Priority System**
```tsx
<PriorityBadge priority="A" /> // Green - Highest Priority
<PriorityBadge priority="B" /> // Yellow - High Priority  
<PriorityBadge priority="C" /> // Orange - Medium Priority
<PriorityBadge priority="D" /> // Red - Low Priority
```

**Good UX Pattern**: Color-coded priority system with semantic meaning
**Bad UX Pattern**: ❌ Using generic colors without business context

## Accessibility Standards

### Focus Management

**Focus Styles**
```css
.touch-target:focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

**Good UX Pattern**: Clear focus indicators with sufficient contrast
**Bad UX Pattern**: ❌ Removing focus styles without alternatives

### Touch Device Detection

**Responsive Layout Component**
```tsx
const ResponsiveLayout = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    const hasTouchCapability = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouchCapability);
  }, []);
}
```

**Good UX Pattern**: Automatic touch detection and layout adaptation
**Bad UX Pattern**: ❌ Static layouts that don't adapt to input method

### Keyboard Navigation

**Interactive Element Standards**
- All interactive elements must be keyboard accessible
- Logical tab order maintained
- Touch targets include `touch-action: manipulation`

## Device-Specific Optimizations

### iPad Optimization

**Touch Target Enhancements**
```css
@media (min-width: 768px) and (max-width: 1024px) {
  .ipad-optimize .button-touch {
    padding: 14px 28px; /* Enhanced padding for iPad */
  }
}
```

**Good UX Pattern**: Larger touch targets for tablet interfaces
**Bad UX Pattern**: ❌ Using desktop-sized elements on tablets

### iOS Safari Considerations

- Input font-size: `16px` prevents zoom
- Touch highlights: `-webkit-tap-highlight-color: rgba(0, 0, 0, 0.1)`
- Safe area handling for newer devices

## Testing and Validation

### Touch Target Testing

**Automated Testing Component**
```tsx
const TouchTargetTest = () => {
  const checkTouchTarget = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  };
};
```

Location: `components/testing/TouchTargetTest.tsx:8`

**Good UX Pattern**: Automated validation of touch target compliance
**Bad UX Pattern**: ❌ Manual testing without measurement tools

## Implementation Guidelines

### CSS Class Conventions

**Touch-Friendly Classes**
- `.touch-target`: Base touch target class
- `.button-touch`: Touch-optimized buttons  
- `.form-input-touch`: Touch-optimized inputs
- `.dropdown-item-touch`: Touch-optimized dropdown items
- `.nav-link-touch`: Touch-optimized navigation links

### Component Composition Rules

1. **Always use semantic HTML elements**
2. **Include proper ARIA labels and roles**
3. **Maintain consistent spacing using Tailwind utilities**
4. **Follow the established color system**
5. **Test touch targets on actual devices**

### Dark Mode Support

**Theme Implementation**
- CSS custom properties for all colors
- Automatic theme detection and persistence
- Consistent contrast ratios in both themes

**Good UX Pattern**: Seamless theme switching with system preference detection
**Bad UX Pattern**: ❌ Inconsistent theming or poor contrast ratios

## Performance Considerations

### CSS Optimization

- Use Tailwind's utility classes for consistency
- Leverage CSS custom properties for theming
- Minimize custom CSS in favor of established patterns

### Component Loading

- Lazy load non-critical components
- Use React.forwardRef for proper ref handling
- Implement proper error boundaries

## Conclusion

This style guide ensures consistent, accessible, and touch-friendly user experiences across the PantryCRM application. All components should follow these established patterns to maintain design system integrity and optimal user experience for food service industry professionals.