"""Focused source/contact checks. Exported/native motion remains a separate gate."""
import importlib.util
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from rocket_flight_spec import (  # noqa: E402
    CLIPS, WORLDS, REST_CONTACTS, apply_bank, apply_yoke,
    contact_targets, flight_state, semantic_source_selection,
    LEFT_RELEASE_START, LEFT_RELEASE_END, baked_frame, ALLOWED_BAKE_SUBSTEPS, LOGICAL_FPS,
)


class FlightSpecTest(unittest.TestCase):
    def test_all_supported_contacts_follow_same_physical_yoke_and_docks(self):
        for clip in CLIPS:
            for step in range(121):
                phase = step / 120
                state = flight_state(clip, phase)
                contacts = contact_targets(clip, phase)
                for name, rest in REST_CONTACTS.items():
                    row = contacts[name]
                    self.assertTrue(all(math.isfinite(value) for value in row["point"]))
                    if not row["contact"]:
                        self.assertEqual((clip, name), ("celebrate", "leftGrip"))
                        continue
                    expected = apply_bank(apply_yoke(rest, state) if name.endswith("Grip") else rest, state)
                    self.assertLess(math.dist(row["point"], expected), 1e-12)

    def test_banks_interruptible_endpoints_and_real_boost_control_motion(self):
        for clip in CLIPS:
            for phase in (0, 1):
                state = flight_state(clip, phase)
                self.assertAlmostEqual(state["bank"], 0)
                self.assertAlmostEqual(state["yokeY"], 0)
                self.assertAlmostEqual(state["yokePitch"], 0)
                self.assertFalse(state["releasedLeft"])
        left, right = flight_state("bank_left", .5), flight_state("bank_right", .5)
        self.assertAlmostEqual(left["bank"], -right["bank"])
        self.assertLess(left["bank"], -.2)
        self.assertGreater(right["bank"], .2)
        boost = flight_state("boost", .5)
        self.assertGreater(boost["yokeY"], .02)
        self.assertNotEqual(contact_targets("boost", .5)["leftGrip"]["point"], REST_CONTACTS["leftGrip"])

    def test_finale_truthfully_releases_one_palm_without_losing_sole_supports(self):
        contacts = contact_targets("celebrate", .5)
        self.assertFalse(contacts["leftGrip"]["contact"])
        self.assertGreater(contacts["leftGrip"]["point"][2], 1.9)
        self.assertTrue(contacts["rightGrip"]["contact"])
        self.assertTrue(contacts["leftSole"]["contact"])
        self.assertTrue(contacts["rightSole"]["contact"])

    def test_continuous_release_boundaries_keep_held_palms_and_return_without_a_jump(self):
        for boundary in (LEFT_RELEASE_START, LEFT_RELEASE_END):
            state = flight_state("celebrate", boundary)
            self.assertFalse(state["releasedLeft"])
            self.assertEqual(state["leftReleaseWeight"], 0)
            near = boundary + (1e-7 if boundary == LEFT_RELEASE_START else -1e-7)
            lifted = flight_state("celebrate", near)
            self.assertTrue(lifted["releasedLeft"])
            self.assertLess(lifted["leftReleaseWeight"], 1e-10)
            self.assertLess(math.dist(contact_targets("celebrate", near)["leftGrip"]["point"], REST_CONTACTS["leftGrip"]), 1e-9)
        for clip in set(CLIPS) - {"celebrate"}:
            for phase in (.123, .333, .618, .876):
                self.assertFalse(flight_state(clip, phase)["releasedLeft"])

    def test_finite_bake_candidates_preserve_every_original_clip_duration(self):
        for density in ALLOWED_BAKE_SUBSTEPS:
            for end in CLIPS.values():
                self.assertAlmostEqual((baked_frame(end, density) - 1) / (LOGICAL_FPS * density), (end - 1) / LOGICAL_FPS)
                self.assertEqual(baked_frame(1, density), 1)
        with self.assertRaises(ValueError):
            baked_frame(60, 16)

    def test_source_selection_excludes_every_cart_surface_and_joined_runtime(self):
        names = ["BouncyKartRig", "BouncyContinuousBody", "BouncyCoilLeg.L", "OpenMonocoque", "SteeringRim", "Tyre.front.L"]
        self.assertEqual(semantic_source_selection(names, "meadow"), names[:3])
        with self.assertRaises(ValueError):
            semantic_source_selection(["BouncyKartRig", "BouncyKart_Paint"], "meadow")
        with self.assertRaises(ValueError):
            semantic_source_selection(["BouncyContinuousBody"], "meadow")

    def test_distinct_canonical_worlds_and_new_genre_actions(self):
        self.assertEqual({row["character"] for row in WORLDS.values()}, {"Bouncy", "Chompy", "Pip"})
        self.assertEqual(len({row["ship"] for row in WORLDS.values()}), 3)
        self.assertEqual(len({row["inputSha256"] for row in WORLDS.values()}), 3)
        self.assertFalse({"drive", "turn_left", "turn_right", "brake", "recover"}.intersection(CLIPS))
        with self.assertRaises(ValueError):
            flight_state("drive", .5)
        with self.assertRaises(ValueError):
            flight_state("boost", float("nan"))

    def test_export_recipe_import_cannot_start_blender_or_mutate_source(self):
        source = ROOT / "build_rocket_craft.py"
        spec = importlib.util.spec_from_file_location("rocket_export_preflight", source)
        module = importlib.util.module_from_spec(spec)
        before = "bpy" in sys.modules
        spec.loader.exec_module(module)
        self.assertEqual("bpy" in sys.modules, before)
        self.assertTrue(callable(module.main))

    def test_alpha_renderer_import_is_inert_and_uses_actual_registered_frames(self):
        source = ROOT / "render_rocket_craft_actions.py"
        spec = importlib.util.spec_from_file_location("rocket_alpha_preflight", source)
        module = importlib.util.module_from_spec(spec)
        before = "bpy" in sys.modules
        spec.loader.exec_module(module)
        self.assertEqual("bpy" in sys.modules, before)
        for row, end in enumerate(CLIPS.values()):
            frames = module.sampled_frames(end)
            self.assertEqual(len(set(frames)), 6)
            self.assertEqual((frames[0], frames[-1]), (1, end))
            self.assertTrue(all(isinstance(frame, int) and 1 <= frame <= end for frame in frames))
            for column in range(6):
                self.assertEqual(module.frame_cell(row, column, 256),
                                 [column * 256, row * 256, 256, 256])


if __name__ == "__main__":
    unittest.main()
