#version 100
precision mediump float;

varying vec3 v_position;
varying vec3 v_normal;

uniform vec3 u_camera_position;
uniform samplerCube u_texture;

void main() {
    vec3 normal = normalize(v_normal);
    // Direction from camera (eye) to current pixel.
    vec3 eye_to_position_dir = normalize(v_position - u_camera_position);
    // Reflection of direction from camera to pixel (points outwards the object).
    vec3 texcoord = reflect(eye_to_position_dir, normal);
    gl_FragColor = textureCube(u_texture, texcoord);
}
