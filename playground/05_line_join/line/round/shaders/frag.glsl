#version 300 es
precision mediump float;

uniform highp float u_thickness;

in vec3 v_round;
in vec4 v_color;

out vec4 frag_color;

bool is_outside_of_circle() {
    // Vector from the (nearest) segment end to current fragment.
    vec2 offset = vec2(v_round.x, abs(v_round.y) - v_round.z * 0.5);
    // Check if vector points outside the segment and its length is greater than half of thickness.
    return offset.y > 0.0 && dot(offset, offset) > u_thickness * u_thickness * 0.25;
}

void main() {
    if (is_outside_of_circle()) {
        discard;
    }
    frag_color = v_color;
}
