import type { Color } from 'lib';

export interface UpdateScaleMessage {
    readonly type: 'update-scale';
    readonly scale: number;
}

export interface UpdateColorMessage {
    readonly type: 'update-color';
    readonly color: number;
}

export type MainThreadMessage = UpdateColorMessage | UpdateScaleMessage;

export interface SetScaleMessage {
    readonly type: 'set-scale';
    readonly scale: number;
}

export interface SetColorMessage {
    readonly type: 'set-color';
    readonly color: Color;
}

export type WorkerMessage = SetScaleMessage | SetColorMessage;
