import React, { useState, useMemo } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { getYAxisLabelStyle } from '../../utils/chartHelpers';

interface SmardPriceData {
  date_generated: string;
  market_data: {
    today: {
      date: string;
      price_eur_mwh: Array<{ start_timestamp: number; marketprice: number }>;
    };
    tomorrow: {
      date: string;
      price_eur_mwh: Array<{ start_timestamp: number; marketprice: number }>;
    };
  };
}

interface SmardChartProps {
  title: string;
  data: SmardPriceData;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}

export function SmardChart({
  title,
  data,
  backgroundColor,
  textColor,
  gridColor,
}: SmardChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const screenWidth = useMemo(() => Dimensions.get('window').width, []);
  const screenHeight = useMemo(() => Dimensions.get('window').height, []);
  const isSmallScreen = screenWidth < 768;
  const isPhone = screenWidth < 480;

  // Responsive Chart-Größen - Viewport-bewusst für optimale Darstellung
  const leftPadding = isPhone ? 35 : 45;
  const padding = 40;
  const bottomPadding = isPhone ? 40 : 50;

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

  // Kombiniere today und tomorrow Daten
  const allPriceData = [...data.market_data.today.price_eur_mwh, ...data.market_data.tomorrow.price_eur_mwh];

  // Konvertiere Preise von EUR/MWh zu Cent/kWh
  const pricesInCent = allPriceData.map(d => d.marketprice * 0.1);
  const GRID_FEES_AND_TAXES = 20;

  const maxMarketPrice = Math.max(...pricesInCent);
  const maxTotal = maxMarketPrice + GRID_FEES_AND_TAXES;
  const min = Math.min(...pricesInCent, 0);
  const range = maxTotal - min;

  const avgMarketPrice = pricesInCent.reduce((sum, v) => sum + v, 0) / pricesInCent.length;

  const now = Date.now();
  const timestamps = allPriceData.map(d => d.start_timestamp);
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
    <View style={{ backgroundColor, margin, padding: cardPadding, borderRadius: 12, alignSelf: 'stretch' }}>
      {selectedIndex !== null && (() => {
        const item = allPriceData[selectedIndex];
        if (!item) return null;

        const marketPriceCent = item.marketprice * 0.1;
        const totalPrice = marketPriceCent + GRID_FEES_AND_TAXES;

        return (
          <View style={{
            paddingVertical: 4,
            paddingHorizontal: 8,
            backgroundColor: textColor + '20',
            borderRadius: 4,
            marginBottom: 4,
            position: 'absolute',
            top: cardPadding,
            right: cardPadding,
            zIndex: 10,
            maxWidth: chartWidth * 0.6
          }}>
            <Text style={{ color: textColor, fontSize: isPhone ? 12 : 13 }}>
              {new Date(item.start_timestamp).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Text style={{ color: textColor, fontSize: isPhone ? 12 : 13, fontWeight: 'bold' }}>
              Börsenpreis: {marketPriceCent.toFixed(2)} ¢/kWh
            </Text>
            <Text style={{ color: textColor, fontSize: isPhone ? 12 : 13 }}>
              Endpreis: {totalPrice.toFixed(2)} ¢/kWh
            </Text>
          </View>
        );
      })()}
      <Text style={{ fontSize: isPhone ? 16 : 18, fontWeight: 'bold', marginBottom: 2, color: textColor }}>{title}</Text>
      <Text style={{ fontSize: isPhone ? 12 : 14, color: textColor, opacity: 0.7, marginBottom: 8 }}>
        SMARD Daten • Generiert: {new Date(data.date_generated).toLocaleString('de-DE')}
      </Text>
      {/* Y-Achsen-Label */}
      <Text style={getYAxisLabelStyle(chartHeight, 30, textColor)}>
        Börsen- und{'\n'}Endkundenstrompreis (Cent/kWh)
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
          {allPriceData.map((d, index) => {
            const marketPrice = d.marketprice * 0.1;
            const totalPrice = marketPrice + GRID_FEES_AND_TAXES;
            const x = leftPadding + ((d.start_timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
            const barWidth = ((chartWidth - leftPadding) / allPriceData.length) * 0.8;

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
              {value.toFixed(0)}
            </Text>
          );
        })}

        {/* X-axis labels */}
        {(() => {
          const labels = [];
          const startDate = new Date(minTime);
          const endDate = new Date(maxTime);

          const startHour = Math.ceil(startDate.getHours() / 6) * 6;
          const current = new Date(startDate);
          current.setHours(startHour, 0, 0, 0);

          while (current <= endDate) {
            const timestamp = current.getTime();
            const x = leftPadding + ((timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
            const day = current.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
            const hour = current.getHours();

            labels.push(
              <Text
                key={`xlabel-${timestamp}`}
                style={{
                  position: 'absolute',
                  left: x - 20,
                  top: chartHeight + 5,
                  fontSize: 12,
                  color: textColor,
                  opacity: 0.6,
                }}
              >
                {day}
              </Text>
            );
            labels.push(
              <Text
                key={`xlabel-hour-${timestamp}`}
                style={{
                  position: 'absolute',
                  left: x - 10,
                  top: chartHeight + 18,
                  fontSize: 12,
                  color: textColor,
                  opacity: 0.5,
                }}
              >
                {hour}h
              </Text>
            );

            current.setHours(current.getHours() + 12);
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

      {/* Legende */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#4CAF50', marginRight: 4, borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>Börsenpreis</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#757575', marginRight: 4, borderRadius: 2, opacity: 0.6 }} />
          <Text style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>Netzentgelte</Text>
        </View>
      </View>
    </View>
  );
}