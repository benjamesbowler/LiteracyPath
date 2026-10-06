"""Prepared runtime admission of actual source anatomy, with no I/O.

This adds no sampled animation/proxy. It carries registrations from the same
strict source record used by the actual exported-GLB gate into the live owner.
The frozen compiler will consume it only after complete-bank admission.
"""
import copy
import math

from rocket_flight_spec import CONTACT_TOLERANCE, LEFT_RELEASE_START, LEFT_RELEASE_END, CLIPS


def checked_runtime_anatomy(model):
    source = model.get('actualSourceSubframes') or {}
    shoulders = model.get('shoulderAttachmentObservations') or {}
    if (source.get('threshold') != CONTACT_TOLERANCE or source.get('sampledPoses', 0) <= 0
            or source.get('supportedContacts', 0) <= 0 or source.get('jointSamples', 0) <= 0
            or shoulders.get('samples', 0) <= 0 or set(source.get('clips', {})) != set(CLIPS)
            or set(shoulders.get('clips', {})) != set(CLIPS)):
        raise ValueError('All seven actual source-subframe/shoulder gates are required')
    for value in (source.get('maximumContactSeparation'), source.get('maximumJointSeparation'),
                  shoulders.get('maximumSeparation'), shoulders.get('releasedWaveMaximum')):
        if not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= CONTACT_TOLERANCE:
            raise ValueError('Actual source anatomical attachment did not satisfy its existing gate')
    for clip in CLIPS:
        motion = source['clips'][clip]
        shoulder = shoulders['clips'][clip]
        if motion.get('poses', 0) <= 0 or shoulder.get('samples', 0) <= 0:
            raise ValueError('Every original clip requires real source subframe/shoulder samples')
        for value in (motion.get('maximumContactSeparation'), motion.get('maximumJointSeparation'),
                      shoulder.get('maximumSeparation')):
            if not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= CONTACT_TOLERANCE:
                raise ValueError('An individual original clip did not pass anatomical attachment')
    pairs = model.get('jointEndpoints') or {}
    torso = model.get('torsoAttachmentPairs') or {}
    if len(pairs) != 8 or len(torso) != 2:
        raise ValueError('All eight joins and both original shoulder surfaces are required')
    for side in ('L', 'R'):
        for name, start, end in (('Wrist', 'forearm', 'hand'), ('Elbow', 'upperarm', 'forearm'),
                                 ('Ankle', 'shin', 'foot'), ('Knee', 'thigh', 'shin')):
            value = pairs.get(side.lower()+name) or {}
            if value.get('fromBone') != start+'.'+side or value.get('toBone') != end+'.'+side:
                raise ValueError('An original anatomical pair changed')
        value = torso.get(side.lower()+'Shoulder') or {}
        if value.get('fromBone') != 'upperarm.'+side or value.get('toBone') != 'chest':
            raise ValueError('An original shoulder/torso attachment changed')
    for value in list(pairs.values())+list(torso.values()):
        for key in ('fromSourcePoint', 'toSourcePoint'):
            point = value.get(key)
            if (not isinstance(point, list) or len(point) != 3
                    or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in point)):
                raise ValueError('An actual registered source surface point is missing')
    release = model.get('release') or {}
    if (release.get('clip') != 'celebrate' or release.get('contact') != 'leftGrip'
            or release.get('startPhase') != LEFT_RELEASE_START or release.get('endPhase') != LEFT_RELEASE_END):
        raise ValueError('The actual continuous left-palm release envelope changed')
    return copy.deepcopy({key: model[key] for key in
        ('actualSourceSubframes', 'shoulderAttachmentObservations', 'jointEndpoints', 'torsoAttachmentPairs', 'release')})
