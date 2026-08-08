import React, { useState, useMemo } from 'react';
import { View, Text, Platform, ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { ThemeColors } from '../../utils/theme';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';
import { useChartDimensions } from '../../utils/chartUtils';
import { arrayMin, arrayMax } from '../../utils/mathUtils';
import { useLanguageContext } from '../../context/LanguageContext';
import {
  ChartGrid,
  ChartCard,
  ChartTooltip,
  getTooltipLeft,
  useChartZoom,
  ZoomResetBadge,
} from './shared';
import { scaleToX, scaleToY } from './shared/chartScale';

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
  insightText?: string;
  accentColor?: string;
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
  insightText,
  accentColor,
}: CorrelationScatterChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { t } = useLanguageContext();

  // Use centralized chart dimensions hook
  const {
    chartWidth: viewportWidth,
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

  // Pinch (mobile) / scroll (web) zoom (#355) — contentWidth replaces the static
  // chartWidth for all internal x-position math below.
  const {
    contentWidth: chartWidth,
    isZoomed,
    resetZoom,
    scrollRef,
    scrollViewProps,
    gestureContainerProps,
    toViewportX,
  } = useChartZoom(viewportWidth);

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
    const maxRenewable = Math.max(100, arrayMax(renewableValues));
    const renewableRange = maxRenewable - minRenewable;

    const minPriceData = arrayMin(priceInCentValues);
    const maxPriceData = arrayMax(priceInCentValues);
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
      const x = scaleToX(d.renewableShare ?? 0, {
        domainMin: minR,
        domainRange: rRange,
        chartWidth,
        leftPadding,
        rightPadding,
      });
      const y = scaleToY(priceInCent, {
        domainMin: minP,
        domainRange: pRange,
        chartHeight,
        padding,
        bottomPadding,
      });
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

  const trendXScale = {
    domainMin: minRenewable,
    domainRange: renewableRange,
    chartWidth,
    leftPadding,
    rightPadding,
  };
  const trendYScale = {
    domainMin: minPrice,
    domainRange: priceRange,
    chartHeight,
    padding,
    bottomPadding,
  };

  return (
    <ChartCard
      backgroundColor={backgroundColor}
      margin={margin}
      cardPadding={cardPadding}
      accentColor={accentColor}
    >
      {selectedIndex !== null &&
        validData[selectedIndex] &&
        (() => {
          const item = validData[selectedIndex];

          const x = scaleToX(item.renewableShare ?? 0, {
            domainMin: minRenewable,
            domainRange: renewableRange,
            chartWidth,
            leftPadding,
            rightPadding,
          });
          const tooltipLeft = getTooltipLeft(toViewportX(x), 120, viewportWidth);

          return (
            <ChartTooltip
              tooltipLeft={tooltipLeft}
              cardPadding={cardPadding}
              backgroundColor={backgroundColor}
              colors={colors}
            >
              <Text style={[styles.tooltipValue, { color: colors.text }]}>
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
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text
            style={[isPhone ? styles.titlePhone : styles.titleDefault, { color: textColor }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle && <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text>}
          {interactionHint && (
            <Text
              style={[styles.hint, { color: textColor }]}
              accessibilityRole="text"
              accessibilityLabel={interactionHint}
            >
              {interactionHint}
            </Text>
          )}
        </View>
        {/* Legend - hidden on small devices in portrait mode */}
        {!(isPhone && !isLandscape) && (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotNight} />
              <Text style={[styles.legendLabel, { color: textColor }]}>{labels.night}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDotMorningEvening} />
              <Text style={[styles.legendLabel, { color: textColor }]}>
                {labels.morningEvening}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDotDay} />
              <Text style={[styles.legendLabel, { color: textColor }]}>{labels.day}</Text>
            </View>
          </View>
        )}
      </View>
      <View
        style={[styles.relative, { height: chartHeight, width: viewportWidth }]}
        {...gestureContainerProps}
      >
        <ScrollView
          ref={scrollRef}
          {...scrollViewProps}
          style={{ width: viewportWidth, height: chartHeight }}
          contentContainerStyle={{ width: chartWidth, height: chartHeight }}
        >
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
                x1={scaleToX(trendStartX, trendXScale)}
                y1={scaleToY(trendStartY, trendYScale)}
                x2={scaleToX(trendEndX, trendXScale)}
                y2={scaleToY(trendEndY, trendYScale)}
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
                  style={[
                    Platform.OS === 'web' ? styles.touchAreaWeb : styles.touchArea,
                    {
                      left: point.x - touchSize / 2,
                      top: point.y - touchSize / 2,
                      width: touchSize,
                      height: touchSize,
                    },
                  ]}
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

            {/* X-axis labels (Erneuerbare %) */}
            {[0, 1, 2, 3, 4].map(i => {
              const value = minRenewable + (i / 4) * renewableRange;
              const x = leftPadding + (i / 4) * (chartWidth - leftPadding - rightPadding);
              return (
                <Text
                  key={`xlabel-${i}`}
                  style={[
                    styles.xAxisLabel,
                    { left: x - 15, top: chartHeight - (isPhone ? 25 : 30), color: textColor },
                  ]}
                >
                  {value.toFixed(0)}%
                </Text>
              );
            })}

            {/* Axis Labels */}
            <Text
              style={[
                isPhone ? styles.xAxisTitlePhone : styles.xAxisTitleDefault,
                { left: chartWidth / 2 - 60, color: textColor },
              ]}
            >
              {labels.xAxisRenewables}
            </Text>
          </View>
        </ScrollView>

        {/* Y-axis labels - pinned outside the zoomable/scrollable content */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = maxPrice - (i / 4) * priceRange;
          const y = padding + (i / 4) * (chartHeight - padding - bottomPadding);
          return (
            <Text
              key={`ylabel-${i}`}
              style={[
                isPhone ? styles.yAxisLabelPhone : styles.yAxisLabelDefault,
                { top: y - 8, color: textColor },
              ]}
            >
              {value.toFixed(0)}
            </Text>
          );
        })}

        <Text style={getYAxisLabelStyle(chartHeight, -15, textColor, isPhone)}>
          {labels.yAxisPrice}
        </Text>

        {isZoomed && (
          <ZoomResetBadge onPress={resetZoom} colors={colors} accessibilityLabel={t.resetZoom} />
        )}
      </View>
      {insightText && (
        <View style={[styles.insightBox, { borderColor: colors.gridLine }]}>
          <Text style={[styles.insightText, { color: textColor }]}>{insightText}</Text>
        </View>
      )}
      {interactionHint && (
        <Text
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={interactionHint}
          style={[styles.interactionHintText, { color: textColor }]}
        >
          {interactionHint}
        </Text>
      )}
    </ChartCard>
  );
}

