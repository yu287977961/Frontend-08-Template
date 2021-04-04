module.exports = {
    mode:'development',  //production
    entry:'./main.js',
    module:{
        rules:[
            {
                test:/\.js$/,
                use:{
                    loader:"babel-loader",
                    options: {
                        presets:["@babel/preset-env"],
                        plugins: [["@babel/plugin-transform-react-jsx",{pragma:"createElement"}]]
                    }
                }
            }
        ]
    },

    target:"web",
    devServer: {
        port: 3001,
        compress:true,
        open:true,
        hot: true
    },

}