precision mediump float;

varying vec3 v_normal;
varying vec3 v_light_dir;
varying vec4 v_depth_coord;

uniform vec3 u_color;
uniform sampler2D u_depth_texture;

// Just an arbitrary factor to indicate shadowing effect.
const float SHADOW_COEFF = 0.45;

const vec3 c_light_dir1 = normalize(vec3(0.0, 2.0, 1.0));
const vec3 c_light_dir2 = normalize(vec3(+1.0, 2.0, -1.0));
const vec3 c_light_dir3 = normalize(vec3(-1.0, 2.0, -1.0));

float get_light_coeff(vec3 normal, vec3 light_dir) {
    return max(0.0, dot(normal, light_dir));
}

float get_full_light_coeff(vec3 normal) {
    float c1 = get_light_coeff(normal, c_light_dir1);
    float c2 = get_light_coeff(normal, c_light_dir2);
    float c3 = get_light_coeff(normal, c_light_dir3);
    return min(c1 + c2 + c3, 1.0);
}

void main() {
    vec3 normal = normalize(v_normal);
    vec4 color = vec4(u_color * get_full_light_coeff(normal), 1.0);

    vec2 depth_coord = v_depth_coord.xy / v_depth_coord.w;
    // Convert [-1,+1] space to [0, 1].
    // All three components (r|g|b) have same value.
    float depth_threshold = texture2D(u_depth_texture, (depth_coord + vec2(1.0)) / 2.0).r;
    float current_depth = v_depth_coord.z / v_depth_coord.w;
    float is_shadowed = 1.0;
    // Check if both coords are in [-1,+1] range.
    is_shadowed *= float(all(lessThanEqual(abs(depth_coord), vec2(1.0))));
    // Check if pixel faces light (otherwise it cannot be shadowed).
    is_shadowed *= max(0.0, sign(dot(normal, normalize(v_light_dir))));
    // If saved depth is less than current depth than something is closer to the light
    // and it shadows current pixel.
    is_shadowed *= float(current_depth >= depth_threshold);

    // If pixel is shadowed than its color is adjusted.
    color.rgb *= mix(1.0, SHADOW_COEFF, is_shadowed);
    gl_FragColor = color;
}
