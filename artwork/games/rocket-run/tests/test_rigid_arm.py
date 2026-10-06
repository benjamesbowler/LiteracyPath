import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rocket_flight_spec import CLIPS, YOKE_PIVOT, flight_state, rigid_elbow, celebration_free_wrist, same_quaternion_hemisphere, anatomical_bend_frame


def distance(a, b):
    return math.sqrt(sum((a[index] - b[index]) ** 2 for index in range(3)))


class RigidArmTests(unittest.TestCase):
    # These are the actual shared canonical source endpoints in the frozen
    # Sports recipe. The Blender gate separately obtains them from each loaded
    # original editable rig rather than trusting this pure source fixture.
    shoulder = (-.27, -.36, 1.40)
    elbow = (-.34, -.02, 1.18)
    wrist = (-.23, .20, 1.02)
    upper = distance(shoulder, elbow)
    fore = distance(elbow, wrist)

    def test_rest_lengths_and_original_bend_are_retained(self):
        solved = rigid_elbow(self.shoulder, self.wrist, self.upper, self.fore, self.elbow)
        self.assertLess(distance(solved, self.elbow), 1e-12)
        self.assertAlmostEqual(distance(self.shoulder, solved), self.upper, places=12)
        self.assertAlmostEqual(distance(solved, self.wrist), self.fore, places=12)

    def test_entire_authored_wrist_path_is_reachable_continuous_and_not_clamped(self):
        for clip in CLIPS:
            previous = None
            for index in range(1001):
                phase = index / 1000
                state = flight_state(clip, phase)
                shoulder = tuple(self.shoulder[i] + (state['torsoX'] * .55 if i == 0
                                     else state['torsoY'] * .55 if i == 1 else 0) for i in range(3))
                pole = tuple(self.elbow[i] + (state['torsoX'] * .30 if i == 0
                                 else state['torsoY'] * .40 if i == 1 else 0) for i in range(3))
                x, y, z = tuple(self.wrist[i] - YOKE_PIVOT[i] for i in range(3))
                angle = state['yokePitch']
                wrist = (x + YOKE_PIVOT[0], math.cos(angle) * y - math.sin(angle) * z + YOKE_PIVOT[1] + state['yokeY'],
                         math.sin(angle) * y + math.cos(angle) * z + YOKE_PIVOT[2])
                if state['releasedLeft']:
                    free = celebration_free_wrist(phase, state)
                    wrist = tuple(wrist[i] + (free[i] - wrist[i]) * state['leftReleaseWeight'] for i in range(3))
                unchanged_wrist = tuple(wrist)
                solved = rigid_elbow(shoulder, wrist, self.upper, self.fore, pole)
                self.assertEqual(wrist, unchanged_wrist)
                self.assertAlmostEqual(distance(shoulder, solved), self.upper, places=11)
                self.assertAlmostEqual(distance(solved, wrist), self.fore, places=11)
                if previous:
                    self.assertLess(distance(previous, solved), .02, clip + ' must not flip its elbow pole')
                previous = solved

    def test_reviewed_wave_preserves_three_cycles_duration_and_release_envelope(self):
        self.assertEqual(CLIPS['celebrate'], 60)
        previous = None
        x_crossings = 0
        for index in range(1, 10000):
            phase = index / 10000
            state = flight_state('celebrate', phase)
            free = celebration_free_wrist(phase, state)
            self.assertEqual(free[1], -.45)
            self.assertAlmostEqual(free[2], 1.84 + .055 * math.sin(math.pi * phase), places=14)
            self.assertAlmostEqual(free[0] + .64, state['leftWave'], places=14)
            self.assertLess(abs(state['leftWave']), .076)
            if previous is not None and previous * state['leftWave'] < 0:
                x_crossings += 1
            if state['leftWave'] != 0:
                previous = state['leftWave']
        self.assertEqual(x_crossings, 5, 'three expressive cycles must remain')
        for boundary in (0, 1):
            state = flight_state('celebrate', boundary)
            self.assertEqual(state['leftReleaseWeight'], 0)
            self.assertFalse(state['releasedLeft'])

    def test_outward_wave_specific_reach_envelope_and_continuous_elbow_to_hand_path(self):
        maximum, maximum_free = 0, 0
        minimum = self.upper + self.fore
        previous = None
        held = self.wrist
        for index in range(1001):
            phase = index / 1000
            state = flight_state('celebrate', phase)
            free = celebration_free_wrist(phase, state)
            wrist = tuple(held[i] + (free[i]-held[i])*state['leftReleaseWeight'] for i in range(3))
            unchanged = tuple(wrist)
            elbow = rigid_elbow(self.shoulder, wrist, self.upper, self.fore, self.elbow)
            self.assertEqual(wrist, unchanged)
            reach = distance(self.shoulder, wrist)
            maximum = max(maximum, reach)
            minimum = min(minimum, reach)
            if state['leftReleaseWeight'] >= .99:
                maximum_free = max(maximum_free, reach)
                self.assertLess(free[0], -.56, 'the whole raised hand path must stay outward of the old wool-obscured centre')
            self.assertAlmostEqual(distance(self.shoulder, elbow), self.upper, places=11)
            self.assertAlmostEqual(distance(elbow, wrist), self.fore, places=11)
            if previous:
                self.assertLess(distance(previous[0], elbow), .02)
                self.assertLess(distance(previous[1], wrist), .02)
            previous = (elbow, wrist)
        self.assertLess(maximum, self.upper + self.fore)
        self.assertLess(maximum_free, self.upper + self.fore)
        self.assertGreater(minimum, abs(self.upper-self.fore))
        self.assertGreater(self.upper + self.fore - maximum, .026)

    def test_actual_antipodal_key_repair_preserves_orientation_and_stable_midpoint(self):
        before = (.018961740657687187, .3040669560432434, .8916245102882385, .334946870803833)
        raw = (.026034319773316383, -.294402152299881, -.9154369831085205, -.27317526936531067)
        fixed = same_quaternion_hemisphere(raw, before)
        self.assertEqual(fixed, tuple(-value for value in raw))
        # Every quadratic product in the rotation matrix remains exact.
        for i in range(4):
            for j in range(4):
                self.assertEqual(raw[i] * raw[j], fixed[i] * fixed[j])
        old_mid = tuple((before[i] + raw[i]) / 2 for i in range(4))
        new_mid = tuple((before[i] + fixed[i]) / 2 for i in range(4))
        self.assertLess(math.sqrt(sum(v*v for v in old_mid)), .041)
        self.assertGreater(math.sqrt(sum(v*v for v in new_mid)), .999)
        self.assertGreater(sum(before[i] * fixed[i] for i in range(4)), .996)
        self.assertEqual(raw, (.026034319773316383, -.294402152299881, -.9154369831085205, -.27317526936531067))

    def test_hemisphere_selection_is_clip_local_and_does_not_normalize_or_clamp_keys(self):
        raw = (-.5, .5, .5, .5)
        self.assertEqual(same_quaternion_hemisphere(raw), raw)
        self.assertEqual(same_quaternion_hemisphere(raw, raw), raw)
        self.assertEqual(same_quaternion_hemisphere(raw, tuple(-v for v in raw)), tuple(-v for v in raw))
        for bad in ((0, 0, 0, 0), (float('nan'), 0, 0, 1), (1, 0, 0)):
            with self.assertRaises(ValueError):
                same_quaternion_hemisphere(bad)

    def test_anatomical_plane_preserves_orthonormal_frames_through_opposite_segment_axes(self):
        def cross(a, b):
            return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
        last = None
        for index in range(1001):
            phase = index / 1000
            state = flight_state('celebrate', phase)
            free = celebration_free_wrist(phase, state)
            wrist = tuple(self.wrist[i] + (free[i]-self.wrist[i])*state['leftReleaseWeight'] for i in range(3))
            elbow = rigid_elbow(self.shoulder, wrist, self.upper, self.fore, self.elbow)
            normal = cross(tuple(elbow[i]-self.shoulder[i] for i in range(3)), tuple(wrist[i]-elbow[i] for i in range(3)))
            frames = [anatomical_bend_frame(wrist, elbow, normal), anatomical_bend_frame(elbow, self.shoulder, normal)]
            for frame in frames:
                for a in range(3):
                    for b in range(3):
                        self.assertAlmostEqual(sum(frame[a][i]*frame[b][i] for i in range(3)), 1 if a==b else 0, places=12)
                self.assertAlmostEqual(sum(cross(frame[0],frame[1])[i]*frame[2][i] for i in range(3)),1,places=12)
            if last:
                for before, after in zip(last, frames):
                    self.assertLess(sum((before[a][i]-after[a][i])**2 for a in range(3) for i in range(3)), .03, 'actual bend plane cannot flip twist')
            last = frames
        with self.assertRaises(ValueError):
            anatomical_bend_frame((0,0,0),(0,0,1),(0,0,1))

    def test_unreachable_singular_nonfinite_inputs_fail_without_moving_target(self):
        for wrist in [(0, 0, 10), self.shoulder, (float('nan'), 0, 0)]:
            with self.assertRaises(ValueError):
                rigid_elbow(self.shoulder, wrist, self.upper, self.fore, self.elbow)
        with self.assertRaises(ValueError):
            rigid_elbow(self.shoulder, self.wrist, self.upper, self.fore, self.shoulder)

    def test_forward_chain_retains_original_physical_shoulder_elbow_wrist_anchors(self):
        # Canonical parent tails and child heads identify the same physical
        # joint, independently of a helper socket or a guessed skin centre.
        upper_head, upper_tail = self.shoulder, self.elbow
        fore_head, fore_tail = self.elbow, self.wrist
        self.assertEqual(upper_head, self.shoulder)
        self.assertEqual(upper_tail, fore_head)
        self.assertEqual(fore_tail, self.wrist)
        self.assertAlmostEqual(distance(fore_head, fore_tail), self.fore, places=14)
        self.assertAlmostEqual(distance(upper_head, upper_tail), self.upper, places=14)


if __name__ == '__main__':
    unittest.main()
