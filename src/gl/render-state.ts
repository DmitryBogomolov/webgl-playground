import type {
    RenderState,
    DEPTH_FUNC,
    StencilOpState, StencilFuncState, STENCIL_FUNC, STENCIL_OP,
    CULL_FACE,
    BLEND_FUNC,
} from './render-state.types';
import type { GLValuesMap } from './gl-values-map.types';
import { formatStr } from '../utils/string-formatter';

type RenderStateValidator<T extends keyof RenderState> = (
    value: RenderState[T],
) => RenderState[T];
type RenderStateComparer<T extends keyof RenderState> = (
    lhs: RenderState[T], rhs: RenderState[T],
) => boolean;
type RenderStateUpdater<T extends keyof RenderState> = (
    value: RenderState[T], gl: WebGL2RenderingContext, log: (msg: string, ...args: unknown[]) => void,
) => void;

type RenderStateValidators = {
    readonly [K in keyof RenderState]: RenderStateValidator<K>;
};
type RenderStateComparers = {
    readonly [K in keyof RenderState]: RenderStateComparer<K>;
};
type RenderStateUpdaters = {
    readonly [K in keyof RenderState]: RenderStateUpdater<K>;
};

const WebGL = WebGL2RenderingContext.prototype;
const GL_DEPTH_TEST = WebGL.DEPTH_TEST;
const GL_STENCIL_TEST = WebGL.STENCIL_TEST;
const GL_CULL_FACE = WebGL.CULL_FACE;
const GL_BLEND = WebGL.BLEND;

const DEPTH_FUNC_MAP: GLValuesMap<DEPTH_FUNC> = {
    'never': WebGL.NEVER,
    'less': WebGL.LESS,
    'lequal': WebGL.LEQUAL,
    'greater': WebGL.GREATER,
    'gequal': WebGL.GEQUAL,
    'equal': WebGL.EQUAL,
    'notequal': WebGL.NOTEQUAL,
    'always': WebGL.ALWAYS,
};

const STENCIL_FUNC_MAP: GLValuesMap<STENCIL_FUNC> = {
    'never': WebGL.NEVER,
    'less': WebGL.LESS,
    'lequal': WebGL.LEQUAL,
    'greater': WebGL.GREATER,
    'gequal': WebGL.GEQUAL,
    'equal': WebGL.EQUAL,
    'notequal': WebGL.NOTEQUAL,
    'always': WebGL.ALWAYS,
};

const STENCIL_OP_MAP: GLValuesMap<STENCIL_OP> = {
    'keep': WebGL.KEEP,
    'zero': WebGL.ZERO,
    'replace': WebGL.REPLACE,
    'incr': WebGL.INCR,
    'incr_wrap': WebGL.INCR_WRAP,
    'decr': WebGL.DECR,
    'decr_wrap': WebGL.DECR_WRAP,
    'invert': WebGL.INVERT,
};

const CULL_FACE_MAP: GLValuesMap<CULL_FACE> = {
    'back': WebGL.BACK,
    'front': WebGL.FRONT,
    'front_and_back': WebGL.FRONT_AND_BACK,
};

const BLEND_FUNC_MAP_SRC: GLValuesMap<BLEND_FUNC> = {
    'one|zero': WebGL.ONE,
    'src_alpha|one_minus_src_alpha': WebGL.SRC_ALPHA,
    'one|one_minus_src_alpha': WebGL.ONE,
};

const BLEND_FUNC_MAP_DST: GLValuesMap<BLEND_FUNC> = {
    'one|zero': WebGL.ZERO,
    'src_alpha|one_minus_src_alpha': WebGL.ONE_MINUS_SRC_ALPHA,
    'one|one_minus_src_alpha': WebGL.ONE_MINUS_SRC_ALPHA,
};

function checkFuncArg(condition: boolean, name: string, arg: unknown): void {
    if (!condition) {
        throw new Error(formatStr('{0}: {1} - bad value', name, arg));
    }
}

function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

