export interface ControlsState {
    readonly animation: boolean;
    readonly xRotation: number;
    readonly yRotation: number;
    readonly magFilter: ReadonlyArray<string>;
    readonly minFilter: ReadonlyArray<string>;
}

export interface ControlsHandlers {
    readonly animation: (enabled: boolean) => void;
    readonly xRotation: (value: number) => void;
    readonly yRotation: (value: number) => void;
    readonly magFilter: (value: string) => void;
    readonly minFilter: (value: string) => void;
}

export function setupControls(state: ControlsState, handlers: ControlsHandlers): void {
    const animationInput = document.querySelector('.controls-panel .animation') as HTMLInputElement;
    const xRotationInput = document.querySelector('.controls-panel .x-rotation') as HTMLInputElement;
    const yRotationInput = document.querySelector('.controls-panel .y-rotation') as HTMLInputElement;
    const magFilterSelect = document.querySelector('.controls-panel .mag-filter') as HTMLSelectElement;
    const minFilterSelect = document.querySelector('.controls-panel .min-filter') as HTMLSelectElement;

    animationInput.checked = state.animation;
    xRotationInput.value = String(state.xRotation);
    yRotationInput.value = String(state.yRotation);
    for (const value of state.magFilter) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        magFilterSelect.appendChild(option);
    }
    for (const value of state.minFilter) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        minFilterSelect.appendChild(option);
    }

    setHandler(animationInput, () => {
        const enabled = animationInput.checked;
        handlers.animation(enabled);
    });
    setHandler(xRotationInput, () => {
        const value = Number(xRotationInput.value);
        handlers.xRotation(value);
    });
    setHandler(yRotationInput, () => {
        const value = Number(yRotationInput.value);
        handlers.yRotation(value);
    });
    magFilterSelect.addEventListener('change', () => {
        const value = magFilterSelect.value;
        handlers.magFilter(value);
    });
    minFilterSelect.addEventListener('change', () => {
        const value = minFilterSelect.value;
        handlers.minFilter(value);
    });
}

function setHandler(input: HTMLInputElement, handler: () => void): void {
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
}
