module.exports = {
    entry: "./src/Init.js",
    output: {
        path: __dirname,
        filename: "novel.js"
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            }, {
                loader: "sass-loader" // compiles Sass to CSS
            }]
        }]

    },
    resolve: {
      alias: {
      }
    }
};
