attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform vec2 u_dir; // (-1, +1), (+1, +1), (-1, -1), (+1, -1)

const float SCALE = 0.4;
const float OFFSET = 0.5;

varying vec2 v_texcoord;

// Position is calculated from initial by applying scale and offset.
// Scale factor is the same for all rectangles.
// Offset is taken from uniform `u_dir`;
//  - initial [-1.0, +1.0]
//  - scale   [-0.4, +0.4]
//  - offset  [-0.9, -0.1] | [+0.1, +0.9]

void main() {
    gl_Position = vec4(SCALE * a_position + u_dir * OFFSET, 0.0, 1.0);
    v_texcoord = a_texcoord;
}
