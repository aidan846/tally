module.exports = {
  name: 'mass',
  baseUnit: 'g',
  units: {
    'mg': {ratio: 0.001},
    'g': {ratio: 1},
    'kg': {ratio: 1000},
    't': {ratio: 1e6}, # metric ton
    'oz': {ratio: 28.3495}, # 1 ounce = 28.3495 grams
    'lb': {ratio: 453.592}, # 1 pound = 453.592 grams
    'st': {ratio: 6350.29}, # 1 stone = 6350.29 grams
    'ton': {ratio: 907185} # US short ton
  },
  aliases: {
    'milligram': 'mg',
    'gram': 'g',
    'kilogram': 'kg',
    'tonne': 't',
    'ounce': 'oz',
    'pound': 'lb',
    'stone': 'st',
    'short ton': 'ton'
  }
}
