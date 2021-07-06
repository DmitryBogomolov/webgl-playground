// xy - segment point, z - left (-1) or right (+1) edge of line, w - front (+1) or back (-1) edge of segment
attribute vec4 a_position;
// xy - other point of the segment
attribute vec2 a_other;
attribute vec4 a_color;

varying vec4 v_color;

uniform vec2 u_canvas_size;
uniform float u_thickness;

vec2 rotate_right(vec2 v) {
    return vec2(v.y, -v.x);
}

void main() {
    vec2 segment = (a_position.xy - a_other.xy) * u_canvas_size * 0.5;
    vec2 segment_dir = normalize(segment);
    vec2 normal = rotate_right(segment_dir);
    float cross_side = a_position.z;
    float lateral_side = a_position.w;
    vec2 offset = segment_dir + cross_side * normal;
    gl_Position = vec4(a_position.xy + offset * u_thickness * 0.5 / (u_canvas_size * 0.5), 0.0, 1.0);
    v_color = a_color;
}
