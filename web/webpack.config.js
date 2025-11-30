module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [
      { test: /\.html$/, loader: 'html-loader' },
      { test: /.(pug|jade)$/, loader: 'apply-loader' },
      { test: /.(pug|jade)$/,
        loader: 'pug-loader',
        options: { doctype: 'html', plugins: [require('pug-plugin-ng')] },
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      { test: /.md$/, use: [{ loader: 'raw-loader' }, { loader: 'markdown-loader', }] }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
}
