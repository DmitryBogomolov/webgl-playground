import { VertexSchema } from '.';
import { BaseWrapper } from './base-wrapper';
import { contextConstants } from './context-constants';
import { ContextView } from './context-view';
import { raiseError } from './utils';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
    FLOAT, FLOAT_VEC2, FLOAT_VEC3, FLOAT_VEC4,
    SAMPLER_2D,
} = contextConstants;

type UniformValue = number | [number, number] | [number, number, number] | [number, number, number, number];
type UniformSetter = (ctx: WebGLRenderingContext, location: WebGLUniformLocation, value: UniformValue) => void;

const uniformSetters: Record<number, UniformSetter> = {
    [FLOAT]: (ctx, location, value) => ctx.uniform1f(location, value as number),
    [FLOAT_VEC2]: (ctx, location, value) => ctx.uniform2fv(location, value as number[]),
    [FLOAT_VEC3]: (ctx, location, value) => ctx.uniform3fv(location, value as number[]),
    [FLOAT_VEC4]: (ctx, location, value) => ctx.uniform4fv(location, value as number[]),
    [SAMPLER_2D]: (ctx, location, value) => ctx.uniform1i(location, value as number),
};

interface AttributeDesc {
    readonly location: number;
    readonly size: number;
    readonly type: number;
}

interface UniformDesc {
    readonly location: WebGLUniformLocation;
    readonly size: number;
    readonly type: number;
}

type AttributesMap = Record<string, AttributeDesc>;

type UniformsMap = Record<string, UniformDesc>;

export class Program extends BaseWrapper<WebGLProgram> {
    private _vertexShader: WebGLShader | null = null;
    private _fragmentShader: WebGLShader | null = null;
    private _attributes: AttributesMap = {};
    private _uniforms: UniformsMap = {};

    constructor(context: ContextView) {
        super(context);
        this.setSources(null, null);
    }

    dispose(): void {
        this.setSources(null, null);
        super.dispose();
    }

    protected _createHandle(): WebGLProgram {
        return this._context.handle().createProgram()!;
    }

    protected _destroyHandle(handle: WebGLProgram): void {
        this._context.handle().deleteProgram(handle);
    }

    private _createShader(type: number, source: string): WebGLShader {
        const ctx = this._context.handle();
        const shader = ctx.createShader(type)!;
        ctx.shaderSource(shader, source);
        ctx.compileShader(shader);
        if (!ctx.getShaderParameter(shader, COMPILE_STATUS)) {
            const info = ctx.getShaderInfoLog(shader)!;
            ctx.deleteShader(shader);
            throw raiseError(this._logger, info);
        }
        ctx.attachShader(this._handle, shader);
        return shader;
    }

    private _deleteShader(shader: WebGLShader): void {
        const ctx = this._context.handle();
        ctx.detachShader(this._handle, shader);
        ctx.deleteShader(shader);
    }

    private _linkProgram(): void {
        const ctx = this._context.handle();
        const program = this._handle;
        ctx.linkProgram(program);
        if (!ctx.getProgramParameter(program, LINK_STATUS)) {
            const info = ctx.getProgramInfoLog(program)!;
            throw raiseError(this._logger, info);
        }
    }

    private _collectAttributes(): Record<string, AttributeDesc> {
        const ctx = this._context.handle();
        const program = this._handle;
        const count = ctx.getProgramParameter(program, ACTIVE_ATTRIBUTES) as number;
        const attributes: Record<string, AttributeDesc> = {};
        for (let i = 0; i < count; ++i) {
            const { name, size, type } = ctx.getActiveAttrib(program, i)!;
            const location = ctx.getAttribLocation(program, name);
            attributes[name] = {
                location,
                size,
                type,
            };
        }
        return attributes;
    }

    private _collectUniforms(): Record<string, UniformDesc> {
        const ctx = this._context.handle();
        const program = this._handle;
        const count = ctx.getProgramParameter(program, ACTIVE_UNIFORMS) as number;
        const uniforms: Record<string, UniformDesc> = {};
        for (let i = 0; i < count; ++i) {
            const { name, size, type } = ctx.getActiveUniform(program, i)!;
            const location = ctx.getUniformLocation(program, name)!;
            uniforms[name] = {
                location,
                size,
                type,
            };
        }
        return uniforms;
    }

    setSources(vertexShader: string | null, fragmentShader: string | null): void {
        if (this._vertexShader) {
            this._deleteShader(this._vertexShader);
            this._vertexShader = null;
        }
        if (this._fragmentShader) {
            this._deleteShader(this._fragmentShader);
            this._fragmentShader = null;
        }
        if (vertexShader) {
            this._vertexShader = this._createShader(VERTEX_SHADER, vertexShader);
        }
        if (fragmentShader) {
            this._fragmentShader = this._createShader(FRAGMENT_SHADER, fragmentShader);
        }
        if (this._vertexShader || this._fragmentShader) {
            this._linkProgram();
            this._attributes = this._collectAttributes();
            this._uniforms = this._collectUniforms();
        }
    }

    setupVertexAttributes(schema: VertexSchema): void {
        this._logger.log(`setup_vertex_attributes(${schema.items.length})`);
        const ctx = this._context.handle();
        const attributes = this._attributes;
        const stride = schema.vertexSize;
        schema.items.forEach((item) => {
            const attr = attributes[item.name];
            if (!attr) {
                throw raiseError(this._logger, `attribute "${item.name}" is unknown`);
            }
            // TODO: Validate type and size (if it is possible).
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
            ctx.vertexAttribPointer(
                attr.location, item.size, item.gltype, item.normalized, stride, item.offset,
            );
            ctx.enableVertexAttribArray(attr.location);
        });
    }

    setUniform(name: string, value: number): void {
        this._logger.log(`set_uniform(${name},${value})`);
        const attr = this._uniforms[name];
        if (!attr) {
            throw raiseError(this._logger, `uniform "${name}" is unknown`);
        }
        const setter = uniformSetters[attr.type];
        if (!setter) {
            throw raiseError(this._logger, `uniform "${name}" setter is not found`);
        }
        setter(this._context.handle(), attr.location, value);
    }

    static contextMethods = {
        createProgram(ctx: ContextView): Program {
            return new Program(ctx);
        },
    
        useProgram(ctx: ContextView, target: Program | null): void {
            ctx.logCall('use_program', target ? target.id() : null);
            ctx.handle().useProgram(target ? target.handle() : null);
        },
    };
}
