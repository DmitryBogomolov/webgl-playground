attribute vec3 a_position;
// For cube (and other similar edgy objects) normals have gaps.
// Because of it offsetted figure becomes discontinuous. So adjusted normals are used instead of original.
attribute vec3 a_offset;

uniform mat4 u_view_proj;
uniform mat4 u_model;
uniform vec2 u_canvas_size;
uniform float u_thickness;

void main() {
    gl_Position = u_view_proj * u_model * vec4(a_position, 1.0);
    // Bring normal to clip space.
    vec3 normal = mat3(u_view_proj) * mat3(u_model) * a_offset;
    // Map [W * H] in pixels to [2 * 2] in units.
    vec2 px_ratio = u_canvas_size / 2.0;
    // Convert normal from unit to pixel space and apply thickness.
    vec2 offset = normalize(normal.xy) / px_ratio * u_thickness;
    // Premultiply by "w" to compensate the following "w" division.
    gl_Position.xy += offset * gl_Position.w;
}
