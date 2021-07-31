
export type Kernel = readonly [number, number, number, number, number, number, number, number, number];

export interface ConvolutionKernel {
    readonly name: string;
    readonly kernel: readonly [number, number, number, number, number, number, number, number, number];
    readonly weight: number;
}

const data: [string, Kernel][] = [
    [
        'Normal', [
            0, 0, 0,
            0, 1, 0,
            0, 0, 0,
        ],
    ],
    [
        'Gaussian Blur', [
            0.045, 0.122, 0.045,
            0.122, 0.332, 0.122,
            0.045, 0.122, 0.045,
        ],
    ],
    [
        'Gaussian Blur 2', [
            1, 2, 1,
            2, 4, 2,
            1, 2, 1,
        ],
    ],
    [
        'Guassian Blur 3', [
            0, 1, 0,
            1, 1, 1,
            0, 1, 0,
        ],
    ],
    [
        'Unsharpen', [
            -1, -1, -1,
            -1, 9, -1,
            -1, -1, -1,
        ],
    ],
    [
        'Sharpness', [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0,
        ],
    ],
    [
        'Sharpen', [
            -1, -1, -1,
            -1, 16, -1,
            -1, -1, -1,
        ],
    ],
    [
        'Edge Detect', [
            -0.125, -0.125, -0.125,
            -0.125, 1, -0.125,
            -0.125, -0.125, -0.125,
        ],
    ],
    [
        'Edge Detect 2', [
            -1, -1, -1,
            -1, 8, -1,
            -1, -1, -1,
        ],
    ],
    [
        'Edge Detect 3', [
            -5, 0, 0,
            0, 0, 0,
            0, 0, 5,
        ],
    ],
    [
        'Edge Detect 4', [
            -1, -1, -1,
            0, 0, 0,
            1, 1, 1,
        ],
    ],
    [
        'Edge Detect 5', [
            -1, -1, -1,
            2, 2, 2,
            -1, -1, -1,
        ],
    ],
    [
        'Edge Detect 6', [
            -5, -5, -5,
            -5, 39, -5,
            -5, -5, -5,
        ],
    ],
    [
        'Sobel Horizontal', [
            1, 2, 1,
            0, 0, 0,
            -1, -2, -1,
        ],
    ],
    [
        'Sobel Vertical', [
            1, 0, -1,
            2, 0, -2,
            1, 0, -1,
        ],
    ],
    [
        'Previt Horizontal', [
            1, 1, 1,
            0, 0, 0,
            -1, -1, -1,
        ],
    ],
    [
        'Previt Vertical', [
            1, 0, -1,
            1, 0, -1,
            1, 0, -1,
        ],
    ],
    [
        'Box Blur', [
            0.111, 0.111, 0.111,
            0.111, 0.111, 0.111,
            0.111, 0.111, 0.111,
        ],
    ],
    [
        'Triangle Blur', [
            0.0625, 0.125, 0.0625,
            0.125, 0.25, 0.125,
            0.0625, 0.125, 0.0625,
        ],
    ],
    [
        'Emboss', [
            -2, -1, 0,
            -1, 1, 1,
            0, 1, 2,
        ],
    ],
];

export const convolutionKernels: ReadonlyArray<ConvolutionKernel> = data.map(([name, kernel]) => ({
    name,
    kernel,
    weight: computeKernelWeight(kernel),
}));

function computeKernelWeight(kernel: Kernel): number {
    let sum = 0;
    for (const item of kernel) {
        sum += item;
    }
    return sum <= 0 ? 1 : sum;
}
