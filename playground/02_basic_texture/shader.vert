attribute vec2 a_position;

// [l, t, r, b]
uniform vec4 u_position;

varying vec2 v_texcoord;

// [-1, -1] -> [l, b], [+1, -1] -> [r, b], [+1, +1] -> [r, t], [-1, +1] -> [l, t]
float map(float val, float min_val, float max_val) {
    return (max_val - min_val) * val / 2.0 + (min_val + max_val) / 2.0;
}

void main() {
    float x = map(a_position.x, u_position[0], u_position[2]);
    float y = map(a_position.y, u_position[1], u_position[3]);
    gl_Position = vec4(x, y, 0.0, 1.0);
    v_texcoord = (a_position + vec2(1.0)) / 2.0;
}
