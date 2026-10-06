"""Original editable Moonwood rolling-fog source and one registered alpha render.

Run only within a granted heavy lease. This recipe authors a fused volumetric
bank plus tapered curling ribbons, rather than recolouring the old hazard.
The source is a visual motor-obstacle layer; it never defines collision,
literacy, a word label, a lane, a clock or a recovery rule.
"""
import bpy
import hashlib
import json
import math
import os
import sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = sys.argv[sys.argv.index('--') + 1]
OUT = os.path.join(ROOT, 'source-art/arcade/sound-racer-3d/moon-fog')
if '--out' in sys.argv:
    OUT = sys.argv[sys.argv.index('--out') + 1]
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.threads_mode = 'FIXED'
scene.render.threads = 2
scene.render.resolution_x = 512
scene.render.resolution_y = 256
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.world = bpy.data.worlds.new('Moonwood soft moonlight')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.18, .24, .42, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35

# One continuous editable field. Unequal overlapping rolls avoid the old
# separate polygonal balls and preserve a distinct low, obstructive silhouette.
field = bpy.data.metaballs.new('Rolling moon-fog sculpt field')
field.resolution = .045
field.render_resolution = .035
field.threshold = .68
core = bpy.data.objects.new('Fused rolling fog', field)
scene.collection.objects.link(core)
ROLLS = [
    (-.72, .02, -.20, .50), (-.34, -.06, .03, .62),
    (.14, .04, .11, .65), (.57, -.02, -.10, .55),
    (.86, .03, -.27, .37), (-.02, -.06, -.28, .58),
]
for x, y, z, radius in ROLLS:
    element = field.elements.new()
    element.co = (x, y, z)
    element.radius = radius
core['original_rolls'] = json.dumps(ROLLS)
bpy.context.view_layer.objects.active = core
core.select_set(True)
bpy.ops.object.convert(target='MESH')
core = bpy.context.object
for polygon in core.data.polygons:
    polygon.use_smooth = True

fog = bpy.data.materials.new('Original moon-blue turbulent mist')
fog.use_nodes = True
nodes = fog.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
volume = nodes.new('ShaderNodeVolumePrincipled')
volume.inputs['Color'].default_value = (.46, .54, .80, 1)
volume.inputs['Anisotropy'].default_value = .12
coordinate = nodes.new('ShaderNodeTexCoord')
noise = nodes.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value = 6.5
noise.inputs['Detail'].default_value = 3
noise.inputs['Roughness'].default_value = .58
range_node = nodes.new('ShaderNodeMapRange')
range_node.inputs['From Min'].default_value = .18
range_node.inputs['From Max'].default_value = .82
range_node.inputs['To Min'].default_value = .48
range_node.inputs['To Max'].default_value = 2.8
fog.node_tree.links.new(coordinate.outputs['Generated'], noise.inputs['Vector'])
fog.node_tree.links.new(noise.outputs['Fac'], range_node.inputs['Value'])
fog.node_tree.links.new(range_node.outputs['Result'], volume.inputs['Density'])
fog.node_tree.links.new(volume.outputs['Volume'], output.inputs['Volume'])
core.data.materials.append(fog)

