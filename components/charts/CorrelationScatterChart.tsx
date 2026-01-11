import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { ThemeColors } from '../../utils/theme';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';
import { useChartDimensions } from '../../utils/chartUtils';

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

export function CorrelationScatterChart({
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

  // Only use entries with both marketPrice and renewableShare, excluding interpolated values
  const validData = data.filter(d =>
    d.marketPrice !== null &&
    d.renewableShare !== null &&
    !d.isMarketPriceInterpolated &&
    !d.isRenewableShareInterpolated
  );

  // Guard against empty data (Division-by-Zero protection)
  if (validData.length === 0) {
    return null;
  }

  const priceInCentValues = validData.map(d => d.marketPrice! * 0.1);
  const renewableValues = validData.map(d => d.renewableShare!);

  const minRenewable = 0;
  const maxRenewable = Math.max(100, ...renewableValues);
  const renewableRange = maxRenewable - minRenewable;

  const minPriceData = Math.min(...priceInCentValues);
  const maxPriceData = Math.max(...priceInCentValues);
  const pricePadding = (maxPriceData - minPriceData) * 0.05;
  const minPrice = Math.max(0, minPriceData - pricePadding);
  const maxPrice = maxPriceData + pricePadding;
  const priceRange = maxPrice - minPrice;

  // Guard against zero range (Division-by-Zero protection)
  if (priceRange === 0 || renewableRange === 0) {
    return null;
  }

  // Lineare Regression
  const n = validData.length;
  const sumX = renewableValues.reduce((sum, v) => sum + v, 0);
  const sumY = priceInCentValues.reduce((sum, v) => sum + v, 0);
  const sumXY = renewableValues.reduce((sum, v, i) => sum + v * priceInCentValues[i], 0);
  const sumX2 = renewableValues.reduce((sum, v) => sum + v * v, 0);

  const denominator = n * sumX2 - sumX * sumX;

  // Guard against division by zero in regression calculation
  if (denominator === 0) {
    return null;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate trend line points that stay within chart bounds
  let trendStartX = minRenewable;
  let trendStartY = intercept + slope * minRenewable;
  let trendEndX = maxRenewable;
  let trendEndY = intercept + slope * maxRenewable;

  // Clip to minPrice boundary
  if (trendStartY < minPrice) {
    trendStartY = minPrice;
    trendStartX = (minPrice - intercept) / slope;
  }
  if (trendEndY < minPrice) {
    trendEndY = minPrice;
    trendEndX = (minPrice - intercept) / slope;
  }

  // Clip to maxPrice boundary
  if (trendStartY > maxPrice) {
    trendStartY = maxPrice;
    trendStartX = (maxPrice - intercept) / slope;
  }
  if (trendEndY > maxPrice) {
    trendEndY = maxPrice;
    trendEndX = (maxPrice - intercept) / slope;
  }

  // Ensure trendStartX <= trendEndX
  if (trendStartX > trendEndX) {
    [trendStartX, trendStartY, trendEndX, trendEndY] = [trendEndX, trendEndY, trendStartX, trendStartY];
  }

  const getTimeColor = (timestamp: number) => {
    const hour = new Date(timestamp).getHours();
    if (hour >= 22 || hour < 6) {
      return '#2196F3';
    } else if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) {
      return '#FF9800';
    } else {
      return '#FFEB3B';
    }
  };

  return (
    <View style={{
      backgroundColor,
      margin,
      padding: cardPadding,
      borderRadius: 18,
      alignSelf: 'stretch',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    }}>
      {selectedIndex !== null && validData[selectedIndex] && (() => {
        const item = validData[selectedIndex];
        const priceInCent = item.marketPrice! * 0.1;
        const renewablePercent = item.renewableShare!;

        // Berechne Position im Chart
        const x = leftPadding + ((renewablePercent - minRenewable) / renewableRange) * (chartWidth - leftPadding - rightPadding);
        const tooltipWidth = 120;
        let tooltipLeft = x - tooltipWidth / 2;

        // Rand-Check
        if (tooltipLeft < 0) tooltipLeft = 8;
        if (tooltipLeft + tooltipWidth > chartWidth) tooltipLeft = chartWidth - tooltipWidth - 8;

        // Use theme colors for proper contrast
        const tooltipBgColor = backgroundColor === colors.surface ? colors.background : colors.surface;

        return (
          <View style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: tooltipBgColor,
            borderWidth: 1,
            borderColor: colors.gridLine,
            borderRadius: 10,
            position: 'absolute',
            top: cardPadding + 30,
            left: tooltipLeft,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 8,
            ...(Platform.OS === 'web' && {
              backdropFilter: 'blur(10px)',
            }),
          }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>
              {new Date(item.timestamp).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        );
      })()}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
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
        {/* Legend - hidden on small devices in portrait mode */}
        {!(isPhone && !isLandscape) && (
          <View style={{
            flexDirection: 'row',
            gap: 12,
            paddingRight: 10,
            paddingTop: 0
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3' }} />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.night}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9800' }} />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.morningEvening}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFEB3B' }} />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.day}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ height: chartHeight, width: chartWidth }}>
        {/* Grid Lines - Modern gestrichelt */}
        <Svg width={chartWidth} height={chartHeight} style={{ position: 'absolute' }}>
          {[0, 1, 2, 3, 4].map(i => {
            const y = padding + (i / 4) * (chartHeight - padding - bottomPadding);
            return (
              <Line
                key={`hgrid-${i}`}
                x1={leftPadding}
                y1={y}
                x2={chartWidth - rightPadding}
                y2={y}
                stroke={gridColor}
                strokeWidth="1"
                strokeDasharray="4,8"
                opacity={0.15}
              />
            );
          })}
          {[0, 1, 2, 3, 4].map(i => {
            const x = leftPadding + (i / 4) * (chartWidth - leftPadding - rightPadding);
            return (
              <Line
                key={`vgrid-${i}`}
                x1={x}
                y1={padding}
                x2={x}
                y2={chartHeight - bottomPadding}
                stroke={gridColor}
                strokeWidth="1"
                strokeDasharray="4,8"
                opacity={0.15}
              />
            );
          })}
        </Svg>

        {/* Scatter Points */}
        <Svg width={chartWidth} height={chartHeight}>
          {/* Trendlinie */}
          <Line
            x1={leftPadding + ((trendStartX - minRenewable) / renewableRange) * (chartWidth - leftPadding - rightPadding)}
            y1={chartHeight - bottomPadding - ((trendStartY - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)}
            x2={leftPadding + ((trendEndX - minRenewable) / renewableRange) * (chartWidth - leftPadding - rightPadding)}
            y2={chartHeight - bottomPadding - ((trendEndY - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)}
            stroke={textColor}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.4}
          />

          {validData.map((d, index) => {
            const priceInCent = (d.marketPrice! * 0.1);
            const x = leftPadding + ((d.renewableShare! - minRenewable) / renewableRange) * (chartWidth - leftPadding - rightPadding);
            const y = chartHeight - bottomPadding - ((priceInCent - minPrice) / priceRange) * (chartHeight - padding - bottomPadding);
            const isSelected = selectedIndex === index;

            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill={getTimeColor(d.timestamp)}
                opacity={isSelected ? 1.0 : 0.7}
                stroke={isSelected ? '#999999' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
            );
          })}
        </Svg>

        {/* Invisible touch/hover areas for points - rendered AFTER SVG */}
        {validData.map((d, index) => {
          const priceInCent = (d.marketPrice! * 0.1);
          const x = leftPadding + ((d.renewableShare! - minRenewable) / renewableRange) * (chartWidth - leftPadding - rightPadding);
          const y = chartHeight - bottomPadding - ((priceInCent - minPrice) / priceRange) * (chartHeight - padding - bottomPadding);
          const touchSize = 24; // Größerer Touch-Bereich für bessere UX

          return (
            <View
              key={`touch-${index}`}
              style={{
                position: 'absolute',
                left: x - touchSize / 2,
                top: y - touchSize / 2,
                width: touchSize,
                height: touchSize,
                zIndex: 10,
                cursor: Platform.OS === 'web' ? 'pointer' : undefined,
              }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={() => setSelectedIndex(index === selectedIndex ? null : index)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setSelectedIndex(index),
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
            bottom: isPhone ? 0 : 3,  // Moved down by 2px for both
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
          style={{ fontSize: 12, color: textColor, opacity: 0.5, fontStyle: 'italic', marginTop: 8 }}
        >
          💡 {interactionHint}
        </Text>
      )}
    </View>
  );
}
