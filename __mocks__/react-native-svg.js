// Manual Jest mock for react-native-svg (RNTL/jsdom can't run its native bridge).
// Renders every primitive as a plain View so charts stay testable; SVG-only
// props (x1/y1/points/...) just pass through as inert view props.
const React = require('react');
const { View } = require('react-native');

function makePrimitive(displayName) {
  const Component = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref, testID: props.testID ?? displayName })
  );
  Component.displayName = displayName;
  return Component;
}

const Svg = makePrimitive('Svg');
const Rect = makePrimitive('Rect');
const Circle = makePrimitive('Circle');
const Line = makePrimitive('Line');
const Path = makePrimitive('Path');
const Polyline = makePrimitive('Polyline');
const Polygon = makePrimitive('Polygon');
const G = makePrimitive('G');
const Text = makePrimitive('SvgText');
const Defs = makePrimitive('Defs');
const Stop = makePrimitive('Stop');
const LinearGradient = makePrimitive('LinearGradient');
const RadialGradient = makePrimitive('RadialGradient');
const ClipPath = makePrimitive('ClipPath');
const Ellipse = makePrimitive('Ellipse');

module.exports = {
  __esModule: true,
  default: Svg,
  Svg,
  Rect,
  Circle,
  Line,
  Path,
  Polyline,
  Polygon,
  G,
  Text,
  Defs,
  Stop,
  LinearGradient,
  RadialGradient,
  ClipPath,
  Ellipse,
};
