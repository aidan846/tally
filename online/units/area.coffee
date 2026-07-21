module.exports = {
  name: 'area',
  baseUnit: 'm2',
  units: {
    'mm2': {ratio: Math.pow(0.001, 2)},
    'cm2': {ratio: Math.pow(0.01, 2)},
    'm2': {ratio: 1},
    'km2': {ratio: Math.pow(1000, 2)},
    'in2': {ratio: Math.pow(0.0254, 2)},
    'ft2': {ratio: Math.pow(0.3048, 2)},
    'yd2': {ratio: Math.pow(0.9144, 2)},
    'mi2': {ratio: Math.pow(1609.34, 2)},
    'ac': {ratio: 4046.86},
    'ha': {ratio: 10000}
  },
  aliases: {
    'square millimeter': 'mm2',
    'square centimeter': 'cm2',
    'square meter': 'm2',
    'square kilometer': 'km2',
    'square inch': 'in2',
    'square foot': 'ft2',
    'square yard': 'yd2',
    'square mile': 'mi2',
    'acre': 'ac',
    'hectare': 'ha'
  }
}
