#version 300 es

uniform vec2 u_canvas_size;
uniform float u_thickness;

// xy - segment point,
// z - left (-1) or right (+1) edge of line,
// w - front (+1) or back (-1) edge of line
in vec4 a_position;
// xy - other point of the segment
in vec2 a_other;
in vec4 a_color;

// x - offset across the line - left (-1) to right (+1),
// y - offset along the line - back (-1) to front (+1),
// z - line length
out vec3 v_round;
out vec4 v_color;

vec2 rotate_right(vec2 v) {
    return vec2(v.y, -v.x);
}

void main() {
    vec2 segment = (a_position.xy - a_other.xy) * u_canvas_size * 0.5;
    vec2 segment_dir = normalize(segment);
    vec2 normal = rotate_right(segment_dir);
    float bitan_dir = a_position.z;
    float tan_dir = a_position.w;
    // Across the line for thickness, along the line for round join space.
    vec2 offset = segment_dir + bitan_dir * normal;
    gl_Position = vec4(a_position.xy + offset * u_thickness * 0.5 / (u_canvas_size * 0.5), 0.0, 1.0);
    float segment_len = length(segment);
    // Left/right direction is inverted for back point so that left/right directions are the same for back and front.
    // While across offset is defined by half of thickness, along direction is defined
    // by half of thickness and half of segment length.
    v_round = vec3(bitan_dir * tan_dir * u_thickness * 0.5, tan_dir * (u_thickness + segment_len) * 0.5, segment_len);
    v_color = a_color;
}
