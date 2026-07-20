(function() {
  module.exports = {
    name: 'length',
    baseUnit: 'm',
    units: {
      'mm': {
        ratio: 0.001
      },
      'cm': {
        ratio: 0.01
      },
      'dm': {
        ratio: 0.1
      },
      'm': {
        ratio: 1
      },
      'km': {
        ratio: 1000
      },
      'in': {
        ratio: 0.0254
      },
      'ft': {
        ratio: 0.3048
      },
      'yd': {
        ratio: 0.9144
      },
      'mi': {
        ratio: 1609.34
      },
      'nmi': {
        ratio: 1852
      }
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
  };

}).call(this);
