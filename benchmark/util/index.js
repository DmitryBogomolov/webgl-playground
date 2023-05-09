const SAMPLE_COUNT = 1E4;

const samples = new Array(SAMPLE_COUNT);

function now() {
    return performance.now();
}

function measure(callback) {
    samples.fill(0);
    const start = now();
    for (let i = 0; i < SAMPLE_COUNT; ++i) {
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

module.exports = { measure };
