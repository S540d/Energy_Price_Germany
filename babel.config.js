module.exports = function(api) {
  api.cache(true);

  // For Jest testing environment - use babel-preset-expo which properly handles Flow types
  if (process.env.NODE_ENV === 'test') {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  // For Expo runtime
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-flow',
      '@babel/preset-typescript',
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  };
};
