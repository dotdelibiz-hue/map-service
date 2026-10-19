import { describe, expect, it } from 'vitest';
import { formatTime, splitSentences } from './useNarration';

describe('splitSentences', () => {
  it('日本語は句点ごとに分ける', () => {
    expect(splitSentences('姫路城は白い城です。天守は国宝です！見に行こう？')).toEqual([
      '姫路城は白い城です。',
      '天守は国宝です！',
      '見に行こう？',
    ]);
  });

  it('英語はピリオドと空白で分ける', () => {
    expect(splitSentences('Himeji Castle is white. It is a National Treasure.')).toEqual([
      'Himeji Castle is white.',
      'It is a National Treasure.',
    ]);
  });

  it('句点が無ければ全体を 1 文として扱う', () => {
    expect(splitSentences('句点なし')).toEqual(['句点なし']);
  });
});

describe('formatTime', () => {
  it('分:秒で表示', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(75.4)).toBe('1:15');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });
});
