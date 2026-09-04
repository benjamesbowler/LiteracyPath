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

/**
 * A young child will often keep one finger on the glass while moving between
 * the modelled strokes. Treat that as one gesture, not one pedagogic stroke:
 * choose one forward interval for every expected stroke, in pedagogic order.
 * The dynamic programme considers all plausible start/end anchor visits as a
 * chain. That matters for B, M, W and other forms which deliberately revisit
 * an earlier anchor: a locally nearest endpoint can belong to a later stroke.
 * Travel between the chosen intervals is retained as transition evidence, so
 * a backwards stroke or retrace cannot disappear into an ignored connector.
 */
function partitionContinuousGesture(stroke = [], expected = [], tolerance = 23) {
  if (!stroke.length || expected.length < 2) return null;
  const anchorToleranceSquared = (tolerance * 1.5) ** 2;
  const spacing = Math.max(3, tolerance / 4);

  const journeyFor = journeyStrokes => journeyStrokes.flatMap((expectedStroke, index) => {
    if (index === 0) return expectedStroke;
    const connector = resampleStroke([
      journeyStrokes[index - 1].at(-1),
      expectedStroke[0]
    ], spacing);
    return [...connector.slice(1, -1), ...expectedStroke];
  });
  const forwardJourneyDistance = orderedAlignment(stroke, journeyFor(expected)).meanDistance;
  // Whole-journey resampling can move a very short connector by a fraction of
  // a pixel. Require both a useful absolute margin and a decisive relative
  // win before treating a reversed model as the better explanation.
  const directionMargin = Math.max(0.5, tolerance * 0.02);
  const reversedJourneyWins = expected.some((expectedStroke, reversedIndex) => {
    const expectedIsDot = expectedStroke.length <= 2
      || strokeLength(expectedStroke) <= tolerance * 0.3;
    if (expectedIsDot) return false;
    const reversedJourney = journeyFor(expected.map((candidate, index) => (
      index === reversedIndex ? [...candidate].reverse() : candidate
    )));
    const reversedDistance = orderedAlignment(stroke, reversedJourney).meanDistance;
    return reversedDistance + directionMargin < forwardJourneyDistance
      && reversedDistance < forwardJourneyDistance * 0.8;
  });
  if (reversedJourneyWins) return null;

  const candidatesByStroke = expected.map(expectedStroke => {
    const expectedLength = strokeLength(expectedStroke);
    const expectedIsDot = expectedStroke.length <= 2 || expectedLength <= tolerance * 0.3;
    const starts = [];
    const ends = [];
    stroke.forEach((point, index) => {
      if (squaredDistance(point, expectedStroke[0]) <= anchorToleranceSquared) starts.push(index);
      if (squaredDistance(point, expectedStroke.at(-1)) <= anchorToleranceSquared) ends.push(index);
    });

    const candidates = [];
    starts.forEach(start => {
      ends.forEach(end => {
        if (end < start || (!expectedIsDot && end === start)) return;
        const points = stroke.slice(start, end + 1);
        if (expectedIsDot) {
          candidates.push({
            start,
            end,
            points: [stroke[start]],
            cost: distance(stroke[start], expectedStroke[0]) / Math.max(1, tolerance)
          });
          return;
        }

        const match = matchDrawnStroke(points, expectedStroke, tolerance);
        const drawnLength = strokeLength(points);
        const lengthRatio = expectedLength > 0 ? drawnLength / expectedLength : 1;
        if (
          match.forward.meanDistance > tolerance * 1.1
          || match.coverage < 0.55
          || match.precision < 0.5
          || !match.directionForward
          || lengthRatio < 0.42
          || lengthRatio > 1.65
        ) return;

        const endpointCost = (
          distance(points[0], expectedStroke[0])
          + distance(points.at(-1), expectedStroke.at(-1))
        ) / Math.max(1, tolerance);
        candidates.push({
          start,
          end,
          points,
          cost: (match.forward.meanDistance / Math.max(1, tolerance))
            + ((1 - match.coverage) * 2)
            + ((1 - match.precision) * 1.5)
            + (Math.abs(1 - lengthRatio) * 0.35)
            + (endpointCost * 0.35)
        });
      });
    });
    return candidates;
  });

  if (candidatesByStroke.some(candidates => candidates.length === 0)) return null;

  const outsideTravelLimit = tolerance * 1.5;
  let states = candidatesByStroke[0].flatMap(candidate => {
    const prefixLength = strokeLength(stroke.slice(0, candidate.start + 1));
    if (prefixLength > outsideTravelLimit) return [];
    return [{
      candidate,
      chain: [candidate],
      transitionExcessLength: 0,
      cost: candidate.cost + (prefixLength / Math.max(1, tolerance))
    }];
  });
  if (!states.length) return null;

  for (let expectedIndex = 1; expectedIndex < expected.length; expectedIndex += 1) {
    const expectedConnectorLength = distance(
      expected[expectedIndex - 1].at(-1),
      expected[expectedIndex][0]
    );
    const nextStates = [];
    candidatesByStroke[expectedIndex].forEach(candidate => {
      let best = null;
      states.forEach(previous => {
        if (candidate.start < previous.candidate.end) return;
        const transitionPoints = stroke.slice(
          previous.candidate.end,
          candidate.start + 1
        );
        const transitionLength = strokeLength(transitionPoints);
        if (expectedConnectorLength <= tolerance * 0.3) {
          // Shared anchors need only a tiny bridge. If a whole backwards line
          // appears here, it is formation evidence rather than pen travel.
          if (transitionLength > tolerance * 1.35) return;
        } else {
          const connectorModel = resampleStroke([
            expected[expectedIndex - 1].at(-1),
            expected[expectedIndex][0]
          ], Math.max(3, tolerance / 4));
          const connectorAlignment = orderedAlignment(transitionPoints, connectorModel);
          const connectorPrecision = pointCoverage(
            transitionPoints,
            connectorModel,
            (tolerance * 1.4) ** 2
          );
          if (
            connectorAlignment.meanDistance > tolerance * 1.25
            || connectorPrecision < 0.55
            || transitionLength > (expectedConnectorLength * 1.65) + tolerance
          ) return;
        }
        // A child's bridge may bow around the letter. Allow 35% plus one pen
        // width, but retain any longer detour as unmatched formation evidence.
        const transitionAllowance = (expectedConnectorLength * 1.35) + tolerance;
        const transitionExcess = Math.max(0, transitionLength - transitionAllowance);
        const transitionCost = transitionExcess / Math.max(1, tolerance);
        const cost = previous.cost + candidate.cost + transitionCost;
        if (!best || cost < best.cost) {
          best = {
            candidate,
            chain: [...previous.chain, candidate],
            transitionExcessLength: previous.transitionExcessLength + transitionExcess,
            cost
          };
        }
      });
      if (best) nextStates.push(best);
    });
    if (!nextStates.length) return null;
    states = nextStates;
  }

  const best = states.reduce((winner, state) => {
    const suffixLength = strokeLength(stroke.slice(state.candidate.end));
    if (suffixLength > outsideTravelLimit) return winner;
    const finalCost = state.cost + (suffixLength / Math.max(1, tolerance));
    if (!winner || finalCost < winner.finalCost) return { ...state, finalCost };
    return winner;
  }, null);
  if (!best) return null;

  const expectedStrokeLength = expected.reduce(
    (total, expectedStroke) => total + strokeLength(expectedStroke),
    0
  );
  const expectedConnectorLength = expected.slice(1).reduce((total, expectedStroke, index) => (
    total + distance(expected[index].at(-1), expectedStroke[0])
  ), 0);
  return {
    pieces: best.chain.map(candidate => candidate.points),
    expectedJourneyLength: expectedStrokeLength + expectedConnectorLength,
    transitionExcessLength: best.transitionExcessLength,
    outsideTravelLength: strokeLength(stroke.slice(0, best.chain[0].start + 1))
      + strokeLength(stroke.slice(best.candidate.end))
  };
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
  tolerance = 23,
  profile = "strict"
} = {}) {
  // Adventure Map runs on a wide mix of classroom touchscreens. Keep the
  // default formation scorer deliberately exact for assessment and other
  // callers, but give the child-facing trace a little more pen-width room.
  // This is a profile, rather than a global threshold change, so a forgiving
  // map retry cannot silently weaken any other handwriting evidence.
  const adventureMapProfile = profile === "adventure-map";
  const scoringTolerance = adventureMapProfile ? Math.max(tolerance, 29) : tolerance;
  const drawn = normaliseStrokes(drawnStrokes);
  const expected = normaliseStrokes(expectedStrokes);
  const spacing = Math.max(3, scoringTolerance / 4);
  const sampledDrawn = drawn.map(stroke => resampleStroke(stroke, spacing));
  const sampledExpected = expected.map(stroke => resampleStroke(stroke, spacing));
  const drawnPoints = sampledDrawn.flat();
  const expectedPoints = sampledExpected.flat();
  const toleranceSquared = scoringTolerance * scoringTolerance;
  const continuousPartition = sampledDrawn.length === 1
    ? partitionContinuousGesture(sampledDrawn[0], sampledExpected, scoringTolerance)
    : null;
  const continuousPieces = continuousPartition?.pieces || null;
  const matchingStrokes = continuousPieces || sampledDrawn;

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

  const assignments = matchingStrokes.map((stroke, drawnIndex) => {
    const candidates = sampledExpected.map((expectedStroke, expectedIndex) => ({
      expectedIndex,
      ...matchDrawnStroke(stroke, expectedStroke, scoringTolerance)
    })).sort((left, right) => right.score - left.score);
    const best = candidates[0];
    const length = strokeLength(stroke);
    const accepted = Boolean(best) && (
      (length <= scoringTolerance * 0.3 && best.precision >= 0.8)
      || (
        best.precision >= 0.46
        && Math.min(best.forward.meanDistance, best.reverse.meanDistance) <= scoringTolerance * 1.1
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
    row.accepted || row.length > scoringTolerance * 0.45
  ));
  const acceptedAssignments = assignments.filter(row => row.accepted);
  const assignedExpectedOrder = acceptedAssignments
    .filter(row => row.length > scoringTolerance * 0.45 || sampledExpected[row.expectedIndex]?.length <= 2)
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
      .filter(row => row.length > scoringTolerance * 0.45)
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
    const endpointToleranceSquared = (scoringTolerance * 1.45) ** 2;
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
  const assignmentUnmatchedRatio = totalDrawnLength > 0 ? unmatchedLength / totalDrawnLength : 1;
  const originalDrawnLength = sampledDrawn.reduce(
    (total, stroke) => total + strokeLength(stroke),
    0
  );
  const continuousTravelRatio = continuousPieces && originalDrawnLength > 0
    ? Math.max(
      Math.max(
        0,
        (originalDrawnLength - (continuousPartition.expectedJourneyLength * 1.15))
          / originalDrawnLength
      ),
      continuousPartition.transitionExcessLength / originalDrawnLength
    )
    : 0;
  const outsideTravelRatio = continuousPartition && originalDrawnLength > 0
    ? continuousPartition.outsideTravelLength / originalDrawnLength
    : 0;
  const unmatchedStrokeRatio = Math.max(assignmentUnmatchedRatio, continuousTravelRatio);
  const unmatchedLimit = adventureMapProfile ? 0.2 : 0.12;

  // A child who has learned to write this letter as one confident, continuous
  // stroke (never lifting their finger between the taught pedagogic
  // sub-strokes) can still trace a shape that is unmistakably the right
  // letter - just without the exact stroke-by-stroke segmentation, order and
  // direction the strict formation check below demands. Accept that as
  // correct too: for a beginning writer what matters most is that the letter
  // is recognisably right, not that it was assembled in the taught stroke
  // order. Coverage/precision stay demanding so a wrong or scribbled shape
  // still fails.
  const shapeAccurate = (
    coverage >= (adventureMapProfile ? 0.76 : 0.8)
    && precision >= (adventureMapProfile ? 0.62 : 0.68)
    // A recognisable shape still has to include every taught stroke. This
    // prevents a neat but incomplete pair from passing as a finished letter.
    && strokeCoverage === 1
    && unmatchedStrokeRatio <= (adventureMapProfile ? 0.22 : 0.16)
    && outsideTravelRatio <= (adventureMapProfile ? 0.2 : 0.16)
    && directionScore === 1
    && orderScore === 1
  );

  const strictPass = (
    coverage >= (adventureMapProfile ? 0.68 : 0.72)
    && precision >= (adventureMapProfile ? 0.56 : 0.62)
    && strokeCoverage === 1
    && endpointCoverage >= (adventureMapProfile ? 0.68 : 0.78)
    && directionScore === 1
    && orderScore === 1
    && unmatchedStrokeRatio <= unmatchedLimit
    && outsideTravelRatio <= (adventureMapProfile ? 0.2 : 0.14)
  );

  return {
    pass: strictPass || shapeAccurate,
    coverage,
    precision,
    strokeCoverage,
    endpointCoverage,
    directionScore,
    orderScore,
    unmatchedStrokeRatio,
    shapeAccurate
  };
}
