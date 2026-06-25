// not yet implemented

import type {
  INode,
  INodeProps,
  ITextNode,
  ITextNodeProps,
  RendererMainSettings,
} from '@lightningjs/renderer';

export type DomRendererMainSettings = RendererMainSettings;
export type IRendererShader = any;
export type IRendererShaderProps = Record<string, unknown>;
export type IRendererShaderManager = {
  registerShaderType: (...args: any[]) => void;
};

export interface IRendererNode extends INode {
  div?: HTMLElement;
}

export type IRendererNodeProps = INodeProps;

export interface IRendererTextNode extends ITextNode {
  div?: HTMLElement;
}

export type IRendererTextNodeProps = ITextNodeProps;
