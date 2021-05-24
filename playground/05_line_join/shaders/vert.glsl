// xy - position, z - -1/+1 direction
attribute vec3 a_position;
// xy - prev point, zw - next point
attribute vec4 a_other;

uniform vec2 u_canvas_size;
uniform float u_thickness;

const float PI = acos(-1.0);
const float MITER_LIMIT = 4.0;
const float DOT_THRESHOLD = 0.99;

vec2 get_normal(vec2 v) {
    return vec2(v.y, -v.x);
}

float get_offset(vec2 v1, vec2 v2) {
    float prod = dot(v1, v2);
    prod *= float(prod < DOT_THRESHOLD);
    float a = (PI - acos(prod)) / 2.0;
    return min(tan(a), MITER_LIMIT);
}

void main() {
    vec2 inner_dir = normalize((a_other.xy - a_position.xy) * u_canvas_size);
    vec2 outer_dir = normalize((a_other.zw - a_position.xy) * u_canvas_size);
    vec2 norm = get_normal(inner_dir);
    vec2 bioffset = norm * a_position.z * u_thickness / u_canvas_size;
    vec2 offset = -inner_dir * get_offset(inner_dir, outer_dir) * u_thickness / u_canvas_size;
    gl_Position = vec4(a_position.xy + bioffset + offset, 0.0, 1.0);
}
