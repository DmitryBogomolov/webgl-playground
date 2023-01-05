export type WorkerMessagePayload = unknown;
export interface WorkerMessageHandler {
    (message: WorkerMessagePayload): void;
}
export type WorkerMessageHandlers = Readonly<Record<string, WorkerMessageHandler>>;
