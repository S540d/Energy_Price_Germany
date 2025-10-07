import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';

interface PriceBarChartProps {
  title: string;
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}

export function PriceBarChart({
  title,
  data,
  backgroundColor,
  textColor,
  gridColor,
}: PriceBarChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 180;
  const leftPadding = 45;
  const padding = 40;
  const bottomPadding = 50;
  const maxChartWidth = Math.min(chartHeight * 3.5, screenWidth - 48);
  const chartWidth = maxChartWidth;

  const pricesInCent = data.map(d => d.marketPrice !== null ? d.marketPrice * 0.1 : null);
  const GRID_FEES_AND_TAXES = 20;

  const validPrices = pricesInCent.filter(p => p !== null) as number[];
  const maxMarketPrice = Math.max(...validPrices);
  const maxTotal = maxMarketPrice + GRID_FEES_AND_TAXES;
  const min = Math.min(...validPrices, 0);
  const range = maxTotal - min;

  const avgMarketPrice = validPrices.reduce((sum, v) => sum + v, 0) / validPrices.length;

  const now = Date.now();
  const timestamps = data.map(d => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;

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
    <View style={{ backgroundColor, margin: 12, padding: 12, borderRadius: 12, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 2, color: textColor }}>{title}</Text>
      {/* Y-Achsen-Label */}
      <Text style={getYAxisLabelStyle(chartHeight, 30, textColor)}>
        Börsen- und{'\n'}Endkundenstrompreis (Cent/kWh)
      </Text>
      <View style={{ height: chartHeight + bottomPadding, width: chartWidth }}>
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

            return (
              <React.Fragment key={index}>
                <Rect
                  x={x - barWidth / 2}
                  y={marketY}
                  width={barWidth}
                  height={marketBarHeight}
                  fill={getColor(totalPrice)}
                  opacity={0.9}
                />
                <Rect
                  x={x - barWidth / 2}
                  y={gridY}
                  width={barWidth}
                  height={gridBarHeight}
                  fill="#757575"
                  opacity={0.6}
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
            left: chartWidth - 60,
            top: chartHeight - ((avgMarketPrice - min) / range) * (chartHeight - padding) - 12,
            fontSize: 10,
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
                left: 8,
                top: y - 8,
                fontSize: 10,
                color: textColor,
                opacity: 0.6,
                textAlign: 'right',
                width: 30,
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
                  fontSize: 10,
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
              fontSize: 10,
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
