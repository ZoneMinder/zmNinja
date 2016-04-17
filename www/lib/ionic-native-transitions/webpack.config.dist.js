var path = require('path'),
    libPath = path.join(__dirname, 'lib'),
    distPath = path.join(__dirname, 'dist'),
    webpack = require("webpack"),
    pkg = require('./package.json'),
    fs = require('fs'),
    copyright = fs.readFileSync('./copyright.txt', 'utf8'),
    HtmlWebpackPlugin = require('html-webpack-plugin');

copyright = copyright.replace('{pkg.name}', pkg.name)
    .replace('{pkg.description}', pkg.description)
    .replace('{pkg.version}', pkg.version)
    .replace('{pkg.author}', pkg.author)
    .replace('{pkg.homepage}', pkg.homepage)
    .replace('{pkg.license}', pkg.license);

module.exports = {
    entry: path.join(libPath, 'index.js'),
    output: {
        path: distPath,
        library: 'ionicNativeTransitions',
        libraryTarget: "umd",
        umdNamedDefine: true,
        filename: 'ionic-native-transitions.js'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: "ng-annotate?add=true!babel"
        }]
    },
    plugins: [
        new webpack.BannerPlugin(copyright)
    ]
};
