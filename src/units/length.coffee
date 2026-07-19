module.exports = {
  name: 'length',
  baseUnit: 'm',
  units: {
    'mm': {ratio: 0.001},
    'cm': {ratio: 0.01},
    'dm': {ratio: 0.1},
    'm': {ratio: 1},
    'km': {ratio: 1000},
    'in': {ratio: 0.0254}, # 1 inch = 0.0254 meters
    'ft': {ratio: 0.3048}, # 1 foot = 0.3048 meters
    'yd': {ratio: 0.9144}, # 1 yard = 0.9144 meters
    'mi': {ratio: 1609.34}, # 1 mile = 1609.34 meters
    'nmi': {ratio: 1852} # 1 nautical mile = 1852 meters
  },
  aliases: {
    'millimeter': 'mm',
    'centimeter': 'cm',
    'decimeter': 'dm',
    'meter': 'm',
    'kilometer': 'km',
    'inch': 'in',
    'foot': 'ft',
    'yard': 'yd',
    'mile': 'mi',
    'nautical mile': 'nmi'
  }
}