
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface HeartIconProps {
  size?: number;
  color?: string;
}

export function HeartIcon({ size = 32, color = '#FFFFFF' }: HeartIconProps) {
  const heartSize = size * 0.7;
  const borderWidth = 2;
  const circleSize = heartSize * 0.5;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Heart shape - simplified with two circles and a rotated square */}
      <View style={[styles.heartShape, { 
        width: heartSize, 
        height: heartSize * 0.9,
      }]}>
        {/* Left circle with black border */}
        <View style={[styles.circle, {
          backgroundColor: color,
          borderColor: '#000000',
          borderWidth: borderWidth,
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          left: 0,
          top: 0,
        }]} />
        {/* Right circle with black border */}
        <View style={[styles.circle, {
          backgroundColor: color,
          borderColor: '#000000',
          borderWidth: borderWidth,
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          right: 0,
          top: 0,
        }]} />
        {/* Bottom point - rotated square */}
        <View style={[styles.heartBottom, {
          backgroundColor: color,
          borderColor: '#000000',
          borderWidth: borderWidth,
          width: circleSize * 0.7,
          height: circleSize * 0.7,
          top: circleSize * 0.5,
          left: heartSize / 2 - (circleSize * 0.35),
          transform: [{ rotate: '45deg' }],
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heartShape: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  circle: {
    position: 'absolute',
  },
  heartBottom: {
    position: 'absolute',
  },
});

