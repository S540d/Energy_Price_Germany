import React, { useState, useMemo } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';

interface PriceBarChartProps {
  title: string;
  subtitle?: string;
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}

export function PriceBarChart({
  title,
  subtitle,
  data,
  backgroundColor,
  textColor,
  gridColor,
}: PriceBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const screenWidth = useMemo(() => Dimensions.get('window').width, []);
  const screenHeight = useMemo(() => Dimensions.get('window').height, []);
  const isSmallScreen = screenWidth < 768;
  const isPhone = screenWidth < 480;

  // Responsive Chart-Größen - dynamisch basierend auf Bildschirmhöhe
  // Verfügbare Höhe: Gesamthöhe minus geschätzter Footer/Header (ca. 200px)
  const availableHeight = screenHeight - 200;
  const dynamicHeight = Math.floor(availableHeight / 3); // 3 Charts
  const minHeight = isPhone ? 140 : 160; // Minimum für Lesbarkeit
  const chartHeight = Math.max(minHeight, dynamicHeight);
  const leftPadding = isPhone ? 35 : 45;
  const padding = 40;
  const bottomPadding = isPhone ? 40 : 50;

  // Maximale Chart-Breite basierend auf Bildschirmgröße (5% breiter)
  const maxChartWidth = isPhone
    ? screenWidth - 24  // Fast voller Bildschirm auf Phone
    : isSmallScreen
    ? Math.min(chartHeight * 2.5 * 1.05, screenWidth - 24)
    : Math.min(chartHeight * 3.5 * 1.05, screenWidth - 48);

  const chartWidth = maxChartWidth;

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
    <View style={{ backgroundColor, margin: isPhone ? 6 : 12, padding: isPhone ? 8 : 12, borderRadius: 12, alignSelf: 'stretch' }}>
      {selectedIndex !== null && (() => {
        const item = data[selectedIndex];
        if (!item || item.marketPrice === null) return null;

        const marketPriceCent = item.marketPrice * 0.1;
        const totalPrice = marketPriceCent + GRID_FEES_AND_TAXES;

        return (
          <View style={{
            paddingVertical: 4,
            paddingHorizontal: 8,
            backgroundColor: textColor + '20',
            borderRadius: 4,
            marginBottom: 4,
            position: 'absolute',
            top: isPhone ? 8 : 12,
            right: isPhone ? 8 : 12,
            zIndex: 10,
            maxWidth: chartWidth * 0.6
          }}>
            <Text style={{ color: textColor, fontSize: 12 }}>
              {new Date(item.timestamp).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Text style={{ color: textColor, fontSize: 12, fontWeight: 'bold' }}>
              Börsenpreis: {marketPriceCent.toFixed(2)} ¢/kWh
            </Text>
            <Text style={{ color: textColor, fontSize: 12 }}>
              Endpreis: {totalPrice.toFixed(2)} ¢/kWh
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
      {/* Y-Achsen-Label */}
      <Text style={getYAxisLabelStyle(chartHeight, 30, textColor)}>
        Preis (¢/kWh)
      </Text>
      <View style={{ height: chartHeight + bottomPadding, width: chartWidth, position: 'relative' }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - padding);
          return (
            <View
              key={`grid-${i}`}
              style={{
                position: 'absolute',
                left: leftPadding,
                top: y,
                width: chartWidth - leftPadding,
                height: 1,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Bars */}
        <Svg width={chartWidth} height={chartHeight + bottomPadding}>
          {data.map((d, index) => {
            const marketPrice = d.marketPrice !== null ? d.marketPrice * 0.1 : null;
            if (marketPrice === null) return null;

            const totalPrice = marketPrice + GRID_FEES_AND_TAXES;
            const x = leftPadding + ((d.timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
            const barWidth = ((chartWidth - leftPadding) / data.length) * 0.8;

            const marketBarHeight = ((marketPrice - min) / range) * (chartHeight - padding);
            const marketY = chartHeight - marketBarHeight;

            const gridBarHeight = (GRID_FEES_AND_TAXES / range) * (chartHeight - padding);
            const gridY = marketY - gridBarHeight;

            const isSelected = selectedIndex === index;

            return (
              <React.Fragment key={index}>
                {/* Invisible touchable area for each bar */}
                <TouchableOpacity
                  key={`touch-${index}`}
                  style={{
                    position: 'absolute',
                    left: x - barWidth / 2,
                    top: gridY,
                    width: barWidth,
                    height: marketBarHeight + gridBarHeight,
                  }}
                  onPress={() => {
                    setSelectedIndex(index === selectedIndex ? null : index);
                  }}
                  activeOpacity={1}
                />
                <Rect
                  x={x - barWidth / 2}
                  y={marketY}
                  width={barWidth}
                  height={marketBarHeight}
                  fill={getColor(totalPrice)}
                  opacity={isSelected ? 1.0 : 0.9}
                  stroke={isSelected ? textColor : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
                <Rect
                  x={x - barWidth / 2}
                  y={gridY}
                  width={barWidth}
                  height={gridBarHeight}
                  fill="#757575"
                  opacity={isSelected ? 0.8 : 0.6}
                  stroke={isSelected ? textColor : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
              </React.Fragment>
            );
          })}

          {/* Durchschnittslinie */}
          <Line
            x1={leftPadding}
            y1={chartHeight - ((avgMarketPrice - min) / range) * (chartHeight - padding)}
            x2={chartWidth}
            y2={chartHeight - ((avgMarketPrice - min) / range) * (chartHeight - padding)}
            stroke={textColor}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.5}
          />

          {/* "Jetzt" Markierung */}
          {now >= minTime && now <= maxTime && (
            <Line
              x1={leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding)}
              y1={padding}
              x2={leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding)}
              y2={chartHeight}
              stroke="red"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </Svg>

        {/* Durchschnittslinie Label */}
        <Text
          style={{
            position: 'absolute',
            left: chartWidth - (isPhone ? 50 : 60),
            top: chartHeight - ((avgMarketPrice - min) / range) * (chartHeight - padding) - 12,
            fontSize: 12,
            color: textColor,
            fontWeight: '600',
            opacity: 0.7,
          }}
        >
          Ø {avgMarketPrice.toFixed(2)} ¢
        </Text>

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = maxTotal - (i / 4) * range;
          const y = padding + (i / 4) * (chartHeight - padding);
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
              {value.toFixed(1)}
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
            const x = leftPadding + ((timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
            const hour = current.getHours();

            labels.push(
              <Text
                key={`xlabel-${timestamp}`}
                style={{
                  position: 'absolute',
                  left: x - 10,
                  top: chartHeight + 5,
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
              left: leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding) - 15,
              top: chartHeight + 20,
              fontSize: 12,
              color: 'red',
              fontWeight: 'bold',
            }}
          >
            Jetzt
          </Text>
        )}
      </View>
    </View>
  );
}