const RENDER_STATE_VALIDATORS: RenderStateValidators = {
    depthTest: (depthTest) => {
        checkFuncArg(isBoolean(depthTest), 'set_depth_test', depthTest);
        return Boolean(depthTest);
    },

    depthMask: (depthMask) => {
        checkFuncArg(isBoolean(depthMask), 'set_depth_mask', depthMask);
        return Boolean(depthMask);
    },

    depthFunc: (depthFunc) => {
        const value = DEPTH_FUNC_MAP[depthFunc];
        checkFuncArg(value !== undefined, 'set_depth_func', depthFunc);
        return depthFunc;
    },

    stencilTest: (stencilTest) => {
        checkFuncArg(isBoolean(stencilTest), 'set_stencil_test', stencilTest);
        return Boolean(stencilTest);
    },

    stencilMask: (stencilMask) => {
        checkFuncArg(isNumber(stencilMask), 'set_stencil_mask', stencilMask);
        return Number(stencilMask);
    },

    stencilFunc: (stencilFunc) => {
        checkFuncArg(!!stencilFunc, 'set_stencil_func', stencilFunc);
        const func = STENCIL_FUNC_MAP[stencilFunc.func];
        const ref = Number(stencilFunc.ref);
        const mask = Number(stencilFunc.mask);
        checkFuncArg(func > 0 && mask > 0 && ref > 0, 'set_stencil_func', stencilFunc);
        return { func: stencilFunc.func, ref, mask };
    },

    stencilOp: (stencilOp) => {
        checkFuncArg(!!stencilOp, 'set_stencil_op', stencilOp);
        const fail = STENCIL_OP_MAP[stencilOp.fail];
        const zfail = STENCIL_OP_MAP[stencilOp.zfail];
        const zpass = STENCIL_OP_MAP[stencilOp.zpass];
        checkFuncArg(fail > 0 && zfail > 0 && zpass > 0, 'set_stencil_op', stencilOp);
        return { fail: stencilOp.fail, zfail: stencilOp.zfail, zpass: stencilOp.zpass };
    },

    culling: (culling) => {
        checkFuncArg(isBoolean(culling), 'set_culling', culling);
        return Boolean(culling);
    },

    cullFace: (cullFace) => {
        checkFuncArg(CULL_FACE_MAP[cullFace] > 0, 'set_cull_face', cullFace);
        return cullFace;
    },

    blending: (blending) => {
        checkFuncArg(isBoolean(blending), 'set_blending', blending);
        return Boolean(blending);
    },

    blendFunc: (blendFunc) => {
        checkFuncArg(BLEND_FUNC_MAP_SRC[blendFunc] > 0, 'set_blend_func', blendFunc);
        return blendFunc;
    },
};

function strictEqual<T>(lhs: T, rhs: T): boolean {
    return lhs === rhs;
}

const RENDER_STATE_COMPARERS: RenderStateComparers = {
    depthTest: strictEqual,

    depthMask: strictEqual,

    depthFunc: strictEqual,

    stencilTest: strictEqual,

    stencilMask: strictEqual,

    stencilFunc: compareStencilFunc,

    stencilOp: compareStencilOp,

    culling: strictEqual,

    cullFace: strictEqual,

    blending: strictEqual,

    blendFunc: strictEqual,
};

