const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: path.resolve(__dirname + '/src/app.ts'),
    target: 'node',
    output: { path: path.resolve(__dirname + '/dist'), filename: 'app.js' },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
        modules: [
            'node_modules'
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
            // {
            //     test: /\.json?$/,
            //     exclude: path.resolve(__dirname, 'node_modules'),
            //     use : [
            //         {
            //             loader: 'file-loader'
            //         }
            //     ]
            // }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: './src/appsettings.json', to: 'appsettings.json' }
        ])
    ],
    mode: 'development',
    watch: true
}