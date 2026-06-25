import type { RendererMainSettings } from '@lightningjs/renderer';
import type {
  TextProps,
  AnimationSettings,
  DollarString,
  StyleEffects,
} from './intrinsicTypes.js';
import {
  type ElementNode,
  convertToShader as defaultConvertToShader,
} from './elementNode.js';
import { setActiveElement as setActiveElementStore } from './activeElement.js';
import type { IRendererShader } from './dom-renderer/domRendererTypes.js';

export { isDev, SHADERS_ENABLED } from './env.js';

export const isDomRendererActive = () => false;

export interface Config {
  debug: boolean;
  focusDebug: boolean;
  domRendererEnabled: boolean;
  keyDebug: boolean;
  focusHistoryDebug: number;
  animationSettings?: AnimationSettings;
  animationsEnabled: boolean;
  fontSettings: Partial<TextProps>;
  rendererOptions?: Partial<RendererMainSettings>;
  setActiveElement: (elm: ElementNode) => void;
  focusStateKey: DollarString;
  lockStyles?: boolean;
  fontWeightAlias?: Record<string, number | string>;
  throttleInput?: number;
  taskDelay?: number;
  convertToShader: (_node: ElementNode, v: StyleEffects) => IRendererShader;
  stateOrder?: DollarString[];
}

export const Config: Config = {
  debug: false,
  domRendererEnabled: false,
  focusDebug: false,
  keyDebug: false,
  focusHistoryDebug: 0,
  animationsEnabled: true,
  animationSettings: {
    duration: 250,
    easing: 'ease-in-out',
  },
  convertToShader: defaultConvertToShader,
  setActiveElement: (elm) => setActiveElementStore(elm),
  fontSettings: {
    fontFamily: 'sans-serif',
    fontSize: 100,
  },
  fontWeightAlias: {
    thin: 100,
    light: 300,
    regular: '',
    400: '',
    medium: 500,
    bold: 700,
    black: 900,
  },
  focusStateKey: '$focus',
  lockStyles: true,
  rendererOptions: {},
  stateOrder: [],
};
