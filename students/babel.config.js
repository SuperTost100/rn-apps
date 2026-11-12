module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '~': './src',
            assets: './assets',
          },
        },
      ],
      [
        'module:react-native-dotenv',
        // ENV_FILE picks another file, such as .env.test for test builds,
        // so the local .env does not leak into them
        { path: process.env.ENV_FILE || '.env' },
      ],
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
