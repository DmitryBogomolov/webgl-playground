precision mediump float;

varying vec2 v_texcoord;
varying vec4 v_planar_texcoord;

uniform sampler2D u_texture;
uniform sampler2D u_planar_texture;

void main() {
    vec2 planar_texcoord = v_planar_texcoord.xy / v_planar_texcoord.w;
    gl_FragColor = mix(
        texture2D(u_texture, v_texcoord),
        texture2D(u_planar_texture, (planar_texcoord + vec2(1.0)) / 2.0),
        float(all(lessThanEqual(abs(planar_texcoord), vec2(1.0))))
    );
}
