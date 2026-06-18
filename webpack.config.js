const path = require("path");
const fs = require("fs");

const PATHS = {
    SRC: path.resolve(__dirname, "./src"),
    BUILD: path.resolve(__dirname, "./build"),
};

module.exports = function (env, argv) {
    return {
        mode: env.production ? "production" : "development",
        experiments: {
            outputModule: true
        },
        devtool: env.production ? false : "source-map",
        entry: path.resolve(PATHS.SRC, "index.ts"),
        output: {
            path: PATHS.BUILD,
            libraryTarget: "module",
            filename: "index.js",
            clean: true
        },
        resolve: {
            extensions: [".ts", ".js"]
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                    options: {
                        transpileOnly: false
                    },
                    exclude: /node_modules|\.test\.ts$/
                }
            ]
        }
    };
}