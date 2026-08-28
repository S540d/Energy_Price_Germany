module.exports = function(api) {
  const isTest = api.env('test');
  api.cache.using(() => isTest);
  return {
    presets: ['babel-preset-expo'],
    // Jest runs on CommonJS: dynamic import() needs rewriting to require() there,
    // while Metro (web/native builds) keeps native import() for platform code splitting.
    plugins: [
      'react-native-reanimated/plugin',
      ...(isTest ? ['babel-plugin-dynamic-import-node'] : []),
    ],
  };
};
