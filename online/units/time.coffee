module.exports = {
  name: 'time',
  baseUnit: 's',
  units: {
    'ns': {ratio: 1e-9},
    'μs': {ratio: 1e-6},
    'ms': {ratio: 1e-3},
    's': {ratio: 1},
    'min': {ratio: 60},
    'hr': {ratio: 3600},
    'day': {ratio: 86400},
    'week': {ratio: 604800},
    'yr': {ratio: 31536000}
  },
  aliases: {
    'nanosecond': 'ns',
    'microsecond': 'μs',
    'millisecond': 'ms',
    'second': 's',
    'minute': 'min',
    'hour': 'hr',
    'day': 'day',
    'week': 'week',
    'year': 'yr'
  }
}
