import { type ElementNode } from './elementNode.js';
import { isTextNode, isElementText } from './utils.js';

function getScratch(node: ElementNode, size: number) {
  let scratch = node._flexLayoutScratch;
  if (!scratch || scratch.capacity < size) {
    scratch = {
      capacity: size,
      processableChildrenIndices: [],
      childMainSizes: new Float32Array(size),
      childMarginStarts: new Float32Array(size),
      childMarginEnds: new Float32Array(size),
      childTotalMainSizes: new Float32Array(size),
      childCrossSizes: new Float32Array(size),
      childMarginCrossStarts: new Float32Array(size),
      childMarginCrossEnds: new Float32Array(size),
    };
    node._flexLayoutScratch = scratch;
  }
  scratch.processableChildrenIndices.length = 0;
  return scratch;
}

function getArrayValue(
  val: number | number[] | undefined,
  index: number,
  defaultValue: number = 0,
): number {
  if (val === undefined) return defaultValue;
  if (typeof val === 'number') return val;

  const len = val.length;
  let result;
  if (len === 2) {
    result = index % 2 === 0 ? val[0] : val[1];
  } else if (len === 3) {
    result = index === 0 ? val[0] : index === 2 ? val[2] : val[1];
  } else {
    result = val[index];
  }
  return result ?? defaultValue;
}

function setLayoutNumber(
  node: ElementNode,
  key: 'x' | 'y' | 'width' | 'height',
  value: number,
) {
  if (node[key] !== value) {
    node[key] = value;
  }
}

