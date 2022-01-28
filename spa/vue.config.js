const path = require('path');
const webpack = require('webpack');
const VersionFile = require('webpack-version-file-plugin');
const buildTs = Date.now();

module.exports = {
    configureWebpack: {
        plugins: [
            //new BundleAnalyzerPlugin(), // uncomment to analyze build size.
            new webpack.DefinePlugin({
                buildTs: buildTs
            }),
            new VersionFile({
                packageFile: path.join(__dirname, 'package.json'),
                template: path.join(__dirname, 'version.ejs'),
                outputFile: path.join(__dirname + '/dist', 'version.json'),
                extras: {
                    'timestamp': buildTs
                }
            }),
        ]
    },
    chainWebpack: config => {
        config.module.rules.delete('eslint');
    }
}
