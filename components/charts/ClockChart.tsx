import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import type { ThemeColors } from '../../utils/theme';
import { getPriceColor } from '../../utils/chartHelpers';
import { useChartDimensions } from '../../utils/chartUtils';
import { ChartCard } from './shared';
import { useSettingsContext } from '../../context/SettingsContext';

interface ClockChartProps {
  data: Array<{
    timestamp: number;
    marketPrice: number | null;
    renewableShare: number | null;
    isMarketPriceInterpolated?: boolean;
  }>;
  backgroundColor: string;
  textColor: string;
  colors: ThemeColors;
  gridFees: number;
  labels: {
    now: string;
    average: string;
    pricePerKwh: string;
    noData: string;
  };
}

interface HourSegment {
  hour: number;
  avgPrice: number | null;
  totalPrice: number | null;
  color: string;
  isInterpolated: boolean;
}

/** Polar → Cartesian helper */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG arc path for a clock segment */
function segmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const gap = 1.5;
  const s = startAngle + gap / 2;
  const e = endAngle - gap / 2;

  const p1 = polarToCartesian(cx, cy, outerR, s);
  const p2 = polarToCartesian(cx, cy, outerR, e);
  const p3 = polarToCartesian(cx, cy, innerR, e);
  const p4 = polarToCartesian(cx, cy, innerR, s);

  const largeArc = e - s > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

