const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PACKAGE = require("./package.json");
const { experiments } = require("webpack");

const PATHS = {
    SRC: path.resolve(__dirname, "./src"),
    DEBUG: path.resolve(__dirname, "./debug"),
    BUILD: path.resolve(__dirname, "./build"),
};

module.exports = function (env, argv) {
    return {
        mode: "development",
        devtool: "source-map",
        entry: path.resolve(PATHS.DEBUG, "index.ts"),
        experiments: {
            outputModule: true
        },
        output: {
            path: PATHS.BUILD,
            libraryTarget: "module",
            filename: "index.js",
            clean: true
        },
        resolve: {
            alias: {
                "~": path.join(PATHS.SRC)
            },
            modules: ["packages", "node_modules", "src"],
            extensions: [".ts", ".tsx", ".js", ".jsx"]
        },
        devServer: {
            // static: [
            //     path.resolve(PATHS.STATIC),
            //     path.resolve(PATHS.EMULATOR_BUILD)
            // ],
            open: false,
            hot: false,
            host: "0.0.0.0",
            port: 8080,
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
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: `${PACKAGE.name} ${PACKAGE.version} - Development`,
                favicon: path.resolve(
                    PATHS.DEBUG,
                    "favicon.png"
                ),
                template: path.resolve(
                    PATHS.DEBUG,
                    "index.html"
                ),
                filename: "index.html"
            })
        ]
    };
}