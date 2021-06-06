// xy - position, z - -1/+1 location
attribute vec3 a_position;
// xy - prev point, zw - next point
attribute vec4 a_other;

uniform vec2 u_canvas_size;
uniform float u_thickness;

const float EPS = 1.E-7;

/*
a_position.z - point location on segment end = -1 (left), +1 (right)

rotation = -1 (left), +1 (right or straight)
slope - middle of right bitangent and right segment normal

left turn (-1)  : inner = -bitangent, outer = +slope
right turn (+1) : inner = +bitangent, outer = -slope
## inner = +dir * bitangent, outer = -dir * slope

left point  (-1) left turn  (-1) : inner
right point (+1) left turn  (-1) : outer
left point  (-1) right turn (+1) : outer
right point (+1) right turn (+1) : inner
## loc * dir = +1 : inner, loc * dir = -1 : outer

*/

vec2 get_tangent(vec2 segment_dir, vec2 outer_dir) {
    return dot(segment_dir, outer_dir) > -1.0 + EPS ? normalize(segment_dir + outer_dir) : segment_dir;
}

vec2 rotate_right(vec2 v) {
    return vec2(v.y, -v.x);
}

float get_rotation_sign(vec2 outer_dir, vec2 bitangent) {
    return 2.0 * step(0.0, dot(outer_dir, bitangent)) - 1.0;
}

vec2 get_inner_offset(vec2 normal, vec2 bitangent) {
    return bitangent / dot(normal, bitangent);
}

vec2 get_outer_offset(vec2 normal, vec2 bitangent) {
    vec2 slope = normalize(normal + bitangent);
    return slope / dot(normal, slope);
}

void main() {
    vec2 segment_dir = normalize((a_position.xy - a_other.xy) * u_canvas_size);
    vec2 outer_dir = normalize((a_other.zw - a_position.xy) * u_canvas_size);
    vec2 tangent = get_tangent(segment_dir, outer_dir);
    vec2 normal = rotate_right(segment_dir);
    vec2 bitangent = rotate_right(tangent);
    float rotation_sign = get_rotation_sign(outer_dir, bitangent);
    vec2 offset = a_position.z * rotation_sign > 0.0
        ? +rotation_sign * get_inner_offset(normal, bitangent)
        : -rotation_sign * get_outer_offset(normal, bitangent);
    vec2 bioffset = offset * u_thickness / u_canvas_size;
    gl_Position = vec4(a_position.xy + bioffset, 0.0, 1.0);
}
