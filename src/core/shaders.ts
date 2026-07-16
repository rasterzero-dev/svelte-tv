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

export interface ShaderOutlineProps {
  /** Width of the outline in pixels. */
  width: number;
  /** Color of the outline in 0xRRGGBBAA. */
  color: number;
  /** Distance between the element edge and the outline. */
  offset: number;
  /** Opacity multiplier applied after the color alpha. */
  opacity: number;
}

type ShaderOutlinePrefixedProps = {
  [P in keyof ShaderOutlineProps as `outline-${P}`]: ShaderOutlineProps[P];
};

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
export type ShaderRoundedWithOutlineProps =
  ShaderRoundedWithBorderAndShadowProps & ShaderOutlinePrefixedProps;

export type ShaderRounded = CanvasShader<ShaderRoundedProps>;
export type ShaderShadow = CanvasShader<ShaderShadowProps>;
export type ShaderRoundedWithBorder =
  CanvasShader<ShaderRoundedWithBorderProps>;
export type ShaderRoundedWithShadow =
  CanvasShader<ShaderRoundedWithShadowProps>;
export type ShaderRoundedWithBorderAndShadow =
  CanvasShader<ShaderRoundedWithBorderAndShadowProps>;
export type ShaderRoundedWithOutline =
  CanvasShader<ShaderRoundedWithOutlineProps>;
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

const outlineProps = {
  'outline-width': 0,
  'outline-color': 0xffffffff,
  'outline-offset': 0,
  'outline-opacity': 1,
};

function addOutlineToVertex(source: string) {
  return source
    .replace(
      'uniform float u_borderAlign;',
      `uniform float u_borderAlign;
    uniform float u_outlineWidth;
    uniform float u_outlineOffset;`,
    )
    .replace(
      'vec2 edgeOffset = edge * ((u_shadow.w * 2.0)+ u_shadow.z) + u_shadow.xy;',
      `vec2 edgeOffset = edge * ((u_shadow.w * 2.0)+ u_shadow.z) + u_shadow.xy;
      edgeOffset += edge * max(0.0, u_outlineOffset + u_outlineWidth);`,
    );
}

function addOutlineToFragment(source: string) {
  return source
    .replace(
      'uniform vec4 u_shadow;',
      `uniform vec4 u_shadow;
    uniform float u_outlineWidth;
    uniform vec4 u_outlineColor;
    uniform float u_outlineOffset;
    uniform float u_outlineOpacity;`,
    )
    .replace(
      'float nodeAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, nodeDist);',
      `float nodeAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, nodeDist);
      vec2 outlineInnerSize = max(vec2(0.0), v_halfDimensions + u_outlineOffset);
      vec2 outlineOuterSize = max(vec2(0.0), outlineInnerSize + u_outlineWidth);
      vec4 outlineInnerRadius = max(vec4(0.0), u_radius + u_outlineOffset);
      vec4 outlineOuterRadius = max(vec4(0.0), outlineInnerRadius + u_outlineWidth);
      float outlineInnerDist = roundedBox(boxUv, outlineInnerSize - edgeWidth, outlineInnerRadius);
      float outlineOuterDist = roundedBox(boxUv, outlineOuterSize - edgeWidth, outlineOuterRadius);
      float outlineDist = max(-outlineInnerDist, outlineOuterDist);
      float outlineAlpha = (1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, outlineDist))
        * u_outlineColor.a * u_outlineOpacity;`,
    )
    .split('resultColor = mix(resultColor, color, nodeAlpha);')
    .join(`resultColor = mix(resultColor, vec4(u_outlineColor.rgb, 1.0), outlineAlpha);
      resultColor = mix(resultColor, color, nodeAlpha);`);
}

const WebGlRoundedWithOutlineAndEffects: WebGlShader<Record<string, any>> = {
  props: {
    ...webglShaders.RoundedWithBorderAndShadow.props,
    'shadow-color': 0x00000000,
    'shadow-projection': { default: [0, 0, 0, 0] },
    ...outlineProps,
  },
  update(node: lngr.CoreNode) {
    webglShaders.RoundedWithBorderAndShadow.update!.call(this as any, node);
    this.uniform1f('u_outlineWidth', this.props!['outline-width']);
    this.uniformRGBA('u_outlineColor', this.props!['outline-color']);
    this.uniform1f('u_outlineOffset', this.props!['outline-offset']);
    this.uniform1f('u_outlineOpacity', this.props!['outline-opacity']);
  },
  vertex: addOutlineToVertex(
    webglShaders.RoundedWithBorderAndShadow.vertex as string,
  ),
  fragment: addOutlineToFragment(
    webglShaders.RoundedWithBorderAndShadow.fragment as string,
  ),
};

