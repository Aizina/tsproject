const path = require('path');

module.exports = {
  entry: {
    main: './dist/init.js' // Your entry point, adjust as needed
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }, 
  devtool: 'source-map', // Generates source maps for debugging
  mode: 'development', // Set the mode to development
};
