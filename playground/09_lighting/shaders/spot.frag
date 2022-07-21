precision mediump float;

uniform vec4 u_color;

varying vec3 v_normal;
varying vec3 v_light_dir;

void main() {
    // TODO...
    vec3 normal = normalize(v_normal);
    vec3 light_dir = normalize(v_light_dir);
    gl_FragColor = vec4(u_color.rgb * dot(normal, light_dir), u_color.a);
}
