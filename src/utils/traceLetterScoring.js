const finitePoint = point => (
  Array.isArray(point)
  && Number.isFinite(point[0])
  && Number.isFinite(point[1])
);

function squaredDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return (dx * dx) + (dy * dy);
}

function nearAny(point, points, toleranceSquared) {
  return points.some(candidate => squaredDistance(point, candidate) <= toleranceSquared);
}

function distance(a, b) {
  return Math.sqrt(squaredDistance(a, b));
}

function normaliseStrokes(strokes = []) {
  return strokes
    .map(stroke => (Array.isArray(stroke) ? stroke.filter(finitePoint) : []))
    .filter(stroke => stroke.length > 0);
}

function strokeLength(stroke = []) {
  let total = 0;
  for (let index = 1; index < stroke.length; index += 1) {
    total += distance(stroke[index - 1], stroke[index]);
  }
  return total;
}

/**
 * Pointer events arrive at very different rates on a mouse, an iPad and a
 * school Chromebook. Compare uniformly spaced points so a fast stroke is not
 * marked differently merely because one device emitted fewer events.
 */
function resampleStroke(stroke = [], spacing = 6, maximumPoints = 96) {
  if (stroke.length <= 1) return stroke.slice();
  const cumulative = [0];
  for (let index = 1; index < stroke.length; index += 1) {
    cumulative.push(cumulative[index - 1] + distance(stroke[index - 1], stroke[index]));
  }
  const total = cumulative.at(-1);
  if (total <= 0.001) return [stroke[0]];
  const count = Math.max(2, Math.min(
    maximumPoints,
    Math.ceil(total / Math.max(2, spacing)) + 1
  ));
  const points = [];
  let segment = 1;
  for (let index = 0; index < count; index += 1) {
    const target = (total * index) / (count - 1);
    while (segment < cumulative.length - 1 && cumulative[segment] < target) segment += 1;
    const startDistance = cumulative[segment - 1];
    const endDistance = cumulative[segment];
    const ratio = endDistance === startDistance
      ? 0
      : (target - startDistance) / (endDistance - startDistance);
    points.push([
      stroke[segment - 1][0] + ((stroke[segment][0] - stroke[segment - 1][0]) * ratio),
      stroke[segment - 1][1] + ((stroke[segment][1] - stroke[segment - 1][1]) * ratio)
    ]);
  }
  return points;
}

/**
 * Find the cheapest order-preserving alignment of a drawn stroke to any
 * contiguous part of an expected stroke. The child may start or finish a little
 * short, but the matched expected-point indexes may never run backwards.
 *
 * Running this once against the expected points and once against their reverse
 * distinguishes a correctly formed line from the same shape drawn backwards.
 * This is deliberately not a flattened point-cloud comparison.
 */
function orderedAlignment(drawn = [], expected = []) {
  if (!drawn.length || !expected.length) {
    return { meanDistance: Number.POSITIVE_INFINITY, indexes: [], span: 0 };
  }
  if (expected.length === 1) {
    return {
      meanDistance: drawn.reduce((total, point) => total + distance(point, expected[0]), 0) / drawn.length,
      indexes: drawn.map(() => 0),
      span: 0
    };
  }

  let previous = expected.map(point => distance(drawn[0], point));
  const parents = [expected.map(() => -1)];

  for (let drawnIndex = 1; drawnIndex < drawn.length; drawnIndex += 1) {
    const prefixCosts = [];
    const prefixIndexes = [];
    let bestCost = Number.POSITIVE_INFINITY;
    let bestIndex = 0;
    for (let expectedIndex = 0; expectedIndex < expected.length; expectedIndex += 1) {
      if (previous[expectedIndex] < bestCost) {
        bestCost = previous[expectedIndex];
        bestIndex = expectedIndex;
      }
      prefixCosts[expectedIndex] = bestCost;
      prefixIndexes[expectedIndex] = bestIndex;
    }
    const current = expected.map((point, expectedIndex) => (
      prefixCosts[expectedIndex] + distance(drawn[drawnIndex], point)
    ));
    parents.push(prefixIndexes);
    previous = current;
  }

  let endIndex = 0;
  for (let index = 1; index < previous.length; index += 1) {
    if (previous[index] < previous[endIndex]) endIndex = index;
  }
  const indexes = new Array(drawn.length);
  indexes[indexes.length - 1] = endIndex;
  for (let drawnIndex = drawn.length - 1; drawnIndex > 0; drawnIndex -= 1) {
    indexes[drawnIndex - 1] = parents[drawnIndex][indexes[drawnIndex]];
  }
  const minimum = Math.min(...indexes);
  const maximum = Math.max(...indexes);
  return {
    meanDistance: previous[endIndex] / drawn.length,
    indexes,
    span: (maximum - minimum) / Math.max(1, expected.length - 1)
  };
}

