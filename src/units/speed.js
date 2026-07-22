export default {
    name: 'speed',
    baseUnit: 'm/s',
    units: {
      'm/s': {
        ratio: 1
      },
      'km/h': {
        ratio: 1000 / 3600
      },
      'mph': {
        ratio: 1609.34 / 3600
      },
      'knot': {
        ratio: 1852 / 3600
      }
    },
    aliases: {
      'meters per second': 'm/s',
      'kilometers per hour': 'km/h',
      'miles per hour': 'mph',
      'knots': 'knot'
    }
  };