const WebGlRoundedWithOutline: WebGlShader<Record<string, any>> = {
  props: {
    ...webglShaders.RoundedWithBorder.props,
    ...outlineProps,
  },
  update(node: lngr.CoreNode) {
    const props = this.props!;
    const width = props['outline-width'];
    this.uniformRGBA('u_borderColor', props['outline-color']);
    this.uniform4fa('u_borderWidth', [width, width, width, width]);
    this.uniform1f('u_borderGap', props['outline-offset']);
    this.uniform1f('u_borderAlign', 1);
    this.uniform1f('u_outlineOpacity', props['outline-opacity']);
    this.uniform4fa(
      'u_radius',
      calcFactoredRadiusArray(props.radius as Vec4, node.w, node.h),
    );
  },
  vertex: webglShaders.RoundedWithBorder.vertex as string,
  fragment: (webglShaders.RoundedWithBorder.fragment as string)
    .replace(
      'uniform vec4 u_borderColor;',
      `uniform vec4 u_borderColor;
    uniform float u_outlineOpacity;`,
    )
    .replace('* u_borderColor.a;', '* u_borderColor.a * u_outlineOpacity;'),
};

const CanvasRoundedWithOutline: CanvasShader<Record<string, any>> = {
  props: {
    ...canvasShaders.RoundedWithBorderAndShadow.props,
    'shadow-color': 0x00000000,
    'shadow-projection': { default: [0, 0, 0, 0] },
    ...outlineProps,
  },
  saveAndRestore: true,
  update(node: lngr.CoreNode) {
    canvasShaders.RoundedWithBorderAndShadow.update!.call(this as any, node);
  },
  render(ctx, node, renderContext) {
    const props = this.props!;
    const width = props['outline-width'];
    if (width > 0 && props['outline-opacity'] > 0) {
      const extent = props['outline-offset'] + width * 0.5;
      const radius = (this.computed.radius as Vec4).map((value) =>
        Math.max(0, value + extent),
      ) as Vec4;
      const { tx, ty } = node.globalTransform!;
      const path = new Path2D();
      roundRect(
        path,
        tx - extent,
        ty - extent,
        node.w + extent * 2,
        node.h + extent * 2,
        radius,
      );
      ctx.save();
      ctx.globalAlpha *= props['outline-opacity'];
      ctx.strokeStyle = this.toColorString(props['outline-color']);
      ctx.lineWidth = width;
      ctx.stroke(path);
      ctx.restore();
    }
    canvasShaders.RoundedWithBorderAndShadow.render.call(
      this as any,
      ctx,
      node,
      renderContext,
    );
  },
};

function roundRect(
  path: Path2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: Vec4,
) {
  if (path.roundRect) {
    path.roundRect(x, y, width, height, radius);
    return;
  }
  const [tl, tr, br, bl] = radius;
  path.moveTo(x + tl, y);
  path.lineTo(x + width - tr, y);
  path.ellipse(x + width - tr, y + tr, tr, tr, 0, 1.5 * Math.PI, 2 * Math.PI);
  path.lineTo(x + width, y + height - br);
  path.ellipse(x + width - br, y + height - br, br, br, 0, 0, 0.5 * Math.PI);
  path.lineTo(x + bl, y + height);
  path.ellipse(x + bl, y + height - bl, bl, bl, 0, 0.5 * Math.PI, Math.PI);
  path.lineTo(x, y + tl);
  path.ellipse(x + tl, y + tl, tl, tl, 0, Math.PI, 1.5 * Math.PI);
}

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

