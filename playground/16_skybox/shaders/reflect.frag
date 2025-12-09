#version 300 es
precision mediump float;

uniform vec3 u_camera_position;
uniform samplerCube u_texture;

in vec3 v_position;
in vec3 v_normal;

out vec4 frag_color;

void main() {
    vec3 normal = normalize(v_normal);
    // Direction from camera (eye) to current pixel.
    vec3 eye_to_position_dir = normalize(v_position - u_camera_position);
    // Reflection of direction from camera to pixel (points outwards the object).
    vec3 texcoord = reflect(eye_to_position_dir, normal);
    frag_color = texture(u_texture, texcoord);
}
