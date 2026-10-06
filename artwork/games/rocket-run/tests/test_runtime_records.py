"""Source-only admission boundary, with no media export or final-art claim."""
import hashlib
import json
import base64
import importlib.util
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import compile_rocket_runtime_data as compiler
from compile_rocket_runtime_data import checked_runtime, checked_inline, compiled_outputs


class RuntimeRecordsTest(unittest.TestCase):
    def test_actual_asset_hash_and_owned_path_required_before_admission(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            asset = root / "public/game-assets/rocket-run/models/original.glb"
            asset.parent.mkdir(parents=True)
            asset.write_bytes(b"actual test bytes; not a GLB/rendered claim")
            record = {"runtime": "/game-assets/rocket-run/models/original.glb",
                      "runtimeSha256": hashlib.sha256(asset.read_bytes()).hexdigest()}
            self.assertEqual(checked_runtime(root, record), asset)
            asset.write_bytes(b"changed delivery")
            with self.assertRaises(ValueError):
                checked_runtime(root, record)
            for unsafe in ["/game-assets/sound-racer/foreign.glb", "/game-assets/rocket-run/../foreign.glb", "https://example.com/model.glb"]:
                with self.assertRaises(ValueError):
                    checked_runtime(root, {**record, "runtime": unsafe})

    def test_runtime_and_sky_compiler_imports_do_not_encode_export_or_load_blender(self):
        for filename in ["compile_rocket_venues.py", "compile_rocket_runtime_data.py"]:
            spec = importlib.util.spec_from_file_location("rocket_inert_" + filename, ROOT / filename)
            module = importlib.util.module_from_spec(spec)
            bpy_before, pillow_before = "bpy" in sys.modules, "PIL.Image" in sys.modules
            spec.loader.exec_module(module)
            self.assertEqual("bpy" in sys.modules, bpy_before)
            self.assertEqual("PIL.Image" in sys.modules, pillow_before)
            self.assertTrue(callable(module.main))

    def test_inline_cost_includes_full_data_url_and_exact_delivered_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / 'public/game-assets/rocket-run/flight-actions/source.webp'
            path.parent.mkdir(parents=True)
            path.write_bytes(b'original exact source bytes for metadata gate')
            payload = base64.b64encode(path.read_bytes()).decode('ascii')
            url = 'data:image/webp;base64,' + payload
            record = {'fileRuntime': '/game-assets/rocket-run/flight-actions/source.webp',
                      'runtimeSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                      'runtime': url, 'inlineBytes': len(payload)}
            with self.assertRaises(ValueError):
                checked_inline(root, record)
            checked_inline(root, {**record, 'inlineBytes': len(url.encode('ascii'))})
            with self.assertRaises(ValueError):
                checked_inline(root, {**record, 'inlineBytes': len(url), 'runtime': url[:-4]+'AAAA'})

    def test_incomplete_world_admission_and_late_validation_write_nothing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaisesRegex(ValueError, 'all three complete worlds'):
                compiler.compile_records(root, ['meadow'])
            with patch.object(compiler, 'compile_records', side_effect=ValueError('Hard route is not delivered')):
                with self.assertRaisesRegex(ValueError, 'Hard route'):
                    compiled_outputs(root)
            self.assertEqual(list(root.iterdir()), [])

    def test_generated_registry_keeps_recovery_in_only_its_selected_world_packet(self):
        worlds = ['meadow', 'dino', 'moonwood']
        records = {world: {'runtime': world, 'emergency': 'data:image/webp;base64,'+world} for world in worlds}
        proof = {world: {'nativeReview': 'UNKNOWN'} for world in worlds}
        with patch.object(compiler, 'compile_records', return_value=(records, proof)):
            outputs = compiled_outputs(Path('/not-read-or-written'))
        registry = outputs['src/components/learn/games/games/rocketRunCraftData.js']
        self.assertNotIn('base64', registry)
        self.assertIn('createRocketWorldRecordDelivery', registry)
        for world in worlds:
            data = outputs['src/components/learn/games/games/rocketRunCraftData-'+world+'.js']
            self.assertIn('base64,'+world, data)
            for other in worlds:
                if other != world:
                    self.assertNotIn('base64,'+other, data)
            packet = outputs['public/game-assets/rocket-run/world-records/'+world+'-v2.json']
            self.assertEqual(json.loads(packet), records[world])
        self.assertEqual(len(outputs), 8)


if __name__ == "__main__":
    unittest.main()
