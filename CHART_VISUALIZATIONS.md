# Chart Visualizations (#165)

**Date:** 2026-02-01
**Status:** Implemented (Gradients) / Planned (Clock View)

## Overview

This document tracks enhanced chart visualizations for Energy Price Germany. The goal is to make price data more intuitive and visually appealing.

## Implemented Features

### ✅ Smooth Gradient Color Transitions

**Status:** DONE
**Impact:** More aesthetically pleasing, clearer price trends

**Implementation:**
- RGB color interpolation between price zones
- Smooth transitions: Green → Yellow → Orange → Red
- Applied to both PriceBarChart and RenewableBarChart

**Files:**
- `components/charts/PriceBarChart.tsx` (Lines 110-133)
- `components/charts/RenewableBarChart.tsx` (Lines 109-135)

**Color Zones:**

**PriceBarChart:**
- `< 25 ¢/kWh`: Pure Green (`#4CAF50`)
- `25-35 ¢/kWh`: Green → Yellow gradient
- `35-50 ¢/kWh`: Yellow → Red gradient
- `> 50 ¢/kWh`: Pure Red (`#F44336`)

**RenewableBarChart:**
- `0-50%`: Red → Yellow gradient
- `50-80%`: Yellow → Green gradient
- `80-100%`: Pure Green (`#4CAF50`)
- `> 100%`: Green → Blue gradient

**Technical Details:**
```typescript
const interpolateColor = (color1: number[], color2: number[], factor: number) => {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return `rgb(${r}, ${g}, ${b})`;
};
```

---

## Planned Features

### 🔄 24-Hour Clock View (Circular Chart)

**Status:** PLANNED
**Priority:** Medium
**Estimated Effort:** 6-8 hours

**Concept:**
Replace or complement linear charts with a circular 24-hour clock visualization.

```
        12:00
    ┌─────────┐
21 │    15ct  │ 3
    │  ○      │
18 │         │ 6
    │    8ct  │
    │  ●      │
15 └─────────┘ 9
        12:00

● = Current time
Color sectors = Price zones (green=cheap, yellow=medium, red=expensive)
```

**Benefits:**
- More intuitive for daily planning
- Easier to spot "cheap hours" at a glance
- Visually similar to clock → familiar mental model
- Great for tablets in landscape mode

**Technical Challenges:**
1. **SVG Arc Paths**: Need to calculate arc segments for each time slot
2. **Touch/Hover on Circular Paths**: Complex hit detection
3. **Responsive Sizing**: Maintain aspect ratio
4. **Label Positioning**: Radial text placement

**Implementation Plan:**
1. Create `ClockViewChart.tsx` component
2. Calculate polar coordinates for each data point
3. Use SVG `<path>` for arc segments
4. Add radial gradient support
5. Implement circular touch areas
6. Add toggle between linear/clock view

**Example Code Snippet:**
```typescript
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};
```

---

### 🔄 Animated Transitions

**Status:** PLANNED
**Priority:** Low (Nice to Have)
**Estimated Effort:** 2-3 hours

**Features:**
- Smooth transitions when data updates
- Fade-in for new data points
- Bar height animations

**Technical Approach:**
- Use `react-native-reanimated` (already a peer dependency)
- Animated values for bar heights
- Spring animations for smooth feel

---

## Design Principles

### Color Psychology
- **Green**: Cheap/Good (renewable energy high)
- **Yellow**: Moderate (transition zone)
- **Red**: Expensive/Bad (renewable energy low)
- **Blue**: Exceptional (renewable > 100%)

### Accessibility
- Color gradients are supplemented with numerical labels
- High contrast for text
- Support for system theme (light/dark mode)

### Performance
- Gradients calculated once with useMemo (see PERFORMANCE.md)
- No runtime color calculations during render
- SVG for crisp rendering at any scale

---

## Future Enhancements

### Additional Visualization Ideas

1. **Heatmap View**
   - Week-at-a-glance calendar view
   - Color-coded cells for each hour
   - Great for long-term planning

2. **Correlation Scatter Plot Improvements**
   - Add size dimension (3rd variable)
   - Interactive region selection
   - Trend line confidence interval

3. **Mini-Charts in Legend**
   - Small sparklines showing trends
   - Historical averages

4. **Export Visualizations**
   - Save as PNG/SVG
   - Share to social media
   - Print-optimized layout

---

## Testing

### Visual Regression Testing
- Capture screenshots of all chart variations
- Compare before/after gradient changes
- Verify color transitions are smooth

### Accessibility Testing
- Color blind simulation
- Screen reader compatibility
- Keyboard navigation

### Performance Testing
- Measure render time for 96 data points (24h at 15min)
- Target: < 100ms render time
- No dropped frames during interactions

---

## References

- D3.js Color Scales: https://d3js.org/d3-scale-chromatic
- SVG Arc Paths: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#arcs
- React Native Reanimated: https://docs.swmansion.com/react-native-reanimated/

---

**Last Updated:** 2026-02-01
**Next Review:** After clock view implementation
