module.exports = {
  name: 'data',
  baseUnit: 'bit',
  units: {
    'bit': {ratio: 1},
    'b': {ratio: 1}, # bit
    'B': {ratio: 8}, # Byte
    'kb': {ratio: Math.pow(2,10)}, # kilobit
    'kB': {ratio: Math.pow(2,10)*8}, # kilobyte
    'mb': {ratio: Math.pow(2,20)}, # megabit
    'MB': {ratio: Math.pow(2,20)*8}, # megabyte
    'gb': {ratio: Math.pow(2,30)}, # gigabit
    'gB': {ratio: Math.pow(2,30)*8}, # gigabyte
    'tb': {ratio: Math.pow(2,40)}, # terabit
    'tB': {ratio: Math.pow(2,40)*8} # terabyte
  },
  aliases: {
    'bits': 'bit',
    'byte': 'B',
    'kilobit': 'kb',
    'kilobyte': 'kB',
    'megabit': 'mb',
    'megabyte': 'MB',
    'gigabit': 'gb',
    'gigabyte': 'gB',
    'terabit': 'tb',
    'terabyte': 'tB'
  }
}
