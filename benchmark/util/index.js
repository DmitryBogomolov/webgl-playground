const DEFAULT_SAMPLE_COUNT = 1E4;

function now() {
    return performance.now();
}

function measure(callback, samples) {
    samples.fill(0);
    const start = now();
    for (let i = 0; i < samples.length; ++i) {
        const sampleStart = now();
        callback(i);
        const sampleEnd = now();
        samples[i] = sampleEnd - sampleStart;
    }
    const end = now();
    samples.sort((a, b) => a - b);
    let sum = 0;
    samples.forEach((sample) => {
        sum += sample;
    });
    return {
        total: end - start,
        min: samples[0],
        max: samples[samples.length - 1],
        avg: sum / samples.length,
        med: samples[samples.length >> 1],
    };
}

function fmt(value) {
    const t = Math.max(Math.log10(value), 0) | 0;
    const precision = Math.max(4 - t, 0);
    return value.toFixed(precision);
}

function runBenchmarks(targets, sampleCount = DEFAULT_SAMPLE_COUNT) {
    const samples = new Array(sampleCount);
    const reports = targets.map(({ name, action }) => {
        const report = measure(action, samples);
        return { name, report };
    });
    reports.forEach(({ name, report }) => {
        console.log(name, ' // ', fmt(report.total));
        console.log('  avg: ', fmt(report.avg));
        console.log('  med: ', fmt(report.med));
        console.log('  min: ', fmt(report.min));
        console.log('  max: ', fmt(report.max));
    });
}

module.exports = { runBenchmarks };
