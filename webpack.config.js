// webpack.config.js
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = env => {
  return {
    context: __dirname,
    entry: './src/index.js',
    optimization: {
      minimize: false
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    },
    plugins: [
      new HtmlWebpackPlugin(),
      new webpack.DefinePlugin({
        __BUNDLE__: env.WEBPACK_BUILD === "true"
      })
    ]
  };
};