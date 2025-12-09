#version 300 es
precision mediump float;

out vec4 frag_color;

void main() {
    // Any constant value could be returns here as it does not matter.
    // Only value in depth buffer matters.
    // This one is an example of value that should be returned to use color buffer as shadow map.
    frag_color = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
}
