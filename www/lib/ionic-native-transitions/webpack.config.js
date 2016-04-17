var path = require('path'),
    testPath = path.join(__dirname, 'test'),
    wwwPath = path.join(__dirname, 'www'),
    docsPath = path.join(__dirname, 'docs'),
    pkg = require('./package.json'),
    HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: path.join(testPath, 'index.js'),
    output: {
        path: wwwPath,
        filename: 'test.js'
    },
    module: {
        loaders: [{
            test: /[\/]angular\.js$/,
            loader: 'expose?angular!exports?window.angular'
        }, {
            test: /\.json$/,
            loader: "json"
        }, {
            test: /\.css$/,
            loader: "style!css"
        }, {
            test: [/ionicons\.svg/, /ionicons\.eot/, /ionicons\.ttf/, /ionicons\.woff/],
            loader: 'file?name=fonts/[name].[ext]'
        }, {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: "ng-annotate?add=true!babel"
        }]
    },
    plugins: [new HtmlWebpackPlugin({
        filename: 'index.html',
        pkg: pkg,
        template: path.join(testPath, 'index.html')
    })]
};
