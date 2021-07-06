precision mediump float;

varying vec2 v_sides;
varying vec4 v_color;
varying float v_length;

uniform highp float u_thickness;

void main() {
    float cross_dist = v_sides.x * u_thickness * 0.5;
    float lateral_dist = v_sides.y * (v_length * 0.5 + u_thickness * 0.5);
    float r = length(vec2(cross_dist, lateral_dist - sign(v_sides.y) * v_length * 0.5));
    if (abs(lateral_dist) > v_length * 0.5 && r > u_thickness * 0.5) {
        discard;
    }
    gl_FragColor = v_color;
}
