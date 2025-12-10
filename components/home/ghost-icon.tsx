
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface GhostIconProps {
  size?: number;
  color?: string;
}

export function GhostIcon({ size = 32, color = '#FFFFFF' }: GhostIconProps) {
  const eyeSize = size * 0.12;
  const eyeGap = size * 0.18;
  const bodyWidth = size * 0.8;
  const bodyHeight = size * 0.7;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.ghostBody, { 
        backgroundColor: color, 
        width: bodyWidth, 
        height: bodyHeight,
        borderTopLeftRadius: bodyWidth / 2,
        borderTopRightRadius: bodyWidth / 2,
        borderColor: '#000000',
        borderWidth: 2,
      }]}>
        {/* Eyes */}
        <View style={[styles.eyesContainer, { 
          gap: eyeGap, 
          marginTop: size * 0.12,
        }]}>
          <View style={[styles.eye, { 
            backgroundColor: '#000000', 
            width: eyeSize, 
            height: eyeSize, 
            borderRadius: eyeSize / 2 
          }]} />
          <View style={[styles.eye, { 
            backgroundColor: '#000000', 
            width: eyeSize, 
            height: eyeSize, 
            borderRadius: eyeSize / 2 
          }]} />
        </View>
        {/* Mouth */}
        <View style={[styles.mouth, { 
          borderColor: '#000000', 
          borderWidth: size * 0.03,
          width: size * 0.28,
          height: size * 0.1,
          marginTop: size * 0.06,
        }]} />
      </View>
      {/* Bottom waves (ghost tail) */}
      <View style={[styles.wavesContainer, { 
        marginTop: -size * 0.08,
        width: bodyWidth,
      }]}>
        <View style={[styles.wave, { 
          backgroundColor: color, 
          width: size * 0.24, 
          height: size * 0.14,
          borderBottomLeftRadius: size * 0.12,
          borderBottomRightRadius: size * 0.12,
          borderColor: '#000000',
          borderWidth: 2,
          borderTopWidth: 0,
        }]} />
        <View style={[styles.wave, { 
          backgroundColor: color, 
          width: size * 0.24, 
          height: size * 0.14,
          borderBottomLeftRadius: size * 0.12,
          borderBottomRightRadius: size * 0.12,
          borderColor: '#000000',
          borderWidth: 2,
          borderTopWidth: 0,
        }]} />
        <View style={[styles.wave, { 
          backgroundColor: color, 
          width: size * 0.24, 
          height: size * 0.14,
          borderBottomLeftRadius: size * 0.12,
          borderBottomRightRadius: size * 0.12,
          borderColor: '#000000',
          borderWidth: 2,
          borderTopWidth: 0,
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBody: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'visible',
  },
  eyesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    // Styles applied inline
  },
  mouth: {
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  wavesContainer: {
    flexDirection: 'row',
    gap: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 0,
  },
  wave: {
    // Styles applied inline
  },
});

