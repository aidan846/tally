(function() {
  module.exports = {
    name: 'mass',
    baseUnit: 'g',
    units: {
      'mg': {
        ratio: 0.001
      },
      'g': {
        ratio: 1
      },
      'kg': {
        ratio: 1000
      },
      't': {
        ratio: 1e6
      },
      'oz': {
        ratio: 28.3495
      },
      'lb': {
        ratio: 453.592
      },
      'st': {
        ratio: 6350.29
      },
      'ton': {
        ratio: 907185
      }
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
  };

}).call(this);
