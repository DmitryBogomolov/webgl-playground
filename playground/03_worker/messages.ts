import type { Color } from 'lib';

export interface UpdateScaleMessage {
    readonly type: 'main:update-scale';
    readonly scale: number;
}

export interface UpdateColorMessage {
    readonly type: 'main:update-color';
    readonly color: number;
}

export type MainThreadMessage = UpdateColorMessage | UpdateScaleMessage;

export interface SetScaleMessage {
    readonly type: 'worker:set-scale';
    readonly scale: number;
}

export interface SetColorMessage {
    readonly type: 'worker:set-color';
    readonly color: Color;
}

export type WorkerMessage = SetScaleMessage | SetColorMessage;
