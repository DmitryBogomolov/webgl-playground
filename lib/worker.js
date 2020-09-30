/**
 *`@typedef {any} WorkerMessagePayload 
 *
 * @typedef {Object} WorkerEventData
 * @property {string} type
 * @property {WorkerMessagePayload} payload
 *
 * @typedef {(message: WorkerMessagePayload) => void} WorkerMessageHandler
 *
 * @typedef {Object.<string, WorkerMessageHandler>} WorkerMessageHandlers
 * @property {Message[]} messages
 */

export class WorkerMessenger {
    constructor(/** @type {string} */workerUrl, /** @type {WorkerMessageHandlers} */messageHandlers) {
        this._worker = new Worker(workerUrl);
        this._handleMessage = (/** @type {MessageEvent<WorkerEventData>} */event) => {
            const { type, payload } = event.data;
            const handleMessage = messageHandlers[type];
            if (handleMessage) {
                handleMessage(payload);
            }
        };
        this._worker.addEventListener('message', this._handleMessage);
    }

    dispose() {
        this._worker.removeEventListener('message', this._handleMessage);
        this._worker.terminate();
    }

    post(/** @type {string} */type, /** @type {WorkerMessagePayload} */payload) {
        this._worker.postMessage({ type, payload });
    }
}

export function setWorkerMessageHandler(/** @type {WorkerMessageHandlers} */messageHandlers) {
    self.onmessage = (/** @type {MessageEvent<WorkerEventData>} */event) => {
        const { type, payload } = event.data;
        const handleMessage = messageHandlers[type];
        if (handleMessage) {
            handleMessage(payload);
        }
    };
}

export function postWorkerMessage(/** @type {string} */type, /** @type {WorkerMessagePayload} */payload) {
    self.postMessage({ type, payload });
}
