module.exports = {
  name: 'temperature',
  baseUnit: 'K',
  units: {
    'C': {ratio: 1},
    'F': {ratio: 1},
    'K': {ratio: 1}
  },
  aliases: {
    'celsius': 'C',
    'fahrenheit': 'F',
    'kelvin': 'K'
  }
}
