#!/usr/bin/env python3
"""Validate a single-source CFR rough cut and retime word captions; never render.

Python standard library only. Reads one JSON file and writes JSON to stdout.
All intervals are integer frames, start-inclusive/end-exclusive, in one timebase.
See ../EDIT_PLAN.md for the intentionally narrow contract.
"""

import argparse
import hashlib
import json
import sys
from fractions import Fraction
from pathlib import Path


class PlanError(ValueError):
    """Invalid or unsupported edit plan."""


def require(condition, message):
    if not condition:
        raise PlanError(message)


def fields(value, required, where):
    require(isinstance(value, dict), f"{where}: expected an object")
    require(set(value) == set(required),
            f"{where}: expected exactly these fields: {', '.join(required)}")


def integer(value, where, minimum=0):
    require(type(value) is int and value >= minimum,
            f"{where}: expected integer >= {minimum}")
    return value


def text(value, where):
    require(isinstance(value, str) and bool(value.strip()),
            f"{where}: expected nonempty text")
    return value


def interval(item, where, limit):
    start = integer(item['source_in'], f"{where}.source_in")
    end = integer(item['source_out'], f"{where}.source_out", 1)
    require(start < end <= limit,
            f"{where}: require 0 <= source_in < source_out <= source frames")
    return start, end


def unique_ids(items, where):
    require(isinstance(items, list), f"{where}: expected an array")
    seen = set()
    for i, item in enumerate(items):
        require(isinstance(item, dict), f"{where}[{i}]: expected an object")
        identity = text(item.get('id'), f"{where}[{i}].id")
        require(identity not in seen, f"{where}: duplicate id {identity!r}")
        seen.add(identity)


def compile_plan(plan):
    fields(plan, ['version', 'fps', 'source', 'segments', 'words'], 'plan')
    require(type(plan['version']) is int and plan['version'] == 1,
            'plan.version: only integer version 1 is supported')
    fields(plan['fps'], ['num', 'den'], 'fps')
    numerator = integer(plan['fps']['num'], 'fps.num', 1)
    denominator = integer(plan['fps']['den'], 'fps.den', 1)
    fps = Fraction(numerator, denominator)
    fields(plan['source'], ['id', 'path', 'sha256', 'frames', 'rights', 'timing'], 'source')
    source = plan['source']
    text(source['id'], 'source.id')
    text(source['path'], 'source.path')
    # Paths are provenance labels only: never opened or passed to a shell.
    require(source['timing'] == 'cfr', 'source.timing: normalize VFR before planning')
    require(isinstance(source['rights'], str) and source['rights'] in
            ('owned', 'licensed', 'unknown'), 'source.rights: owned, licensed, or unknown')
    digest = source['sha256']
    require(digest is None or (isinstance(digest, str) and len(digest) == 64 and
                             all(c in '0123456789abcdef' for c in digest)),
            'source.sha256: lowercase SHA-256 or null')
    limit = integer(source['frames'], 'source.frames', 1)
    segments, words = plan['segments'], plan['words']
    unique_ids(segments, 'segments')
    unique_ids(words, 'words')
    require(bool(segments), 'segments: at least one retained segment is required')

    timeline = []
    cursor = 0
    previous_end = 0
    for i, segment in enumerate(segments):
        where = f'segments[{i}]'
        fields(segment, ['id', 'source_in', 'source_out', 'reason'], where)
        text(segment['reason'], f'{where}.reason')
        start, end = interval(segment, where, limit)
        require(start >= previous_end,
                f'{where}: overlapping, repeated, or reordered source ranges unsupported')
        timeline.append({**segment, 'timeline_in': cursor,
                         'timeline_out': cursor + end - start})
        cursor += end - start
        previous_end = end

    captions, omitted = [], []
    previous_word_end = 0
    for i, word in enumerate(words):
        where = f'words[{i}]'
        fields(word, ['id', 'text', 'source_in', 'source_out'], where)
        text(word['text'], f'{where}.text')
        start, end = interval(word, where, limit)
        require(start >= previous_word_end,
                f'{where}: words must be source-ordered and nonoverlapping (one speaker)')
        previous_word_end = end
        matches = [s for s in timeline if start < s['source_out'] and end > s['source_in']]
        if not matches:
            omitted.append({**word, 'reason': 'outside retained source ranges'})
            continue
        require(len(matches) == 1 and matches[0]['source_in'] <= start and
                end <= matches[0]['source_out'],
                f'{where} ({word["id"]}): cut splits a spoken word; move/merge segment boundaries')
        segment = matches[0]
        offset = segment['timeline_in'] - segment['source_in']
        captions.append({**word, 'segment_id': segment['id'],
                         'timeline_in': start + offset, 'timeline_out': end + offset})

    warnings = [
        'Planning only: source media, declared rights, transcript accuracy and audio sync are not verified.',
        'No render adapter, audio mix, VFX, or visual QA has run.'
    ]
    if digest is None:
        warnings.append('Source SHA-256 is unknown; establish provenance before production.')
    if source['rights'] == 'unknown':
        warnings.append('Source rights are unknown; do not publish until cleared.')
    if not words:
        warnings.append('No word timings supplied; caption coverage is unknown.')
    elif not captions:
        warnings.append('No words survive the edit; review transcript and cut selection.')
    duration = Fraction(cursor, 1) / fps
    canonical = json.dumps(plan, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    return {
        'version': 1,
        'status': 'plan_valid_not_render_verified',
        'plan_sha256': hashlib.sha256(canonical.encode('utf-8')).hexdigest(),
        'source': dict(source),
        'fps': {'num': fps.numerator, 'den': fps.denominator},
        'duration_frames': cursor,
        'duration_seconds_exact': {'num': duration.numerator, 'den': duration.denominator},
        'segments': timeline,
        'captions': captions,
        'omitted_words': omitted,
        'warnings': warnings,
    }


def reject_constant(value):
    raise PlanError(f'Non-finite JSON number is not allowed: {value}')


def distinct_keys(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f'Duplicate JSON key: {key}')
        result[key] = value
    return result


def load_plan(path):
    return json.loads(Path(path).read_text(encoding='utf-8'),
                      parse_constant=reject_constant, object_pairs_hook=distinct_keys)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path, help='Local edit-plan JSON; never a media URL')
    args = parser.parse_args()
    try:
        result = compile_plan(load_plan(args.plan))
    except (PlanError, OSError, ValueError, RecursionError) as error:
        print(json.dumps({'status': 'invalid_plan', 'error': str(error)}), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, ensure_ascii=False, allow_nan=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
