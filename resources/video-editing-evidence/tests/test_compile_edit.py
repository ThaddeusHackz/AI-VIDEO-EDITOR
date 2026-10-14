"""Offline contract tests. No renderer, source media, package installs, or network."""

import copy
import importlib.util
import json
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / 'tools' / 'compile_edit.py'
SPEC = importlib.util.spec_from_file_location('compile_edit', TOOL)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class EditPlanTests(unittest.TestCase):
    def setUp(self):
        self.plan = MODULE.load_plan(ROOT / 'examples' / 'talking-head.plan.json')

    def invalid(self, plan, fragment):
        with self.assertRaisesRegex(MODULE.PlanError, fragment):
            MODULE.compile_plan(plan)

    def test_example_duration_and_retiming(self):
        result = MODULE.compile_plan(self.plan)
        self.assertEqual(result['duration_frames'], 240)
        self.assertEqual(result['duration_seconds_exact'], {'num': 8, 'den': 1})
        self.assertEqual(result['captions'][0]['timeline_in'], 5)
        self.assertEqual(result['captions'][4]['timeline_in'], 125)
        self.assertEqual([w['id'] for w in result['omitted_words']], ['w0', 'w5'])
        self.assertEqual(result['status'], 'plan_valid_not_render_verified')

    def test_deterministic_and_no_input_mutation(self):
        before = copy.deepcopy(self.plan)
        a = MODULE.compile_plan(self.plan)
        b = MODULE.compile_plan(self.plan)
        self.assertEqual(a, b)
        self.assertEqual(before, self.plan)

    def test_fractional_fps_no_float_drift(self):
        self.plan['fps'] = {'num': 30000, 'den': 1001}
        result = MODULE.compile_plan(self.plan)
        self.assertEqual(result['duration_seconds_exact'], {'num': 1001, 'den': 125})

    def test_half_open_boundaries(self):
        self.plan['words'] = [
            {'id': 'a', 'text': 'left', 'source_in': 20, 'source_out': 30},
            {'id': 'b', 'text': 'inside', 'source_in': 30, 'source_out': 150},
            {'id': 'c', 'text': 'right', 'source_in': 150, 'source_out': 160},
        ]
        result = MODULE.compile_plan(self.plan)
        self.assertEqual([w['id'] for w in result['captions']], ['b'])
        self.assertEqual([w['id'] for w in result['omitted_words']], ['a', 'c'])

    def test_split_word_rejected_at_each_cut_edge(self):
        for start, end in [(20, 40), (140, 160), (140, 220)]:
            with self.subTest(start=start):
                self.plan['words'] = [{'id': 'w', 'text': 'word', 'source_in': start, 'source_out': end}]
                self.invalid(self.plan, 'splits a spoken word')

    def test_adjacent_segments_do_not_duplicate_word(self):
        self.plan['segments'] = [
            {'id': 'a', 'source_in': 0, 'source_out': 150, 'reason': 'a'},
            {'id': 'b', 'source_in': 150, 'source_out': 330, 'reason': 'b'},
        ]
        result = MODULE.compile_plan(self.plan)
        self.assertEqual(len(result['captions']), len(self.plan['words']))

    def test_word_spanning_adjacent_segments_requires_merge(self):
        self.plan['segments'][1]['source_in'] = 150
        self.plan['words'] = [{'id': 'w', 'text': 'word', 'source_in': 140, 'source_out': 160}]
        self.invalid(self.plan, 'move/merge')

    def test_overlap_and_reorder_rejected(self):
        for start in [0, 100, 149]:
            with self.subTest(start=start):
                self.plan['segments'][1]['source_in'] = start
                self.invalid(self.plan, 'overlapping, repeated, or reordered')

    def test_bad_ranges(self):
        for start, end in [(-1, 20), (30, 30), (30, 361), (30, 0), (30, 20)]:
            with self.subTest(start=start, end=end):
                self.plan['segments'][0].update(source_in=start, source_out=end)
                self.invalid(self.plan, 'integer|require')

    def test_noninteger_frames_and_bad_fps(self):
        for value in [True, 1.5, '30', None]:
            with self.subTest(value=value):
                self.plan['segments'][0]['source_in'] = value
                self.invalid(self.plan, 'integer')
        for value in [0, -1, True, 1.5]:
            with self.subTest(fps=value):
                fresh = copy.deepcopy(self.plan)
                fresh['fps']['num'] = value
                self.invalid(fresh, 'fps.num')
        self.plan['fps']['den'] = 0
        self.invalid(self.plan, 'fps.den')

    def test_duplicate_ids(self):
        for key in ['words', 'segments']:
            with self.subTest(key=key):
                fresh = copy.deepcopy(self.plan)
                fresh[key][1]['id'] = fresh[key][0]['id']
                self.invalid(fresh, 'duplicate id')

    def test_words_must_be_ordered_nonoverlapping(self):
        self.plan['words'][2]['source_in'] = 40
        self.invalid(self.plan, 'source-ordered')

    def test_empty_words_allowed_but_flagged(self):
        self.plan['words'] = []
        result = MODULE.compile_plan(self.plan)
        self.assertTrue(any('coverage is unknown' in w for w in result['warnings']))

    def test_no_retained_words_flagged(self):
        self.plan['words'] = self.plan['words'][:1]
        result = MODULE.compile_plan(self.plan)
        self.assertTrue(any('No words survive' in w for w in result['warnings']))

    def test_unknown_or_missing_fields_fail_closed(self):
        self.plan['segments'][0]['speed'] = 2
        self.invalid(self.plan, 'exactly these fields')
        del self.plan['segments'][0]['speed']
        del self.plan['fps']
        self.invalid(self.plan, 'exactly these fields')

    def test_vfr_rights_hash_and_version(self):
        for field, value in [('timing', 'vfr'), ('sha256', 'bad'), ('rights', 'public')]:
            with self.subTest(field=field):
                fresh = copy.deepcopy(self.plan)
                fresh['source'][field] = value
                self.invalid(fresh, 'source.' + field)
        self.plan['version'] = True
        self.invalid(self.plan, 'version')

    def test_missing_segments(self):
        self.plan['segments'] = []
        self.invalid(self.plan, 'at least one')

    def test_malformed_types(self):
        for candidate in [[], None, {'version': 1}]:
            with self.subTest(candidate=candidate):
                self.invalid(candidate, 'plan:')
        self.plan['words'] = 'not an array'
        self.invalid(self.plan, 'expected an array')

    def test_plan_digest_changes_with_edit(self):
        a = MODULE.compile_plan(self.plan)['plan_sha256']
        self.plan['segments'][0]['reason'] = 'Different rationale'
        self.assertNotEqual(a, MODULE.compile_plan(self.plan)['plan_sha256'])

    def test_random_timeline_mapping_invariants(self):
        rng = random.Random(42)
        for _ in range(100):
            start, output = 0, 0
            segments, words = [], []
            for i in range(8):
                start += rng.randrange(1, 20)
                length = rng.randrange(3, 40)
                segments.append({'id': str(i), 'source_in': start, 'source_out': start + length, 'reason': 'test'})
                words.append({'id': str(i), 'text': 'test', 'source_in': start, 'source_out': start + length})
                start += length
                output += length
            self.plan['source']['frames'] = start
            self.plan['segments'], self.plan['words'] = segments, words
            result = MODULE.compile_plan(self.plan)
            self.assertEqual(result['duration_frames'], output)
            cursor = 0
            for segment, word in zip(result['segments'], result['captions']):
                self.assertEqual(segment['timeline_in'], cursor)
                self.assertEqual(word['timeline_in'], cursor)
                cursor = segment['timeline_out']
                self.assertEqual(word['timeline_out'], cursor)

    def test_json_rejects_duplicate_keys_and_nonfinite_numbers(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'invalid.json'
            for content in ['{"version":1,"version":2}', '{"version":NaN}', '{"version":Infinity}']:
                with self.subTest(content=content):
                    path.write_text(content)
                    with self.assertRaises(MODULE.PlanError):
                        MODULE.load_plan(path)

    def test_cli_success_and_missing_file(self):
        result = subprocess.run([sys.executable, str(TOOL), str(ROOT / 'examples' / 'talking-head.plan.json')],
                                capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['duration_frames'], 240)
        with tempfile.TemporaryDirectory() as folder:
            result = subprocess.run([sys.executable, str(TOOL), str(Path(folder) / 'missing.json')],
                                    capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, '')
        self.assertEqual(json.loads(result.stderr)['status'], 'invalid_plan')

    def test_cli_malformed_json_fails_without_traceback(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'invalid.json'
            path.write_text('{broken')
            result = subprocess.run([sys.executable, str(TOOL), str(path)],
                                    capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, '')
        self.assertNotIn('Traceback', result.stderr)


if __name__ == '__main__':
    unittest.main()