const RoundedClipWithOutline: WebGlShader<Record<string, any>> = {
  props: {
    ...webglShaders.Rounded.props,
    ...outlineProps,
  },
  update(node: lngr.CoreNode) {
    this.uniform4fa(
      'u_radius',
      calcFactoredRadiusArray(this.props!.radius as Vec4, node.w, node.h),
    );
    this.uniform1f('u_outlineWidth', this.props!['outline-width']);
    this.uniformRGBA('u_outlineColor', this.props!['outline-color']);
    this.uniform1f('u_outlineOffset', this.props!['outline-offset']);
    this.uniform1f('u_outlineOpacity', this.props!['outline-opacity']);
  },
  vertex: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    attribute vec2 a_position;
    attribute vec2 a_textureCoords;
    attribute vec4 a_color;
    attribute vec2 a_nodeCoords;

    uniform vec2 u_resolution;
    uniform float u_pixelRatio;
    uniform vec2 u_dimensions;
    uniform float u_outlineWidth;
    uniform float u_outlineOffset;

    varying vec4 v_color;
    varying vec2 v_textureCoords;
    varying vec2 v_nodeCoords;

    void main() {
      vec2 screenSpace = vec2(2.0 / u_resolution.x, -2.0 / u_resolution.y);
      vec2 edge = clamp(a_nodeCoords * 2.0 - vec2(1.0), -1.0, 1.0);
      vec2 edgeOffset = edge * max(0.0, u_outlineOffset + u_outlineWidth);
      vec2 normalized = (a_position + edgeOffset) * u_pixelRatio;

      v_color = a_color;
      v_nodeCoords = a_nodeCoords + edgeOffset / u_dimensions;
      v_textureCoords = a_textureCoords + edgeOffset / u_dimensions;

      gl_Position = vec4(normalized.x * screenSpace.x - 1.0, normalized.y * -abs(screenSpace.y) + 1.0, 0.0, 1.0);
      gl_Position.y = -sign(screenSpace.y) * gl_Position.y;
    }
  `,
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
    uniform float u_outlineWidth;
    uniform vec4 u_outlineColor;
    uniform float u_outlineOffset;
    uniform float u_outlineOpacity;

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
      vec2 halfDimensions = u_dimensions * 0.5;
      vec2 boxUv = v_nodeCoords.xy * u_dimensions - halfDimensions;
      float edgeWidth = 1.0 / u_pixelRatio;
      float boxDist = roundedBox(boxUv, halfDimensions, u_radius);
      float roundedAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, boxDist);

      vec2 outlineInnerSize = max(vec2(0.0), halfDimensions + u_outlineOffset);
      vec2 outlineOuterSize = max(vec2(0.0), outlineInnerSize + u_outlineWidth);
      vec4 outlineInnerRadius = max(vec4(0.0), u_radius + u_outlineOffset);
      vec4 outlineOuterRadius = max(vec4(0.0), outlineInnerRadius + u_outlineWidth);
      float outlineInnerDist = roundedBox(boxUv, outlineInnerSize - edgeWidth, outlineInnerRadius);
      float outlineOuterDist = roundedBox(boxUv, outlineOuterSize - edgeWidth, outlineOuterRadius);
      float outlineDist = max(-outlineInnerDist, outlineOuterDist);
      float outlineAlpha = (1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, outlineDist))
        * u_outlineColor.a * u_outlineOpacity;

      vec4 background = v_color * roundedAlpha;
      vec4 clippedNode = (child * roundedAlpha) + background * (1.0 - child.a);
      vec4 outline = vec4(u_outlineColor.rgb, 1.0) * outlineAlpha;
      gl_FragColor = (clippedNode + outline * (1.0 - clippedNode.a)) * u_alpha;
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
      calcFactoredRadiusArray(props.radius as Vec4, props.clipW, props.clipH),
    );
    this.uniform4fa(
      'u_nodeRadius',
      calcFactoredRadiusArray(props.nodeRadius as Vec4, node.w, node.h),
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
export function registerDefaultShaderRoundedClipWithOutline(
  shManager: CoreShaderManager,
) {
  if (
    SHADERS_ENABLED &&
    !isDomRendererActive() &&
    shManager.stage?.renderer.mode === 'webgl'
  )
    shManager.registerShaderType(
      'roundedClipWithOutline',
      RoundedClipWithOutline,
    );
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
export function registerDefaultShaderRoundedWithOutline(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType(
      'roundedWithOutline',
      shManager.stage?.renderer.mode === 'webgl'
        ? WebGlRoundedWithOutline
        : CanvasRoundedWithOutline,
    );
}
export function registerDefaultShaderRoundedWithOutlineAndEffects(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !isDomRendererActive())
    shManager.registerShaderType(
      'roundedWithOutlineAndEffects',
      shManager.stage?.renderer.mode === 'webgl'
        ? WebGlRoundedWithOutlineAndEffects
        : CanvasRoundedWithOutline,
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
    registerDefaultShaderRoundedClipWithOutline(shManager);
    registerDefaultShaderRoundedChildClip(shManager);
    registerDefaultShaderShadow(shManager);
    registerDefaultShaderRoundedWithBorder(shManager);
    registerDefaultShaderRoundedWithShadow(shManager);
    registerDefaultShaderRoundedWithBorderAndShadow(shManager);
    registerDefaultShaderRoundedWithOutline(shManager);
    registerDefaultShaderRoundedWithOutlineAndEffects(shManager);
    registerDefaultShaderHolePunch(shManager);
    registerDefaultShaderRadialGradient(shManager);
    registerDefaultShaderLinearGradient(shManager);
  }
}
