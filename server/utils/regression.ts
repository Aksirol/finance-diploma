export function calculateLinearRegression(dataPoints: number[]): number {
    const n = dataPoints.length;
    if (n === 0) return 0;
    if (n === 1) return dataPoints[0];

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
        const x = i + 1;
        const y = dataPoints[i];

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return dataPoints[n - 1];

    const m = (n * sumXY - sumX * sumY) / denominator;
    const b = (sumY - m * sumX) / n;

    const nextX = n + 1;
    const prediction = m * nextX + b;

    return Math.max(0, prediction);
}