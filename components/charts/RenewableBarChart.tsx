import React, { useState, useMemo } from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';

interface RenewableBarChartProps {
  title: string;
  subtitle?: string;
  data: Array<{
    timestamp: number;
    marketPrice: number | null;
    renewableShare: number | null;
    isRenewableShareInterpolated?: boolean;
  }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  labels: {
    yAxis: string;
    now: string;
    average: string;
  };
  interactionHint?: string;
}

export function RenewableBarChart({
  title,
  subtitle,
  data,
  backgroundColor,
  textColor,
  gridColor,
  labels,
  interactionHint,
}: RenewableBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  // Only use entries with valid renewableShare for rendering bars and calculations
  const validData = data.filter(d => d.renewableShare !== null);
  const values = validData.map(d => d.renewableShare!);
  const dataMax = Math.max(...values);
  const min = 0; // Immer bei 0 starten
  // Y-Achse: Minimum 0-100%, aber erweitere wenn Werte >100%
  const max = dataMax > 100 ? dataMax : 100;
  const range = max - min;

  // Durchschnittswert berechnen
  const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;

  // Letzter gültiger Wert für fade-out Balken
  const lastValidValue = validData.length > 0 ? validData[validData.length - 1].renewableShare! : avgValue;

  const handleBarInteraction = (index: number) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  // Farbcodierung mit fließenden Übergängen
  const getColor = (renewablePercent: number) => {
    const interpolateColor = (color1: number[], color2: number[], factor: number) => {
      const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
      const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
      const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    };

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

  return (
    <View style={{ backgroundColor, margin, padding: cardPadding, borderRadius: 12, alignSelf: 'stretch' }}>
      {selectedIndex !== null && data[selectedIndex]?.renewableShare !== null && (() => {
        const item = data[selectedIndex];
        const renewablePercent = item.renewableShare!;

        // Berechne Position des Tooltips über dem Balken
        const x = leftPadding + ((item.timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
        const tooltipWidth = 80; // Geschätzte Breite
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
              {renewablePercent.toFixed(1)}%
            </Text>
          </View>
        );
      })()}
      <Text style={{ fontSize: isPhone ? 16 : 18, fontWeight: 'bold', marginBottom: 0, color: textColor }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontSize: 12, color: textColor, opacity: 0.7, marginBottom: 2 }}>
          {subtitle}
        </Text>
      )}
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
            const value = d.renewableShare;

            // Render gray fading bar for missing data
            if (value === null) {
              const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
              const barWidth = ((chartWidth - leftPadding - rightPadding) / data.length) * 0.8;

              // Seeded random for consistent but varied heights
              const seed = d.timestamp % 1000;
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
                <React.Fragment key={index}>
                  {Array.from({ length: segments }).map((_, segIndex) => {
                    const segY = fadeY + (segIndex * segmentHeight);
                    // Opacity increases as we go down (from 0.0 at top to 0.25 at bottom)
                    const opacity = 0.25 * (segIndex / (segments - 1));

                    return (
                      <Rect
                        key={`${index}-seg-${segIndex}`}
                        x={x - barWidth / 2}
                        y={segY}
                        width={barWidth}
                        height={segmentHeight}
                        fill={gridColor}
                        opacity={opacity}
                      />
                    );
                  })}
                </React.Fragment>
              );
            }

            const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
            const barWidth = ((chartWidth - leftPadding - rightPadding) / data.length) * 0.8;
            const barHeight = ((value - min) / range) * (chartHeight - padding - bottomPadding);
            const y = chartHeight - bottomPadding - barHeight;
            const isSelected = selectedIndex === index;
            const isInterpolated = d.isRenewableShareInterpolated || false;

            // Dimmed opacity for interpolated values
            const baseOpacity = isInterpolated ? 0.4 : 0.9;
            const selectedOpacity = isInterpolated ? 0.6 : 1.0;

            // Wenn Wert über 100%, Balken zweiteilen
            if (value > 100) {
              const baseHeight = ((100 - min) / range) * (chartHeight - padding - bottomPadding);
              const overHeight = ((value - 100) / range) * (chartHeight - padding - bottomPadding);
              const baseY = chartHeight - bottomPadding - baseHeight;
              const overY = baseY - overHeight;

              return (
                <React.Fragment key={index}>
                  <Rect
                    x={x - barWidth / 2}
                    y={baseY}
                    width={barWidth}
                    height={baseHeight}
                    fill={getColor(100)}
                    opacity={isSelected ? selectedOpacity : baseOpacity}
                    stroke={isSelected ? '#999999' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                  <Rect
                    x={x - barWidth / 2}
                    y={overY}
                    width={barWidth}
                    height={overHeight}
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
                key={index}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={getColor(value)}
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
          const value = d.renewableShare;
          if (value === null) return null;

          const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
          const barWidth = ((chartWidth - leftPadding - rightPadding) / data.length) * 0.8;
          const barHeight = ((value - min) / range) * (chartHeight - padding - bottomPadding);
          const y = chartHeight - bottomPadding - barHeight;

          return (
            <View
              key={`touch-${index}`}
              style={{
                position: 'absolute',
                left: x - barWidth / 2,
                top: y,
                width: barWidth,
                height: barHeight,
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
