"""Pure packet-admission gates; these do not claim actual rendered pixels."""
import base64
import copy
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rocket_route_spec import ROUTE_ROLES  # noqa: E402
from rocket_runtime_route import checked_runtime_route  # noqa: E402


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_record(root, path, data):
    absolute = root / path
    absolute.parent.mkdir(parents=True, exist_ok=True)
    absolute.write_bytes(data)
    return sha(data)


def packet(root):
    """Small metadata fixtures, with distinct source/file bytes per role.

    Actual decoder/alpha/pixel parity belongs to the real encoder and native
    gates. No fake image here is labelled rendered or accepted artwork.
    """
    folder = 'source-art/arcade/rocket-run/route-kit-v1/meadow'
    source = folder + '/original-route-kit.blend'
    source_hash = write_record(root, source, b'original-owned-source-fixture')
    originals, roles = [], {}
    for index, role in enumerate(ROUTE_ROLES):
        path = folder + '/' + role + '.png'
        source_hash_for_role = write_record(root, path, ('source-' + role).encode())
        core = {'sourcePoint': [0, 0, 0], 'radius': .64,
                'sourceObject': role + '-physical-core', 'measuredVertices': 24}
        core = core if role in ('courier', 'asteroid') else None
        original = {'role': role, 'source': path, 'sha256': source_hash_for_role,
                    'size': [4, 4], 'anchor': [2, 2], 'pixelsPerUnit': 8,
                    'motorCore': core}
        originals.append(original)
        x, y = (index % 4) * 4, (index // 4) * 4
        roles[role] = {'cell': [x, y, x + 4, y + 4], 'source': path,
                       'sourceSha256': source_hash_for_role, 'sourceSize': [4, 4],
                       'anchor': [2, 2], 'pixelsPerUnit': 8,
                       'motorCore': copy.deepcopy(core)}
    registration = {'world': 'meadow', 'trueAlpha': True, 'completeRoleBank': True,
                    'source': source, 'sourceSha256': source_hash, 'roles': originals}
    url = '/game-assets/rocket-run/route-kit/meadow-route-kit-v1.webp'
    binary = b'lossless-derivative-byte-fixture'
    binary_hash = write_record(root, 'public' + url, binary)
    primary = {'runtime': url, 'runtimeSha256': binary_hash, 'runtimeBytes': len(binary),
               'width': 16, 'height': 8, 'decodedBaseBytes': 16 * 8 * 4,
               'trueAlpha': True, 'roles': roles,
               'pixelParity': {'changedAlphaPixels': 0, 'changedVisibleRgbPixels': 0,
                               'transparentRgbDifferences': 0,
                               'resized': False, 'repainted': False}}
    inline = 'data:image/webp;base64,' + base64.b64encode(binary).decode('ascii')
    embedded = {**copy.deepcopy(primary), 'fileRuntime': url, 'runtime': inline,
                'inlineBytes': len(inline.encode('ascii'))}
    delivery = {'world': 'meadow', 'primary': primary, 'embedded': embedded}
    return registration, delivery


def write_packet(root, registration, delivery):
    folder = root / 'source-art/arcade/rocket-run/route-kit-v1/meadow'
    (folder / 'registration.json').write_text(json.dumps(registration))
    (folder / 'delivery.json').write_text(json.dumps(delivery))


class RuntimeRouteRecordTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.registration, self.delivery = packet(self.root)

    def check(self):
        write_packet(self.root, self.registration, self.delivery)
        return checked_runtime_route(self.root, 'meadow')

    def test_complete_packet_preserves_core_and_one_selected_texture_without_native_claim(self):
        original = copy.deepcopy(self.delivery)
        record, provenance = self.check()
        self.assertEqual(record['primary'], original['primary'])
        self.assertEqual(record['embedded'], original['embedded'])
        self.assertEqual(provenance['maximumDecodedBaseBytes'], 512)
        self.assertEqual(provenance['selectedTextureOwners'], 1)
        self.assertEqual(provenance['inlineBytes'], len(original['embedded']['runtime'].encode('ascii')))
        self.assertEqual(provenance['nativeReview'], 'UNKNOWN')
        record['primary']['roles']['courier']['motorCore']['radius'] = 9
        self.assertEqual(self.delivery['primary']['roles']['courier']['motorCore']['radius'], .64)

    def test_missing_role_or_changed_real_core_cannot_be_registered_for_fallback(self):
        self.delivery['embedded']['roles'].pop('comet')
        with self.assertRaises(ValueError):
            self.check()
        self.registration, self.delivery = packet(self.root)
        self.delivery['primary']['roles']['courier']['motorCore']['radius'] = .01
        with self.assertRaises(ValueError):
            self.check()

    def test_inline_data_and_current_source_bytes_are_actually_matched(self):
        self.delivery['embedded']['runtime'] = 'data:image/webp;base64,' + base64.b64encode(b'changed').decode()
        with self.assertRaises(ValueError):
            self.check()
        self.registration, self.delivery = packet(self.root)
        source = self.root / self.registration['roles'][0]['source']
        source.write_bytes(b'changed-original')
        with self.assertRaises(ValueError):
            self.check()

    def test_overlap_fractional_cell_and_outside_origin_cannot_hide_omitted_pixels(self):
        for field, value in (('cell', [0, 0, 4, 4]), ('cell', [4.5, 0, 8.5, 4]),
                             ('anchor', [4, 2])):
            with self.subTest(field=field, value=value):
                self.registration, self.delivery = packet(self.root)
                self.delivery['primary']['roles']['portal'][field] = value
                with self.assertRaises(ValueError):
                    self.check()

    def test_false_pixel_parity_and_understated_cost_cannot_enter_runtime(self):
        for bank, field, value in (('primary', 'decodedBaseBytes', 1),
                                  ('embedded', 'inlineBytes', 1),
                                  ('embedded', 'runtimeBytes', 1)):
            with self.subTest(bank=bank, field=field):
                self.registration, self.delivery = packet(self.root)
                self.delivery[bank][field] = value
                with self.assertRaises(ValueError):
                    self.check()
        self.registration, self.delivery = packet(self.root)
        self.delivery['primary']['pixelParity']['changedVisibleRgbPixels'] = 1
        with self.assertRaises(ValueError):
            self.check()
        self.registration, self.delivery = packet(self.root)
        self.delivery['primary']['pixelParity']['transparentRgbDifferences'] = 1
        with self.assertRaises(ValueError):
            self.check()

    def test_retained_role_keeps_original_blend_provenance_and_rejects_changed_bytes(self):
        current = {'path': self.registration['source'], 'sha256': self.registration['sourceSha256']}
        old_path = 'source-art/arcade/rocket-run/route-kit-v1/meadow/retained-first-route-kit.blend'
        retained = {'path': old_path, 'sha256': write_record(self.root, old_path, b'original-before-refinement')}
        self.registration.update({'renderSources': [current, retained],
            'renderedRoles': [role for role in ROUTE_ROLES if role != 'courier'], 'retainedRoles': ['courier']})
        for row in self.registration['roles']:
            row.update({'renderSource': current, 'renderMode': 'rendered-from-refined-source'})
            if row['role'] == 'courier':
                row.update({'renderSource': retained, 'renderMode': 'retained-original-pixels',
                            'retention': {'originalRegistrationSha256': 'c'*64}})
            for bank in ('primary', 'embedded'):
                self.delivery[bank]['roles'][row['role']].update({
                    key: copy.deepcopy(row[key]) for key in ('renderSource', 'renderMode', 'retention') if key in row})
        record, _ = self.check()
        self.assertEqual(record['primary']['roles']['courier']['renderSource'], retained)
        self.delivery['embedded']['roles']['courier']['renderSource'] = current
        with self.assertRaises(ValueError):
            self.check()
        self.delivery['embedded']['roles']['courier']['renderSource'] = retained
        (self.root/old_path).write_bytes(b'changed-original-blend')
        with self.assertRaises(ValueError):
            self.check()


if __name__ == '__main__':
    unittest.main()
