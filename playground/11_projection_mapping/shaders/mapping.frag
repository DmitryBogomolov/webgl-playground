precision mediump float;

varying vec3 v_normal;

uniform vec3 u_light_direction;

void main() {
    vec3 normal = normalize(v_normal);
    gl_FragColor = vec4(vec3(dot(normal, -u_light_direction)), 1.0);
}
