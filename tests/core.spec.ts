import { describe, expect, it, vi } from 'vitest';
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
