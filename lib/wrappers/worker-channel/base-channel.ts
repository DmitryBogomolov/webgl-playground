import type { BaseChannelHandler, BaseChannelOptions } from './base-channel.types';
import { BaseDisposable } from '../../common/base-disposable';

interface MessageBatch<T> {
    readonly connectionId: number;
    readonly orderId: number;
    readonly items: ReadonlyArray<T>;
}

const DEFAULT_SEND_BUFFER_LIMIT = 4;
const DEFAULT_RECV_BUFFER_LIMIT = 16;
const DEFAULT_FLUSH_DELAY = 500;

export abstract class BaseChannel<SendT, RecvT> extends BaseDisposable {
    private readonly _carrier: MessagePort;
    private readonly _connectionId: number;
    private readonly _handler: BaseChannelHandler<RecvT>;
    private readonly _sendBuffer: SendT[] = [];
    private readonly _sendBufferLimit: number;
    private readonly _sendTransferables: Transferable[] = [];
    private readonly _recvBuffer: (ReadonlyArray<RecvT> | undefined)[] = [];
    private readonly _recvBufferLimit: number;
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
        this._sendBufferLimit = pickValue(options.sendBufferLimit, DEFAULT_SEND_BUFFER_LIMIT);
        this._recvBufferLimit = pickValue(options.recvBufferLimit, DEFAULT_RECV_BUFFER_LIMIT);
        this._flushDelay = pickValue(options.flushDelay, DEFAULT_FLUSH_DELAY);
        this._carrier.addEventListener('message', this._handleMessage);
        this._carrier.start();
    }

    private readonly _handleMessage = (e: MessageEvent<MessageBatch<RecvT>>): void => {
        const batch = e.data;
        if (!batch || batch.connectionId !== this._connectionId) {
            return;
        }
        if (!batch.orderId || !Array.isArray(batch.items)) {
            throw this._logger.error('recv: bad message content', batch);
        }
        const orderOffset = getOrderOffset(this._recvOrderId, batch.orderId);
        if (isReversedOrderOffset(orderOffset)) {
            throw this._logger.error(
                'recv: order id mismatch: {0} / >= {1}', batch.orderId, this._recvOrderId);
        }
        if (orderOffset > 0) {
            if (orderOffset >= this._recvBufferLimit) {
                throw this._logger.error('recv: queue is full');
            }
            this._recvBuffer[orderOffset - 1] = batch.items;
            return;
        }
        this._notify(batch.items);
        while (this._recvBuffer.length > 0 && this._recvBuffer[0]) {
            this._notify(this._recvBuffer.shift()!);
        }
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
    }

    dispose(): void {
        this._logger.log('dispose');
        this._cancelFlush();
        this._carrier.removeEventListener('message', this._handleMessage);
        this._carrier.close();
        this._dispose();
    }

    send(message: SendT, transferables: Transferable[], immediate: boolean = false): void {
        if (!message) {
            throw this._logger.error('send: message is not defined');
        }
        this._sendBuffer.push(message);
        this._sendTransferables.push(...transferables);
        if (immediate || this._sendBuffer.length > this._sendBufferLimit) {
            this.flush();
        } else {
            this._requestFlush();
        }
    }

    private _requestFlush(): void {
        if (this._flushTimeout === 0) {
            this._flushTimeout = window.setTimeout(this._flush, this._flushDelay);
        }
    }

    private _cancelFlush(): void {
        if (this._flushTimeout !== 0) {
            window.clearTimeout(this._flushTimeout);
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
            items: this._sendBuffer,
        };
        this._carrier.postMessage(batch, this._sendTransferables);
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
