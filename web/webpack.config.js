module.exports = {
  module: {
    rules: [
      { test: /.(pug|jade)$/, loader: 'apply-loader' },
      { test: /.(pug|jade)$/,
        loader: 'pug-loader',
        options: { doctype: 'html', plugins: [require('pug-plugin-ng')] },
      },
      {
        test: /.js$/,
        use: [{
          loader:  'babel-loader',
          options: {
            presets: ['env'],
          }
        }],
      },
      { test: /.md$/, use: [{ loader: 'raw-loader' }, { loader: 'markdown-loader', }] }
    ]
  }
}
