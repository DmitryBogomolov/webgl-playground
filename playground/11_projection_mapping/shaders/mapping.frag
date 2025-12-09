#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_mapping_texture;

in vec2 v_texcoord;
in vec4 v_mapping_coord;

out vec4 frag_color;

void main() {
    vec4 color = texture(u_texture, v_texcoord);
    // Only "xy" components from clip space are used.
    vec2 mapping_coord = v_mapping_coord.xy / v_mapping_coord.w;
    // Bring [-1,+1] space to [0, 1] and use it as texture coordinates.
    vec4 mapping_color = texture(u_mapping_texture, (mapping_coord + vec2(1.0)) / 2.0);
    // If coordinates are within [-1,+1] range than pixel is visible in mapping source frustum.
    // In such case mapping texture is samples. Otherwise default color is used.
    float is_mapped = float(all(lessThanEqual(abs(mapping_coord), vec2(1.0))));
    frag_color = mix(color, mapping_color, is_mapped);
}
