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

function normaliseStrokes(strokes = []) {
  return strokes
    .map(stroke => (Array.isArray(stroke) ? stroke.filter(finitePoint) : []))
    .filter(stroke => stroke.length > 0);
}

export function scoreLetterTrace({
  drawnStrokes = [],
  expectedStrokes = [],
  tolerance = 23
} = {}) {
  const drawn = normaliseStrokes(drawnStrokes);
  const expected = normaliseStrokes(expectedStrokes);
  const drawnPoints = drawn.flat();
  const expectedPoints = expected.flat();
  const toleranceSquared = tolerance * tolerance;

  if (drawnPoints.length < 20 || expectedPoints.length < 8) {
    return {
      pass: false,
      coverage: 0,
      precision: 0,
      strokeCoverage: 0,
      endpointCoverage: 0
    };
  }

  const coverage = expectedPoints.filter(point => (
    nearAny(point, drawnPoints, toleranceSquared)
  )).length / expectedPoints.length;
  const precision = drawnPoints.filter(point => (
    nearAny(point, expectedPoints, toleranceSquared)
  )).length / drawnPoints.length;

  const expectedStrokeCoverage = expected.map(stroke => (
    stroke.filter(point => nearAny(point, drawnPoints, toleranceSquared)).length / stroke.length
  ));
  const strokeCoverage = expectedStrokeCoverage.filter(value => value >= 0.48).length / expected.length;

  const endpointToleranceSquared = (tolerance * 1.45) ** 2;
  const endpointCoverage = expected.reduce((total, stroke) => {
    const startMatched = nearAny(stroke[0], drawnPoints, endpointToleranceSquared);
    const endMatched = nearAny(stroke[stroke.length - 1], drawnPoints, endpointToleranceSquared);
    return total + Number(startMatched) + Number(endMatched);
  }, 0) / (expected.length * 2);

  return {
    pass: (
      coverage >= 0.72
      && precision >= 0.62
      && strokeCoverage >= 0.86
      && endpointCoverage >= 0.78
    ),
    coverage,
    precision,
    strokeCoverage,
    endpointCoverage
  };
}
