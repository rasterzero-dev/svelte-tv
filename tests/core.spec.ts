import { describe, expect, it, vi } from 'vitest';

const renderer = vi.hoisted(() => ({
  createTexture: vi.fn(),
  stage: {
    platform: { fetch: vi.fn() },
    txManager: { loadTexture: vi.fn() },
  },
}));

vi.mock('../src/core/lightningInit.js', () => ({ renderer }));

import {
  activeElement,
  applyNodeProps,
  ElementNode,
  focusPath,
  hasFocus,
  mountNode,
  setActiveElementCore,
} from '../src/core/index.js';
import { navigableForwardFocus } from '../src/primitives/utils/handleNavigation.js';

interface TestEffect {
  parent: TestEffect | null;
  prev: TestEffect | null;
}

function renderedNode() {
  const node = new ElementNode('view');
  node.rendered = true;
  return node;
}

function effect(
  parent: TestEffect | null = null,
  prev: TestEffect | null = null,
) {
  return { parent, prev };
}

describe('core', () => {
  it('stores color props as renderer numbers', () => {
    const node = new ElementNode('view');
    node.color = '#11223344';
    expect(node.lng.color).toBe(0x11223344);
  });

  it('updates active element and focus path', () => {
    const parent = renderedNode();
    const child = renderedNode();
    parent.insertChild(child);

    setActiveElementCore(child);

    expect(activeElement()).toBe(child);
    expect(focusPath()[0]).toBe(child);
    expect(hasFocus(child)).toBe(true);
    expect(hasFocus(parent)).toBe(true);
  });

  it('does not refocus when autofocus is reapplied with the same value', async () => {
    const initial = renderedNode();
    const next = renderedNode();

    applyNodeProps(initial, { autofocus: true });
    await Promise.resolve();
    await Promise.resolve();
    expect(activeElement()).toBe(initial);

    setActiveElementCore(next);
    applyNodeProps(initial, { autofocus: true });
    await Promise.resolve();
    await Promise.resolve();

    expect(activeElement()).toBe(next);
  });

  it('does not rerender when applied props are unchanged', () => {
    const node = renderedNode();
    const rerender = vi.spyOn(node, 'rerender');
    const style = { color: '#38bdf8ff' };

    applyNodeProps(node, { x: 10, style });
    applyNodeProps(node, { x: 10, style });

    expect(rerender).toHaveBeenCalledTimes(1);
  });

  it('forgets skipped undefined props so the same value can be reapplied', () => {
    const node = renderedNode();

    applyNodeProps(node, { x: 10 });
    applyNodeProps(node, { x: undefined });
    node.x = 20;
    applyNodeProps(node, { x: 10 });

    expect(node.x).toBe(10);
  });

  it('updates a source crop once when its coordinates change', () => {
    const node = renderedNode();
    const applySourceCropTexture = vi
      .spyOn(node, '_applySourceCropTexture')
      .mockReturnValue(true);
    node.lng = { src: 'image.png', srcX: 0, srcY: 0 } as any;
    node._appliedProps = { src: 'image.png', srcX: 0, srcY: 0 };

    applyNodeProps(node, { src: 'image.png', srcX: 12, srcY: 24 });

    expect(node.lng.srcX).toBe(12);
    expect(node.lng.srcY).toBe(24);
    expect(applySourceCropTexture).toHaveBeenCalledOnce();
  });

  it('keeps the previous source crop until the next one is loaded', async () => {
    const node = renderedNode();
    const previousTexture = { state: 'loaded' };
    const nextTexture = { state: 'initial' };
    let finishLoading: () => void;
    const loading = new Promise<void>((resolve) => {
      finishLoading = resolve;
    });
    renderer.createTexture.mockReturnValueOnce(nextTexture);
    renderer.stage.txManager.loadTexture.mockImplementationOnce(
      async (texture) => {
        await loading;
        texture.state = 'loaded';
      },
    );
    node.lng = {
      color: 0xffffffff,
      srcX: 0,
      srcY: 0,
      srcWidth: 100,
      srcHeight: 50,
      texture: previousTexture,
    } as any;
    node._src = 'image.png';
    node._sourceBlob = new Blob();
    node._sourceBlobSrc = 'image.png';

    node._applySourceCropTexture();

    expect(node.lng.texture).toBe(previousTexture);
    finishLoading!();
    await loading;
    await Promise.resolve();
    expect(node.lng.texture).toBe(nextTexture);
  });

  it('keeps the initial source crop transparent while it loads', () => {
    const node = renderedNode();
    renderer.stage.platform.fetch.mockReturnValueOnce(new Promise(() => {}));
    node.lng = {
      color: undefined,
      src: 'image.png',
      srcX: 0,
      srcY: 0,
      srcWidth: 100,
      srcHeight: 50,
      texture: null,
    } as any;
    node._src = 'image.png';

    node._applySourceCropTexture();

    expect(node.lng.color).toBe(0x00000000);
    expect(node.lng.texture).toBeNull();
  });

  it('forwards navigable focus to the selected child', async () => {
    const row = renderedNode();
    const first = renderedNode();
    const second = renderedNode();
    row.insertChild(first);
    row.insertChild(second);
    row.selected = 1;

    navigableForwardFocus.call(row, row);
    await Promise.resolve();

    expect(activeElement()).toBe(second);
  });

  it('inserts a later-mounted conditional child before the next sibling', () => {
    const parent = new ElementNode('view');
    const ifBlock = effect();
    const textEffect = effect(null, ifBlock);
    const branch = effect(ifBlock);
    const iconEffect = effect(branch);
    const text = new ElementNode('text');
    const icon = new ElementNode('view');

    mountNode(text, parent, textEffect);
    mountNode(icon, parent, iconEffect);

    expect(parent.children).toEqual([icon, text]);
  });

  it('appends a later-mounted conditional child after previous siblings', () => {
    const parent = new ElementNode('view');
    const firstEffect = effect();
    const ifBlock = effect(null, firstEffect);
    const branch = effect(ifBlock);
    const iconEffect = effect(branch);
    const first = new ElementNode('text');
    const icon = new ElementNode('view');

    mountNode(first, parent, firstEffect);
    mountNode(icon, parent, iconEffect);

    expect(parent.children).toEqual([first, icon]);
  });

  it('restores prop values when state styles are removed', () => {
    const node = new ElementNode('view');
    node.color = '#1e293bff';
    node.style = {
      $focus: {
        color: '#38bdf8ff',
        scale: 1.04,
      },
    };

    node.states.add('$focus');
    expect(node.lng.color).toBe(0x38bdf8ff);

    node.states.remove('$focus');
    expect(node.lng.color).toBe(0x1e293bff);
    expect(node.scale).toBe(1);
  });

  it('does not reapply unchanged states on rendered nodes', () => {
    const node = renderedNode();
    const stateChanged = vi.spyOn(node, '_stateChanged');

    node.states = ['$focus'];
    node.states = ['$focus'];

    expect(stateChanged).toHaveBeenCalledTimes(1);
  });

  it('applies multi-state styles after style changes', () => {
    const node = renderedNode();

    node.style = {
      $focus: { color: '#38bdf8ff' },
      $active: { scale: 1.04 },
    };
    node.states = ['$focus', '$active'];

    node.states = [];
    node.style = {
      $focus: { color: '#f59e0bff' },
      $active: { scale: 1.08 },
    };
    node.states = ['$focus', '$active'];

    expect(node.color).toBe(0xf59e0bff);
    expect(node.scale).toBe(1.08);
  });

  it('reapplies state styles when a focused node is reused with new props', () => {
    const node = renderedNode();
    applyNodeProps(node, {
      color: '#1e293bff',
      style: { $focus: { color: '#38bdf8ff', scale: 1.04 } },
    });

    node.states.add('$focus');
    expect(node.lng.color).toBe(0x38bdf8ff);

    applyNodeProps(node, {
      color: '#334155ff',
      style: { $focus: { color: '#f59e0bff', scale: 1.08 } },
    });

    expect(node.lng.color).toBe(0xf59e0bff);
    expect(node.scale).toBe(1.08);

    node.states.remove('$focus');
    expect(node.lng.color).toBe(0x334155ff);
    expect(node.scale).toBe(1);
  });

  it('stretches flex children across the cross axis', () => {
    const column = new ElementNode('view');
    const wide = new ElementNode('view');
    const narrow = new ElementNode('view');

    column.display = 'flex';
    column.flexDirection = 'column';
    column.alignItems = 'stretch';
    column.width = 300;
    column.height = 120;
    wide.width = 180;
    wide.height = 40;
    narrow.width = 80;
    narrow.height = 40;
    column.insertChild(wide);
    column.insertChild(narrow);

    column.updateLayout();

    expect(wide.width).toBe(300);
    expect(narrow.width).toBe(300);
  });

  it('sizes implicit flex item wrappers from their content', () => {
    const row = new ElementNode('view');
    const wrappers = Array.from({ length: 3 }, () => {
      const wrapper = new ElementNode('view');
      const button = new ElementNode('view');
      wrapper.width = 1920;
      wrapper.height = 1080;
      wrapper._calcWidth = true;
      wrapper._calcHeight = true;
      button.width = 80;
      button.height = 80;
      wrapper.insertChild(button);
      return wrapper;
    });

    row.display = 'flex';
    row.justifyContent = 'spaceBetween';
    row.width = 1920;
    row.height = 80;
    wrappers.forEach((wrapper) => row.insertChild(wrapper));

    row.updateLayout();

    expect(wrappers.map((wrapper) => wrapper.width)).toEqual([80, 80, 80]);
    expect(wrappers.map((wrapper) => wrapper.height)).toEqual([80, 80, 80]);
    expect(wrappers.map((wrapper) => wrapper.x)).toEqual([0, 920, 1840]);
  });

  it('keeps content-sized bottom bars inside column containers', () => {
    const player = new ElementNode('view');
    const header = new ElementNode('view');
    const title = new ElementNode('view');
    const bottom = new ElementNode('view');
    const button = new ElementNode('view');

    player.display = 'flex';
    player.flexDirection = 'column';
    player.justifyContent = 'spaceBetween';
    player.width = 1920;
    player.height = 1080;
    header.height = 1080;
    header._calcHeight = true;
    title.width = 300;
    title.height = 60;
    header.insertChild(title);
    bottom.display = 'flex';
    bottom._calcWidth = true;
    bottom._calcHeight = true;
    button.width = 80;
    button.height = 80;
    bottom.insertChild(button);
    player.insertChild(header);
    player.insertChild(bottom);

    bottom.updateLayout();
    player.updateLayout();

    expect(header.height).toBe(60);
    expect(bottom.height).toBe(80);
    expect(bottom.y).toBe(1000);
  });

  it('falls back to flexStart when spaceBetween items overflow', () => {
    const row = new ElementNode('view');
    const first = new ElementNode('view');
    const second = new ElementNode('view');

    row.display = 'flex';
    row.justifyContent = 'spaceBetween';
    row.width = 100;
    first.width = 80;
    second.width = 80;
    row.insertChild(first);
    row.insertChild(second);

    row.updateLayout();

    expect(first.x).toBe(0);
    expect(second.x).toBe(80);
  });

  it('excludes container padding from flex grow space', () => {
    const row = new ElementNode('view');
    const leading = new ElementNode('view');
    const content = new ElementNode('view');
    const trailing = new ElementNode('view');

    row.display = 'flex';
    row.width = 640;
    row.paddingLeft = 24;
    row.paddingRight = 24;
    row.gap = 16;
    leading.width = 32;
    content.flexGrow = 1;
    trailing.width = 32;
    row.insertChild(leading);
    row.insertChild(content);
    row.insertChild(trailing);

    row.updateLayout();

    expect(content.width).toBe(496);
    expect(trailing.x).toBe(584);
    expect(trailing.x + trailing.width).toBe(616);
  });

  it('reuses flex layout scratch buffers across layout passes', () => {
    const row = new ElementNode('view');
    const first = new ElementNode('view');
    const second = new ElementNode('view');

    row.display = 'flex';
    row.width = 300;
    row.height = 80;
    first.width = 80;
    first.height = 40;
    second.width = 80;
    second.height = 40;
    row.insertChild(first);
    row.insertChild(second);

    row.updateLayout();
    const scratch = row._flexLayoutScratch;
    const mainSizes = scratch?.childMainSizes;
    row.updateLayout();

    expect(row._flexLayoutScratch).toBe(scratch);
    expect(row._flexLayoutScratch?.childMainSizes).toBe(mainSizes);
  });

  it('recalculates stretched flex children with their new cross size', () => {
    const column = new ElementNode('view');
    const button = new ElementNode('view');
    const icon = new ElementNode('view');
    const label = new ElementNode('view');

    column.display = 'flex';
    column.flexDirection = 'column';
    column.alignItems = 'stretch';
    column.width = 300;
    column.height = 80;
    button.display = 'flex';
    button.justifyContent = 'center';
    button.width = 220;
    button.height = 40;
    button._calcWidth = true;
    button.paddingLeft = 32;
    button.paddingRight = 32;
    icon.width = 32;
    icon.height = 32;
    label.width = 100;
    label.height = 32;
    label.marginLeft = 8;
    button.insertChild(icon);
    button.insertChild(label);
    column.insertChild(button);

    button.updateLayout();
    expect(button.width).toBe(204);
    expect(icon.x).toBe(32);

    column.updateLayout();

    expect(button.width).toBe(300);
    expect(icon.x).toBe(80);
  });

  it('lets alignSelf stretch override flex container alignment', () => {
    const row = new ElementNode('view');
    const centered = new ElementNode('view');
    const stretched = new ElementNode('view');

    row.display = 'flex';
    row.alignItems = 'center';
    row.width = 300;
    row.height = 120;
    centered.width = 80;
    centered.height = 40;
    stretched.width = 80;
    stretched.height = 40;
    stretched.alignSelf = 'stretch';
    row.insertChild(centered);
    row.insertChild(stretched);

    row.updateLayout();

    expect(centered.height).toBe(40);
    expect(stretched.height).toBe(120);
  });

  it('updates rounded child clipping after flex layout resolves parent size', () => {
    const card = new ElementNode('view');
    const image = new ElementNode('view');
    const body = new ElementNode('view');
    const childClipShader = {
      shaderKey: 'roundedChildClip',
      value: {},
      set props(value) {
        this.value = value;
      },
      get props() {
        return this.value;
      },
    };

    card.display = 'flex';
    card.flexDirection = 'column';
    card.clipping = true;
    card.color = '#ffffff15';
    card.lng.shader = {
      shaderKey: 'rounded',
      props: { radius: 16 },
    } as any;
    card._calcWidth = true;
    card._calcHeight = true;

    image.rendered = true;
    image.lng = {
      src: 'avatar.png',
      shader: childClipShader,
    } as any;
    image.width = 192;
    image.height = 192;

    body.width = 192;
    body.height = 48;

    card.insertChild(image);
    card.insertChild(body);
    card.updateLayout();

    expect(childClipShader.props).toEqual({
      radius: 16,
      nodeRadius: [0, 0, 0, 0],
      clipX: 0,
      clipY: 0,
      clipW: 192,
      clipH: 240,
    });
  });

  it('preserves child radius when updating rounded child clipping', () => {
    const card = new ElementNode('view');
    const image = new ElementNode('view');
    const badge = new ElementNode('view');
    const childClipShader = {
      shaderKey: 'roundedChildClip',
      value: { nodeRadius: [0, 0, 6, 0] },
      set props(value) {
        this.value = value;
      },
      get props() {
        return this.value;
      },
    };

    card.display = 'flex';
    card.flexDirection = 'column';
    card.clipping = true;
    card.color = '#ffffff15';
    card.lng.shader = {
      shaderKey: 'rounded',
      props: { radius: 16 },
    } as any;
    card._calcWidth = true;
    card._calcHeight = true;

    image.rendered = true;
    image.lng = {
      src: 'avatar.png',
    } as any;
    image.width = 192;
    image.height = 192;

    badge.rendered = true;
    badge.lng = {
      shader: childClipShader,
    } as any;
    badge.width = 96;
    badge.height = 32;

    card.insertChild(image);
    card.insertChild(badge);
    card.updateLayout();

    expect(childClipShader.props).toEqual({
      radius: 16,
      nodeRadius: [0, 0, 6, 0],
      clipX: 0,
      clipY: 192,
      clipW: 192,
      clipH: 224,
    });
  });

  it('does not rewrite unchanged rounded child clipping props', () => {
    const card = new ElementNode('view');
    const image = new ElementNode('view');
    const setProps = vi.fn();
    const childClipShader = {
      shaderKey: 'roundedChildClip',
      value: { nodeRadius: [0, 0, 0, 0] },
      set props(value) {
        this.value = value;
        setProps(value);
      },
      get props() {
        return this.value;
      },
    };

    card.display = 'flex';
    card.flexDirection = 'column';
    card.clipping = true;
    card.color = '#ffffff15';
    card.lng.shader = {
      shaderKey: 'rounded',
      props: { radius: 16 },
    } as any;

    image.rendered = true;
    image.lng = {
      src: 'avatar.png',
      shader: childClipShader,
    } as any;
    image.width = 192;
    image.height = 192;
    card.insertChild(image);

    card.updateLayout();
    card.updateLayout();

    expect(setProps).toHaveBeenCalledTimes(1);
  });

  it('clips texture children inside a rounded border', () => {
    const card = new ElementNode('view');
    const image = new ElementNode('view');
    const setProps = vi.fn();
    const childClipShader = {
      shaderKey: 'roundedChildClip',
      value: { nodeRadius: [0, 0, 0, 0] },
      set props(value) {
        this.value = value;
        setProps(value);
      },
      get props() {
        return this.value;
      },
    };

    card.clipping = true;
    card.color = '#0000004d';
    card.width = 192;
    card.height = 108;
    card.lng.shader = {
      shaderKey: 'roundedWithBorder',
      props: {
        radius: 8,
        'border-w': [4, 4, 4, 4],
        'border-align': 0,
        'border-gap': 0,
      },
    } as any;

    image.rendered = true;
    image.lng = {
      src: 'preview.png',
      shader: childClipShader,
    } as any;
    image.width = 192;
    image.height = 108;
    card.insertChild(image);

    card.updateLayout();
    card.updateLayout();

    expect(childClipShader.props).toEqual({
      radius: [4, 4, 4, 4],
      nodeRadius: [0, 0, 0, 0],
      clipX: -4,
      clipY: -4,
      clipW: 184,
      clipH: 100,
    });
    expect(setProps).toHaveBeenCalledTimes(1);
  });

  it('stops an in-flight transition before starting another for the same prop', () => {
    const first = {
      start: vi.fn(function () {
        return first;
      }),
      stop: vi.fn(function () {
        return first;
      }),
      waitUntilStopped: vi.fn(() => new Promise<void>(() => {})),
    };
    const second = {
      start: vi.fn(function () {
        return second;
      }),
      stop: vi.fn(function () {
        return second;
      }),
      waitUntilStopped: vi.fn(() => new Promise<void>(() => {})),
    };
    const animate = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const node = renderedNode();
    node.lng = { animate } as any;
    node.transition = { color: true };

    node.color = '#38bdf8ff';
    node.color = '#1e293bff';

    expect(first.stop).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it('keeps state fallback values while blur transitions are still running', () => {
    const pending = new Promise<void>(() => {});
    const animate = vi.fn(() => {
      const controller = {
        state: 'running' as 'running' | 'stopped',
        start: vi.fn(() => controller),
        stop: vi.fn(() => {
          controller.state = 'stopped' as const;
          return controller;
        }),
        waitUntilStopped: vi.fn(() => pending),
      };
      return controller;
    });
    const node = renderedNode();
    node.lng = {
      color: 0x1e293bff,
      scale: 1,
      animate,
    } as any;
    node.style = {
      $focus: {
        color: '#38bdf8ff',
        scale: 1.04,
      },
    };
    node.transition = { color: true, scale: true };

    node.states.add('$focus');
    node.states.remove('$focus');
    node.lng.color = 0x2b6d91ff;
    node.lng.scale = 1.02;
    node.states.add('$focus');
    node.states.remove('$focus');

    expect(animate).toHaveBeenLastCalledWith({ scale: 1 }, expect.any(Object));
    expect(animate).toHaveBeenNthCalledWith(
      7,
      { color: 0x1e293bff },
      expect.any(Object),
    );
  });

  it('does not let old transition cleanup hide a reused controller', async () => {
    let resolveStopped!: () => void;
    let stopped = new Promise<void>((resolve) => {
      resolveStopped = resolve;
    });
    const controller = {
      state: 'running' as 'running' | 'stopped',
      start: vi.fn(() => controller),
      stop: vi.fn(() => {
        controller.state = 'stopped' as const;
        return controller;
      }),
      waitUntilStopped: vi.fn(() => stopped),
    };
    const animate = vi.fn(() => controller);
    const node = renderedNode();
    node.lng = { color: 0x1e293bff, animate } as any;
    node.transition = { color: true };
    node.style = {
      $focus: {
        color: '#38bdf8ff',
      },
    };

    node.states.add('$focus');
    resolveStopped();
    stopped = new Promise<void>(() => {});
    node.states.remove('$focus');
    await Promise.resolve();
    node.states.add('$focus');
    node.states.remove('$focus');

    expect(controller.stop).toHaveBeenCalledTimes(3);
  });

  it('releases internal caches when destroyed', () => {
    const parent = new ElementNode('view');
    const node = renderedNode();
    const destroy = vi.fn();

    parent.insertChild(node);
    node.lng = { destroy } as any;
    node._appliedProps = { x: 10 };
    node._flexLayoutScratch = {
      capacity: 1,
      processableChildrenIndices: [0],
      childMainSizes: new Float32Array(1),
      childMarginStarts: new Float32Array(1),
      childMarginEnds: new Float32Array(1),
      childTotalMainSizes: new Float32Array(1),
      childCrossSizes: new Float32Array(1),
      childMarginCrossStarts: new Float32Array(1),
      childMarginCrossEnds: new Float32Array(1),
    };
    node._svelteEffect = {};

    node.destroy();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(node.parent).toBeUndefined();
    expect(node._appliedProps).toBeUndefined();
    expect(node._flexLayoutScratch).toBeUndefined();
    expect(node._svelteEffect).toBeUndefined();
  });

  it('does not clear a transition while a reused controller is still running', async () => {
    const controller = {
      state: 'running' as 'running' | 'stopped',
      start: vi.fn(() => controller),
      stop: vi.fn(() => {
        controller.state = 'stopped' as const;
        return controller;
      }),
      waitUntilStopped: vi.fn(() => Promise.resolve()),
    };
    const animate = vi.fn(() => controller);
    const node = renderedNode();
    node.lng = { color: 0x1e293bff, animate } as any;
    node.transition = { color: true };

    node.color = '#38bdf8ff';
    await Promise.resolve();
    node.color = '#1e293bff';

    expect(controller.stop).toHaveBeenCalledTimes(1);
  });
});
