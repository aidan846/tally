(function() {
  module.exports = {
    name: 'volume',
    baseUnit: 'l',
    units: {
      'ml': {
        ratio: 0.001
      },
      'cl': {
        ratio: 0.01
      },
      'dl': {
        ratio: 0.1
      },
      'l': {
        ratio: 1
      },
      'kl': {
        ratio: 1000
      },
      'tsp': {
        ratio: 0.00492892
      },
      'tbsp': {
        ratio: 0.0147868
      },
      'cup': {
        ratio: 0.236588
      },
      'pt': {
        ratio: 0.473176
      },
      'qt': {
        ratio: 0.946353
      },
      'gal': {
        ratio: 3.78541
      }
    },
    aliases: {
      'milliliter': 'ml',
      'centiliter': 'cl',
      'deciliter': 'dl',
      'liter': 'l',
      'kiloliter': 'kl',
      'teaspoon': 'tsp',
      'tablespoon': 'tbsp',
      'cup': 'cup',
      'pint': 'pt',
      'quart': 'qt',
      'gallon': 'gal'
    }
  };

}).call(this);
