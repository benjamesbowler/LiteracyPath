"""Prepared isolated route gates; no image/render/export side effects.

The directory is deliberately separate from the frozen flight-wave tests.
"""
import copy
import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from compile_rocket_route_kit import check_registration  # noqa: E402
from rocket_route_spec import (ROUTE_ROLES, ROUTE_WORLDS, validate_route_spec,
    MEADOW_MATERIALS, MEADOW_REFINED_ROLES, checked_role_camera,
    checked_render_provenance, radial_sail_rotation, portal_frame_connections,
    MEADOW_GATE_CHANNEL, THEMED_ROUTE_MATERIALS, extended_support_path,
    fossil_portal_structure, fossil_station_structure, themed_lamp_support)  # noqa: E402


def record():
    return {"trueAlpha": True, "completeRoleBank": True,
            "roles": [{"role": role, "size": [512, 512],
                       "pixelsPerUnit": 64, "anchor": [256, 400],
                       "motorCore": {"sourcePoint": [0, 0, 0], "radius": .64}
                                    if role in ("courier", "asteroid") else None}
                      for role in ROUTE_ROLES]}


class RouteDeliveryTests(unittest.TestCase):
    def test_all_three_worlds_require_the_complete_concrete_role_inventory(self):
        self.assertTrue(validate_route_spec())
        self.assertEqual(set(ROUTE_WORLDS), {"meadow", "dino", "moonwood"})
        for role in ROUTE_ROLES:
            self.assertEqual(len({world[role] for world in ROUTE_WORLDS.values()}), 3)

    def test_partial_repeated_or_empty_roles_cannot_be_delivered_as_a_complete_bank(self):
        for rows in (record()["roles"][:-1],
                     record()["roles"][:-1]+[record()["roles"][0]], []):
            source = record()
            source["roles"] = rows
            with self.assertRaises(ValueError):
                check_registration(source)
        partial = record()
        partial["completeRoleBank"] = False
        with self.assertRaises(ValueError):
            check_registration(partial)

    def test_actual_registration_rejects_clipped_origins_and_mixed_cameras(self):
        self.assertEqual(check_registration(record()), 512)
        for change in ({"anchor": [-1, 400]}, {"anchor": [256, 513]},
                       {"anchor": [256, float("nan")]}, {"pixelsPerUnit": 0},
                       {"size": [256, 256]}, {"size": [512, 511]}):
            changed = copy.deepcopy(record())
            changed["roles"][0].update(change)
            with self.assertRaises(ValueError):
                check_registration(changed)

    def test_refinement_preserves_the_declared_cream_carrier_and_distinct_warm_source_materials(self):
        self.assertNotIn('courier', MEADOW_REFINED_ROLES)
        self.assertEqual(set(MEADOW_REFINED_ROLES), set(ROUTE_ROLES)-{'courier'})
        self.assertEqual(set(MEADOW_MATERIALS), {'timber', 'brass', 'sailcloth', 'lampAmber'})
        self.assertEqual(len(set(MEADOW_MATERIALS.values())), 4)
        self.assertNotIn(ROUTE_WORLDS['meadow']['panel'], MEADOW_MATERIALS.values())
        # A real sail points out from its rotor, rather than sitting tangential
        # to it as an unrelated floating plank. These angles cover both mills.
        for phase in (0, .2, math.pi/2+.2, math.pi+.2, math.pi*1.5+.2):
            orientation = radial_sail_rotation(phase)
            actual_long_axis = (math.sin(orientation), math.cos(orientation))
            expected_arm_axis = (math.cos(phase), math.sin(phase))
            self.assertAlmostEqual(sum(a*b for a, b in zip(actual_long_axis, expected_arm_axis)), 1, places=12)
        with self.assertRaises(ValueError):
            radial_sail_rotation(float('nan'))

    def test_same_actual_projection_is_cloned_without_fitting_or_moving_the_origin(self):
        reference = record()
        reference['world'] = 'meadow'
        for row in reference['roles']:
            row.update({'pixelsPerUnit': 128, 'camera': {'orthoScale': 4,
                'location': [3.2, -6, 3.3], 'focus': [0, 0, 0]}})
        selected = checked_role_camera(reference, 'meadow', 'portal', 512)
        self.assertEqual(selected, reference['roles'][1])
        selected['anchor'][0] = 9
        self.assertEqual(reference['roles'][1]['anchor'], [256, 400])
        for change in ('wrong-world', 'repeated-role', 'different-canvas', 'different-scale', 'clipped-origin'):
            changed = copy.deepcopy(reference)
            if change == 'wrong-world':
                changed['world'] = 'moonwood'
            elif change == 'repeated-role':
                changed['roles'][-1] = changed['roles'][0]
            elif change == 'different-canvas':
                changed['roles'][1]['size'] = [256, 256]
            elif change == 'different-scale':
                changed['roles'][1]['camera']['orthoScale'] = 4.1
            else:
                changed['roles'][1]['anchor'] = [512, 400]
            with self.subTest(change=change), self.assertRaises(ValueError):
                checked_role_camera(changed, 'meadow', 'portal', 512)

    def test_unmeasured_core_or_invalid_camera_cannot_be_used_as_a_fixed_reference(self):
        reference = record()
        reference['world'] = 'meadow'
        for row in reference['roles']:
            row.update({'pixelsPerUnit': 128, 'camera': {'orthoScale': 4,
                'location': [3.2, -6, 3.3], 'focus': [0, 0, 0]}})
        for field, value in (('radius', 0), ('radius', float('nan')), ('radius', True),
                             ('sourcePoint', [1, 0, 0])):
            changed = copy.deepcopy(reference)
            changed['roles'][2]['motorCore'][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                checked_role_camera(changed, 'meadow', 'courier', 512)
        reference['roles'][1]['camera']['location'] = [0, float('nan'), 0]
        with self.assertRaises(ValueError):
            checked_role_camera(reference, 'meadow', 'portal', 512)

    def test_retained_courier_cannot_claim_a_new_render_or_lose_original_source_ownership(self):
        reference = record()
        folder = 'source-art/arcade/rocket-run/route-kit-v1/meadow/'
        current = {'path': folder+'original-route-kit.blend', 'sha256': 'a'*64}
        retained = {'path': folder+'retained-first-route-kit.blend', 'sha256': 'b'*64}
        reference.update({'world': 'meadow', 'source': current['path'],
            'sourceSha256': current['sha256'], 'renderSources': [current, retained],
            'renderedRoles': list(MEADOW_REFINED_ROLES), 'retainedRoles': ['courier']})
        for row in reference['roles']:
            row.update({'renderSource': current, 'renderMode': 'rendered-from-refined-source'})
        reference['roles'][2].update({'renderSource': retained, 'renderMode': 'retained-original-pixels',
            'retention': {'originalRegistrationSha256': 'c'*64}})
        self.assertEqual(checked_render_provenance(reference), [current, retained])
        self.assertEqual(check_registration(reference), 512)
        for change in ('new-render-claim', 'current-source-substitute', 'missing-role-source',
                       'wrong-inventory', 'outside-owned-path', 'missing-original-registration'):
            changed = copy.deepcopy(reference)
            row = changed['roles'][2]
            if change == 'new-render-claim':
                row['renderMode'] = 'rendered-from-refined-source'
            elif change == 'current-source-substitute':
                row['renderSource'] = current
            elif change == 'missing-role-source':
                row.pop('renderSource')
            elif change == 'wrong-inventory':
                changed['renderedRoles'].append('courier')
            elif change == 'outside-owned-path':
                changed['renderSources'][1]['path'] = '../unowned.blend'
            else:
                row['retention'] = {}
            with self.subTest(change=change), self.assertRaises(ValueError):
                check_registration(changed)

    def test_actual_portal_risers_and_both_knee_ends_tie_into_timbers_outside_the_channel(self):
        # Real source centres/sizes are the builder's geometry authority.
        # A supported brace needs both endpoints inside its actual timbers.
        arch_lo, arch_hi = (-5.7, -.16, 4.52), (5.7, .16, 4.78)
        for side in (-1, 1):
            joints = portal_frame_connections(side)
            post_lo, post_hi = (side*5.6-.22, -.26, .125), (side*5.6+.22, .26, 3.875)
            centre, size = joints['riserCentre'], joints['riserSize']
            riser_lo = [c-s/2 for c, s in zip(centre, size)]
            riser_hi = [c+s/2 for c, s in zip(centre, size)]
            for lo, hi in ((post_lo, post_hi), (arch_lo, arch_hi)):
                self.assertTrue(all(min(riser_hi[i], hi[i])-max(riser_lo[i], lo[i]) > 0 for i in range(3)))
            for point, bounds in zip(joints['kneeEndpoints'], ((post_lo, post_hi), (arch_lo, arch_hi))):
                self.assertTrue(all(bounds[0][i] < point[i] < bounds[1][i] for i in range(3)))
                self.assertGreater(point[2]-joints['kneeRadius'], MEADOW_GATE_CHANNEL['top'])
            self.assertGreater(riser_lo[2], MEADOW_GATE_CHANNEL['top'])
        with self.assertRaises(ValueError):
            portal_frame_connections(True)

    def test_fossil_overhead_rib_connects_both_columns_without_entering_the_flight_channel(self):
        structure = fossil_portal_structure()
        path = structure['overhead']
        self.assertEqual(path[0], structure['columns'][-1][-1])
        self.assertEqual(path[-1], structure['columns'][1][-1])
        self.assertGreater(max(point[2] for point in path), 4.9)
        for a, b in zip(path, path[1:]):
            actual = extended_support_path([a, b], structure['overlap'])
            radius = structure['overheadRadius']
            lo_x, hi_x = min(p[0] for p in actual)-radius, max(p[0] for p in actual)+radius
            lo_z = min(p[2] for p in actual)-radius
            # Conservative full-radius bounds. A lower side segment cannot
            # enter the channel even before its actual evaluated mesh gate.
            self.assertTrue(lo_z >= MEADOW_GATE_CHANNEL['top']
                            or lo_x >= MEADOW_GATE_CHANNEL['halfWidth']
                            or hi_x <= -MEADOW_GATE_CHANNEL['halfWidth'])
            length = math.dist(actual[0], actual[1])
            for joint in (a, b):
                self.assertGreater(math.dist(actual[0], joint), 0)
                self.assertLess(math.dist(actual[0], joint), length)
        for side, column in structure['columns'].items():
            for point in column:
                self.assertGreater(abs(point[0])-.34, MEADOW_GATE_CHANNEL['halfWidth'])
            self.assertEqual(column[0], (side*5.6, 0, .3))

    def test_observatory_roof_rib_has_fitted_stone_footings_and_original_dock_attachment(self):
        source = fossil_station_structure()
        for endpoint in (source['rib'][0], source['rib'][-1]):
            low = source['footingZ']-source['footingSize'][2]/2
            high = source['footingZ']+source['footingSize'][2]/2
            self.assertLess(low, endpoint[2])
            self.assertGreater(high, endpoint[2])
            dock_joint = (endpoint[0], .22, .39)
            self.assertLess(low, dock_joint[2])
            self.assertGreater(high, dock_joint[2])
            # Same actual ellipsoid constructed for the unchanged dock.
            self.assertLess((dock_joint[0]/3.3)**2+(dock_joint[1]/2.5)**2
                            +((dock_joint[2]-.12)/.34)**2, 1)
        self.assertGreater(max(point[2] for point in source['rib']), 3.4)

    def test_themed_lamp_bracket_starts_on_the_real_support_and_ends_inside_the_solid_cap(self):
        for world in ('dino', 'moonwood'):
            self.assertIn('copper', THEMED_ROUTE_MATERIALS[world])
            self.assertNotEqual(THEMED_ROUTE_MATERIALS[world]['copper'], ROUTE_WORLDS[world]['panel'])
            for side in (-1, 1):
                path = themed_lamp_support(world, side)
                expected = (fossil_portal_structure()['columns'][side][6] if world == 'dino'
                            else (side*5.3, 0, 3.4))
                self.assertEqual(path[0], expected)
                cap_centre_z = 2.8+.305*.8
                self.assertLess(abs(path[-1][2]-cap_centre_z), .06*.8)
                self.assertEqual(path[-1][:2], (side*4.9, -.12))
                self.assertTrue(all(abs(point[0])-.032 > MEADOW_GATE_CHANNEL['halfWidth'] for point in path))
        with self.assertRaises(ValueError):
            themed_lamp_support('meadow', 1)

    def test_support_extension_requires_real_distinct_endpoints_and_preserves_shared_centres(self):
        source = [(1, 0, 0), (2, 0, 0), (2, 0, 1)]
        result = extended_support_path(source)
        self.assertEqual(source, [(1, 0, 0), (2, 0, 0), (2, 0, 1)])
        self.assertEqual(result[1], source[1])
        self.assertLess(result[0][0], source[0][0])
        self.assertGreater(result[-1][2], source[-1][2])
        for points, radius in (([(0, 0, 0)], .06), ([(0, 0, 0), (0, 0, 0)], .06),
                               (source, float('nan')), (source, 0)):
            with self.assertRaises(ValueError):
                extended_support_path(points, radius)


if __name__ == "__main__":
    unittest.main()
