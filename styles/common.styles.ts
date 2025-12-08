/**
 * Estilos comuns reutilizáveis
 * Use estes estilos como base para componentes similares
 */

import { StyleSheet } from 'react-native';
import { BorderRadius, Shadows, Spacing } from './spacing';

export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Cards
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  cardCompact: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  
  // Buttons
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  
  // Inputs
  input: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  
  // Dividers
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.1,
  },
  dividerVertical: {
    width: 1,
    height: '100%',
    opacity: 0.1,
  },
  
  // Spacing utilities
  marginTopSm: { marginTop: Spacing.sm },
  marginTopMd: { marginTop: Spacing.md },
  marginTopLg: { marginTop: Spacing.lg },
  marginBottomSm: { marginBottom: Spacing.sm },
  marginBottomMd: { marginBottom: Spacing.md },
  marginBottomLg: { marginBottom: Spacing.lg },
  paddingSm: { padding: Spacing.sm },
  paddingMd: { padding: Spacing.md },
  paddingLg: { padding: Spacing.lg },
});

