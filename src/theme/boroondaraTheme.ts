import { createTheme, ITheme } from '@fluentui/react';

/**
 * Boroondara light theme (Fluent UI v8).
 * Government-style: white backgrounds, teal-green accents, clean and accessible.
 */
export const boroondaraPalette = {
  bg: '#FFFFFF',
  bg2: '#F5F7FA',
  panel: '#FFFFFF',
  panel2: '#F0F2F5',
  border: '#D1D5DB',
  borderSoft: '#E5E7EB',
  text: '#1A1A2E',
  text2: '#4A5568',
  text3: '#718096',
  primary: '#00695C',
  accent: '#00897B',
};

export const boroondaraTheme: ITheme = createTheme({
  palette: {
    themePrimary: '#00695C',
    themeLighterAlt: '#F0FAF9',
    themeLighter: '#C8EDE9',
    themeLight: '#9EDDD7',
    themeTertiary: '#4DB8AD',
    themeSecondary: '#0F9688',
    themeDarkAlt: '#005E52',
    themeDark: '#004F45',
    themeDarker: '#003A33',

    neutralLighterAlt: '#FAFAFA',
    neutralLighter: '#F5F7FA',
    neutralLight: '#E5E7EB',
    neutralQuaternaryAlt: '#D1D5DB',
    neutralQuaternary: '#C4C9D0',
    neutralTertiaryAlt: '#B0B7BF',
    neutralTertiary: '#9CA3AF',
    neutralSecondary: '#718096',
    neutralPrimaryAlt: '#4A5568',
    neutralPrimary: '#1A1A2E',
    neutralDark: '#1A1A2E',

    black: '#000000',
    white: '#FFFFFF',
  },
  semanticColors: {
    bodyBackground: '#FFFFFF',
    bodyBackgroundChecked: '#F5F7FA',
    bodyStandoutBackground: '#F5F7FA',

    bodyText: '#1A1A2E',
    bodyTextChecked: '#1A1A2E',
    disabledBodyText: '#9CA3AF',
    bodySubtext: '#4A5568',

    link: '#00695C',
    linkHovered: '#004F45',

    listBackground: '#FFFFFF',
    listText: '#1A1A2E',
    listItemBackgroundHovered: '#F5F7FA',

    inputBackground: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputBorderHovered: '#9CA3AF',
    inputText: '#1A1A2E',
    inputPlaceholderText: '#718096',

    menuBackground: '#FFFFFF',
    menuDivider: '#E5E7EB',
    menuItemBackgroundHovered: '#F5F7FA',
    menuItemBackgroundPressed: '#E5E7EB',
    menuItemText: '#1A1A2E',
    menuItemTextHovered: '#1A1A2E',

    variantBorder: '#E5E7EB',
    variantBorderHovered: '#9CA3AF',
  },
  defaultFontStyle: {
    fontFamily:
      "'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif",
  },
});
