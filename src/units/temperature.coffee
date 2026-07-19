module.exports = {
  name: 'temperature',
  baseUnit: 'K', # Kelvin is the SI base unit for temperature
  units: {
    'C': {ratio: 1}, # Celsius (relative to Kelvin)
    'F': {ratio: 1}, # Fahrenheit (relative to Kelvin)
    'K': {ratio: 1} # Kelvin
  },
  aliases: {
    'celsius': 'C',
    'fahrenheit': 'F',
    'kelvin': 'K'
  }
}
