/**
 * Module-level ref for audio amplitude [0..1].
 * Written every frame by SpeechPulse, read by NodeMesh — avoids prop-drilling
 * through the entire scene graph.
 */
export const speechAmplitudeRef = { current: 0 };
