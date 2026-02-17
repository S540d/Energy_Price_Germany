import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import Svg, { Rect, Line, Polyline } from 'react-native-svg';
import { ThemeColors } from '../../utils/theme';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';
import { useChartDimensions } from '../../utils/chartUtils';
import { ChartGrid, ChartCard, ChartTooltip, getTooltipLeft, NowMarkerLine, NowMarkerLabel } from './shared';

// Performance: Move color helpers outside component for stable references
const interpolateColor = (color1: number[], color2: number[], factor: number) => {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return `rgb(${r}, ${g}, ${b})`;
};

const getRenewableColor = (renewablePercent: number) => {
  const red = [244, 67, 54];
  const yellow = [255, 193, 7];
  const green = [76, 175, 80];
  const blue = [33, 150, 243];

  if (renewablePercent > 100) {
    const factor = Math.min((renewablePercent - 100) / 20, 1);
    return interpolateColor(green, blue, factor);
  } else if (renewablePercent > 80) {
    return '#4CAF50';
  } else if (renewablePercent > 50) {
    const factor = (renewablePercent - 50) / 30;
    return interpolateColor(yellow, green, factor);
  } else {
    const factor = renewablePercent / 50;
    return interpolateColor(red, yellow, factor);
  }
};

/**
 * Type alias for renewable share data keys in EnergyData
 * This ensures type safety when extending with new renewable data fields
 */
type RenewableDataKey = 'renewableShare' | 'renewableShareRegional';

interface RenewableBarChartProps{
  title: string;
  subtitle?: string;
  data: Array<{
    timestamp: number;
    marketPrice: number | null;
    renewableShare: number | null;
    renewableShareRegional?: number | null;
    isRenewableShareInterpolated?: boolean;
  }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  colors: ThemeColors;
  labels: {
    yAxis: string;
    now: string;
    average: string;
    regional?: string; // Label für regionale Linie
  };
  interactionHint?: string;
  dataKey?: RenewableDataKey;
  showRegionalLine?: boolean; // Zeigt gestrichelte Linie für regionale Daten
  showLegend?: boolean;
}

