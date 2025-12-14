import React, { useState, useMemo } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Platform } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';

interface PriceBarChartProps {
  title: string;
  subtitle?: string;
  data: Array<{
    timestamp: number;
    marketPrice: number | null;
    renewableShare: number | null;
    isMarketPriceInterpolated?: boolean;
  }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  labels: {
    yAxis: string;
    now: string;
    average: string;
    marketPrice: string;
    gridFeesAndTaxes: string;
    interpolated: string;
  };
  interactionHint?: string;
}

export function PriceBarChart({
  title,
  subtitle,
  data,
  backgroundColor,
  textColor,
  gridColor,
  labels,
  interactionHint,
}: PriceBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleBarInteraction = (index: number) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  const screenWidth = useMemo(() => Dimensions.get('window').width, []);
  const screenHeight = useMemo(() => Dimensions.get('window').height, []);
  const isSmallScreen = screenWidth < 768;
  const isPhone = screenWidth < 480;

  // Responsive Chart-Größen - Viewport-bewusst für optimale Darstellung
  const leftPadding = isPhone ? 35 : 45;
  const padding = 40;
  const rightPadding = isPhone ? 20 : 50;  // Halved for phone to reduce right margin
  const bottomPadding = isPhone ? 35 : 40;

  // Margins (8px Grid)
  const margin = isPhone ? 8 : 16;
  const cardPadding = isPhone ? 12 : 16;

  // Breite: Nutze verfügbare Bildschirmbreite optimal (minus Margins)
  const chartWidth = screenWidth - (margin * 2);

  // Höhe: Viewport-bewusst, sodass alle 3 Charts gut sichtbar sind
  const baseAspectRatio = 2.5;
  const availableHeight = screenHeight - 200; // Header + Overhead
  const maxChartHeight = availableHeight / 3.3; // 3 Charts + Gaps
  const absoluteMaxHeight = isPhone ? 200 : isSmallScreen ? 280 : 320; // Absolute Obergrenze
  const chartHeight = Math.round(Math.min(
    chartWidth / baseAspectRatio,
    maxChartHeight,
    absoluteMaxHeight
  ));

  // Use ALL data timestamps for consistent X-axis range across all charts
  const now = Date.now();
  const timestamps = data.map(d => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;

  // Only use entries with valid marketPrice for rendering bars and calculations
  const validData = data.filter(d => d.marketPrice !== null);
  const pricesInCent = validData.map(d => d.marketPrice! * 0.1);
  const GRID_FEES_AND_TAXES = 18;

  const maxMarketPrice = Math.max(...pricesInCent);
  const maxTotal = maxMarketPrice + GRID_FEES_AND_TAXES;
  const min = Math.min(...pricesInCent, 0);
  const range = maxTotal - min;

  const avgMarketPrice = pricesInCent.reduce((sum, v) => sum + v, 0) / pricesInCent.length;

  const getColor = (totalPrice: number) => {
    const interpolateColor = (color1: number[], color2: number[], factor: number) => {
      const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
      const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
      const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const green = [76, 175, 80];
    const yellow = [255, 193, 7];
    const red = [244, 67, 54];

    if (totalPrice < 25) {
      return '#4CAF50';
    } else if (totalPrice < 35) {
      const factor = (totalPrice - 25) / 10;
      return interpolateColor(green, yellow, factor);
    } else if (totalPrice < 50) {
      const factor = (totalPrice - 35) / 15;
      return interpolateColor(yellow, red, factor);
    } else {
      return '#F44336';
    }
  };

  return (
    <View style={{ backgroundColor, margin, padding: cardPadding, borderRadius: 12, alignSelf: 'stretch' }}>
      {selectedIndex !== null && (() => {
        const item = data[selectedIndex];
        if (!item || item.marketPrice === null) return null;

        const marketPriceCent = item.marketPrice * 0.1;
        const totalPrice = marketPriceCent + GRID_FEES_AND_TAXES;

        // Berechne Position des Tooltips über dem Balken
        const x = leftPadding + ((item.timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
        const tooltipWidth = 100; // Geschätzte Breite
        let tooltipLeft = x - tooltipWidth / 2;

        // Rand-Check: Tooltip darf nicht über den Rand hinaus
        if (tooltipLeft < 0) tooltipLeft = 8;
        if (tooltipLeft + tooltipWidth > chartWidth) tooltipLeft = chartWidth - tooltipWidth - 8;

        return (
          <View style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: textColor,
            borderRadius: 6,
            position: 'absolute',
            top: cardPadding + 30,
            left: tooltipLeft,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Text style={{ color: textColor, fontSize: 14, fontWeight: 'bold' }}>
              {totalPrice.toFixed(2)} ¢/kWh
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
        {!isPhone && (
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#4CAF50' }} />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.marketPrice}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#757575' }} />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.gridFeesAndTaxes}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#4CAF50', opacity: 0.4 }} />
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>{labels.interpolated}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ height: chartHeight, width: chartWidth, position: 'relative' }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - padding - bottomPadding);
          return (
            <View
              key={`grid-${i}`}
              style={{
                position: 'absolute',
                left: leftPadding,
                top: y,
                width: chartWidth - leftPadding - rightPadding,
                height: 1,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Bars (SVG) */}
        <Svg width={chartWidth} height={chartHeight}>
          {data.map((d, index) => {
            const marketPrice = d.marketPrice !== null ? d.marketPrice * 0.1 : null;

            // Render dashed placeholder for missing data
            if (marketPrice === null) {
              const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
              const barWidth = ((chartWidth - leftPadding - rightPadding) / data.length) * 0.8;

              return (
                <Rect
                  key={index}
                  x={x - barWidth / 2}
                  y={padding}
                  width={barWidth}
                  height={chartHeight - padding - bottomPadding}
                  fill="none"
                  stroke={gridColor}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity={0.3}
                />
              );
            }

            const totalPrice = marketPrice + GRID_FEES_AND_TAXES;
            const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
            const barWidth = ((chartWidth - leftPadding - rightPadding) / data.length) * 0.8;

            const marketBarHeight = ((marketPrice - min) / range) * (chartHeight - padding - bottomPadding);
            const marketY = chartHeight - bottomPadding - marketBarHeight;

            const gridBarHeight = (GRID_FEES_AND_TAXES / range) * (chartHeight - padding - bottomPadding);
            const gridY = marketY - gridBarHeight;

            const isSelected = selectedIndex === index;
            const isInterpolated = d.isMarketPriceInterpolated || false;

            // Dimmed opacity for interpolated values
            const baseOpacity = isInterpolated ? 0.4 : 0.9;
            const selectedOpacity = isInterpolated ? 0.6 : 1.0;

            return (
              <React.Fragment key={index}>
                <Rect
                  x={x - barWidth / 2}
                  y={marketY}
                  width={barWidth}
                  height={marketBarHeight}
                  fill={getColor(totalPrice)}
                  opacity={isSelected ? selectedOpacity : baseOpacity}
                  stroke={isSelected ? '#999999' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
                <Rect
                  x={x - barWidth / 2}
                  y={gridY}
                  width={barWidth}
                  height={gridBarHeight}
                  fill="#757575"
                  opacity={isSelected ? (isInterpolated ? 0.5 : 0.8) : (isInterpolated ? 0.3 : 0.6)}
                  stroke={isSelected ? '#999999' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
              </React.Fragment>
            );
          })}

          {/* Durchschnittslinie */}
          <Line
            x1={leftPadding}
            y1={chartHeight - bottomPadding - ((avgMarketPrice - min) / range) * (chartHeight - padding - bottomPadding)}
            x2={chartWidth - rightPadding}
            y2={chartHeight - bottomPadding - ((avgMarketPrice - min) / range) * (chartHeight - padding - bottomPadding)}
            stroke={textColor}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.5}
          />

          {/* "Jetzt" Markierung */}
          {now >= minTime && now <= maxTime && (
            <Line
              x1={leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding)}
              y1={padding}
              x2={leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding)}
              y2={chartHeight - bottomPadding}
              stroke="red"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </Svg>

        {/* Invisible touch/hover areas for bars - rendered AFTER SVG to receive events */}
        {data.map((d, index) => {
          const marketPrice = d.marketPrice !== null ? d.marketPrice * 0.1 : null;
          if (marketPrice === null) return null;

          const totalPrice = marketPrice + GRID_FEES_AND_TAXES;
          const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
          const barWidth = ((chartWidth - leftPadding - rightPadding) / data.length) * 0.8;

          const marketBarHeight = ((marketPrice - min) / range) * (chartHeight - padding - bottomPadding);
          const marketY = chartHeight - bottomPadding - marketBarHeight;

          const gridBarHeight = (GRID_FEES_AND_TAXES / range) * (chartHeight - padding - bottomPadding);
          const gridY = marketY - gridBarHeight;

          return (
            <View
              key={`touch-${index}`}
              style={{
                position: 'absolute',
                left: x - barWidth / 2,
                top: gridY,
                width: barWidth,
                height: marketBarHeight + gridBarHeight,
                zIndex: 10,
                cursor: Platform.OS === 'web' ? 'pointer' : undefined,
              }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={() => handleBarInteraction(index)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setSelectedIndex(index),
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
            top: chartHeight - bottomPadding - ((avgMarketPrice - min) / range) * (chartHeight - padding - bottomPadding) - 12,
            fontSize: 12,
            color: textColor,
            fontWeight: '600',
            opacity: 0.7,
          }}
        >
          {labels.average} {avgMarketPrice.toFixed(2)} ¢
        </Text>

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = maxTotal - (i / 4) * range;
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

        {/* X-axis labels */}
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
          <Text
            style={{
              position: 'absolute',
              left: leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding) - 15,
              top: chartHeight - bottomPadding + 20,
              fontSize: 12,
              color: 'red',
              fontWeight: 'bold',
            }}
          >
            {labels.now}
          </Text>
        )}

        {/* Y-Achsen-Label */}
        <Text style={getYAxisLabelStyle(chartHeight, -15, textColor, isPhone)}>
          {labels.yAxis}
        </Text>
      </View>
    </View>
  );
}
