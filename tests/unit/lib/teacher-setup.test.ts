import { describe, it, expect } from 'vitest'
import { isInitialSetupComplete, getMissingSetupItems } from '@/lib/teacher-setup'

describe('isInitialSetupComplete', () => {
  it('returns true when all fields are set', () => {
    expect(
      isInitialSetupComplete(
        ['数学'],
        ['中学1年'],
        { display_name: '山田太郎', bio: '数学の講師です' }
      )
    ).toBe(true)
  })

  it('returns false when subjects are empty', () => {
    expect(
      isInitialSetupComplete(
        [],
        ['中学1年'],
        { display_name: '山田太郎', bio: '講師です' }
      )
    ).toBe(false)
  })

  it('returns false when grades are empty', () => {
    expect(
      isInitialSetupComplete(
        ['数学'],
        [],
        { display_name: '山田太郎', bio: '講師です' }
      )
    ).toBe(false)
  })

  it('returns false when display_name is missing', () => {
    expect(
      isInitialSetupComplete(
        ['数学'],
        ['中学1年'],
        { bio: '講師です' }
      )
    ).toBe(false)
  })

  it('returns false when bio is missing', () => {
    expect(
      isInitialSetupComplete(
        ['数学'],
        ['中学1年'],
        { display_name: '山田太郎' }
      )
    ).toBe(false)
  })

  it('returns false when display_name is whitespace only', () => {
    expect(
      isInitialSetupComplete(
        ['数学'],
        ['中学1年'],
        { display_name: '  ', bio: '講師です' }
      )
    ).toBe(false)
  })

  it('returns false when bio is whitespace only', () => {
    expect(
      isInitialSetupComplete(
        ['数学'],
        ['中学1年'],
        { display_name: '山田太郎', bio: '   ' }
      )
    ).toBe(false)
  })

  it('returns false when publicProfile is null-ish', () => {
    expect(isInitialSetupComplete(['数学'], ['中学1年'], {})).toBe(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isInitialSetupComplete(['数学'], ['中学1年'], null as unknown as Record<string, any>)).toBe(false)
  })

  it('returns false when subjects is not an array', () => {
    expect(
      isInitialSetupComplete(
        null as unknown as string[],
        ['中学1年'],
        { display_name: '山田太郎', bio: '講師です' }
      )
    ).toBe(false)
  })
})

describe('getMissingSetupItems', () => {
  it('returns empty array when all fields are set', () => {
    const missing = getMissingSetupItems(
      ['数学'],
      ['中学1年'],
      { display_name: '山田太郎', bio: '数学の講師です' }
    )
    expect(missing).toEqual([])
  })

  it('returns all keys when everything is missing', () => {
    const missing = getMissingSetupItems([], [], {})
    expect(missing).toEqual([
      'subjectsLabel',
      'gradesLabel',
      'displayNameLabel',
      'bioLabel',
    ])
  })

  it('returns only missing keys', () => {
    const missing = getMissingSetupItems(
      ['数学'],
      [],
      { display_name: '山田太郎', bio: '' }
    )
    expect(missing).toContain('gradesLabel')
    expect(missing).toContain('bioLabel')
    expect(missing).not.toContain('subjectsLabel')
    expect(missing).not.toContain('displayNameLabel')
  })

  it('handles multiple subjects and grades', () => {
    const missing = getMissingSetupItems(
      ['数学', '英語', '理科'],
      ['中学1年', '中学2年'],
      { display_name: 'テスト', bio: 'テスト bio' }
    )
    expect(missing).toEqual([])
  })
})
