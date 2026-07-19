module.exports = {
  name: 'speed',
  baseUnit: 'm/s',
  units: {
    'm/s': {ratio: 1},
    'km/h': {ratio: 1000 / 3600}, # 1 km/h = 1000m / 3600s
    'mph': {ratio: 1609.34 / 3600}, # 1 mph = 1609.34m / 3600s
    'knot': {ratio: 1852 / 3600} # 1 nautical mile per hour = 1852m / 3600s
  },
  aliases: {
    'meters per second': 'm/s',
    'kilometers per hour': 'km/h',
    'miles per hour': 'mph',
    'knots': 'knot'
  }
}
