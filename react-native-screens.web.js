// Web shim for react-native-screens
import { View } from 'react-native';

export const enableScreens = () => {};
export const enableFreeze = () => {};
export const screensEnabled = () => true;

export const Screen = View;
export const ScreenContainer = View;
export const ScreenStack = View;
export const ScreenStackHeaderConfig = View;
export const ScreenStackHeaderSubview = View;
export const ScreenStackHeaderCenterView = View;
export const ScreenStackHeaderRightView = View;
export const ScreenStackHeaderLeftView = View;
export const ScreenStackHeaderSearchBarView = View;
export const SearchBar = View;
export const FullWindowOverlay = View;

export default {
  enableScreens,
  enableFreeze,
  screensEnabled,
  Screen,
  ScreenContainer,
  ScreenStack,
};
