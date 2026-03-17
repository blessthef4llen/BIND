// constants/theme.ts — PULSE design token system
// Translates CSS variables from pulse-app.html

export const Colors = {
  teal:         '#1D9E75',
  tealLight:    '#E1F5EE',
  tealMid:      '#5DCAA5',
  tealDark:     '#085041',
  coral:        '#D85A30',
  coralLight:   '#FAECE7',
  amber:        '#EF9F27',
  amberLight:   '#FAEEDA',
  redLight:     '#FCEBEB',
  red:          '#E24B4A',
  bg:           '#F6FAF8',
  surface:      '#FFFFFF',
  surface2:     '#F0F7F4',
  border:       'rgba(29,158,117,0.15)',
  borderStrong: 'rgba(29,158,117,0.3)',
  text:         '#1A2E26',
  textMuted:    '#5A7A6E',
  textFaint:    '#96B5AB',
  darkBg:       '#0D2E1F',
};

export const Radius = {
  xs:   6,
  sm:   10,
  md:   16,
  pill: 20,
  full: 9999,
};

export const Fonts = {
  serif:       'DMSerifDisplay_400Regular',
  sans:        'DMSans_400Regular',
  sansMedium:  'DMSans_500Medium',
  sansLight:   'DMSans_300Light',
  sansSemiBold:'DMSans_600SemiBold',
};

// Typography scale — unitless numbers for React Native
export const FontSize = {
  tiny:    11,  // 0.68–0.72rem
  small:   12,  // 0.74–0.78rem
  body:    14,  // 0.84–0.88rem
  regular: 15,
  section: 11,  // section headers — uppercase + letterSpacing
  title:   26,  // screen titles (1.6rem)
  display: 38,  // hero serif (2.4rem)
  wordmark:42,  // "pulse" wordmark (2.6rem)
};