function pointCoverage(target = [], evidence = [], toleranceSquared) {
  if (!target.length) return 0;
  return target.filter(point => nearAny(point, evidence, toleranceSquared)).length / target.length;
}

function matchDrawnStroke(drawn, expected, tolerance) {
  const toleranceSquared = tolerance * tolerance;
  const reversedExpected = [...expected].reverse();
  const forward = orderedAlignment(drawn, expected);
  const reverse = orderedAlignment(drawn, reversedExpected);
  const precision = pointCoverage(drawn, expected, toleranceSquared);
  const coverage = pointCoverage(expected, drawn, toleranceSquared);
  const expectedIsDot = expected.length <= 2 || strokeLength(expected) <= tolerance * 0.3;
  const directional = !expectedIsDot && strokeLength(drawn) > tolerance * 0.45;
  const directionMargin = Math.max(1.5, tolerance * 0.08);
  const directionForward = !directional || (
    forward.meanDistance <= tolerance
    && (
      reverse.meanDistance - forward.meanDistance >= directionMargin
      || forward.meanDistance <= reverse.meanDistance * 0.82
    )
  );
  const bestAlignment = Math.min(forward.meanDistance, reverse.meanDistance);
  const alignmentQuality = Math.max(0, 1 - (bestAlignment / (tolerance * 2.5)));
  return {
    precision,
    coverage,
    forward,
    reverse,
    directional,
    directionForward,
    score: (precision * 0.55) + (coverage * 0.25) + (alignmentQuality * 0.2)
  };
}

