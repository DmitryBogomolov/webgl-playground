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

type WorkerMessagePayload = any;

interface WorkerEventData {
    readonly type: string;
    readonly payload: WorkerMessagePayload;
}

type WorkerMessageHandler = (message: WorkerMessagePayload) => void;

type WorkerMessageHandlers = Record<string, WorkerMessageHandler>;

export class WorkerMessenger {
    private readonly _worker: Worker;
    private readonly _handleMessage: (event: MessageEvent<WorkerEventData>) => void;

    constructor(workerUrl: string, messageHandlers: WorkerMessageHandlers) {
        this._worker = new Worker(workerUrl);
        this._handleMessage = (event) => {
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

    post(type: string, payload: WorkerMessagePayload) {
        this._worker.postMessage({ type, payload });
    }
}

export function setWorkerMessageHandler(messageHandlers: WorkerMessageHandlers): void {
    self.onmessage = (event: MessageEvent<WorkerEventData>) => {
        const { type, payload } = event.data;
        const handleMessage = messageHandlers[type];
        if (handleMessage) {
            handleMessage(payload);
        }
    };
}

export function postWorkerMessage(type: string, payload: WorkerMessagePayload): void {
    self.postMessage({ type, payload }, 'TODO');
}
