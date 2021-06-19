// xy - segment point, z - left (-1) or right (+1) edge of line
attribute vec3 a_position;
// xy - other point of the segment, zw - other point of the next segment
attribute vec4 a_other;
attribute vec4 a_color;

varying vec4 v_color;

uniform vec2 u_canvas_size;
uniform float u_thickness;

const float EPS = 1.E-7;

vec2 rotate_right(vec2 v) {
    return vec2(v.y, -v.x);
}

// Next segment turns left (-1) or right (+1) or goes forward (+1).
float get_rotation_sign(vec2 segment_normal, vec2 next_segment_dir) {
    return 2.0 * step(0.0, dot(segment_normal, next_segment_dir)) - 1.0;
}

vec2 get_inner_offset(vec2 normal, vec2 bitangent, vec2 segment, vec2 next_segment) {
    // Bitangent is a hypotenuse of a triangle, normal is an adjacent leg.
    // Dot product is a cosine of angle between them.
    // Returns bitagent of hypotenuse length of a triangle with adjacent leg length of 1.
    // If segments overlap (angle between them is quite small) then returns normal.
    float coeff = 1.0 * dot(normal, bitangent);
    return u_thickness * 0.5 * coeff > min(length(segment), length(next_segment)) ? bitangent * coeff : normal;
}

vec2 get_outer_offset(vec2 normal, vec2 bitangent) {
    vec2 slope = normalize(normal + bitangent);
    return slope / dot(normal, slope);
}

// left side  (-1), left turn  (-1) --> -inner_offset
// left side  (-1), right turn (+1) --> -outer_offset
// right side (+1), left turn  (-1) --> +outer_offset
// right side (+1), right turn (+1) --> +inner_offset
// --> offset = side * (side == turn ? inner_offset : outer_offset)
vec2 get_offset(
    float segment_side, float rotation_sign, vec2 segment_normal, vec2 bitangent, vec2 segment, vec2 next_segment
) {
    vec2 offset = segment_side * rotation_sign > 0.0
        ? get_inner_offset(segment_normal, bitangent, segment, next_segment)
        : get_outer_offset(segment_normal, bitangent);
    return segment_side * offset;
}

void main() {
    vec2 segment = (a_position.xy - a_other.xy) * u_canvas_size * 0.5;
    vec2 next_segment = (a_other.zw - a_position.xy) * u_canvas_size * 0.5;
    vec2 segment_dir = normalize(segment);
    vec2 next_segment_dir = normalize(next_segment);
    // Does next segment goes backward? It is handled separately.
    bool is_reverse = dot(segment_dir, next_segment_dir) <= -1.0 + EPS;
    // Tangent at the junction point of the current segment and the next one.
    vec2 tangent = is_reverse ? segment_dir : normalize(segment_dir + next_segment_dir);
    vec2 normal = rotate_right(segment_dir);
    vec2 bitangent = rotate_right(tangent);
    float rotation_sign = get_rotation_sign(normal, next_segment_dir);
    float segment_side = a_position.z;
    vec2 offset = get_offset(segment_side, rotation_sign, normal, bitangent, segment, next_segment);
    // Add line cap for a reverse case.
    offset += float(is_reverse) * segment_dir;
    gl_Position = vec4(a_position.xy + offset * u_thickness * 0.5 / (u_canvas_size * 0.5), 0.0, 1.0);
    v_color = a_color;
}
