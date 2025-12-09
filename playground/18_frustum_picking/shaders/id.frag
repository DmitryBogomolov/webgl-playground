#version 300 es
precision mediump float;

uniform vec4 u_id;

out vec4 frag_color;

void main() {
    // Id (uint32) is passed to shader as 4-bytes. In the same 4-bytes form it is then read back from pixel data.
    // Here [0, 255] integer must be converted to [0, 1] float because color range is [0, 1].
    frag_color = u_id / 255.0;
}
