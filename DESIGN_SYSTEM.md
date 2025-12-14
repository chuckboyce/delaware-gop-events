# Delaware Conservative Event Database - Design System

## Design Philosophy
Modern, clean, and professional with subtle patriotic elements. Conservative in execution, contemporary in approach. Community-focused and authoritative without being corporate.

## Color Palette

### Primary Colors
- **Navy Blue** (#001F3F) - Primary brand color, represents stability and authority
- **Patriotic Red** (#DC143C) - Accent color for CTAs, highlights, and important actions
- **White** (#FFFFFF) - Background and text
- **Off-White** (#F8F9FA) - Subtle backgrounds, cards

### Secondary Colors
- **Gold/Brass** (#B8860B) - Premium accents, borders, highlights
- **Light Gray** (#E8EAED) - Borders, dividers, subtle backgrounds
- **Dark Gray** (#4A5568) - Secondary text, muted content
- **Success Green** (#28A745) - Approval, positive actions
- **Warning Orange** (#FFC107) - Pending status, caution
- **Error Red** (#DC3545) - Rejection, errors

## Typography

### Font Stack
- **Headings**: "Inter", "Segoe UI", sans-serif (600-700 weight)
- **Body**: "Inter", "Segoe UI", sans-serif (400-500 weight)
- **Monospace**: "Menlo", "Monaco", monospace (for code/technical content)

### Type Scale
- **H1**: 32px, 700 weight, line-height 1.2
- **H2**: 24px, 700 weight, line-height 1.3
- **H3**: 20px, 600 weight, line-height 1.4
- **Body**: 16px, 400 weight, line-height 1.6
- **Small**: 14px, 400 weight, line-height 1.5
- **Caption**: 12px, 400 weight, line-height 1.4

## Components & Patterns

### Buttons
- **Primary**: Navy background, white text, rounded corners (4px)
- **Secondary**: White background, navy border, navy text
- **Danger**: Red background, white text (for reject/delete actions)
- **Hover States**: Slightly darker shade, subtle shadow
- **Disabled**: Gray background, muted text

### Cards
- White background with subtle shadow (0 2px 8px rgba(0,0,0,0.1))
- 8px border-radius
- Padding: 20px
- Hover: Slight lift effect with increased shadow

### Forms
- Clean, minimal design
- Labels above inputs
- Input borders: light gray, 1px
- Focus state: Navy border, subtle blue shadow
- Validation: Green for success, red for errors
- Placeholder text: Light gray

### Navigation
- Top navigation bar with navy background
- White text/icons
- Logo on left, navigation links on right
- Mobile: Hamburger menu with slide-out drawer

### Event Cards
- Title, date/time, location, organizer
- Visibility badge (Public/Private/Members)
- Status badge (Approved/Pending/Rejected)
- Hover: Slight shadow increase, subtle color change

### Patriotic Elements
- Subtle star icons in headers
- Thin gold divider lines between sections
- American flag color accents (navy, red, white)
- Civic/community imagery in backgrounds
- No heavy-handed patriotic graphics—keep it subtle and professional

## Layout & Spacing

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Container
- Max-width: 1200px
- Responsive padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Centered with auto margins

### Grid
- 12-column responsive grid
- Mobile: 1 column
- Tablet: 2-4 columns
- Desktop: 3-4 columns

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First Approach
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly button sizes (44px minimum)

## Imagery & Icons

### Icons
- Lucide React icons (already in template)
- Consistent sizing: 20px (body), 24px (headers), 32px (large)
- Navy or red color depending on context

### Images
- Professional event photography
- Community and civic engagement themes
- Consistent aspect ratios (16:9 for event images)
- Subtle overlays for text on images

## Accessibility

- WCAG 2.1 AA compliance
- Sufficient color contrast (4.5:1 for text)
- Focus indicators on all interactive elements
- Semantic HTML
- Alt text for all images
- Keyboard navigation support

## Dark Mode (Future)

When implementing dark mode:
- Navy background (#0F1419)
- Light gray text (#E8EAED)
- Red accents remain (#DC143C)
- Gold accents become lighter (#D4AF37)
