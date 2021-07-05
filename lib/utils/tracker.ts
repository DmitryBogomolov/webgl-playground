import { Vec2 } from 'lib/geometry/vec2';
import { GetEventCoordsFunc, makeEventCoordsGetter } from './pointer-event';

export interface TrackerEvent {
    readonly e: PointerEvent | MouseEvent;
    readonly coords: Vec2;
}

export type TrackerHandler = (e: TrackerEvent) => void;

export interface TrackerParams {
    readonly onStart?: TrackerHandler;
    readonly onMove?: TrackerHandler;
    readonly onEnd?: TrackerHandler;
    readonly onClick?: TrackerHandler;
    readonly onDblClick?: TrackerHandler;
}

export class Tracker {
    private readonly _element: HTMLElement;
    private readonly _getEventCoords: GetEventCoordsFunc;
    private readonly _onStart?: TrackerHandler;
    private readonly _onMove?: TrackerHandler;
    private readonly _onEnd?: TrackerHandler;
    private readonly _onClick?: TrackerHandler;
    private readonly _onDblClick?: TrackerHandler;
    private readonly _pointerDownHandler?: (e: PointerEvent) => void;
    private readonly _pointerMoveHandler?: (e: PointerEvent) => void;
    private readonly _pointerUpHandler?: (e: PointerEvent) => void;
    private readonly _clickHandler?: (e: MouseEvent) => void;
    private readonly _dblClickHandler?: (e: MouseEvent) => void;

    constructor(element: HTMLElement, params: TrackerParams) {
        this._element = element;
        this._getEventCoords = makeEventCoordsGetter(this._element);
        if (params.onStart || params.onMove || params.onEnd) {
            this._onStart = params.onStart || noop;
            this._onMove = params.onMove || noop;
            this._onEnd = params.onEnd || noop;
            this._pointerDownHandler = (e) => this._handlePointerDown(e);
            this._pointerMoveHandler = (e) => this._handlePointerMove(e);
            this._pointerUpHandler = (e) => this._handlePointerUp(e);
            this._element.addEventListener('pointerdown', this._pointerDownHandler);
        }
        if (params.onClick) {
            this._onClick = params.onClick;
            this._clickHandler = (e) => this._handleClick(e);
            this._element.addEventListener('click', this._clickHandler);
        }
        if (params.onDblClick) {
            this._onDblClick = params.onDblClick;
            this._dblClickHandler = (e) => this._handleDblClick(e);
            this._element.addEventListener('dblclick', this._dblClickHandler);
        }
    }

    private _handlePointerDown(e: PointerEvent): void {
        this._addDocumentListeners();
        e.preventDefault();
        const coords = this._getEventCoords(e);
        this._onStart!({ coords, e });
    }

    private _handlePointerMove(e: PointerEvent): void {
        const coords = this._getEventCoords(e);
        this._onMove!({ coords, e });
    }

    private _handlePointerUp(e: PointerEvent): void {
        this._removeDocumentListeners();
        const coords = this._getEventCoords(e);
        this._onEnd!({ coords, e });
    }

    private _handleClick(e: MouseEvent): void {
        e.preventDefault();
        const coords = this._getEventCoords(e);
        this._onClick!({ coords, e });
    }

    private _handleDblClick(e: MouseEvent): void {
        e.preventDefault();
        const coords = this._getEventCoords(e);
        this._onDblClick!({ coords, e });
    }

    private _addDocumentListeners(): void {
        document.addEventListener('pointermove', this._pointerMoveHandler!);
        document.addEventListener('pointerup', this._pointerUpHandler!);
        document.addEventListener('pointercancel', this._pointerUpHandler!);
    }

    private _removeDocumentListeners(): void {
        document.removeEventListener('pointermove', this._pointerMoveHandler!);
        document.removeEventListener('pointerup', this._pointerUpHandler!);
        document.removeEventListener('pointercancel', this._pointerUpHandler!);
    }

    dispose(): void {
        if (this._pointerDownHandler) {
            this._element.removeEventListener('pointerdown', this._pointerDownHandler);
            this._removeDocumentListeners();
        }
        if (this._clickHandler) {
            this._element.removeEventListener('click', this._clickHandler);
        }
        if (this._dblClickHandler) {
            this._element.removeEventListener('dblclick', this._dblClickHandler);
        }
    }
}

function noop(): void { /* empty */ }
