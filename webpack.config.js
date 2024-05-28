const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { LimitChunkCountPlugin } = require("webpack").optimize;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const ASSETS_PATH = process.env.ASSETS_PATH || "./";

module.exports = {
  mode: "production",
  entry: {
    button: "./button.js",
  },
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: ASSETS_PATH,
    filename: "[name].[contenthash].js",
  },
  module: {
    noParse: /webcomponents/,
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/,
        type: "asset/resource",
        generator: {
          filename: "[name].[hash:8][ext]",
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "index.html",
      inject: "head",
      minify: false,
    }),
  ],
};
