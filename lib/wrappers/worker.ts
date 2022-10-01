import type { WorkerMessagePayload, WorkerMessageHandlers } from './types/worker';

interface WorkerEventData {
    readonly type: string;
    readonly payload: WorkerMessagePayload;
}

export class WorkerMessenger {
    private readonly _worker: Worker;
    private readonly _handleMessage: (event: MessageEvent<WorkerEventData>) => void;

    constructor(worker: string | Worker, messageHandlers: WorkerMessageHandlers) {
        this._worker = worker instanceof Worker ? worker : new Worker(worker);
        this._handleMessage = (event) => {
            const { type, payload } = event.data;
            const handleMessage = messageHandlers[type];
            if (handleMessage) {
                handleMessage(payload);
            }
        };
        this._worker.addEventListener('message', this._handleMessage);
    }

    dispose(): void {
        this._worker.removeEventListener('message', this._handleMessage);
        this._worker.terminate();
    }

    post(type: string, payload: WorkerMessagePayload): void {
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
    // @ts-ignore No target origin.
    self.postMessage({ type, payload });
}
