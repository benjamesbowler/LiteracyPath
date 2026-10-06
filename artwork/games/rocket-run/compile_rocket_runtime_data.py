"""Join delivered Rocket inputs; no provisional asset may become runtime data.

Source preparation only. Run after an explicitly leased original-craft export,
registered action compilation and venue encoding. Imports perform no I/O.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

from rocket_flight_spec import WORLDS, CLIPS, CAPTURE_RADIUS
from rocket_runtime_anatomy import checked_runtime_anatomy
from rocket_runtime_route import checked_runtime_route


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_runtime(root, record, url_key="runtime", hash_key="runtimeSha256"):
    url = record[url_key]
    if not url.startswith("/game-assets/rocket-run/") or ".." in url:
        raise ValueError("A declared owned Rocket runtime file is required")
    path = root / "public" / url.lstrip("/")
    if digest(path) != record[hash_key]:
        raise ValueError("Actual delivered asset bytes changed: " + url)
    return path


def checked_inline(root, value):
    path = checked_runtime(root, value, url_key='fileRuntime')
    inline = value.get('runtime', '')
    prefix = 'data:image/webp;base64,'
    if (not inline.startswith(prefix) or value.get('inlineBytes') != len(inline.encode('ascii'))
            or base64.b64decode(inline[len(prefix):], validate=True) != path.read_bytes()):
        raise ValueError('The complete actual inline URL, bytes and delivered file must agree')


def checked_flight(root, world, flight, registration):
    if (registration.get('world') != world or registration.get('trueAlpha') is not True
            or registration.get('completeSourceBank') is not True
            or len(registration.get('frames', [])) != 42
            or digest(root/registration['craftSource']) != registration['craftSourceSha256']):
        raise ValueError('The complete actual source craft and action registration are required')
    originals = {frame['source']: frame for frame in registration['frames']}
    if len(originals) != 42:
        raise ValueError('Every original flight pose must be unique')
    for frame in originals.values():
        if digest(root/frame['source']) != frame['sha256']:
            raise ValueError('An original rendered pose changed')
    for key, count in [('primary', 42), ('independentIdle', 1), ('emergency', 21)]:
        bank = flight[key]
        path = checked_runtime(root, bank, url_key='fileRuntime' if key == 'emergency' else 'runtime')
        parity = bank.get('pixelParity', {})
        if (any(parity.get(name) != 0 for name in
                ('changedAlphaPixels', 'changedVisibleRgbPixels', 'transparentRgbDifferences'))
                or parity.get('resized') is not False or parity.get('repainted') is not False
                or len(bank.get('frames', [])) != count or path.stat().st_size != bank.get('runtimeBytes')
                or bank.get('decodedBaseBytes') != bank['width']*bank['height']*4):
            raise ValueError('Complete exact original RGBA flight delivery is required')
        if key == 'emergency':
            checked_inline(root, bank)
        if key == 'independentIdle':
            if bank['frames'][0].get('clip') != 'cruise':
                raise ValueError('The independent idle is an opening pose, not a complete action bank')
        elif any(sum(frame.get('clip') == clip for frame in bank['frames']) != count//7 for clip in CLIPS):
            raise ValueError('Every original flight clip needs the complete declared pose count')
        cells = []
        for frame in bank['frames']:
            original = originals.get(frame.get('source'))
            if (not original or frame.get('sourceSha256') != original['sha256']
                    or frame.get('clip') != original['clip'] or frame.get('phase') != original['phase']
                    or frame.get('anchor') != original['anchor']):
                raise ValueError('Delivered flight pose no longer matches its registered original')
            cell = frame.get('cell', [])
            if (len(cell) != 4 or any(isinstance(v, bool) or not isinstance(v, int) for v in cell)):
                raise ValueError('The real flight atlas needs integer source cells')
            left, top, right, bottom = cell
            if (left < 0 or top < 0 or right > bank['width'] or bottom > bank['height']
                    or [right-left, bottom-top] != frame.get('sourceSize')
                    or any(min(right, old[2]) > max(left, old[0]) and min(bottom, old[3]) > max(top, old[1]) for old in cells)):
                raise ValueError('A registered flight pose was clipped or repeated')
            cells.append(cell)
    if sum(flight[key]['decodedBaseBytes'] for key in ('primary', 'independentIdle', 'emergency')) > 16*1024*1024:
        raise ValueError('The complete file-bank decoded budget changed')


def compile_records(root, selected_worlds):
    if list(selected_worlds) != list(WORLDS):
        raise ValueError('Runtime admission requires all three complete worlds; no partial theme selection')
    records, manifest_worlds = {}, {}
    for world in selected_worlds:
        spec = WORLDS[world]
        source = root / "source-art/arcade/rocket-run"
        model_path = source / (spec["characterId"] + "-spacecraft-v1.json")
        model = json.loads(model_path.read_text())
        if (model["world"] != world or model["clips"] != CLIPS or model["canonicalInput"]["sha256"] != spec["inputSha256"]
                or model.get('canonicalSurfaceEquality') is not True):
            raise ValueError("The exact original craft, clips and canonical pilot input are required")
        anatomy = checked_runtime_anatomy(model)
        capture = model["capture"]
        if capture["socket"] != "wordCaptureSocket" or capture["radius"] != CAPTURE_RADIUS or capture["depthRadius"] != .24:
            raise ValueError("The visible receiver and actual motor collision contract disagree")
        model_file = checked_runtime(root, model, hash_key="sha256")
        if model_file.stat().st_size != model["bytes"] or model["bytes"] > 6 * 1024 * 1024:
            raise ValueError("The actual model delivery exceeds its existing library budget")
        flight_path = source / "flight-actions-v1" / world / "delivery.json"
        flight = json.loads(flight_path.read_text())
        registration_path = source / 'flight-actions-v1' / world / 'registration.json'
        registration = json.loads(registration_path.read_text())
        for bank in flight.values():
            if isinstance(bank, dict) and bank.get('registrationSha256'):
                if digest(registration_path) != bank['registrationSha256']:
                    raise ValueError('The delivered action registration changed')
        checked_flight(root, world, flight, registration)
        venue_path = source / "space-venues" / (world + "-delivery-v1.json")
        venue = json.loads(venue_path.read_text())
        if venue.get('world') != world or venue.get('containsGameplay') is not False:
            raise ValueError('This world requires its actual retained empty scenery')
        for key in ["primary", "independent", "embedded"]:
            value = venue[key]
            path = checked_runtime(root, value, url_key="fileRuntime" if key == "embedded" else "runtime")
            if (digest(root/value['source']) != value['sourceSha256'] or path.stat().st_size != value['runtimeBytes']
                    or value['decodedBaseBytes'] != value['width']*value['height']*4):
                raise ValueError('The retained scenery source or actual delivery budget changed')
            if key == 'embedded':
                checked_inline(root, value)
        route, route_proof = checked_runtime_route(root, world)
        if route_proof['maximumDecodedBaseBytes'] > 8*1024*1024:
            raise ValueError('The selected route atlas decoded budget changed')
        records[world] = {"url": model["runtime"], "sha256": model["sha256"], "modelBytes": model["bytes"],
                          "capture": capture, "flight": {key: flight[key] for key in ["primary", "independentIdle", "emergency"]},
                          "venue": {key: venue[key] for key in ["primary", "independent", "embedded"]},
                          "route": route, **anatomy,
                          "identity": spec["identity"], "character": spec["characterId"], "ship": spec["ship"]}
        records[world]["contacts"] = {name: {"sourcePoint": point,
                                      "bone": ("hand." if name.endswith("Grip") else "foot.") + ("L" if name.startswith("left") else "R"),
                                      "support": name + "Socket" if name.endswith("Grip") else name.replace("Sole", "FootDock")}
                                    for name, point in model["contacts"].items()}
        # Inline art is carried by the selected lazy module or its identical
        # explicit-retry packet. The source manifest records file hashes/cost,
        # without another base64 copy as provenance.
        manifest_worlds[world] = {"model": model, "flight": {key: {**flight[key],
                                    "runtime": flight[key].get("fileRuntime", flight[key]["runtime"])}
                                    for key in ["primary", "independentIdle", "emergency"]},
                                 "venue": {key: {**venue[key], "runtime": venue[key].get("fileRuntime", venue[key]["runtime"])}
                                           for key in ["primary", "independent", "embedded"]},
                                 "route": {**route_proof, 'registration': route_proof['registration'],
                                           'delivery': route_proof['delivery']},
                                 "inputRecords": [{"path": str(path.relative_to(root)), "sha256": digest(path)}
                                                  for path in [model_path, flight_path, registration_path, venue_path]],
                                 "runtimeDeliveryBytes": model["bytes"] + sum(flight[key]["runtimeBytes"]
                                     for key in ["primary", "independentIdle", "emergency"])
                                     + sum(venue[key]["runtimeBytes"] for key in ["primary", "independent", "embedded"]),
                                 "decodedAtlasFileBankBytes": sum(flight[key]["decodedBaseBytes"] for key in ["primary", "independentIdle", "emergency"]),
                                 "maximumSelectedActionImageBytes": max(flight[key]['decodedBaseBytes'] for key in ('primary', 'independentIdle', 'emergency')),
                                 "maximumSelectedSkyImageBytes": max(venue[key]['decodedBaseBytes'] for key in ('primary', 'independent', 'embedded')),
                                 "inlineBytes": flight["emergency"]["inlineBytes"] + venue["embedded"]["inlineBytes"] + route_proof['inlineBytes'],
                                 'nativeDecodedOwners': 'UNKNOWN; file budgets are not measured live ownership'}
    return records, manifest_worlds


def compiled_outputs(root):
    # Validate the whole bank before preparing any output. Failure leaves all
    # existing generated files/manifests untouched.
    records, manifest_worlds = compile_records(root, list(WORLDS))
    output_dir = 'src/components/learn/games/games/'
    outputs, lazy_rows, recovery_rows = {}, [], []
    for world, record in records.items():
        path = output_dir + 'rocketRunCraftData-' + world + '.js'
        data = ('// Generated from this one complete original world delivery.\n'
                # Preserve the original JSON's IEEE values without emitting
                # decimal literals whose printed precision exceeds JavaScript.
                'export const ROCKET_RUN_CRAFT_WORLD = JSON.parse(' +
                json.dumps(json.dumps(record, separators=(',', ':'))) + ');\n')
        outputs[path] = data
        manifest_worlds[world]['generatedRuntime'] = path
        manifest_worlds[world]['generatedRuntimeSha256'] = hashlib.sha256(data.encode()).hexdigest()
        lazy_rows.append("  '"+world+"': () => import('./rocketRunCraftData-"+world+".js'),")
        recovery = json.dumps(record, separators=(',', ':')) + '\n'
        recovery_path = 'public/game-assets/rocket-run/world-records/' + world + '-v2.json'
        recovery_runtime = '/' + recovery_path.removeprefix('public/')
        outputs[recovery_path] = recovery
        manifest_worlds[world]['metadataRecovery'] = {'runtime': recovery_runtime,
            'bytes': len(recovery.encode()), 'sha256': hashlib.sha256(recovery.encode()).hexdigest(),
            'policy': 'Only after a genuine selected-world import failure and explicit Reload'}
        recovery_rows.append("  '"+world+"': { runtime: '"+recovery_runtime+"', bytes: "+str(len(recovery.encode()))+" },")
    registry = ('// Generated complete-world registry. Unselected art is not imported.\n'
                "import { createRocketWorldRecordDelivery } from './rocketRunWorldRecordDelivery.js';\n"
                'const loadWorld = {\n' + '\n'.join(lazy_rows) + '\n};\n'
                'const recoveryPackets = {\n' + '\n'.join(recovery_rows) + '\n};\n'
                'export const loadRocketRunCraft = createRocketWorldRecordDelivery(loadWorld, recoveryPackets);\n')
    registry_path = output_dir + 'rocketRunCraftData.js'
    outputs[registry_path] = registry
    manifest = {"game": "rocket-run", "version": "rocket-run-v2", "creator": "LiteracyGuide original spacecraft and flight performance",
                "status": "DELIVERED source records only; native complete game and visual review remain pending",
                "generatedRuntime": registry_path, "generatedRuntimeSha256": hashlib.sha256(registry.encode()).hexdigest(),
                "worlds": manifest_worlds, "completeWorldBank": True,
                "nativeContactReview": "UNKNOWN", "humanListening": "UNKNOWN", "physicalIpad": "UNKNOWN",
                "rights": "Original owned art and derivative of retained original canonical Pals; no external model or paid service"}
    # Native proof binds the actual reviewed leaf and delivery inputs. A later
    # source change retains that proof as history rather than inheriting a pass.
    proof_path = root / 'source-art/arcade/rocket-run/native-owner-verification-v2.json'
    if proof_path.exists():
        proof = json.loads(proof_path.read_text())
        source_match = all((root / row['path']).exists()
            and hashlib.sha256((root / row['path']).read_bytes()).hexdigest() == row['sha256']
            for row in proof['reviewedInputSources'])
        manifest['ownerNativeVerification'] = {'source': str(proof_path.relative_to(root)),
            'sha256': hashlib.sha256(proof_path.read_bytes()).hexdigest(),
            'reviewedInputsMatch': source_match, 'status': proof['status'] if source_match else 'HISTORICAL; source changed'}
        if source_match:
            manifest['status'] = 'DELIVERED complete source bank; owner native verified; Root integration and release pending'
            manifest['nativeContactReview'] = proof['nativeContactReview']
            for world in manifest_worlds.values():
                world['nativeDecodedOwners'] = proof['decodedOwners']
    outputs['source-art/arcade/rocket-run/scene-kit-v1.json'] = json.dumps(manifest, indent=2) + '\n'
    return outputs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--world", choices=["all"], default="all")
    args = parser.parse_args()
    root = args.root.resolve()
    outputs = compiled_outputs(root)
    for relative, data in outputs.items():
        (root/relative).parent.mkdir(parents=True, exist_ok=True)
        (root/relative).write_text(data)
    print(json.dumps({'worlds': list(WORLDS), 'generatedPaths': list(outputs),
                      'bytes': sum(len(value.encode()) for value in outputs.values()),
                      'nativeAcceptance': 'UNKNOWN'}))


if __name__ == "__main__":
    main()
