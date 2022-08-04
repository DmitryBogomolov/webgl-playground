precision mediump float;

varying vec2 v_texcoord;
varying vec4 v_planar_texcoord;

uniform sampler2D u_texture;
uniform sampler2D u_planar_texture;

void main() {
    vec2 planar_texcoord = v_planar_texcoord.xy / v_planar_texcoord.w;
    vec4 color = texture2D(u_texture, v_texcoord);
    // if (projected_texcoord.x >= -1.0 && projected_texcoord.x <= +1.0 && projected_texcoord.y >= -1.0 && projected_texcoord.y <= +1.0) {
    //     color.r = 0.0;
    //     color.g = 0.0;
    // }
    if (step(vec2(1.0), abs(planar_texcoord)) == vec2(0.0)) {
        color = texture2D(u_planar_texture, (planar_texcoord + vec2(1.0)) / 2.0);
    }
    gl_FragColor = color;
}
