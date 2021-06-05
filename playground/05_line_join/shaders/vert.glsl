// xy - position, z - -1/+1 location
attribute vec3 a_position;
// xy - prev point, zw - next point
attribute vec4 a_other;

uniform vec2 u_canvas_size;
uniform float u_thickness;

const float EPS = 1.E-7;

vec2 rotate_right(vec2 v) {
    return vec2(v.y, -v.x);
}

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

void main() {
    vec2 curr_dir = normalize((a_position.xy - a_other.xy) * u_canvas_size);
    vec2 next_dir = normalize((a_other.zw - a_position.xy) * u_canvas_size);
    vec2 tangent = dot(curr_dir, next_dir) <= -1.0 + EPS ? curr_dir : normalize(curr_dir + next_dir);
    vec2 curr_norm = rotate_right(curr_dir);
    vec2 bitangent = rotate_right(tangent);
    vec2 slope = normalize(curr_norm + bitangent);

    float rotation_dir = 2.0 * step(0.0, dot(next_dir, bitangent)) - 1.0;
    vec2 inner_offset = +rotation_dir * bitangent / dot(curr_norm, bitangent);
    vec2 outer_offset = -rotation_dir * slope / dot(curr_norm, slope);
    vec2 offset = a_position.z * rotation_dir > 0.0 ? inner_offset : outer_offset;

    vec2 bioffset = offset * u_thickness / u_canvas_size;
    gl_Position = vec4(a_position.xy + bioffset, 0.0, 1.0);
}