const RENDER_STATE_UPDATERS: RenderStateUpdaters = {
    depthTest: (depthTest, gl, log) => {
        log('set_depth_test({0})', depthTest);
        if (depthTest) {
            gl.enable(GL_DEPTH_TEST);
        } else {
            gl.disable(GL_DEPTH_TEST);
        }
    },

    depthMask: (depthMask, gl, log) => {
        log('set_depth_mask({0})', depthMask);
        gl.depthMask(depthMask);
    },

    depthFunc: (depthFunc, gl, log) => {
        log('set_depth_func({0})', depthFunc);
        gl.depthFunc(DEPTH_FUNC_MAP[depthFunc]);
    },

    stencilTest: (stencilTest, gl, log) => {
        log('set_stencil_test({0})', stencilTest);
        if (stencilTest) {
            gl.enable(GL_STENCIL_TEST);
        } else {
            gl.disable(GL_STENCIL_TEST);
        }
    },

    stencilMask: (stencilMask, gl, log) => {
        log('set_stencil_mask({0})', stencilMask);
        gl.stencilMask(stencilMask);
    },

    stencilFunc: (stencilFunc, gl, log) => {
        log('set_stencil_func({0})', stencilFunc);
        gl.stencilFunc(
            STENCIL_FUNC_MAP[stencilFunc.func],
            stencilFunc.ref,
            stencilFunc.mask,
        );
    },

    stencilOp: (stencilOp, gl, log) => {
        log('set_stencil_op({0})', stencilOp);
        gl.stencilOp(
            STENCIL_OP_MAP[stencilOp.fail],
            STENCIL_OP_MAP[stencilOp.zfail],
            STENCIL_OP_MAP[stencilOp.zpass],
        );
    },

    culling: (culling, gl, log) => {
        log('set_culling({0})', culling);
        if (culling) {
            gl.enable(GL_CULL_FACE);
        } else {
            gl.disable(GL_CULL_FACE);
        }
    },

    cullFace: (cullFace, gl, log) => {
        log('set_cull_face({0})', cullFace);
        gl.cullFace(CULL_FACE_MAP[cullFace]);
    },

    blending: (blending, gl, log) => {
        log('set_blending({0})', blending);
        if (blending) {
            gl.enable(GL_BLEND);
        } else {
            gl.disable(GL_BLEND);
        }
    },

    blendFunc: (blendFunc, gl, log) => {
        log('set_blend_func({0})', blendFunc);
        gl.blendFunc(BLEND_FUNC_MAP_SRC[blendFunc], BLEND_FUNC_MAP_DST[blendFunc]);
    },
};

const RENDER_STATE = Symbol('RenderState');

type Changes = Partial<Record<keyof RenderState, RenderState[keyof RenderState]>>;

export function makeRenderState(state: Partial<RenderState>): RenderState {
    const changes: Changes = {};
    for (const [key, val] of Object.entries(state)) {
        const validate = RENDER_STATE_VALIDATORS[key as keyof RenderState];
        const value = validate(val as never);
        changes[key as keyof RenderState] = value;
    }
    return Object.assign(getDefaultRenderState(), changes);
}

export function isRenderState(state: RenderState): boolean {
    return !!state && (RENDER_STATE in state);
}

export function applyRenderState(
    currentState: RenderState,
    appliedState: RenderState,
    gl: WebGL2RenderingContext,
    log: (msg: string, ...args: unknown[]) => void,
): boolean {
    if (currentState === appliedState) {
        return false;
    }
    const keys: (keyof RenderState)[] = [];
    for (const [key, compare] of Object.entries(RENDER_STATE_COMPARERS)) {
        const current = currentState[key as keyof RenderState];
        const applied = appliedState[key as keyof RenderState];
        if (!compare(current as never, applied as never)) {
            keys.push(key as keyof RenderState);
        }
    }
    if (keys.length === 0) {
        return false;
    }
    const changes: Changes = {};
    for (const key of keys) {
        const val = appliedState[key];
        const update = RENDER_STATE_UPDATERS[key];
        update(val as never, gl, log);
        changes[key] = val;
    }
    Object.assign(currentState, changes);
    return true;
}

// Initial state is formed according to specification.
// These values could be queried with `gl.getParameter` but that would affect startup time.
function getDefaultRenderState(): RenderState {
    return {
        depthTest: false,
        depthMask: true,
        depthFunc: 'less',
        stencilTest: false,
        stencilMask: 0x7FFFFFFF,
        stencilFunc: { func: 'always', ref: 0, mask: 0x7FFFFFFF },
        stencilOp: { fail: 'keep', zfail: 'keep', zpass: 'keep' },
        culling: false,
        cullFace: 'back',
        blending: false,
        blendFunc: 'one|zero',
        // @ts-ignore Internal tag.
        [RENDER_STATE]: RENDER_STATE,
    };
}

function compareStencilFunc(lhs: StencilFuncState, rhs: StencilFuncState): boolean {
    return lhs.func === rhs.func && lhs.mask === rhs.mask && lhs.ref === rhs.ref;
}

function compareStencilOp(lhs: StencilOpState, rhs: StencilOpState): boolean {
    return lhs.fail === rhs.fail && lhs.zfail === rhs.zfail && lhs.zpass === rhs.zpass;
}
