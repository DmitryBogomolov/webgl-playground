attribute vec2 a_position;

varying vec4 v_position;

void main() {
    // No transformation is required. Vertex positions are already in NDC space.
    gl_Position = vec4(a_position, 1.0, 1.0);
    v_position = gl_Position;
}
