export default {
    name: 'data',
    baseUnit: 'bit',
    units: {
      'bit': {
        ratio: 1
      },
      'b': {
        ratio: 1
      },
      'B': {
        ratio: 8
      },
      'kb': {
        ratio: Math.pow(2, 10)
      },
      'kB': {
        ratio: Math.pow(2, 10) * 8
      },
      'mb': {
        ratio: Math.pow(2, 20)
      },
      'MB': {
        ratio: Math.pow(2, 20) * 8
      },
      'gb': {
        ratio: Math.pow(2, 30)
      },
      'gB': {
        ratio: Math.pow(2, 30) * 8
      },
      'tb': {
        ratio: Math.pow(2, 40)
      },
      'tB': {
        ratio: Math.pow(2, 40) * 8
      }
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
  };
