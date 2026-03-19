/**
 * Converts a TND amount into French words.
 * E.g. 1234.567 → "Mille deux cent trente quatre dinars et cinq cent soixante sept millimes"
 */

const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante',
  'soixante', 'quatre-vingt', 'quatre-vingt'];

function belowHundred(n: number): string {
  if (n < 20) return units[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7) {
    // 70-79 → soixante + dix à dix-neuf
    return 'soixante-' + units[10 + u];
  }
  if (t === 9) {
    // 90-99 → quatre-vingt + dix à dix-neuf
    return 'quatre-vingt-' + units[10 + u];
  }
  if (u === 0) {
    return tens[t] + (t === 8 ? 's' : '');
  }
  const liaison = (t === 8) ? '-' : (u === 1 ? ' et ' : '-');
  return tens[t] + liaison + units[u];
}

function belowThousand(n: number): string {
  if (n === 0) return '';
  if (n < 100) return belowHundred(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let result = '';
  if (hundreds === 1) {
    result = 'cent';
  } else {
    result = units[hundreds] + ' cent' + (rest === 0 ? 's' : '');
  }
  if (rest > 0) result += ' ' + belowHundred(rest);
  return result;
}

function convertInteger(n: number): string {
  if (n === 0) return 'zéro';

  const groups: number[] = [];
  let temp = n;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const groupNames = ['', 'mille', 'million', 'milliard'];
  const parts: string[] = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const name = groupNames[i];
    if (i === 1 && g === 1) {
      // "mille" not "un mille"
      parts.push('mille');
    } else {
      parts.push(belowThousand(g) + (name ? ' ' + name : ''));
    }
  }

  return parts.join(' ');
}

export function numberToWordsTND(amount: number): string {
  const rounded = Math.round(amount * 1000) / 1000;
  const dinars = Math.floor(rounded);
  const millimesRaw = Math.round((rounded - dinars) * 1000);
  const millimes = Math.min(millimesRaw, 999);

  const dinarWords = convertInteger(dinars);
  const dinarLabel = dinars === 1 ? 'dinar' : 'dinars';

  let result = capitalize(dinarWords) + ' ' + dinarLabel;

  if (millimes > 0) {
    const millimeWords = convertInteger(millimes);
    const millimeLabel = millimes === 1 ? 'millime' : 'millimes';
    result += ' et ' + millimeWords + ' ' + millimeLabel;
  }

  return result;
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
