import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

// Base guideline dimensions based on standard modern smartphone (iPhone X / 13 / 14 baseline)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Scales a dimension horizontally based on the current device screen width.
 */
export function scale(size: number): number {
  const currentWidth = Dimensions.get('window').width;
  return (currentWidth / GUIDELINE_BASE_WIDTH) * size;
}

/**
 * Scales a dimension vertically based on the current device screen height.
 */
export function verticalScale(size: number): number {
  const currentHeight = Dimensions.get('window').height;
  return (currentHeight / GUIDELINE_BASE_HEIGHT) * size;
}

/**
 * Moderately scales a dimension with a dampening factor (default 0.5)
 * so sizes do not grow or shrink excessively on extreme screen sizes.
 */
export function moderateScale(size: number, factor = 0.5): number {
  const currentWidth = Dimensions.get('window').width;
  const scaled = (currentWidth / GUIDELINE_BASE_WIDTH) * size;
  return size + (scaled - size) * factor;
}

/**
 * Calculates a responsive font size, capped with upper and lower thresholds
 * to avoid clipping and keep text legible.
 */
export function fontScale(size: number): number {
  const currentWidth = Dimensions.get('window').width;
  const scaleFactor = currentWidth / GUIDELINE_BASE_WIDTH;
  const newSize = size * scaleFactor;
  // Cap font scaling between 0.85x and 1.35x
  const minSize = size * 0.85;
  const maxSize = size * 1.35;
  const boundedSize = Math.max(minSize, Math.min(maxSize, newSize));
  return Math.round(PixelRatio.roundToNearestPixel(boundedSize));
}

/**
 * Returns width as a percentage of device screen width.
 */
export function wp(percentage: number): number {
  const currentWidth = Dimensions.get('window').width;
  return (percentage * currentWidth) / 100;
}

/**
 * Returns height as a percentage of device screen height.
 */
export function hp(percentage: number): number {
  const currentHeight = Dimensions.get('window').height;
  return (percentage * currentHeight) / 100;
}

/**
 * Device type classifications based on current viewport.
 */
export const isSmallDevice = SCREEN_WIDTH < 360;
export const isTablet = SCREEN_WIDTH >= 768 || (SCREEN_WIDTH >= 600 && SCREEN_HEIGHT / SCREEN_WIDTH < 1.6);

/**
 * React hook that reactively updates dimensions, orientation, and scaling functions
 * upon device rotation or screen resizing (e.g. iPad split-screen, foldables).
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isPortrait = height >= width;
  const isTab = width >= 768 || (width >= 600 && height / width < 1.6);
  const isSmall = width < 360;

  const rScale = (size: number) => (width / GUIDELINE_BASE_WIDTH) * size;
  const rVerticalScale = (size: number) => (height / GUIDELINE_BASE_HEIGHT) * size;
  const rModerateScale = (size: number, factor = 0.5) => size + (rScale(size) - size) * factor;
  const rFontScale = (size: number) => {
    const scaleFactor = width / GUIDELINE_BASE_WIDTH;
    const newSize = size * scaleFactor;
    const minSize = size * 0.85;
    const maxSize = size * 1.35;
    return Math.round(PixelRatio.roundToNearestPixel(Math.max(minSize, Math.min(maxSize, newSize))));
  };
  const rWp = (pct: number) => (pct * width) / 100;
  const rHp = (pct: number) => (pct * height) / 100;

  return {
    width,
    height,
    isPortrait,
    isTablet: isTab,
    isSmallDevice: isSmall,
    scale: rScale,
    verticalScale: rVerticalScale,
    moderateScale: rModerateScale,
    fontScale: rFontScale,
    wp: rWp,
    hp: rHp,
  };
}