function ClockChartComponent({
  data,
  backgroundColor,
  textColor,
  colors,
  gridFees,
  labels,
}: ClockChartProps) {
  // Single call – destructure everything needed
  const { margin, cardPadding, isPhone, chartWidth } = useChartDimensions();
  const { priceDisplayMode } = useSettingsContext();
  const isMarketOnly = priceDisplayMode === 'marketOnly';
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Aggregate data into 24 hourly buckets
  const hourSegments = useMemo<HourSegment[]>(() => {
    const buckets: { prices: number[]; interpolated: boolean[] }[] = Array.from(
      { length: 24 },
      () => ({ prices: [], interpolated: [] })
    );

    for (const d of data) {
      if (d.marketPrice === null) continue;
      const date = new Date(d.timestamp);
      const hour = date.getHours();
      // Convert to ¢/kWh – same as PriceBarChart (marketPrice * 0.1)
      const priceCentsPerKwh = d.marketPrice * 0.1;
      buckets[hour].prices.push(priceCentsPerKwh);
      buckets[hour].interpolated.push(d.isMarketPriceInterpolated ?? false);
    }

    return buckets.map((bucket, hour) => {
      if (bucket.prices.length === 0) {
        return {
          hour,
          avgPrice: null,
          totalPrice: null,
          color: colors.gridLine,
          isInterpolated: false,
        };
      }
      const avgPrice = bucket.prices.reduce((a, b) => a + b, 0) / bucket.prices.length;
      const totalPrice = isMarketOnly ? avgPrice : avgPrice + gridFees;
      const isInterpolated = bucket.interpolated.every(Boolean);
      return {
        hour,
        avgPrice,
        totalPrice,
        color: getPriceColor(totalPrice),
        isInterpolated,
      };
    });
  }, [data, gridFees, isMarketOnly, colors.gridLine]);

  // Current hour + now-marker angle
  const currentHour = new Date().getHours();
  const nowAngle = (currentHour / 24) * 360 + (new Date().getMinutes() / 60) * 15;

  // Chart geometry
  const size = Math.min(chartWidth - cardPadding * 2, isPhone ? 280 : 340);
  const labelMargin = 20; // extra canvas space so SVG labels are not clipped
  const svgSize = size + labelMargin * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.55;
  const labelR = outerR * 1.18;

  const selectedSegment = selectedHour !== null ? hourSegments[selectedHour] : null;
  const currentSegment = hourSegments[currentHour];

  const handleSegmentPress = useCallback((hour: number) => {
    setSelectedHour(prev => (prev === hour ? null : hour));
  }, []);

  const clockLabels = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <ChartCard backgroundColor={backgroundColor} margin={margin} cardPadding={cardPadding}>
      {/* Center info */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        {selectedSegment && selectedSegment.totalPrice !== null ? (
          <>
            <Text style={{ color: textColor, fontSize: isPhone ? 13 : 15, fontWeight: '700' }}>
              {selectedHour}:00 – {((selectedHour ?? 0) + 1) % 24}:00
            </Text>
            <Text
              style={{
                color: selectedSegment.color,
                fontSize: isPhone ? 20 : 24,
                fontWeight: '800',
              }}
            >
              {selectedSegment.totalPrice.toFixed(2)} ¢
            </Text>
            <Text style={{ color: textColor, fontSize: 11, opacity: 0.6 }}>
              {labels.pricePerKwh}
            </Text>
          </>
        ) : currentSegment.totalPrice !== null ? (
          <>
            <Text style={{ color: textColor, fontSize: isPhone ? 11 : 13, opacity: 0.7 }}>
              {labels.now}
            </Text>
            <Text
              style={{
                color: currentSegment.color,
                fontSize: isPhone ? 20 : 24,
                fontWeight: '800',
              }}
            >
              {currentSegment.totalPrice.toFixed(2)} ¢
            </Text>
            <Text style={{ color: textColor, fontSize: 11, opacity: 0.6 }}>
              {labels.pricePerKwh}
            </Text>
          </>
        ) : (
          <Text style={{ color: textColor, fontSize: 13, opacity: 0.5 }}>{labels.noData}</Text>
        )}
      </View>

      {/* Clock SVG */}
      <View style={{ alignItems: 'center' }}>
        <Svg width={svgSize} height={svgSize}>
          {/* Background circle */}
          <Circle cx={cx} cy={cy} r={outerR + 4} fill={colors.gridLine} opacity={0.1} />

          {/* Hour segments */}
          {hourSegments.map(seg => {
            const startAngle = (seg.hour / 24) * 360;
            const endAngle = ((seg.hour + 1) / 24) * 360;
            const isSelected = selectedHour === seg.hour;
            const isCurrent = seg.hour === currentHour && selectedHour === null;
            const outerRadius = isSelected || isCurrent ? outerR + 4 : outerR;

            return (
              <G key={`seg-${seg.hour}`}>
                <Path
                  d={segmentPath(cx, cy, innerR, outerRadius, startAngle, endAngle)}
                  fill={seg.color}
                  opacity={seg.avgPrice === null ? 0.15 : isSelected ? 1 : 0.75}
                  {...(Platform.OS === 'web'
                    ? {
                        onMouseEnter: () => setSelectedHour(seg.hour),
                        onMouseLeave: () => setSelectedHour(null),
                        style: { cursor: 'pointer' },
                      }
                    : {
                        onPress: () => handleSegmentPress(seg.hour),
                      })}
                  accessibilityLabel={
                    seg.totalPrice !== null
                      ? `${seg.hour}:00, ${labels.pricePerKwh}: ${seg.totalPrice.toFixed(2)}`
                      : `${seg.hour}:00, ${labels.noData}`
                  }
                />
              </G>
            );
          })}

          {/* Inner circle (center cutout) */}
          <Circle cx={cx} cy={cy} r={innerR - 2} fill={backgroundColor} />

          {/* Now marker (clock hand) */}
          {(() => {
            const tip = polarToCartesian(cx, cy, outerR + 8, nowAngle);
            const base = polarToCartesian(cx, cy, innerR - 8, nowAngle);
            return (
              <Line
                x1={base.x}
                y1={base.y}
                x2={tip.x}
                y2={tip.y}
                stroke={textColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })()}
          <Circle cx={cx} cy={cy} r={4} fill={textColor} opacity={0.9} />

          {/* Hour labels inside SVG – correct coordinate system */}
          {clockLabels.map(h => {
            const angle = (h / 24) * 360;
            const pos = polarToCartesian(cx, cy, labelR, angle);
            return (
              <SvgText
                key={`ol-${h}`}
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize={isPhone ? 9 : 10}
                fill={textColor}
                opacity={0.55}
              >
                {h}h
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </ChartCard>
  );
}

export const ClockChart = React.memo(ClockChartComponent);
