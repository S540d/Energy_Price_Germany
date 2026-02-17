import React from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';

interface ChartCardProps {
  backgroundColor: string;
  margin: number;
  cardPadding: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

function ChartCardComponent({
  backgroundColor,
  margin,
  cardPadding,
  children,
  style,
}: ChartCardProps) {
  return (
    <View
      style={{
        backgroundColor,
        margin,
        padding: cardPadding,
        borderRadius: 16,
        alignSelf: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

export const ChartCard = React.memo(ChartCardComponent);
