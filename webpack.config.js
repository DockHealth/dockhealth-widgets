// webpack.config.js
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    'dockhealth-widget-sdk': './src/sdk/index.js',
    'dockhealth-widget-sdk-internal': './src/sdk-internal/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimize: false
  }
}