# Original modelled pearl-lit ribbons show curling flow without letters or
# particles that could imply a target. Every radius tapers into the same bank.
ribbon = bpy.data.materials.new('Pearl lavender curling flow')
ribbon.use_nodes = True
shader = ribbon.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = (.63, .66, .90, 1)
shader.inputs['Roughness'].default_value = .82
shader.inputs['Alpha'].default_value = .58
for index, (cx, cy, cz, radius, winding) in enumerate([
    (-.47, -.24, .36, .23, 1.35), (.26, -.27, .47, .19, -1.25),
    (.65, -.18, .18, .16, 1.15), (-.87, -.08, -.07, .15, -1.1),
]):
    curve = bpy.data.curves.new('Editable rolling curl ' + str(index), 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = .023
    curve.bevel_resolution = 3
    spline = curve.splines.new('POLY')
    spline.points.add(47)
    for step, point in enumerate(spline.points):
        t = step / 47
        angle = t * math.pi * 2 * winding
        r = radius * (1 - .70 * t)
        point.co = (cx + math.cos(angle) * r, cy + .06 * math.sin(angle * .6),
                    cz + math.sin(angle) * r + .03 * t, 1)
        point.radius = math.sin(math.pi * t) * .7 + .08
    obj = bpy.data.objects.new('Moon fog curl ' + str(index), curve)
    scene.collection.objects.link(obj)
    obj.data.materials.append(ribbon)

for name, position, energy, size, color in [
    ('Lavender moon rim', (2.4, 1.4, 3.6), 185, 3, (.65, .71, 1.0)),
    ('Soft pearl front', (-2.3, -3.6, 2.6), 220, 4, (.83, .88, 1.0)),
]:
    bpy.ops.object.light_add(type='AREA', location=position)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.size = size
    light.data.color = color
    light.rotation_euler = (Vector((0, 0, .08)) - light.location).to_track_quat('-Z', 'Y').to_euler()

bpy.ops.object.camera_add(location=(0, -6, 1.15))
camera = bpy.context.object
camera.name = 'Registered fog-centre camera'
camera.rotation_euler = (Vector((0, 0, .04)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.4
scene.camera = camera
scene['visual_only_authority'] = 'Existing Sound Racer cloudbank motor collision remains in its controller.'
scene['render_source_owner'] = 'Original local editable fused-volume and tapered-curve recipe; no external service.'

editable = os.path.join(OUT, 'moon-fog-v1.blend')
png = os.path.join(OUT, 'moon-fog-v1.png')
scene.render.filepath = png
bpy.ops.wm.save_as_mainfile(filepath=editable)
bpy.ops.render.render(write_still=True)
image = bpy.data.images.load(png, check_existing=False)
rgba = list(image.pixels)
opaque = []
for y in range(256):
    for x in range(512):
        if rgba[(y * 512 + x) * 4 + 3] > 1 / 255:
            opaque.append((x, 255 - y))
assert opaque, 'A blank fog source cannot be admitted'
bounds = [min(p[0] for p in opaque), min(p[1] for p in opaque),
          max(p[0] for p in opaque) + 1, max(p[1] for p in opaque) + 1]
assert bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 512 and bounds[3] < 256, 'Full source contour must remain inside alpha margins'
anchor = world_to_camera_view(scene, camera, Vector((0, 0, 0)))
sha = lambda path: hashlib.sha256(open(path, 'rb').read()).hexdigest()
record = {
    'status': 'One original editable fog candidate; direct source and native acceptance pending',
    'kind': 'motor-obstacle', 'world': 'moonwood', 'source': os.path.relpath(png, ROOT),
    'sourceSha256': sha(png), 'sourceBytes': os.path.getsize(png),
    'editable': os.path.relpath(editable, ROOT), 'editableSha256': sha(editable),
    'recipe': os.path.relpath(__file__, ROOT), 'recipeSha256': sha(__file__),
    'dimensions': [512, 256], 'decodedRgbaBytes': 512 * 256 * 4,
    'opaqueBounds': bounds, 'registeredCentreWorld': [0, 0, 0],
    'registeredCentrePixel': [anchor.x * 512, (1 - anchor.y) * 256],
    'pixelsPerUnit': 512 / camera.data.ortho_scale,
    'camera': {'orthographicScale': camera.data.ortho_scale, 'position': list(camera.location)},
    'collisionAuthority': 'Existing lane/position/contact/shield/drag/recovery controller unchanged',
    'encodedRuntime': None, 'nativeAcceptance': False,
}
del rgba
bpy.data.images.remove(image)
open(os.path.join(OUT, 'moon-fog-v1.json'), 'w').write(json.dumps(record, indent=2) + '\n')
print(json.dumps(record))
