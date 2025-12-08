import { TextInput, type TextInputProps, StyleSheet, Platform } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  placeholderTextColor,
  ...otherProps
}: ThemedTextInputProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const defaultPlaceholderColor = useThemeColor({}, 'icon');

  return (
    <TextInput
      style={[
        styles.input,
        {
          color: textColor,
          backgroundColor: backgroundColor,
          borderColor: textColor + '20', // 20% opacity
        },
        style,
      ]}
      placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    ...Platform.select({
      ios: {
        paddingVertical: 16,
      },
      android: {
        paddingVertical: 0,
        textAlignVertical: 'center',
      },
    }),
  },
});

