import type { BaseChannelMessageHandler, BaseChannelOptions, SendMessageOptions } from './base-channel.types';
import { BaseDisposable } from '../../common/base-disposable';

interface MessageBatch<T> {
    readonly connectionId: number;
    readonly orderId: number;
    readonly messages: ReadonlyArray<T>;
}

const DEFAULT_SEND_BUFFER_SIZE = 64;
const DEFAULT_RECV_QUEUE_SIZE = 16;
const DEFAULT_FLUSH_DELAY = 500;

export abstract class BaseChannel<SendT, RecvT> extends BaseDisposable {
    private readonly _carrier: MessagePort;
    private readonly _connectionId: number;
    private readonly _handler: BaseChannelMessageHandler<RecvT>;
    private readonly _sendBuffer: SendT[] = [];
    private readonly _sendBufferSize: number;
    private readonly _sendTransferables: Transferable[] = [];
    private readonly _recvQueue: (ReadonlyArray<RecvT> | undefined)[] = [];
    private readonly _recvQueueSize: number;
    private readonly _flushDelay: number;
    private _sendOrderId: number = 1;
    private _recvOrderId: number = 1;
    private _flushTimeout: number = 0;

    constructor(options: BaseChannelOptions<RecvT>) {
        super(options.rootLogger || null, options.tag);
        this._logger.log('init');
        if (!options.carrier) {
            throw this._logger.error('carrier is not defined');
        }
        if (typeof options.handler !== 'function') {
            throw this._logger.error('handler is not defined');
        }
        if (!(options.connectionId > 0)) {
            throw this._logger.error('bad connection id: {0}', options.connectionId);
        }
        this._carrier = options.carrier;
        this._connectionId = options.connectionId;
        this._handler = options.handler;
        this._sendBufferSize = pickValue(options.sendBufferSize, DEFAULT_SEND_BUFFER_SIZE);
        this._recvQueueSize = pickValue(options.recvQueueSize, DEFAULT_RECV_QUEUE_SIZE);
        this._flushDelay = pickValue(options.flushDelay, DEFAULT_FLUSH_DELAY);
        this._carrier.addEventListener('message', this._handleMessage);
        this._carrier.start();
    }

    private readonly _handleMessage = (e: MessageEvent<MessageBatch<RecvT>>): void => {
        const batch = e.data;
        if (!batch || batch.connectionId !== this._connectionId) {
            return;
        }
        if (!batch.orderId || !Array.isArray(batch.messages)) {
            throw this._logger.error('recv: bad message content', batch);
        }
        const orderOffset = getOrderOffset(this._recvOrderId, batch.orderId);
        if (isReversedOrderOffset(orderOffset)) {
            throw this._logger.error(
                'recv: duplicate order id: {0}', batch.orderId, this._recvOrderId);
        }
        if (orderOffset > 0) {
            if (orderOffset > this._recvQueueSize) {
                throw this._logger.error('recv: queue is too long');
            }
            if (this._recvQueue[orderOffset - 1]) {
                throw this._logger.error('recv: duplicate order id: {0}', batch.orderId);
            }
            this._recvQueue[orderOffset - 1] = batch.messages;
            return;
        }
        this._notify(batch.messages);
    };

    private readonly _flush = (): void => {
        this.flush();
    };

    private _notify(messages: ReadonlyArray<RecvT>): void {
        for (const message of messages) {
            this._logger.log('recv: {0}', message);
            this._handler(message);
        }
        this._recvOrderId = advanceOrderId(this._recvOrderId);
        if (this._recvQueue.length > 0) {
            const next = this._recvQueue.shift()!;
            if (next) {
                this._notify(next);
            }
        }
    }

    dispose(): void {
        this._logger.log('dispose');
        this._cancelFlush();
        this._carrier.removeEventListener('message', this._handleMessage);
        this._carrier.close();
        this._emitDisposed();
    }

    send(message: SendT, options?: SendMessageOptions): void {
        if (!message) {
            throw this._logger.error('send: message is not defined');
        }
        this._sendBuffer.push(message);
        if (options && Array.isArray(options.transferables)) {
            this._sendTransferables.push(...options.transferables as Transferable[]);
        }
        if ((options && options.immediate) || this._sendBuffer.length > this._sendBufferSize) {
            this.flush();
        } else {
            this._requestFlush();
        }
    }

    private _requestFlush(): void {
        if (this._flushTimeout === 0) {
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            this._flushTimeout = setTimeout(this._flush as TimerHandler, this._flushDelay);
        }
    }

    private _cancelFlush(): void {
        if (this._flushTimeout !== 0) {
            clearTimeout(this._flushTimeout);
            this._flushTimeout = 0;
        }
    }

    flush(): void {
        this._cancelFlush();
        for (const message of this._sendBuffer) {
            this._logger.log('send: {0}', message);
        }
        const batch: MessageBatch<SendT> = {
            connectionId: this._connectionId,
            orderId: this._sendOrderId,
            messages: [...this._sendBuffer],
        };
        this._carrier.postMessage(batch, [...this._sendTransferables]);
        this._sendOrderId = advanceOrderId(this._sendOrderId);
        this._sendBuffer.length = 0;
        this._sendTransferables.length = 0;
    }
}

function pickValue(value: number | undefined, defaultValue: number): number {
    return typeof value === 'number' && value >= 0 ? value : defaultValue;
}

const ORDER_ID_LIMIT = 1 << 24;

function advanceOrderId(orderId: number): number {
    return (orderId + 1) % ORDER_ID_LIMIT;
}

function isReversedOrderOffset(orderOffset: number): boolean {
    return orderOffset >= ORDER_ID_LIMIT / 2;
}

function getOrderOffset(fromOrderId: number, toOrderId: number): number {
    const diff = toOrderId - fromOrderId;
    return diff >= 0 ? diff : (diff + ORDER_ID_LIMIT) % ORDER_ID_LIMIT;
}
