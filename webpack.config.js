module.exports = {
    entry: "./src/index.ts",
    output: {
        filename: "target/bundle.js"
    },
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        loaders: [
            { test: /\.tsx?$/, loader: "ts-loader" },
        ]
    }
};