// Performance: Wrap with React.memo to prevent unnecessary re-renders
// Only re-renders if props actually change
export const CorrelationScatterChart = React.memo(CorrelationScatterChartComponent);

const styles = StyleSheet.create({
  tooltipValue: { fontSize: 14, fontWeight: 'bold' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  titleColumn: { flex: 1, marginRight: 8 },
  titlePhone: { fontSize: 16, fontWeight: 'bold', marginBottom: 0 },
  titleDefault: { fontSize: 18, fontWeight: 'bold', marginBottom: 0 },
  subtitle: { fontSize: 12, opacity: 0.7, marginBottom: 2 },
  hint: { fontSize: 12, fontStyle: 'italic', opacity: 0.5 },
  legendRow: { flexDirection: 'row', gap: 12, paddingRight: 10, paddingTop: 0 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDotNight: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3' },
  legendDotMorningEvening: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9800' },
  legendDotDay: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFEB3B' },
  legendLabel: { fontSize: 12, opacity: 0.7 },
  relative: { position: 'relative' },
  touchArea: { position: 'absolute', zIndex: 10 },
  touchAreaWeb: { position: 'absolute', zIndex: 10, cursor: 'pointer' },
  xAxisLabel: { position: 'absolute', fontSize: 12, opacity: 0.6 },
  xAxisTitlePhone: {
    position: 'absolute',
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '600',
    bottom: 0,
  },
  xAxisTitleDefault: {
    position: 'absolute',
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '600',
    bottom: 3,
  },
  yAxisLabelPhone: {
    position: 'absolute',
    left: 10,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
    width: 25,
  },
  yAxisLabelDefault: {
    position: 'absolute',
    left: 10,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
    width: 30,
  },
  insightBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  insightText: { fontSize: 12, opacity: 0.7 },
  interactionHintText: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
