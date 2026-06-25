import * as lngr from '@lightningjs/renderer';
import * as canvasShaders from '@lightningjs/renderer/canvas/shaders';
import * as webglShaders from '@lightningjs/renderer/webgl/shaders';

import type {
  HolePunchProps as ShaderHolePunchProps,
  LinearGradientProps as ShaderLinearGradientProps,
  RadialGradientProps as ShaderRadialGradientProps,
  RoundedProps as ShaderRoundedProps,
  ShadowProps as ShaderShadowProps,
} from '@lightningjs/renderer';
import { type CanvasShaderType as CanvasShader } from '@lightningjs/renderer/canvas/shaders';
import { type WebGlShaderType as WebGlShader } from '@lightningjs/renderer/webgl';
export {
  ShaderHolePunchProps,
  ShaderLinearGradientProps,
  ShaderRadialGradientProps,
  ShaderRoundedProps,
  ShaderShadowProps,
};
export { CanvasShader, WebGlShader };

import { SHADERS_ENABLED, isDomRendererActive } from './config.js';
import type { CoreShaderManager } from './intrinsicTypes.js';

export type Vec4 = [x: number, y: number, z: number, w: number];

export interface ShaderBorderProps extends lngr.BorderProps {
  /** Distance between the border and element edges. */
  gap: number;
  /**
   * If `false`, the border is drawn outside the element. \
   * If `true`, the border is drawn inside the element.
   * @default true
   */
  inset: boolean;
}

export type ShaderBorderPrefixedProps = {
  [P in keyof ShaderBorderProps as `border-${P}`]: ShaderBorderProps[P];
};
export type ShaderShadowPrefixedProps = {
  [P in keyof ShaderShadowProps as `shadow-${P}`]: ShaderShadowProps[P];
};

export type ShaderRoundedWithShadowProps = ShaderRoundedProps &
  ShaderShadowPrefixedProps;
export type ShaderRoundedWithBorderProps = ShaderRoundedProps &
  ShaderBorderPrefixedProps;
export type ShaderRoundedWithBorderAndShadowProps = ShaderRoundedProps &
  ShaderShadowPrefixedProps &
  ShaderBorderPrefixedProps;

export type ShaderRounded = CanvasShader<ShaderRoundedProps>;
export type ShaderShadow = CanvasShader<ShaderShadowProps>;
export type ShaderRoundedWithBorder =
  CanvasShader<ShaderRoundedWithBorderProps>;
export type ShaderRoundedWithShadow =
  CanvasShader<ShaderRoundedWithShadowProps>;
export type ShaderRoundedWithBorderAndShadow =
  CanvasShader<ShaderRoundedWithBorderAndShadowProps>;
export type ShaderHolePunch = CanvasShader<ShaderHolePunchProps>;
export type ShaderRadialGradient = CanvasShader<ShaderRadialGradientProps>;
export type ShaderLinearGradient = CanvasShader<ShaderLinearGradientProps>;

function getDefaultShaders(shManager: CoreShaderManager) {
  const mode = shManager.stage?.renderer.mode;
  return mode === 'webgl' ? webglShaders : canvasShaders;
}

function calcFactoredRadiusArray(
  radius: Vec4,
  width: number,
  height: number,
  out: Vec4 = [0, 0, 0, 0],
): Vec4 {
  [out[0], out[1], out[2], out[3]] = radius;
  const factor = Math.min(
    width / Math.max(width, radius[0] + radius[1]),
    width / Math.max(width, radius[2] + radius[3]),
    height / Math.max(height, radius[0] + radius[3]),
    height / Math.max(height, radius[1] + radius[2]),
    1,
  );
  out[0] *= factor;
  out[1] *= factor;
  out[2] *= factor;
  out[3] *= factor;
  return out;
}

function toValidVec4(value: unknown): Vec4 {
  if (typeof value === 'number') {
    return [value, value, value, value];
  }
  if (Array.isArray(value)) {
    switch (value.length) {
      default:
      case 4:
        return value as Vec4;
      case 3:
        return [value[0], value[1], value[2], value[0]];
      case 2:
        return [value[0], value[1], value[0], value[1]];
      case 1:
        return [value[0], value[0], value[0], value[0]];
      case 0:
        break;
    }
  }
  return [0, 0, 0, 0];
}

export function registerDefaultShaderRounded(shManager: CoreShaderManager) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType('rounded', getDefaultShaders(shManager).Rounded);
}
export function registerDefaultShaderShadow(shManager: CoreShaderManager) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType('shadow', getDefaultShaders(shManager).Shadow);
}
export function registerDefaultShaderRoundedWithBorder(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType(
      'roundedWithBorder',
      getDefaultShaders(shManager).RoundedWithBorder,
    );
}
export function registerDefaultShaderRoundedWithShadow(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType(
      'roundedWithShadow',
      getDefaultShaders(shManager).RoundedWithShadow,
    );
}
export function registerDefaultShaderRoundedWithBorderAndShadow(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType(
      'roundedWithBorderWithShadow',
      getDefaultShaders(shManager).RoundedWithBorderAndShadow,
    );
}
export function registerDefaultShaderHolePunch(shManager: CoreShaderManager) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType('holePunch', getDefaultShaders(shManager).HolePunch);
}
export function registerDefaultShaderRadialGradient(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType(
      'radialGradient',
      getDefaultShaders(shManager).RadialGradient,
    );
}
export function registerDefaultShaderLinearGradient(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType(
      'linearGradient',
      getDefaultShaders(shManager).LinearGradient,
    );
}

export function registerDefaultShaders(shManager: CoreShaderManager) {
  if (SHADERS_ENABLED && !isDomRendererActive()) {
    registerDefaultShaderRounded(shManager);
    registerDefaultShaderShadow(shManager);
    registerDefaultShaderRoundedWithBorder(shManager);
    registerDefaultShaderRoundedWithShadow(shManager);
    registerDefaultShaderRoundedWithBorderAndShadow(shManager);
    registerDefaultShaderHolePunch(shManager);
    registerDefaultShaderRadialGradient(shManager);
    registerDefaultShaderLinearGradient(shManager);
  }
}
