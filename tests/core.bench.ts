import { bench, describe } from 'vitest';
import { applyNodeProps, ElementNode } from '../src/core/index.js';

function renderedNode() {
  const node = new ElementNode('view');
  node.rendered = true;
  return node;
}

function flexTree(children = 240) {
  const row = new ElementNode('view');
  row.display = 'flex';
  row.width = 1920;
  row.height = 300;
  row.gap = 8;

  for (let i = 0; i < children; i++) {
    const child = new ElementNode('view');
    child.width = 80 + (i % 4) * 8;
    child.height = 60;
    child.marginLeft = i % 3;
    child.marginRight = i % 5;
    row.insertChild(child);
  }

  return row;
}

function roundedClipTree(children = 160) {
  const card = new ElementNode('view');
  card.display = 'flex';
  card.flexDirection = 'column';
  card.clipping = true;
  card.color = '#ffffff15';
  card.lng.shader = {
    shaderKey: 'rounded',
    props: { radius: 16 },
  } as any;

  for (let i = 0; i < children; i++) {
    const child = new ElementNode('view');
    child.rendered = true;
    child.lng = {
      src: i === 0 ? 'image.png' : undefined,
      shader: {
        shaderKey: 'roundedChildClip',
        props: { nodeRadius: [0, 0, 0, 0] },
      },
    } as any;
    child.width = 192;
    child.height = 32;
    card.insertChild(child);
  }

  return card;
}

describe('core engine hot paths', () => {
  bench('apply unchanged props', () => {
    const node = renderedNode();
    const style = { color: '#38bdf8ff', $focus: { scale: 1.04 } };
    applyNodeProps(node, { x: 10, y: 20, alpha: 1, style });
    for (let i = 0; i < 1000; i++) {
      applyNodeProps(node, { x: 10, y: 20, alpha: 1, style });
    }
  });

  bench('flex layout 240 children', () => {
    const row = flexTree();
    for (let i = 0; i < 100; i++) {
      row.updateLayout();
    }
  });

  bench('state focus toggle', () => {
    const node = renderedNode();
    node.color = '#1e293bff';
    node.style = {
      $focus: {
        color: '#38bdf8ff',
        scale: 1.04,
      },
    };

    for (let i = 0; i < 1000; i++) {
      node.states.add('$focus');
      node.states.remove('$focus');
    }
  });

  bench('multi-state style merge', () => {
    const node = renderedNode();
    node.color = '#1e293bff';
    node.x = 0;
    node.y = 0;
    node.style = {
      $focus: {
        color: '#38bdf8ff',
        scale: 1.04,
      },
      $active: {
        alpha: 0.85,
        x: 24,
      },
      $pressed: {
        y: 12,
      },
    };

    for (let i = 0; i < 1000; i++) {
      node.states = [];
      node.states = ['$focus', '$active', '$pressed'];
    }
  });

  bench('rounded clipping update 160 children', () => {
    const card = roundedClipTree();
    for (let i = 0; i < 100; i++) {
      card.updateLayout();
    }
  });
});
