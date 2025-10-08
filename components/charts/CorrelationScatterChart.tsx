import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';

interface CorrelationScatterChartProps {
  title: string;
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}

export function CorrelationScatterChart({
  title,
  data,
  backgroundColor,
  textColor,
  gridColor,
}: CorrelationScatterChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 180;
  const leftPadding = 45;
  const padding = 50;
  const rightPadding = 50;
  const bottomPadding = 40;
  const maxChartWidth = Math.min(chartHeight * 3.5, screenWidth - 48);
  const chartWidth = maxChartWidth;

  const validData = data.filter(d => d.marketPrice !== null && d.renewableShare !== null);

  const priceInCentValues = validData.map(d => (d.marketPrice as number) * 0.1);
  const renewableValues = validData.map(d => d.renewableShare as number);

  const minRenewable = 0;
  const maxRenewable = Math.max(100, ...renewableValues);
  const renewableRange = maxRenewable - minRenewable;

  const minPriceData = Math.min(...priceInCentValues);
  const maxPriceData = Math.max(...priceInCentValues);
  const pricePadding = (maxPriceData - minPriceData) * 0.05;
  const minPrice = Math.max(0, minPriceData - pricePadding);
  const maxPrice = maxPriceData + pricePadding;
  const priceRange = maxPrice - minPrice;

  // Lineare Regression
  const n = validData.length;
  const sumX = renewableValues.reduce((sum, v) => sum + v, 0);
  const sumY = priceInCentValues.reduce((sum, v) => sum + v, 0);
  const sumXY = renewableValues.reduce((sum, v, i) => sum + v * priceInCentValues[i], 0);
  const sumX2 = renewableValues.reduce((sum, v) => sum + v * v, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

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
    <View style={{ backgroundColor, margin: 12, padding: 12, borderRadius: 12, alignSelf: 'flex-start' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 0, color: textColor }}>{title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2196F3' }} />
            <Text style={{ fontSize: 9, color: textColor, opacity: 0.7 }}>Nacht</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9800' }} />
            <Text style={{ fontSize: 9, color: textColor, opacity: 0.7 }}>M/A</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFEB3B' }} />
            <Text style={{ fontSize: 9, color: textColor, opacity: 0.7 }}>Tag</Text>
          </View>
        </View>
      </View>
      <View style={{ height: chartHeight, width: chartWidth }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - padding - bottomPadding);
          return (
            <View
              key={`hgrid-${i}`}
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

        {[0, 1, 2, 3, 4].map(i => {
          const x = leftPadding + (i / 4) * (chartWidth - leftPadding - rightPadding);
          return (
            <View
              key={`vgrid-${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: padding,
                width: 1,
                height: chartHeight - padding - bottomPadding,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Scatter Points */}
        <Svg width={chartWidth} height={chartHeight}>
          {/* Trendlinie */}
          <Line
            x1={leftPadding}
            y1={chartHeight - bottomPadding - ((intercept + slope * minRenewable - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)}
            x2={chartWidth - rightPadding}
            y2={chartHeight - bottomPadding - ((intercept + slope * maxRenewable - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)}
            stroke={textColor}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.4}
          />

          {validData.map((d, index) => {
            const priceInCent = (d.marketPrice! * 0.1);
            const x = leftPadding + ((d.renewableShare! - minRenewable) / renewableRange) * (chartWidth - leftPadding - rightPadding);
            const y = chartHeight - bottomPadding - ((priceInCent - minPrice) / priceRange) * (chartHeight - padding - bottomPadding);

            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill={getTimeColor(d.timestamp)}
                opacity={0.7}
              />
            );
          })}
        </Svg>

        {/* Y-axis labels (Preis) */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = maxPrice - (i / 4) * priceRange;
          const y = padding + (i / 4) * (chartHeight - padding - bottomPadding);
          return (
            <Text
              key={`ylabel-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: y - 8,
                fontSize: 10,
                color: textColor,
                opacity: 0.6,
                textAlign: 'right',
                width: leftPadding - 5,
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
                top: chartHeight - 30,
                fontSize: 10,
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
            bottom: 5,
            fontSize: 11,
            color: textColor,
            fontWeight: '600',
          }}
        >
          Erneuerbare (%)
        </Text>
        <Text style={getYAxisLabelStyle(chartHeight, 0, textColor)}>
          Preis{'\n'}(¢/kWh)
        </Text>
      </View>
    </View>
  );
}
