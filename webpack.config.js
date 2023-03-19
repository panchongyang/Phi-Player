const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/ts/index.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /(\.mp3|\.wav)$/,
                type: 'asset/resource'
            },
            {
                test: /\.ts$/, //匹配规则 以ts结尾的文件
                loader: 'ts-loader' //对应文件采用ts-loader进行编译
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },

        ],
    },
    plugins: [
        new HtmlWebpackPlugin({//设置模板文件
            template: './src/index.html',//使用打包后的模板文件
            filename: 'index.html'//打包后文件的名字
        }),
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js'] //针对于'.ts', '.tsx', '.js'这三种文件进行处理引入文件可以不写他的扩展名
    },
};