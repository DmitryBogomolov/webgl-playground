attribute vec2 a_position;

uniform mat4 u_view_proj;
uniform vec3 u_position;
uniform vec2 u_size_coeff;

varying vec2 v_texcoord;

void main() {
    vec4 position = u_view_proj * vec4(u_position, 1.0);
    // Adjust quad size so that it match texture pixel size.
    // [-1,+1] -> canvas_size ~~ [-t,+t] -> texture_size => t = texture_size / canvas_size
    // Multiply by "w" to compensate further "w" division.
    position.xy += a_position * u_size_coeff * position.w;
    gl_Position = position;
    v_texcoord = (a_position + vec2(1.0)) / 2.0;
}