function RenewableBarChartComponent({
  title,
  subtitle,
  data,
  backgroundColor,
  textColor,
  gridColor,
  colors,
  labels,
  interactionHint,
  dataKey = 'renewableShare',
  showRegionalLine = false,
  showLegend = true,
}: RenewableBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleBarInteraction = useCallback((index: number) => {
    setSelectedIndex(prev => index === prev ? null : index);
  }, []);

  // Use centralized chart dimensions hook
  const {
    chartWidth,
    chartHeight,
    leftPadding,
    padding,
    rightPadding,
    bottomPadding,
    margin,
    cardPadding,
    isPhone,
    isLandscape,
  } = useChartDimensions();

  // Performance: Memoize expensive data calculations
  const chartCalcs = useMemo(() => {
    const now = Date.now();
    const timestamps = data.map(d => d.timestamp);

    if (timestamps.length === 0) return null;

    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime;

    if (timeRange === 0) return null;

    const validData = data.filter(d => d[dataKey] !== null && d[dataKey] !== undefined);
    const values = validData.map(d => d[dataKey]!);
    const min = 0;
    const max = 100;
    const range = max - min;

    const avgValue = values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : 50;

    const lastValidValue = validData.length > 0 ? validData[validData.length - 1][dataKey]! : avgValue;

    return { now, minTime, maxTime, timeRange, min, max, range, avgValue, lastValidValue };
  }, [data, dataKey]);

  // Guard against invalid data
  if (!chartCalcs) return null;

  const { now, minTime, maxTime, timeRange, min, max, range, avgValue, lastValidValue } = chartCalcs;

  // Performance: Pre-calculate all bar positions, colors, and dimensions
  const barData = useMemo(() => {
    return data.map((d, index) => {
      const value = d[dataKey];
      const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
      const barWidth = ((chartWidth - leftPadding - rightPadding) / data.length) * 0.8;
      const timestamp = d.timestamp;

      if (value === null || value === undefined) {
        return {
          index,
          x,
          barWidth,
          value: null,
          isInterpolated: false,
          timestamp,
        };
      }

      const color = getRenewableColor(value);
      const barHeight = ((value - min) / range) * (chartHeight - padding - bottomPadding);
      const y = chartHeight - bottomPadding - barHeight;
      const isInterpolated = d.isRenewableShareInterpolated || false;

      // Pre-calculate >100% split bar dimensions
      let baseHeight, overHeight, baseY, overY, baseColor;
      if (value > 100) {
        baseHeight = ((100 - min) / range) * (chartHeight - padding - bottomPadding);
        overHeight = ((value - 100) / range) * (chartHeight - padding - bottomPadding);
        baseY = chartHeight - bottomPadding - baseHeight;
        overY = baseY - overHeight;
        baseColor = getRenewableColor(100);
      }

      return {
        index,
        x,
        barWidth,
        value,
        color,
        barHeight,
        y,
        isInterpolated,
        timestamp,
        baseHeight,
        overHeight,
        baseY,
        overY,
        baseColor,
      };
    });
  }, [data, dataKey, minTime, timeRange, chartWidth, chartHeight, leftPadding, rightPadding, padding, bottomPadding, min, range]);

  return (
    <ChartCard backgroundColor={backgroundColor} margin={margin} cardPadding={cardPadding}>
      {selectedIndex !== null && data[selectedIndex]?.[dataKey] !== null && data[selectedIndex]?.[dataKey] !== undefined && (() => {
        const item = data[selectedIndex];
        const renewablePercent = item[dataKey]!;

        const x = leftPadding + ((item.timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
        const tooltipLeft = getTooltipLeft(x, 80, chartWidth);

        return (
          <ChartTooltip
            tooltipLeft={tooltipLeft}
            cardPadding={cardPadding}
            backgroundColor={backgroundColor}
            colors={colors}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>
              {renewablePercent.toFixed(1)}%
            </Text>
          </ChartTooltip>
        );
      })()}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0 }}>
        <View>
          <Text style={{ fontSize: isPhone ? 16 : 18, fontWeight: 'bold', marginBottom: 0, color: textColor }}>{title}</Text>
          {subtitle && (
            <Text style={{ fontSize: 12, color: textColor, opacity: 0.7, marginBottom: 2 }}>
              {subtitle}
            </Text>
          )}
          {interactionHint && (
            <Text style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.5, color: textColor }} accessibilityRole="text" accessibilityLabel={interactionHint}>
              💡 {interactionHint}
            </Text>
          )}
        </View>
        {/* Legend - hidden when showLegend is false or on small devices in portrait mode */}
        {showLegend && !(isPhone && !isLandscape) && (
          <View style={{
            flexDirection: 'row',
            gap: 12,
            paddingRight: 10,
            paddingTop: 0
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 12,
                height: 2,
                backgroundColor: textColor,
                opacity: 0.5
              }} />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.average}</Text>
            </View>
            {showRegionalLine && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{
                  width: 12,
                  height: 2,
                  backgroundColor: '#FF9800',
                  opacity: 0.8
                }} />
                <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.regional}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={{ height: chartHeight, width: chartWidth, position: 'relative' }}>
        <ChartGrid
          chartWidth={chartWidth} chartHeight={chartHeight}
          leftPadding={leftPadding} rightPadding={rightPadding}
          padding={padding} bottomPadding={bottomPadding}
          gridColor={gridColor}
        />

        {/* Bars (SVG) - Using pre-calculated bar data for performance */}
        <Svg width={chartWidth} height={chartHeight}>
          {barData.map((bar) => {
            // Render gray fading bar for missing data
            if (bar.value === null) {
              // Seeded random for consistent but varied heights
              const seed = data[bar.index].timestamp % 1000;
              const random = Math.sin(seed) * 10000;
              const randomFactor = (random - Math.floor(random)) * 0.3 + 0.9; // Range: 0.9 to 1.2

              // Calculate fade-out height: based on last valid value (not average)
              const fadeMaxValue = lastValidValue * randomFactor;
              const clampedFadeMax = Math.min(Math.max(fadeMaxValue, min), max);
              const fadeHeight = ((clampedFadeMax - min) / range) * (chartHeight - padding - bottomPadding);
              const fadeY = chartHeight - bottomPadding - fadeHeight;

              // Create fading effect with multiple segments
              const segments = 5;
              const segmentHeight = fadeHeight / segments;

              return (
                <React.Fragment key={bar.index}>
                  {Array.from({ length: segments }).map((_, segIndex) => {
                    const segY = fadeY + (segIndex * segmentHeight);
                    // Opacity increases as we go down (from 0.0 at top to 0.25 at bottom)
                    const opacity = 0.25 * (segIndex / (segments - 1));

                    return (
                      <Rect
                        key={`${bar.index}-seg-${segIndex}`}
                        x={bar.x - bar.barWidth / 2}
                        y={segY}
                        width={bar.barWidth}
                        height={segmentHeight}
                        fill={gridColor}
                        opacity={opacity}
                      />
                    );
                  })}
                </React.Fragment>
              );
            }

            const isSelected = selectedIndex === bar.index;
            const baseOpacity = bar.isInterpolated ? 0.4 : 0.9;
            const selectedOpacity = bar.isInterpolated ? 0.6 : 1.0;

            // Wenn Wert über 100%, Balken zweiteilen (use pre-calculated values)
            if (bar.value > 100) {
              return (
                <React.Fragment key={bar.index}>
                  <Rect
                    x={bar.x - bar.barWidth / 2}
                    y={bar.baseY}
                    width={bar.barWidth}
                    height={bar.baseHeight}
                    fill={bar.baseColor}
                    opacity={isSelected ? selectedOpacity : baseOpacity}
                    stroke={isSelected ? '#999999' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                  <Rect
                    x={bar.x - bar.barWidth / 2}
                    y={bar.overY}
                    width={bar.barWidth}
                    height={bar.overHeight}
                    fill="#90A4AE"
                    opacity={isSelected ? selectedOpacity : baseOpacity}
                    stroke={isSelected ? '#999999' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                </React.Fragment>
              );
            }

            return (
              <Rect
                key={bar.index}
                x={bar.x - bar.barWidth / 2}
                y={bar.y}
                width={bar.barWidth}
                height={bar.barHeight}
                fill={bar.color}
                opacity={isSelected ? selectedOpacity : baseOpacity}
                stroke={isSelected ? '#999999' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
            );
          })}

          {/* Durchschnittslinie */}
          <Line
            x1={leftPadding}
            y1={chartHeight - bottomPadding - ((avgValue - min) / range) * (chartHeight - padding - bottomPadding)}
            x2={chartWidth - rightPadding}
            y2={chartHeight - bottomPadding - ((avgValue - min) / range) * (chartHeight - padding - bottomPadding)}
            stroke={textColor}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.5}
          />

          {/* Regionale Datenlinie - gestrichelt */}
          {showRegionalLine && (() => {
            const regionalPoints = data
              .map((d, index) => ({
                x: leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding),
                y: d.renewableShareRegional !== null && d.renewableShareRegional !== undefined
                  ? chartHeight - bottomPadding - ((d.renewableShareRegional - min) / range) * (chartHeight - padding - bottomPadding)
                  : null,
                value: d.renewableShareRegional,
              }))
              .filter(p => p.y !== null);

            if (regionalPoints.length === 0) return null;

            const pointsString = regionalPoints.map(p => `${p.x},${p.y}`).join(' ');
            const regionalAvg = regionalPoints.reduce((sum, p) => sum + (p.value || 0), 0) / regionalPoints.length;

            return (
              <>
                <Polyline
                  points={pointsString}
                  stroke="#FF9800"
                  strokeWidth="3"
                  strokeDasharray="6,6"
                  fill="none"
                  opacity={0.8}
                />
                {labels.regional && (
                  <Text
                    style={{
                      position: 'absolute',
                      right: rightPadding + 4,
                      top: chartHeight - bottomPadding - ((regionalAvg - min) / range) * (chartHeight - padding - bottomPadding) + 12,
                      fontSize: 12,
                      color: '#FF9800',
                      fontWeight: '600',
                      opacity: 0.9,
                    }}
                  >
                    {labels.regional} {regionalAvg.toFixed(1)}%
                  </Text>
                )}
              </>
            );
          })()}

          {/* "Jetzt" Markierung */}
          {now >= minTime && now <= maxTime && (
            <NowMarkerLine
              now={now} minTime={minTime} timeRange={timeRange}
              chartWidth={chartWidth} chartHeight={chartHeight}
              leftPadding={leftPadding} rightPadding={rightPadding}
              padding={padding} bottomPadding={bottomPadding}
            />
          )}
        </Svg>

        {/* Invisible touch/hover areas for bars - Using pre-calculated positions */}
        {barData.map((bar) => {
          if (bar.value === null) return null;

          return (
            <View
              key={`touch-${bar.index}`}
              style={{
                position: 'absolute',
                left: bar.x - bar.barWidth / 2,
                top: bar.y,
                width: bar.barWidth,
                height: bar.barHeight,
                zIndex: 10,
                cursor: Platform.OS === 'web' ? 'pointer' : undefined,
              }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={() => handleBarInteraction(bar.index)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setSelectedIndex(bar.index),
                onMouseLeave: () => setSelectedIndex(null),
              })}
            />
          );
        })}

        {/* Durchschnittslinie Label */}
        <Text
          style={{
            position: 'absolute',
            right: rightPadding + 4,
            top: chartHeight - bottomPadding - ((avgValue - min) / range) * (chartHeight - padding - bottomPadding) - 12,
            fontSize: 12,
            color: textColor,
            fontWeight: '600',
            opacity: 0.7,
          }}
        >
          {labels.average} {avgValue.toFixed(1)}%
        </Text>

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = max - (i / 4) * range;
          const y = padding + (i / 4) * (chartHeight - padding - bottomPadding);
          return (
            <Text
              key={`ylabel-${i}`}
              style={{
                position: 'absolute',
                left: 10,
                top: y - 8,
                fontSize: 12,
                color: textColor,
                opacity: 0.6,
                textAlign: 'right',
                width: isPhone ? 25 : 30,
              }}
            >
              {value.toFixed(0)}
            </Text>
          );
        })}

        {/* X-axis labels (alle 3 Stunden) */}
        {(() => {
          const labels = [];
          const startDate = new Date(minTime);
          const endDate = new Date(maxTime);

          const startHour = Math.ceil(startDate.getHours() / 3) * 3;
          const current = new Date(startDate);
          current.setHours(startHour, 0, 0, 0);

          while (current <= endDate) {
            const timestamp = current.getTime();
            const x = leftPadding + ((timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
            const hour = current.getHours();

            labels.push(
              <Text
                key={`xlabel-${timestamp}`}
                style={{
                  position: 'absolute',
                  left: x - 10,
                  top: chartHeight - bottomPadding + 5,
                  fontSize: 12,
                  color: textColor,
                  opacity: 0.6,
                }}
              >
                {hour}h
              </Text>
            );

            current.setHours(current.getHours() + 3);
          }

          return labels;
        })()}

        {/* "Jetzt" Label */}
        {now >= minTime && now <= maxTime && (
          <NowMarkerLabel
            now={now} minTime={minTime} timeRange={timeRange}
            chartWidth={chartWidth} chartHeight={chartHeight}
            leftPadding={leftPadding} rightPadding={rightPadding}
            bottomPadding={bottomPadding} label={labels.now}
          />
        )}

        {/* Y-Achsen-Label */}
        <Text style={getYAxisLabelStyle(chartHeight, -15, textColor, isPhone)}>
          {labels.yAxis}
        </Text>
      </View>
      {interactionHint && (
        <Text
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={interactionHint}
          style={{ fontSize: 12, color: textColor, opacity: 0.5, fontStyle: 'italic', marginTop: 8 }}
        >
          💡 {interactionHint}
        </Text>
      )}
    </ChartCard>
  );
}

// Performance: Wrap with React.memo to prevent unnecessary re-renders
// Only re-renders if props actually change
export const RenewableBarChart = React.memo(RenewableBarChartComponent);
