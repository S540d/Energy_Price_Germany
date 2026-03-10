import React, { useState, useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { ThemeColors } from '../../utils/theme';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';
import { useChartDimensions } from '../../utils/chartUtils';
import { ChartGrid, ChartCard, ChartTooltip, getTooltipLeft } from './shared';

interface CorrelationScatterChartProps {
  title: string;
  subtitle?: string;
  data: Array<{
    timestamp: number;
    marketPrice: number | null;
    renewableShare: number | null;
    isMarketPriceInterpolated?: boolean;
    isRenewableShareInterpolated?: boolean;
  }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  colors: ThemeColors;
  labels: {
    yAxisPrice: string;
    xAxisRenewables: string;
    night: string;
    morningEvening: string;
    day: string;
  };
  interactionHint?: string;
}

function CorrelationScatterChartComponent({
  title,
  subtitle,
  data,
  backgroundColor,
  textColor,
  gridColor,
  colors,
  labels,
  interactionHint,
}: CorrelationScatterChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  // Performance: Memoize expensive data calculations (filtering, regression, ranges)
  const chartCalcs = useMemo(() => {
    const validData = data.filter(
      d =>
        d.marketPrice !== null &&
        d.renewableShare !== null &&
        !d.isMarketPriceInterpolated &&
        !d.isRenewableShareInterpolated
    );

    if (validData.length === 0) return null;

    const priceInCentValues = validData.map(d => (d.marketPrice ?? 0) * 0.1);
    const renewableValues = validData.map(d => d.renewableShare ?? 0);

    const minRenewable = 0;
    const maxRenewable = Math.max(100, ...renewableValues);
    const renewableRange = maxRenewable - minRenewable;

    const minPriceData = Math.min(...priceInCentValues);
    const maxPriceData = Math.max(...priceInCentValues);
    const pricePadding = (maxPriceData - minPriceData) * 0.05;
    const minPrice = Math.max(0, minPriceData - pricePadding);
    const maxPrice = maxPriceData + pricePadding;
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0 || renewableRange === 0) return null;

    // Lineare Regression
    const n = validData.length;
    const sumX = renewableValues.reduce((sum, v) => sum + v, 0);
    const sumY = priceInCentValues.reduce((sum, v) => sum + v, 0);
    const sumXY = renewableValues.reduce((sum, v, i) => sum + v * priceInCentValues[i], 0);
    const sumX2 = renewableValues.reduce((sum, v) => sum + v * v, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate trend line points that stay within chart bounds
    let trendStartX = minRenewable;
    let trendStartY = intercept + slope * minRenewable;
    let trendEndX = maxRenewable;
    let trendEndY = intercept + slope * maxRenewable;

    if (trendStartY < minPrice) {
      trendStartY = minPrice;
      trendStartX = (minPrice - intercept) / slope;
    }
    if (trendEndY < minPrice) {
      trendEndY = minPrice;
      trendEndX = (minPrice - intercept) / slope;
    }
    if (trendStartY > maxPrice) {
      trendStartY = maxPrice;
      trendStartX = (maxPrice - intercept) / slope;
    }
    if (trendEndY > maxPrice) {
      trendEndY = maxPrice;
      trendEndX = (maxPrice - intercept) / slope;
    }

    if (trendStartX > trendEndX) {
      [trendStartX, trendStartY, trendEndX, trendEndY] = [
        trendEndX,
        trendEndY,
        trendStartX,
        trendStartY,
      ];
    }

    return {
      validData,
      minRenewable,
      maxRenewable,
      renewableRange,
      minPrice,
      maxPrice,
      priceRange,
      trendStartX,
      trendStartY,
      trendEndX,
      trendEndY,
    };
  }, [data]);

  // Performance: Pre-calculate scatter point positions and colors
  const scatterPoints = useMemo(() => {
    if (!chartCalcs) return [];
    const {
      validData: vd,
      minRenewable: minR,
      renewableRange: rRange,
      minPrice: minP,
      priceRange: pRange,
    } = chartCalcs;
    return vd.map((d, index) => {
      const priceInCent = (d.marketPrice ?? 0) * 0.1;
      const x =
        leftPadding +
        (((d.renewableShare ?? 0) - minR) / rRange) * (chartWidth - leftPadding - rightPadding);
      const y =
        chartHeight -
        bottomPadding -
        ((priceInCent - minP) / pRange) * (chartHeight - padding - bottomPadding);
      const hour = new Date(d.timestamp).getHours();
      const color =
        hour >= 22 || hour < 6
          ? '#2196F3'
          : (hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)
            ? '#FF9800'
            : '#FFEB3B';

      return { index, x, y, color };
    });
  }, [chartCalcs, leftPadding, rightPadding, chartWidth, chartHeight, padding, bottomPadding]);

  // Guard against invalid data
  if (!chartCalcs) return null;

  const {
    validData,
    minRenewable,
    renewableRange,
    minPrice,
    maxPrice,
    priceRange,
    trendStartX,
    trendStartY,
    trendEndX,
    trendEndY,
  } = chartCalcs;

  return (
    <ChartCard backgroundColor={backgroundColor} margin={margin} cardPadding={cardPadding}>
      {selectedIndex !== null &&
        validData[selectedIndex] &&
        (() => {
          const item = validData[selectedIndex];

          const x =
            leftPadding +
            (((item.renewableShare ?? 0) - minRenewable) / renewableRange) *
              (chartWidth - leftPadding - rightPadding);
          const tooltipLeft = getTooltipLeft(x, 120, chartWidth);

          return (
            <ChartTooltip
              tooltipLeft={tooltipLeft}
              cardPadding={cardPadding}
              backgroundColor={backgroundColor}
              colors={colors}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>
                {new Date(item.timestamp).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </ChartTooltip>
          );
        })()}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 0,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: isPhone ? 16 : 18,
              fontWeight: 'bold',
              marginBottom: 0,
              color: textColor,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: 12, color: textColor, opacity: 0.7, marginBottom: 2 }}>
              {subtitle}
            </Text>
          )}
          {interactionHint && (
            <Text
              style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.5, color: textColor }}
              accessibilityRole="text"
              accessibilityLabel={interactionHint}
            >
              Hint: {interactionHint}
            </Text>
          )}
        </View>
        {/* Legend - hidden on small devices in portrait mode */}
        {!(isPhone && !isLandscape) && (
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingRight: 10,
              paddingTop: 0,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3' }}
              />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.night}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9800' }}
              />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>
                {labels.morningEvening}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFEB3B' }}
              />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.day}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ height: chartHeight, width: chartWidth }}>
        <ChartGrid
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          leftPadding={leftPadding}
          rightPadding={rightPadding}
          padding={padding}
          bottomPadding={bottomPadding}
          gridColor={gridColor}
          verticalLines={5}
        />

        {/* Scatter Points */}
        <Svg width={chartWidth} height={chartHeight}>
          {/* Trendlinie */}
          <Line
            x1={
              leftPadding +
              ((trendStartX - minRenewable) / renewableRange) *
                (chartWidth - leftPadding - rightPadding)
            }
            y1={
              chartHeight -
              bottomPadding -
              ((trendStartY - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)
            }
            x2={
              leftPadding +
              ((trendEndX - minRenewable) / renewableRange) *
                (chartWidth - leftPadding - rightPadding)
            }
            y2={
              chartHeight -
              bottomPadding -
              ((trendEndY - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)
            }
            stroke={textColor}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.4}
          />

          {scatterPoints.map(point => {
            const isSelected = selectedIndex === point.index;

            return (
              <Circle
                key={point.index}
                cx={point.x}
                cy={point.y}
                r={isSelected ? 6 : 4}
                fill={point.color}
                opacity={isSelected ? 1.0 : 0.7}
                stroke={isSelected ? '#999999' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
            );
          })}
        </Svg>

        {/* Invisible touch/hover areas for points - Using pre-calculated positions */}
        {scatterPoints.map(point => {
          const touchSize = 24;

          return (
            <View
              key={`touch-${point.index}`}
              style={{
                position: 'absolute',
                left: point.x - touchSize / 2,
                top: point.y - touchSize / 2,
                width: touchSize,
                height: touchSize,
                zIndex: 10,
                cursor: Platform.OS === 'web' ? 'pointer' : undefined,
              }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={() =>
                setSelectedIndex(prev => (point.index === prev ? null : point.index))
              }
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setSelectedIndex(point.index),
                onMouseLeave: () => setSelectedIndex(null),
              })}
            />
          );
        })}

        {/* Y-axis labels (Preis) */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = maxPrice - (i / 4) * priceRange;
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

        {/* X-axis labels (Erneuerbare %) */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = minRenewable + (i / 4) * renewableRange;
          const x = leftPadding + (i / 4) * (chartWidth - leftPadding - rightPadding);
          return (
            <Text
              key={`xlabel-${i}`}
              style={{
                position: 'absolute',
                left: x - 15,
                top: chartHeight - (isPhone ? 25 : 30),
                fontSize: 12,
                color: textColor,
                opacity: 0.6,
              }}
            >
              {value.toFixed(0)}%
            </Text>
          );
        })}

        {/* Axis Labels */}
        <Text
          style={{
            position: 'absolute',
            left: chartWidth / 2 - 60,
            bottom: isPhone ? 0 : 3, // Moved down by 2px for both
            fontSize: 12,
            color: textColor,
            fontWeight: '600',
          }}
        >
          {labels.xAxisRenewables}
        </Text>
        <Text style={getYAxisLabelStyle(chartHeight, -15, textColor, isPhone)}>
          {labels.yAxisPrice}
        </Text>
      </View>
      {interactionHint && (
        <Text
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={interactionHint}
          style={{
            fontSize: 12,
            color: textColor,
            opacity: 0.5,
            fontStyle: 'italic',
            marginTop: 8,
          }}
        >
          Hint: {interactionHint}
        </Text>
      )}
    </ChartCard>
  );
}

// Performance: Wrap with React.memo to prevent unnecessary re-renders
// Only re-renders if props actually change
export const CorrelationScatterChart = React.memo(CorrelationScatterChartComponent);
