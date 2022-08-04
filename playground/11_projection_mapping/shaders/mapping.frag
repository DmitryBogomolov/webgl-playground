precision mediump float;

varying vec3 v_normal;
varying vec4 v_projected_texcoord;

uniform vec3 u_light_direction;

void main() {
    vec3 normal = normalize(v_normal);
    vec2 projected_texcoord = v_projected_texcoord.xy / v_projected_texcoord.w;
    vec3 color = vec3(1.0);
    // if (projected_texcoord.x >= -1.0 && projected_texcoord.x <= +1.0 && projected_texcoord.y >= -1.0 && projected_texcoord.y <= +1.0) {
    //     color.r = 0.0;
    //     color.g = 0.0;
    // }
    if (step(vec2(1.0), abs(projected_texcoord)) == vec2(0.0)) {
        color = vec3(1.0, 0.0, 0.0);
    }
    gl_FragColor = vec4(color * vec3(dot(normal, -u_light_direction)), 1.0);
}
