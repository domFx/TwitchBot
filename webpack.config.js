const path = require('path');

module.exports = {
    entry: path.resolve(__dirname+ '/src/app.ts'),
    target: 'node',
    output: { path: path.resolve(__dirname+ '/dist'), filename: 'app.js' },
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
        ]
    },
    mode: 'development',
    watch: true
}