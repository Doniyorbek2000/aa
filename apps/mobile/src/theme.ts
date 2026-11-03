import { useColorScheme } from 'react-native';

// Same palette as the a12.uz web app, plus a dark variant that keeps the ink/paper contrast
const light = {
  ink: '#170404',
  paper: '#fffffc',
  body: '#4a3535',
  muted: '#6b5555',
  line: 'rgba(23,4,4,0.16)',
  accent: '#c65a92',
  wash: '#faf7f8',
  scrim: 'rgba(6,5,3,0.55)',
  onInk: '#fffffc',
};

export type Palette = typeof light;

const dark: Palette = {
  ink: '#f7eef2',
  paper: '#140f10',
  body: '#d9c8cf',
  muted: '#a8939b',
  line: 'rgba(247,238,242,0.16)',
  accent: '#f0a8cd',
  wash: '#1d1618',
  scrim: 'rgba(0,0,0,0.6)',
  onInk: '#140f10',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
