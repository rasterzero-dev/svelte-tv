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
import {
  type ShaderSource,
  type WebGlShaderType as WebGlShader,
} from '@lightningjs/renderer/webgl';
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

type RoundedChildClipProps = {
  radius: number | number[];
  nodeRadius: number | number[];
  clipX: number;
  clipY: number;
  clipW: number;
  clipH: number;
};

const RoundedClip: WebGlShader<ShaderRoundedProps> = {
  props: webglShaders.Rounded.props,
  update(node: lngr.CoreNode) {
    this.uniform4fa(
      'u_radius',
      calcFactoredRadiusArray(this.props!.radius as Vec4, node.w, node.h),
    );
  },
  vertex: webglShaders.Rounded.vertex,
  fragment: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    uniform vec2 u_dimensions;
    uniform float u_alpha;
    uniform float u_pixelRatio;
    uniform sampler2D u_texture;

    uniform vec4 u_radius;

    varying vec4 v_color;
    varying vec2 v_textureCoords;
    varying vec2 v_nodeCoords;

    float roundedBox(vec2 p, vec2 s, vec4 r) {
      r.xy = (p.x > 0.0) ? r.yz : r.xw;
      r.x = (p.y > 0.0) ? r.y : r.x;
      vec2 q = abs(p) - s + r.x;
      return (min(max(q.x, q.y), 0.0) + length(max(q, 0.0))) - r.x;
    }

    void main() {
      vec4 child = texture2D(u_texture, v_textureCoords);
      vec2 halfDimensions = (u_dimensions * 0.5);
      vec2 boxUv = v_nodeCoords.xy * u_dimensions - halfDimensions;
      float boxDist = roundedBox(boxUv, halfDimensions, u_radius);
      float edgeWidth = 1.0 / u_pixelRatio;
      float roundedAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, boxDist);
      vec4 clippedChild = child * roundedAlpha;
      vec4 background = v_color * roundedAlpha;
      gl_FragColor = (clippedChild + background * (1.0 - clippedChild.a)) * u_alpha;
    }
  `,
};

const RoundedChildClip: WebGlShader<RoundedChildClipProps> = {
  props: {
    radius: {
      default: [0, 0, 0, 0],
      resolve(value) {
        return toValidVec4(value);
      },
    },
    nodeRadius: {
      default: [0, 0, 0, 0],
      resolve(value) {
        return toValidVec4(value);
      },
    },
    clipX: 0,
    clipY: 0,
    clipW: 0,
    clipH: 0,
  },
  update(node: lngr.CoreNode) {
    const props = this.props!;
    this.uniform4fa(
      'u_radius',
      calcFactoredRadiusArray(
        props.radius as Vec4,
        props.clipW,
        props.clipH,
      ),
    );
    this.uniform4fa(
      'u_nodeRadius',
      calcFactoredRadiusArray(
        props.nodeRadius as Vec4,
        node.w,
        node.h,
      ),
    );
    this.uniform2f('u_clipOffset', props.clipX, props.clipY);
    this.uniform2f('u_clipSize', props.clipW, props.clipH);
  },
  vertex: webglShaders.Rounded.vertex as ShaderSource<RoundedChildClipProps>,
  fragment: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    uniform vec2 u_dimensions;
    uniform float u_alpha;
    uniform float u_pixelRatio;
    uniform sampler2D u_texture;

    uniform vec4 u_radius;
    uniform vec4 u_nodeRadius;
    uniform vec2 u_clipOffset;
    uniform vec2 u_clipSize;

    varying vec4 v_color;
    varying vec2 v_textureCoords;
    varying vec2 v_nodeCoords;

    float roundedBox(vec2 p, vec2 s, vec4 r) {
      r.xy = (p.x > 0.0) ? r.yz : r.xw;
      r.x = (p.y > 0.0) ? r.y : r.x;
      vec2 q = abs(p) - s + r.x;
      return (min(max(q.x, q.y), 0.0) + length(max(q, 0.0))) - r.x;
    }

    void main() {
      vec4 color = texture2D(u_texture, v_textureCoords) * v_color;
      vec2 halfDimensions = (u_dimensions * 0.5);
      vec2 nodeUv = v_nodeCoords.xy * u_dimensions - halfDimensions;
      float nodeDist = roundedBox(nodeUv, halfDimensions, u_nodeRadius);

      vec2 clipHalfDimensions = (u_clipSize * 0.5);
      vec2 clipPosition = v_nodeCoords.xy * u_dimensions + u_clipOffset;
      vec2 boxUv = clipPosition - clipHalfDimensions;
      float boxDist = roundedBox(boxUv, clipHalfDimensions, u_radius);

      float edgeWidth = 1.0 / u_pixelRatio;
      float nodeAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, nodeDist);
      float clipAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, boxDist);
      gl_FragColor = color * nodeAlpha * clipAlpha * u_alpha;
    }
  `,
};

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
    shManager.registerShaderType(
      'rounded',
      getDefaultShaders(shManager).Rounded,
    );
}
export function registerDefaultShaderRoundedClip(shManager: CoreShaderManager) {
  if (
    SHADERS_ENABLED &&
    !isDomRendererActive() &&
    shManager.stage?.renderer.mode === 'webgl'
  )
    shManager.registerShaderType('roundedClip', RoundedClip);
}
export function registerDefaultShaderRoundedChildClip(
  shManager: CoreShaderManager,
) {
  if (
    SHADERS_ENABLED &&
    !isDomRendererActive() &&
    shManager.stage?.renderer.mode === 'webgl'
  )
    shManager.registerShaderType('roundedChildClip', RoundedChildClip);
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
    shManager.registerShaderType(
      'holePunch',
      getDefaultShaders(shManager).HolePunch,
    );
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
    registerDefaultShaderRoundedClip(shManager);
    registerDefaultShaderRoundedChildClip(shManager);
    registerDefaultShaderShadow(shManager);
    registerDefaultShaderRoundedWithBorder(shManager);
    registerDefaultShaderRoundedWithShadow(shManager);
    registerDefaultShaderRoundedWithBorderAndShadow(shManager);
    registerDefaultShaderHolePunch(shManager);
    registerDefaultShaderRadialGradient(shManager);
    registerDefaultShaderLinearGradient(shManager);
  }
}
