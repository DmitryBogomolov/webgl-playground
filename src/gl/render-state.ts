import type {
    RenderState,
    DEPTH_FUNC,
    StencilOpState, StencilFuncState, STENCIL_FUNC, STENCIL_OP,
    CULL_FACE,
    BLEND_FUNC,
} from './render-state.types';
import type { Logger } from '../common/logger.types';
import type { GLValuesMap } from './gl-values-map.types';

type RenderStateValidator<T extends keyof RenderState> = (
    value: RenderState[T], logger: Logger,
) => RenderState[T];
type RenderStateComparer<T extends keyof RenderState> = (
    lhs: RenderState[T], rhs: RenderState[T],
) => boolean;
type RenderStateUpdater<T extends keyof RenderState> = (
    value: RenderState[T], gl: WebGLRenderingContext, logger: Logger,
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

const WebGL = WebGLRenderingContext.prototype;
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

function raiseError(message: string, logger: Logger): Error {
    logger.error(message);
    return new Error(message);
}

const RENDER_STATE_VALIDATORS: RenderStateValidators = {
    depthTest: (depthTest, _logger) => {
        return Boolean(depthTest);
    },

    depthMask: (depthMask, _logger) => {
        return Boolean(depthMask);
    },

    depthFunc: (depthFunc, logger) => {
        const value = DEPTH_FUNC_MAP[depthFunc];
        if (!value) {
            throw raiseError(`set_depth_func(${depthFunc}): bad value`, logger);
        }
        return depthFunc;
    },

    stencilTest: (stencilTest, _logger) => {
        return Boolean(stencilTest);
    },

    stencilMask: (stencilMask, _logger) => {
        return Number(stencilMask);
    },

    stencilFunc: (stencilFunc, logger) => {
        if (!stencilFunc) {
            throw raiseError(`set_stencil_func(${stencilFunc}): bad value`, logger);
        }
        const func = STENCIL_FUNC_MAP[stencilFunc.func];
        const ref = Number(stencilFunc.ref);
        const mask = Number(stencilFunc.mask);
        if (!func || !(mask >= 0) || !(ref >= 0)) {
            throw raiseError(
                'set_stencil_func('
                    + `func=${stencilFunc.func}, ref=${stencilFunc.ref}, mask=${stencilFunc.mask}): bad value`,
                logger,
            );
        }
        return { func: stencilFunc.func, ref, mask };
    },

    stencilOp: (stencilOp, logger) => {
        if (!stencilOp) {
            throw raiseError(`set_stencil_op(${stencilOp}): bad value`, logger);
        }
        const fail = STENCIL_OP_MAP[stencilOp.fail];
        const zfail = STENCIL_OP_MAP[stencilOp.zfail];
        const zpass = STENCIL_OP_MAP[stencilOp.zpass];
        if (!fail || !zfail || !zpass) {
            throw raiseError(
                'set_stencil_op('
                    + `fail=${stencilOp.fail}, zfail=${stencilOp.zfail}, zpass=${stencilOp.zpass}): bad value`,
                logger,
            );
        }
        return { fail: stencilOp.fail, zfail: stencilOp.zfail, zpass: stencilOp.zpass };
    },

    culling: (culling, _logger) => {
        return Boolean(culling);
    },

    cullFace: (cullFace, logger) => {
        const value = CULL_FACE_MAP[cullFace];
        if (!value) {
            throw raiseError(`set_cull_face(${cullFace}): bad value`, logger);
        }
        return cullFace;
    },

    blending: (blending, _logger) => {
        return Boolean(blending);
    },

    blendFunc: (blendFunc, logger) => {
        const value = BLEND_FUNC_MAP_SRC[blendFunc];
        if (!value) {
            throw raiseError(`set_blend_func(${blendFunc}): bad value`, logger);
        }
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
    depthTest: (depthTest, gl, logger) => {
        logger.info(`set_depth_test(${depthTest})`);
        if (depthTest) {
            gl.enable(GL_DEPTH_TEST);
        } else {
            gl.disable(GL_DEPTH_TEST);
        }
    },

    depthMask: (depthMask, gl, logger) => {
        logger.info(`set_depth_mask(${depthMask})`);
        gl.depthMask(depthMask);
    },

    depthFunc: (depthFunc, gl, logger) => {
        logger.info(`set_depth_func(${depthFunc})`);
        gl.depthFunc(DEPTH_FUNC_MAP[depthFunc]);
    },

    stencilTest: (stencilTest, gl, logger) => {
        logger.info(`set_stencil_test(${stencilTest})`);
        if (stencilTest) {
            gl.enable(GL_STENCIL_TEST);
        } else {
            gl.disable(GL_STENCIL_TEST);
        }
    },

    stencilMask: (stencilMask, gl, logger) => {
        logger.info(`set_stencil_mask(${stencilMask})`);
        gl.stencilMask(stencilMask);
    },

    stencilFunc: (stencilFunc, gl, logger) => {
        logger.info(
            `set_stencil_func(func=${stencilFunc.func}, ref=${stencilFunc.ref}, mask=${stencilFunc.mask})`,
        );
        gl.stencilFunc(
            STENCIL_FUNC_MAP[stencilFunc.func], stencilFunc.ref, stencilFunc.mask,
        );
    },

    stencilOp: (stencilOp, gl, logger) => {
        logger.info(
            `set_stencil_op(fail=${stencilOp.fail}, zfail=${stencilOp.zfail}, zpass=${stencilOp.zpass})`,
        );
        gl.stencilOp(
            STENCIL_OP_MAP[stencilOp.fail], STENCIL_OP_MAP[stencilOp.zfail], STENCIL_OP_MAP[stencilOp.zpass],
        );
    },

    culling: (culling, gl, logger) => {
        logger.info(`set_culling(${culling})`);
        if (culling) {
            gl.enable(GL_CULL_FACE);
        } else {
            gl.disable(GL_CULL_FACE);
        }
    },

    cullFace: (cullFace, gl, logger) => {
        logger.info(`set_cull_face(${cullFace})`);
        gl.cullFace(CULL_FACE_MAP[cullFace]);
    },

    blending: (blending, gl, logger) => {
        logger.info(`set_blending(${blending})`);
        if (blending) {
            gl.enable(GL_BLEND);
        } else {
            gl.disable(GL_BLEND);
        }
    },

    blendFunc: (blendFunc, gl, logger) => {
        logger.info(`set_blend_func(${blendFunc})`);
        gl.blendFunc(BLEND_FUNC_MAP_SRC[blendFunc], BLEND_FUNC_MAP_DST[blendFunc]);
    },
};

const RENDER_STATE = Symbol('RenderState');

type Changes = Partial<Record<keyof RenderState, RenderState[keyof RenderState]>>;

export function makeRenderState(state: Partial<RenderState>, logger: Logger): RenderState {
    const changes: Changes = {};
    for (const [key, val] of Object.entries(state)) {
        const validate = RENDER_STATE_VALIDATORS[key as keyof RenderState];
        const value = validate(val as never, logger);
        changes[key as keyof RenderState] = value;
    }
    return Object.assign(getDefaultRenderState(), changes);
}

export function isRenderState(state: RenderState): boolean {
    return !!state && (RENDER_STATE in state);
}

export function applyRenderState(
    currentState: RenderState, appliedState: RenderState, gl: WebGLRenderingContext, logger: Logger,
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
        update(val as never, gl, logger);
        changes[key] = val;
    }
    Object.assign(currentState, changes);
    return true;
}

// Initial state is formed according to specification.
// These values could be queried with `gl.getParameter` but that would unnecessarily increase in startup time.
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
