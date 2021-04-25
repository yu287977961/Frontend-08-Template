const webpack = require('webpack'); 
const CopyPlugin = require('copy-webpack-plugin'); 
const VueLoaderPlugin = require('vue-loader/lib/plugin');
module.exports = {
  entry:"./src/main.js",
  mode:"production",
  module: {
    rules: [
      { test: /\.vue$/, use: 'vue-loader' },
      { test: /\.css$/, use: ['vue-style-loader','css-loader'] },
      {
        test:/\.js$/,
        ues:{
           loader:"babel-loader",
           options:{
              presets: ["@babel/preset-env"],
              plugins: [["@babel/plugin-transform-react-js"],{pragma:"createElement"}]
           }
        }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "src/*.html", to: "[name].[ext]" }
      ],
    }),
  ]
};