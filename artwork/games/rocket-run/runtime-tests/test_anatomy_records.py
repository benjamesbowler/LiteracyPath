"""Prepared isolated runtime-metadata gates, outside frozen flight discovery."""
import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rocket_flight_spec import CLIPS, CONTACT_TOLERANCE, LEFT_RELEASE_START, LEFT_RELEASE_END  # noqa: E402
from rocket_runtime_anatomy import checked_runtime_anatomy  # noqa: E402


def record():
    model = {'actualSourceSubframes': {'threshold': CONTACT_TOLERANCE, 'sampledPoses': 1435,
             'supportedContacts': 5465, 'jointSamples': 11480, 'maximumContactSeparation': 3.7e-6,
             'maximumJointSeparation': 1.2e-6, 'clips': {clip: {'poses': 100,
                 'maximumContactSeparation': 3.7e-6, 'maximumJointSeparation': 1.2e-6} for clip in CLIPS}},
             'shoulderAttachmentObservations': {'samples': 3458, 'maximumSeparation': 7.7e-7,
               'releasedWaveMaximum': 6.2e-7, 'clips': {clip: {'samples': 200,
                   'maximumSeparation': 7.7e-7} for clip in CLIPS}},
             'jointEndpoints': {}, 'torsoAttachmentPairs': {},
             'release': {'clip': 'celebrate', 'contact': 'leftGrip',
                         'startPhase': LEFT_RELEASE_START, 'endPhase': LEFT_RELEASE_END}}
    for side in ('L', 'R'):
        for name, start, end in (('Wrist', 'forearm', 'hand'), ('Elbow', 'upperarm', 'forearm'),
                                 ('Ankle', 'shin', 'foot'), ('Knee', 'thigh', 'shin')):
            model['jointEndpoints'][side.lower()+name] = {'fromBone': start+'.'+side, 'toBone': end+'.'+side,
                'fromSourcePoint': [0, 0, 0], 'toSourcePoint': [0, 0, 0]}
        model['torsoAttachmentPairs'][side.lower()+'Shoulder'] = {'fromBone': 'upperarm.'+side, 'toBone': 'chest',
            'fromSourcePoint': [0, 0, 0], 'toSourcePoint': [0, 0, 0]}
    return model


class RuntimeAnatomyTests(unittest.TestCase):
    def test_actual_checked_registration_is_cloned_without_inventing_a_pose_or_tolerance(self):
        source = record()
        actual = checked_runtime_anatomy(source)
        self.assertEqual(actual, source)
        actual['jointEndpoints']['lWrist']['fromSourcePoint'][0] = 900
        self.assertEqual(source['jointEndpoints']['lWrist']['fromSourcePoint'], [0, 0, 0])

    def test_partial_drifted_source_and_wider_release_cannot_enter_the_runtime(self):
        for field, key, value in [('actualSourceSubframes', 'sampledPoses', 0),
                                  ('actualSourceSubframes', 'maximumJointSeparation', 1.1e-5),
                                  ('shoulderAttachmentObservations', 'maximumSeparation', float('nan')),
                                  ('release', 'startPhase', 0), ('release', 'contact', 'rightGrip')]:
            source = copy.deepcopy(record())
            source[field][key] = value
            with self.assertRaises(ValueError):
                checked_runtime_anatomy(source)

    def test_wrong_anatomical_pair_or_unregistered_surface_is_rejected(self):
        source = record()
        source['jointEndpoints']['lElbow']['toBone'] = 'hand.L'
        with self.assertRaises(ValueError):
            checked_runtime_anatomy(source)
        source = record()
        source['torsoAttachmentPairs']['rShoulder']['fromSourcePoint'] = [0, 0]
        with self.assertRaises(ValueError):
            checked_runtime_anatomy(source)
        source = record()
        source['actualSourceSubframes']['clips']['celebrate']['poses'] = 0
        with self.assertRaises(ValueError):
            checked_runtime_anatomy(source)


if __name__ == '__main__':
    unittest.main()