export default function calculateFlex(
  node: ElementNode,
  lockedDimension?: 'width' | 'height',
): boolean {
  const direction = node.flexDirection || 'row';
  const isRow = direction === 'row' || direction === 'row-reverse';
  const isReverse =
    direction === 'row-reverse' || direction === 'column-reverse';
  const dimension = isRow ? 'width' : 'height';
  const crossDimension = isRow ? 'height' : 'width';

  // padding order: Top, Right, Bottom, Left
  const nodePadding = node.padding;
  const paddingTop = node.paddingTop ?? getArrayValue(nodePadding, 0);
  const paddingRight = node.paddingRight ?? getArrayValue(nodePadding, 1);
  const paddingBottom = node.paddingBottom ?? getArrayValue(nodePadding, 2);
  const paddingLeft = node.paddingLeft ?? getArrayValue(nodePadding, 3);

  const paddingStart = isRow ? paddingLeft : paddingTop;
  const paddingEnd = isRow ? paddingRight : paddingBottom;
  const paddingCrossStart = isRow ? paddingTop : paddingLeft;
  const paddingCrossEnd = isRow ? paddingBottom : paddingRight;
  const nodePaddingTotal = paddingStart + paddingEnd;

  const minDimension = isRow ? 'minWidth' : 'minHeight';
  const crossMinDimension = isRow ? 'minHeight' : 'minWidth';

  const children = node.children;
  const numChildren = children.length;

  if (numChildren === 0) {
    return false;
  }

  const scratch = getScratch(node, numChildren);
  const processableChildrenIndices = scratch.processableChildrenIndices;
  let hasOrder = false;
  let totalFlexGrow = 0;
  let totalFlexShrink = 0;

  for (let i = 0; i < numChildren; i++) {
    const c = children[i]!;

    if (isElementText(c) && c.text && !(c.width || c.height)) {
      return false; // specific text layout constraint
    }

    if (isTextNode(c) || c.flexItem === false) {
      continue;
    }

    if (c.flexOrder !== undefined) {
      hasOrder = true;
    }

    const flexGrow = c.flexGrow;
    if (flexGrow !== undefined && flexGrow > 0) {
      totalFlexGrow += flexGrow;
    }

    const flexShrink = c.flexShrink;
    if (flexShrink !== undefined && flexShrink > 0) {
      totalFlexShrink += flexShrink;
    }

    if (c[minDimension] && (c[dimension] || 0) < c[minDimension]) {
      c[dimension] = c[minDimension]!;
    }

    if (
      c[crossMinDimension] &&
      (c[crossDimension] || 0) < c[crossMinDimension]
    ) {
      c[crossDimension] = c[crossMinDimension]!;
    }

    processableChildrenIndices.push(i);
  }

  if (hasOrder) {
    processableChildrenIndices.sort((aIdx, bIdx) => {
      const a = children[aIdx] as ElementNode;
      const b = children[bIdx] as ElementNode;
      return (a.flexOrder || 0) - (b.flexOrder || 0);
    });
  }

  // Apply reverse layout ordering
  if (isReverse || node.direction === 'rtl') {
    processableChildrenIndices.reverse();
  }

  const numProcessedChildren = processableChildrenIndices.length;
  if (numProcessedChildren === 0) {
    return false;
  }

  const prop = isRow ? 'x' : 'y';
  const crossProp = isRow ? 'y' : 'x';
  let containerSize = Math.max(
    node[dimension] || 0,
    node[minDimension] || 0,
    0,
  );
  let containerCrossSize = Math.max(
    node[crossDimension] || 0,
    node[crossMinDimension] || 0,
    0,
  );
  const isWrapReverse = node.flexWrap === 'wrap-reverse';
  const gap = node.gap || 0;
  const justify = node.justifyContent || 'flexStart';
  const align = node.alignItems || 'flexStart';
  let containerUpdated = false;

  const childMainSizes = scratch.childMainSizes;
  const childMarginStarts = scratch.childMarginStarts;
  const childMarginEnds = scratch.childMarginEnds;
  const childTotalMainSizes = scratch.childTotalMainSizes;
  const childCrossSizes = scratch.childCrossSizes;
  const childMarginCrossStarts = scratch.childMarginCrossStarts;
  const childMarginCrossEnds = scratch.childMarginCrossEnds;

  let sumOfFlexBaseSizesWithMargins = 0;

  for (let idx = 0; idx < numProcessedChildren; idx++) {
    const c = children[processableChildrenIndices[idx]!] as ElementNode;
    const marginArray = c.margin;
    // index mappings for margins: Top: 0, Right: 1, Bottom: 2, Left: 3
    // if row: main = left/right (3/1),
    const flexBasis = c.flexBasis;
    const isBasisAuto = flexBasis === undefined || flexBasis === 'auto';
    const computedBasis = isBasisAuto
      ? c[dimension] || 0
      : (flexBasis as number);
    const baseMainSize = isBasisAuto
      ? computedBasis
      : Math.max(computedBasis, c[minDimension] || 0);

    const marginStart = isRow
      ? c.marginLeft || getArrayValue(marginArray, 3)
      : c.marginTop || getArrayValue(marginArray, 0);
    const marginEnd = isRow
      ? c.marginRight || getArrayValue(marginArray, 1)
      : c.marginBottom || getArrayValue(marginArray, 2);
    const marginCrossStart = isRow
      ? c.marginTop || getArrayValue(marginArray, 0)
      : c.marginLeft || getArrayValue(marginArray, 3);
    const marginCrossEnd = isRow
      ? c.marginBottom || getArrayValue(marginArray, 2)
      : c.marginRight || getArrayValue(marginArray, 1);

    childMainSizes[idx] = baseMainSize;
    childMarginStarts[idx] = marginStart;
    childMarginEnds[idx] = marginEnd;
    childTotalMainSizes[idx] = baseMainSize + marginStart + marginEnd;
    childCrossSizes[idx] = c[crossDimension] || 0;
    childMarginCrossStarts[idx] = marginCrossStart;
    childMarginCrossEnds[idx] = marginCrossEnd;

    sumOfFlexBaseSizesWithMargins += childTotalMainSizes[idx]!;
  }

  if ((totalFlexGrow > 0 || totalFlexShrink > 0) && numProcessedChildren > 1) {
    node.flexBoundary = node.flexBoundary || 'fixed';

    const totalGapSpace =
      numProcessedChildren > 0 ? gap * (numProcessedChildren - 1) : 0;
    const availableSpace =
      containerSize - sumOfFlexBaseSizesWithMargins - totalGapSpace;

    if (availableSpace > 0 && totalFlexGrow > 0) {
      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        const flexGrowValue = c.flexGrow || 0;
        if (flexGrowValue > 0) {
          const shareOfSpace = (flexGrowValue / totalFlexGrow) * availableSpace;
          const newMainSize = childMainSizes[idx]! + shareOfSpace;
          setLayoutNumber(c, dimension, newMainSize);
          childMainSizes[idx] = newMainSize;
          childTotalMainSizes[idx] =
            newMainSize + childMarginStarts[idx]! + childMarginEnds[idx]!;
        }
      }
      node._containsFlexGrow = node._containsFlexGrow ? null : true;
    } else if (availableSpace < 0 && totalFlexShrink > 0) {
      // Flex Shrink Phase
      let totalScaledShrinkFactor = 0;
      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        const flexShrinkValue = c.flexShrink || 0;
        totalScaledShrinkFactor += flexShrinkValue * childMainSizes[idx]!;
      }

      if (totalScaledShrinkFactor > 0) {
        for (let idx = 0; idx < numProcessedChildren; idx++) {
          const c = children[processableChildrenIndices[idx]!] as ElementNode;
          const flexShrinkValue = c.flexShrink || 0;
          if (flexShrinkValue > 0) {
            const shrinkRatio =
              (flexShrinkValue * childMainSizes[idx]!) /
              totalScaledShrinkFactor;
            const sizeReduction = shrinkRatio * Math.abs(availableSpace);
            let newMainSize = childMainSizes[idx]! - sizeReduction;

            // Constrain by min width/height
            const minBound = c[minDimension] || 0;
            if (newMainSize < minBound) {
              newMainSize = minBound;
            }

            setLayoutNumber(c, dimension, newMainSize);
            childMainSizes[idx] = newMainSize;
            childTotalMainSizes[idx] =
              newMainSize + childMarginStarts[idx]! + childMarginEnds[idx]!;
          }
        }
      }
      node._containsFlexGrow = node._containsFlexGrow ? null : true;
    } else if (node._containsFlexGrow) {
      node._containsFlexGrow = null;
    }
  }

  let totalItemSize = 0;
  for (let idx = 0; idx < numProcessedChildren; idx++) {
    totalItemSize += childTotalMainSizes[idx]!;
  }

  const totalGapSize =
    numProcessedChildren > 0 ? gap * (numProcessedChildren - 1) : 0;
  const shouldUpdateMainSize = isRow ? node._calcWidth : node._calcHeight;
  if (
    shouldUpdateMainSize &&
    dimension !== lockedDimension &&
    node.flexBoundary !== 'fixed' &&
    node.flexWrap !== 'wrap'
  ) {
    let calculatedSize = totalItemSize + totalGapSize + nodePaddingTotal;
    const minSize = node[minDimension] || 0;
    if (calculatedSize < minSize) {
      calculatedSize = minSize;
    }
    if (calculatedSize !== (node[dimension] || 0)) {
      node[`preFlex${dimension}`] = containerSize;
      setLayoutNumber(node, dimension, calculatedSize);
      containerSize = calculatedSize;
      containerUpdated = true;
    }
  }

  const doCrossAlign = (
    c: ElementNode,
    idx: number,
    crossCurrentPos: number = paddingCrossStart,
  ) => {
    const alignSelf = c.alignSelf || align;
    if (!alignSelf || !containerCrossSize) {
      return;
    }

    const innerCrossSize = Math.max(
      0,
      containerCrossSize - paddingCrossStart - paddingCrossEnd,
    );
    if (alignSelf === 'flexStart') {
      setLayoutNumber(
        c,
        crossProp,
        crossCurrentPos + childMarginCrossStarts[idx]!,
      );
    } else if (alignSelf === 'center') {
      setLayoutNumber(
        c,
        crossProp,
        crossCurrentPos +
          (innerCrossSize - childCrossSizes[idx]!) / 2 +
          childMarginCrossStarts[idx]!,
      );
    } else if (alignSelf === 'flexEnd') {
      setLayoutNumber(
        c,
        crossProp,
        crossCurrentPos +
          innerCrossSize -
          childCrossSizes[idx]! -
          childMarginCrossEnds[idx]!,
      );
    } else if (alignSelf === 'stretch') {
      const currentCrossSize = childCrossSizes[idx]!;
      const stretchedCrossSize = Math.max(
        0,
        innerCrossSize -
          childMarginCrossStarts[idx]! -
          childMarginCrossEnds[idx]!,
      );
      setLayoutNumber(c, crossDimension, stretchedCrossSize);
      childCrossSizes[idx] = stretchedCrossSize;
      setLayoutNumber(
        c,
        crossProp,
        crossCurrentPos + childMarginCrossStarts[idx]!,
      );
      if (stretchedCrossSize !== currentCrossSize && c.display === 'flex') {
        calculateFlex(c, crossDimension);
      }
    }
  };

  const shouldUpdateCrossSize = isRow ? node._calcHeight : node._calcWidth;
  if (
    shouldUpdateCrossSize &&
    crossDimension !== lockedDimension &&
    !node.flexCrossBoundary
  ) {
    let maxCrossSize = 0;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      if (childCrossSizes[idx]! > maxCrossSize) {
        maxCrossSize = childCrossSizes[idx]!;
      }
    }
    const newCrossSize = maxCrossSize
      ? maxCrossSize + paddingCrossStart + paddingCrossEnd
      : node[crossDimension];
    if (newCrossSize !== node[crossDimension]) {
      containerUpdated = true;
      setLayoutNumber(node, crossDimension, newCrossSize);
      containerCrossSize = newCrossSize;
    }
  }

  let currentPos = paddingStart;
  if (justify === 'flexStart') {
    if (node.flexWrap === 'wrap') {
      const childCrossSizeVar =
        numProcessedChildren > 0 ? childCrossSizes[0]! : containerCrossSize;
      let crossCurrentPos = isWrapReverse
        ? containerCrossSize - paddingCrossEnd - childCrossSizeVar
        : paddingCrossStart;
      const crossGap = isRow ? (node.columnGap ?? gap) : (node.rowGap ?? gap);

      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        if (
          currentPos + childTotalMainSizes[idx]! > containerSize &&
          currentPos > paddingStart
        ) {
          currentPos = paddingStart;
          crossCurrentPos += isWrapReverse
            ? -(childCrossSizeVar + crossGap)
            : childCrossSizeVar + crossGap;
        }
        setLayoutNumber(c, prop, currentPos + childMarginStarts[idx]!);
        currentPos += childTotalMainSizes[idx]! + gap;
        doCrossAlign(c, idx, crossCurrentPos);
      }

      const finalCrossSize = isWrapReverse
        ? containerCrossSize - crossCurrentPos + paddingCrossStart
        : crossCurrentPos + childCrossSizeVar + paddingCrossEnd;

      if (node[crossDimension] !== finalCrossSize) {
        node[`preFlex${crossDimension}`] = node[crossDimension];
        setLayoutNumber(node, crossDimension, finalCrossSize);
        containerUpdated = true;
      }
    } else {
      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        setLayoutNumber(c, prop, currentPos + childMarginStarts[idx]!);
        currentPos += childTotalMainSizes[idx]! + gap;
        doCrossAlign(c, idx, paddingCrossStart);
      }
    }

    // Update container size
    if (
      node.flexBoundary !== 'fixed' &&
      node.flexWrap !== 'wrap' &&
      dimension !== lockedDimension
    ) {
      let calculatedSize = currentPos - gap + paddingEnd;
      const minSize = node[minDimension] || 0;
      if (calculatedSize < minSize) {
        calculatedSize = minSize;
      }
      if (calculatedSize !== (node[dimension] || 0)) {
        node[`preFlex${dimension}`] = containerSize;
        setLayoutNumber(node, dimension, calculatedSize);
        return true;
      }
    }
  } else if (justify === 'flexEnd') {
    currentPos = containerSize - paddingEnd;
    for (let idx = numProcessedChildren - 1; idx >= 0; idx--) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      setLayoutNumber(
        c,
        prop,
        currentPos - childMainSizes[idx]! - childMarginEnds[idx]!,
      );
      currentPos -= childTotalMainSizes[idx]! + gap;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'center') {
    currentPos =
      paddingStart +
      (containerSize - nodePaddingTotal - (totalItemSize + totalGapSize)) / 2;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      setLayoutNumber(c, prop, currentPos + childMarginStarts[idx]!);
      currentPos += childTotalMainSizes[idx]! + gap;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'spaceBetween') {
    const spaceBetween =
      numProcessedChildren > 1
        ? (containerSize - totalItemSize - nodePaddingTotal) /
          (numProcessedChildren - 1)
        : 0;
    currentPos = paddingStart;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      setLayoutNumber(c, prop, currentPos + childMarginStarts[idx]!);
      currentPos += childTotalMainSizes[idx]! + spaceBetween;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'spaceAround') {
    const spaceAround =
      numProcessedChildren > 0
        ? (containerSize - totalItemSize - nodePaddingTotal) /
          numProcessedChildren
        : 0;
    currentPos = paddingStart + spaceAround / 2;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      setLayoutNumber(c, prop, currentPos + childMarginStarts[idx]!);
      currentPos += childTotalMainSizes[idx]! + spaceAround;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'spaceEvenly') {
    const spaceEvenly =
      (containerSize - totalItemSize - nodePaddingTotal) /
      (numProcessedChildren + 1);
    currentPos = spaceEvenly + paddingStart;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      setLayoutNumber(c, prop, currentPos + childMarginStarts[idx]!);
      currentPos += childTotalMainSizes[idx]! + spaceEvenly;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  }

  return containerUpdated;
}
