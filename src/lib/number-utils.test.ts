import { describe, expect, it } from 'vitest';

import { formatWeight, parsePositiveNumber, sanitizeDecimal, sanitizeInt } from './number-utils';

describe('sanitizeDecimal', () => {
  it('mantém números válidos', () => {
    expect(sanitizeDecimal('42')).toBe('42');
    expect(sanitizeDecimal('42,5')).toBe('42,5');
    expect(sanitizeDecimal('42.25')).toBe('42.25');
  });

  it('remove letras e símbolos', () => {
    expect(sanitizeDecimal('4a2kg')).toBe('42');
    expect(sanitizeDecimal('-10')).toBe('10');
  });

  it('aceita só um separador e no máximo 2 casas decimais', () => {
    expect(sanitizeDecimal('1,2,3')).toBe('1,23');
    expect(sanitizeDecimal('10.555')).toBe('10.55');
    expect(sanitizeDecimal('10,.5')).toBe('10,5');
  });

  it('limita a parte inteira a 4 dígitos (não estoura a célula)', () => {
    expect(sanitizeDecimal('123456')).toBe('1234');
    expect(sanitizeDecimal('123456,5')).toBe('1234,5');
  });

  it('permite separador no fim enquanto digita', () => {
    expect(sanitizeDecimal('42,')).toBe('42,');
    expect(sanitizeDecimal('')).toBe('');
  });
});

describe('sanitizeInt', () => {
  it('só dígitos, até 3', () => {
    expect(sanitizeInt('12')).toBe('12');
    expect(sanitizeInt('1a2b')).toBe('12');
    expect(sanitizeInt('12345')).toBe('123');
    expect(sanitizeInt('8.5')).toBe('85');
  });
});

describe('parsePositiveNumber', () => {
  it('converte vírgula e ponto', () => {
    expect(parsePositiveNumber('42,5')).toBe(42.5);
    expect(parsePositiveNumber('42.5')).toBe(42.5);
    expect(parsePositiveNumber('10')).toBe(10);
  });

  it('rejeita vazio, zero e lixo', () => {
    expect(parsePositiveNumber('')).toBeNull();
    expect(parsePositiveNumber('0')).toBeNull();
    expect(parsePositiveNumber(',')).toBeNull();
    expect(parsePositiveNumber('abc')).toBeNull();
  });
});

describe('formatWeight', () => {
  it('usa vírgula e remove zeros à toa', () => {
    expect(formatWeight(40)).toBe('40');
    expect(formatWeight(42.5)).toBe('42,5');
    expect(formatWeight(42.25)).toBe('42,25');
  });

  it('não deixa vírgula solta em valores quase inteiros', () => {
    expect(formatWeight(40.004)).toBe('40');
    expect(formatWeight(0.1 + 0.2)).toBe('0,3');
  });
});
