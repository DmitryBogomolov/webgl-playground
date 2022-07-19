import {
    EventEmitter,
} from 'lib';

export interface ControlDescription {
    readonly name: string;
    readonly value: number;
    readonly min: number;
    readonly max: number;
    readonly emitter: EventEmitter<number>;
}

export function createControls(controls: ReadonlyArray<ControlDescription>): void {
    const template = document.querySelector('#control-template') as HTMLDivElement;
    const container = template.parentElement!;
    template.remove();
    template.removeAttribute('id');
    controls.forEach(({ name, value, min, max, emitter }) => {
        const control = template.cloneNode(true) as HTMLDivElement;
        control.querySelector('.control-text')!.textContent = name;
        const label = control.querySelector('.control-value')!;
        const input = control.querySelector('input')!;
        input.min = String(min);
        input.max = String(max);
        input.value = String(value);
        label.textContent = input.value;
        input.addEventListener('input', handleChange);
        input.addEventListener('change', handleChange);
        container.appendChild(control);

        function handleChange(): void {
            const val = Number(input.value);
            label.textContent = input.value;
            emitter.emit(val);
        }
    });
}
