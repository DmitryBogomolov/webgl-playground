const process = require('node:process');
const { fork } = require('node:child_process');

function now() {
    return performance.now();
}

function measure(name, callback, sampleCount) {
    const samples = Array(sampleCount).fill(0);
    const start = now();
    for (let i = 0; i < samples.length; ++i) {
        const sampleStart = now();
        callback(i);
        const sampleEnd = now();
        samples[i] = sampleEnd - sampleStart;
    }
    const end = now();
    samples.sort();
    return {
        name,
        total: end - start,
        min: samples[0],
        max: samples[samples.length - 1],
        avg: average(samples),
        med: median(samples),
    };
}

function average(items) {
    let sum = 0;
    for (const item of items) {
        sum += item;
    }
    return sum / items.length;
}

function median(items) {
    const i2 = items.length >> 1;
    const i1 = i2 - 1 + (items.length & 1);
    return (items[i1] + items[i2]) / 2;
}

function fmt(value) {
    return value .toPrecision(4);
}

function runWorker(index) {
    return new Promise((resolve, reject) => {
        const worker = fork(require.main.filename);
        worker.on('message', (payload) => {
            resolve(payload);
        });
        worker.on('error', (err) => {
            reject(err);
        });
        worker.send({ index });
    });
}

function runBenchmarksMaster(targets, _sampleCount) {
    const tasks = [];
    for (let i = 0; i < targets.length; ++i) {
        tasks.push(runWorker(i));
    }
    return Promise.all(tasks).then((reports) => {
        printReports(reports);
    });
}

function runBenchmarksWorker(targets, sampleCount) {
    process.on('message', (payload) => {
        const target = targets[payload.index];
        const report = measure(target.name, target.action, sampleCount);
        process.send(report);
        process.exit(0);
    });
}

function printReports(reports) {
    reports.forEach((report) => {
        console.log(report.name, ' // ', fmt(report.total));
        console.log('  avg: ', fmt(report.avg));
        console.log('  med: ', fmt(report.med));
        console.log('  min: ', fmt(report.min));
        console.log('  max: ', fmt(report.max));
    });
}

function runBenchmarks(targets, sampleCount) {
    if (process.connected === undefined) {
        return runBenchmarksMaster(targets, sampleCount);
    } else {
        runBenchmarksWorker(targets, sampleCount);
        return Promise.resolve();
    }
}

module.exports = { runBenchmarks };
