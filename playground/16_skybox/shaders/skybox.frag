#version 100
precision mediump float;

varying vec4 v_position;

uniform mat4 u_view_proj_inv;
uniform samplerCube u_texture;

void main() {
    // Transform position back from NDC space to world space.
    vec4 position = u_view_proj_inv * v_position;
    vec3 texcoord = normalize(position.xyz / position.w);
    gl_FragColor = textureCube(u_texture, texcoord);
}