export function scoreLetterTrace({
  drawnStrokes = [],
  expectedStrokes = [],
  tolerance = 23
} = {}) {
  const drawn = normaliseStrokes(drawnStrokes);
  const expected = normaliseStrokes(expectedStrokes);
  const spacing = Math.max(3, tolerance / 4);
  const sampledDrawn = drawn.map(stroke => resampleStroke(stroke, spacing));
  const sampledExpected = expected.map(stroke => resampleStroke(stroke, spacing));
  const drawnPoints = sampledDrawn.flat();
  const expectedPoints = sampledExpected.flat();
  const toleranceSquared = tolerance * tolerance;

  // Use resampled evidence here rather than raw pointer-event count. A valid
  // fast stroke may produce only a handful of events on a low-rate device.
  if (drawnPoints.length < 8 || expectedPoints.length < 8) {
    return {
      pass: false,
      coverage: 0,
      precision: 0,
      strokeCoverage: 0,
      endpointCoverage: 0,
      directionScore: 0,
      orderScore: 0,
      unmatchedStrokeRatio: drawnPoints.length ? 1 : 0
    };
  }

  const assignments = sampledDrawn.map((stroke, drawnIndex) => {
    const candidates = sampledExpected.map((expectedStroke, expectedIndex) => ({
      expectedIndex,
      ...matchDrawnStroke(stroke, expectedStroke, tolerance)
    })).sort((left, right) => right.score - left.score);
    const best = candidates[0];
    const length = strokeLength(stroke);
    const accepted = Boolean(best) && (
      (length <= tolerance * 0.3 && best.precision >= 0.8)
      || (
        best.precision >= 0.46
        && Math.min(best.forward.meanDistance, best.reverse.meanDistance) <= tolerance * 1.1
      )
    );
    return {
      drawnIndex,
      stroke,
      length,
      accepted,
      ...(best || {
        expectedIndex: -1,
        precision: 0,
        coverage: 0,
        directional: false,
        directionForward: false,
        forward: { span: 0, indexes: [] }
      })
    };
  });

  const substantialAssignments = assignments.filter(row => (
    row.accepted || row.length > tolerance * 0.45
  ));
  const acceptedAssignments = assignments.filter(row => row.accepted);
  const assignedExpectedOrder = acceptedAssignments
    .filter(row => row.length > tolerance * 0.45 || sampledExpected[row.expectedIndex]?.length <= 2)
    .map(row => row.expectedIndex);
  const expectedOrderCorrect = assignedExpectedOrder.every((
    expectedIndex,
    index
  ) => index === 0 || expectedIndex >= assignedExpectedOrder[index - 1]);

  const strokeResults = sampledExpected.map((expectedStroke, expectedIndex) => {
    const assigned = acceptedAssignments.filter(row => row.expectedIndex === expectedIndex);
    const assignedPoints = assigned.flatMap(row => row.stroke);
    const expectedCoverage = pointCoverage(
      expectedStroke,
      assignedPoints,
      toleranceSquared
    );
    const assignedPrecision = pointCoverage(
      assignedPoints,
      expectedStroke,
      toleranceSquared
    );
    const directional = assigned.filter(row => row.directional);
    const directionCorrect = directional.every(row => row.directionForward);
    const fragmentProgress = assigned
      .filter(row => row.length > tolerance * 0.45)
      .map(row => {
        const indexes = row.forward.indexes || [];
        const denominator = Math.max(1, expectedStroke.length - 1);
        return {
          start: (indexes[0] || 0) / denominator,
          end: (indexes.at(-1) || 0) / denominator
        };
      });
    // An accidental lift is allowed. Returning to a much earlier part of the
    // same expected stroke is not: that is a restart/reversal, not formation.
    const fragmentOrderCorrect = fragmentProgress.every((fragment, index) => (
      index === 0 || fragment.start >= fragmentProgress[index - 1].end - 0.2
    ));
    const endpointToleranceSquared = (tolerance * 1.45) ** 2;
    const endpointMatches = assignedPoints.length
      ? Number(nearAny(expectedStroke[0], assignedPoints, endpointToleranceSquared))
        + Number(nearAny(expectedStroke.at(-1), assignedPoints, endpointToleranceSquared))
      : 0;
    return {
      assigned,
      coverage: expectedCoverage,
      precision: assignedPrecision,
      geometryComplete: assigned.length > 0
        && expectedCoverage >= 0.5
        && assignedPrecision >= 0.55,
      directionCorrect,
      fragmentOrderCorrect,
      endpointMatches
    };
  });

  const coverage = pointCoverage(expectedPoints, drawnPoints, toleranceSquared);
  const precision = pointCoverage(drawnPoints, expectedPoints, toleranceSquared);
  const strokeCoverage = strokeResults.filter(row => row.geometryComplete).length / expected.length;
  const endpointCoverage = strokeResults.reduce(
    (total, row) => total + row.endpointMatches,
    0
  ) / (expected.length * 2);
  const directionalStrokeResults = strokeResults.filter(row => (
    row.assigned.some(assignment => assignment.directional)
  ));
  const directionScore = directionalStrokeResults.length
    ? directionalStrokeResults.filter(row => row.directionCorrect).length
      / directionalStrokeResults.length
    : 0;
  const fragmentOrderCorrect = strokeResults.every(row => row.fragmentOrderCorrect);
  const orderScore = expectedOrderCorrect && fragmentOrderCorrect ? 1 : 0;
  const totalDrawnLength = assignments.reduce((total, row) => total + row.length, 0);
  const unmatchedLength = substantialAssignments
    .filter(row => !row.accepted)
    .reduce((total, row) => total + row.length, 0);
  const unmatchedStrokeRatio = totalDrawnLength > 0 ? unmatchedLength / totalDrawnLength : 1;

  return {
    pass: (
      coverage >= 0.72
      && precision >= 0.62
      && strokeCoverage === 1
      && endpointCoverage >= 0.78
      && directionScore === 1
      && orderScore === 1
      && unmatchedStrokeRatio <= 0.12
    ),
    coverage,
    precision,
    strokeCoverage,
    endpointCoverage,
    directionScore,
    orderScore,
    unmatchedStrokeRatio
  };
}
