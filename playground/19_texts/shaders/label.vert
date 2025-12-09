#version 300 es

uniform mat4 u_view_proj;
uniform vec3 u_position;
uniform vec2 u_size_coeff;
uniform float u_base_distance;
uniform vec3 u_view_position;

in vec2 a_position;

out vec2 v_texcoord;

void main() {
    vec4 position = u_view_proj * vec4(u_position, 1.0);
    // Adjust quad size so that it match texture pixel size.
    // u_size_coeff is texture to canvas size ratio.
    // [-1,+1] -> canvas_size ~~ [-t,+t] -> texture_size => t = texture_size / canvas_size
    // depth_coeff is base distance (like camera view distance) to point distance ratio.
    // If object has visual size "h1" on distance "d1" then it will have visual size "h2" on distance "d2".
    // (h1, d2) and (h2, d1) make similar triangles. h1 / d2 == h2 / d1 => h2 = h1 * d1 / d2.
    // That gives perspective size diminishing for quad.
    // Multiply by "w" to compensate further "w" division.
    float depth_coeff = u_base_distance / distance(u_position, u_view_position);
    position.xy += a_position * u_size_coeff * depth_coeff * position.w;
    gl_Position = position;
    v_texcoord = (a_position + vec2(1.0)) / 2.0;
}
