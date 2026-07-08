import { describe, it } from 'vitest';
import { applyNodeProps, ElementNode } from '../src/core/index.js';

function heapUsed() {
  (globalThis as { gc?: () => void }).gc?.();
  return process.memoryUsage().heapUsed;
}

function formatBytes(value: number) {
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function report(name: string, before: number, after: number, count: number) {
  const delta = after - before;
  process.stdout.write(
    `${name}: ${formatBytes(delta)} delta, ${Math.round(delta / count)} bytes/item`,
  );
  process.stdout.write('\n');
}

function makeNode(index: number) {
  const node = new ElementNode('view');
  applyNodeProps(node, {
    x: index % 1920,
    y: Math.floor(index / 10),
    width: 120,
    height: 80,
    color: '#1e293bff',
    style: {
      $focus: {
        color: '#38bdf8ff',
        scale: 1.04,
      },
    },
  });
  return node;
}

describe('core memory benchmark', () => {
  it('reports heap usage for node props and flex scratch buffers', () => {
    const nodes: ElementNode[] = [];
    const beforeNodes = heapUsed();
    for (let i = 0; i < 20_000; i++) {
      nodes.push(makeNode(i));
    }
    const afterNodes = heapUsed();
    report('20k ElementNode + props', beforeNodes, afterNodes, nodes.length);

    const flexParents: ElementNode[] = [];
    const beforeFlex = heapUsed();
    for (let i = 0; i < 500; i++) {
      const parent = new ElementNode('view');
      parent.display = 'flex';
      parent.width = 1920;
      parent.height = 300;
      for (let j = 0; j < 80; j++) {
        const child = new ElementNode('view');
        child.width = 100;
        child.height = 40;
        parent.insertChild(child);
      }
      parent.updateLayout();
      flexParents.push(parent);
    }
    const afterFlex = heapUsed();
    report(
      '500 flex parents + 40k children + scratch',
      beforeFlex,
      afterFlex,
      flexParents.length,
    );

    process.stdout.write(
      `retained nodes: ${nodes.length + flexParents.length}\n`,
    );
  });
});
