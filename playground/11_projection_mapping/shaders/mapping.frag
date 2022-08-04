precision mediump float;

varying vec2 v_texcoord;
varying vec4 v_projected_texcoord;

uniform sampler2D u_texture;

void main() {
    vec2 projected_texcoord = v_projected_texcoord.xy / v_projected_texcoord.w;
    vec4 color = texture2D(u_texture, v_texcoord);
    // if (projected_texcoord.x >= -1.0 && projected_texcoord.x <= +1.0 && projected_texcoord.y >= -1.0 && projected_texcoord.y <= +1.0) {
    //     color.r = 0.0;
    //     color.g = 0.0;
    // }
    if (step(vec2(1.0), abs(projected_texcoord)) == vec2(0.0)) {
        color.rgb += 0.0 * vec3(1.0, 0.0, 0.0);
    }
    gl_FragColor = color;
}
