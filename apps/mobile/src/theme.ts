import { useColorScheme } from 'react-native';

// Same palette as the a12.uz web app (teal and blue from the A12 mark), plus a dark variant
const light = {
  ink: '#0b1726',
  paper: '#fbfcfa',
  body: '#3b4756',
  muted: '#5d6877',
  line: 'rgba(11,23,38,0.14)',
  accent: '#2b62ff',
  wash: '#f1f4f3',
  scrim: 'rgba(5,12,24,0.55)',
  onInk: '#ffffff',
};

export type Palette = typeof light;

const dark: Palette = {
  ink: '#eef3f8',
  paper: '#0c121a',
  body: '#c9d3de',
  muted: '#93a0ae',
  line: 'rgba(238,243,248,0.14)',
  accent: '#5fd3c4',
  wash: '#151d27',
  scrim: 'rgba(0,0,0,0.6)',
  onInk: '#0c121a',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
