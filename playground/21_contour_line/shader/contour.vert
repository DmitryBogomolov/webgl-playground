// xy - point, z - left (-1) or right (+1)
attribute vec3 a_position;
attribute vec4 a_other;

uniform float u_thickness;
uniform vec2 u_canvas_size;

vec2 rotate_right(vec2 v) {
    return vec2(v.y, -v.x);
}

void main() {
    // Map [W * H] in pixels to [2 * 2] in units.
    vec2 px_ratio = u_canvas_size / 2.0;
    // Map segments from unit to screen space.
    vec2 this_segment = (a_other.xy - a_position.xy) * px_ratio;
    vec2 prev_segment = (a_position.xy - a_other.zw) * px_ratio;
    vec2 this_dir = normalize(this_segment);
    vec2 prev_dir = normalize(prev_segment);
    vec2 tangent = normalize(this_dir + prev_dir);
    vec2 bitangent = rotate_right(tangent);
    vec2 normal = rotate_right(this_dir);
    float offset_length = u_thickness * 0.5 / dot(normal, bitangent);
    // Map offset from screen to unit space.
    vec2 offset = bitangent * offset_length / px_ratio;
    gl_Position = vec4(a_position.xy + offset * a_position.z, 1.0, 1.0);
}
