#version 300 es
precision mediump float;

uniform mat4 u_view_proj_inv;
uniform samplerCube u_texture;

in vec4 v_position;

out vec4 frag_color;

void main() {
    // Transform position back from NDC space to world space.
    vec4 position = u_view_proj_inv * v_position;
    vec3 texcoord = normalize(position.xyz / position.w);
    frag_color = texture(u_texture, texcoord);
}
