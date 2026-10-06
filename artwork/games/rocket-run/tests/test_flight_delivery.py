"""Source-only delivery gates; no renderer, encoder or authored output claim."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from compile_rocket_flight_art import runtime_frame, validate_source_views, verify_alpha_and_pixels
from rocket_flight_spec import CLIPS
from render_rocket_craft_actions import sampled_frames, retained_frames, selected_clips


class Pixels:
    def __init__(self, values):
        self.size = (len(values) // 4, 1)
        self.values = bytes(values)

    def tobytes(self):
        return self.values


class FlightDeliveryTest(unittest.TestCase):
    def test_finite_batches_cannot_mix_changed_source_camera_or_duplicate_poses(self):
        self.assertEqual(selected_clips("celebrate,cruise"), ("cruise", "celebrate"))
        for invalid in ("", "cruise,cruise", "tennis"):
            with self.assertRaises(ValueError):
                selected_clips(invalid)
        camera = {"orthoScale": 4.2}
        row = {"clip": "cruise", "frame": 1}
        registration = {"craftSourceSha256": "actual-source", "camera": camera,
                        "size": [1536, 1792], "frames": [row]}
        self.assertEqual(retained_frames(registration, "actual-source", camera, 256), [row])
        self.assertFalse(registration.get("completeSourceBank", False))
        for source, projection in (("changed", camera), ("actual-source", {"orthoScale": 4.3})):
            with self.assertRaises(ValueError):
                retained_frames(registration, source, projection, 256)
        with self.assertRaises(ValueError):
            retained_frames({**registration, "frames": [row, row]}, "actual-source", camera, 256)

    def test_xywh_conversion_preserves_transparent_receiver_and_absolute_true_supports(self):
        row = {"cell": [512, 256, 256, 256], "capturePixel": [128.25, 113.75],
               "clip": "catch", "frame": 13, "phase": 12 / 29,
               "source": "source-art/actual-frame.png", "sha256": "retained-original",
               "originPixel": [116, 140], "sockets": {"leftGrip": {
                   "pixel": [103.4, 96.3], "supportPixel": [103.4, 96.3],
                   "contact": True, "separation": 0}}}
        output = runtime_frame(row, (256, 256))
        self.assertEqual(output["cell"], [512, 256, 768, 512])
        self.assertEqual(output["anchor"], [128.25, 113.75])
        self.assertEqual(output["sockets"]["captureCenter"], [640.25, 369.75])
        self.assertEqual(output["contacts"]["leftGrip"]["pixel"], [615.4, 352.3])
        self.assertEqual(output["contacts"]["leftGrip"]["supportPixel"], [615.4, 352.3])
        self.assertEqual(output["contacts"]["leftGrip"]["separation"], 0)
        self.assertEqual(row["sockets"]["leftGrip"]["pixel"], [103.4, 96.3])

    def test_42_cells_cannot_hide_a_missing_action_pose_or_a_false_contact_phase(self):
        rows = [{"clip": clip, "frame": frame, "phase": (frame - 1) / (end - 1)}
                for clip, end in CLIPS.items() for frame in sampled_frames(end)]
        validate_source_views(rows)
        missing = [dict(row) for row in rows]
        missing[-1] = dict(missing[-2])
        with self.assertRaises(ValueError):
            validate_source_views(missing)
        false_phase = [dict(row) for row in rows]
        false_phase[4]["phase"] = .5
        with self.assertRaises(ValueError):
            validate_source_views(false_phase)

    def test_visible_rgb_and_soft_alpha_remain_exact_without_threshold_or_repaint(self):
        original = Pixels([40, 80, 120, 57, 10, 20, 30, 255, 70, 80, 90, 0])
        transparent_only = Pixels([40, 80, 120, 57, 10, 20, 30, 255, 0, 0, 0, 0])
        proof = verify_alpha_and_pixels(original, transparent_only)
        self.assertEqual(proof["changedAlphaPixels"], 0)
        self.assertEqual(proof["changedVisibleRgbPixels"], 0)
        self.assertEqual(proof["transparentRgbDifferences"], 1)
        for changed in [Pixels([40, 80, 120, 58, 10, 20, 30, 255, 70, 80, 90, 0]),
                        Pixels([41, 80, 120, 57, 10, 20, 30, 255, 70, 80, 90, 0])]:
            with self.assertRaises(ValueError):
                verify_alpha_and_pixels(original, changed)


if __name__ == "__main__":
    unittest.main()
