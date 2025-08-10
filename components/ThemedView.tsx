import React from 'react';
import { 
  View, 
  StyleSheet, 
  type ViewStyle, 
  type ViewProps, 
  type StyleProp 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  children,
  ...props
}: ThemedViewProps) {
  const { colors } = useTheme();
  
  // Safely get background color with fallbacks
  const backgroundColor = React.useMemo(() => {
    return darkColor || lightColor || colors?.background || '#FFFFFF';
  }, [darkColor, lightColor, colors]);

  // Create base style
  const baseStyle = React.useMemo<ViewStyle>(() => ({
    backgroundColor,
  }), [backgroundColor]);

  return (
    <View 
      style={style ? [baseStyle, style] : baseStyle} 
      {...props}
    >
      {children}
    </View>
  );
}
