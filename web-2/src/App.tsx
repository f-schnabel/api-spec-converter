import { useState } from 'react'
import { 
  AMFBaseUnitClient, 
  OASConfiguration, 
  RAMLConfiguration,
  AMFDocumentResult,
  AMFResult,
  PipelineId
} from 'amf-client-js'

type Format = 'RAML 0.8' | 'RAML 1.0' | 'OAS 2.0' | 'OAS 3.0';
type InputMode = 'url' | 'content';

function App() {
  const [inputFormat, setInputFormat] = useState<Format>('OAS 2.0')
  const [outputFormat, setOutputFormat] = useState<Format>('OAS 3.0')
  const [inputMode, setInputMode] = useState<InputMode>('url')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getClient = (format: Format): AMFBaseUnitClient => {
    switch (format) {
      case 'RAML 0.8':
        return RAMLConfiguration.RAML08().baseUnitClient()
      case 'RAML 1.0':
        return RAMLConfiguration.RAML10().baseUnitClient()
      case 'OAS 2.0':
        return OASConfiguration.OAS20().baseUnitClient()
      case 'OAS 3.0':
        return OASConfiguration.OAS30().baseUnitClient()
    }
  }

  const handleConvert = async () => {
    if (!input.trim()) {
      setError('Please provide input')
      return
    }

    setLoading(true)
    setError('')
    setOutput('')

    try {
      const inputClient = getClient(inputFormat)
      const outputClient = getClient(outputFormat)

      // Parse the input document
      let baseUnit
      let parseErrors
      
      if (inputMode === 'url') {
        const parseResult: AMFDocumentResult = await inputClient.parseDocument(input)
        baseUnit = parseResult.baseUnit
        parseErrors = parseResult.results
      } else {
        // For content mode, parse as string content
        const result = await inputClient.parseContent(input, 'application/yaml')
        baseUnit = result.baseUnit
        parseErrors = result.results
      }

      if (parseErrors && parseErrors.length > 0) {
        const errors = parseErrors.map(r => r.message).join('\n')
        setError(`Parsing errors:\n${errors}`)
        setLoading(false)
        return
      }

      // Transform to output format
      const transformResult: AMFResult = outputClient.transform(
        baseUnit,
        PipelineId.Compatibility
      )

      if (transformResult.results && transformResult.results.length > 0) {
        const warnings = transformResult.results.map(r => r.message).join('\n')
        console.warn('Transform warnings:', warnings)
      }

      // Render the output
      const mimeType = outputFormat.startsWith('RAML') ? 'application/yaml' : 'application/json'
      const rendered: string = outputClient.render(transformResult.baseUnit, mimeType)
      
      setOutput(rendered)
    } catch (err) {
      console.error('Conversion error:', err)
      setError(`Conversion error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-w-screen min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            API Spec Converter
          </h1>
          <p className="text-slate-300 text-lg">
            Convert between RAML and OpenAPI specifications seamlessly
          </p>
        </div>

        <div className="space-y-6">
          {/* Controls Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Input Format */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Input Format
                </label>
                <select 
                  value={inputFormat} 
                  onChange={(e) => setInputFormat(e.target.value as Format)}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="RAML 0.8">RAML 0.8</option>
                  <option value="RAML 1.0">RAML 1.0</option>
                  <option value="OAS 2.0">OAS 2.0 (Swagger)</option>
                  <option value="OAS 3.0">OAS 3.0 (OpenAPI)</option>
                </select>
              </div>

              {/* Output Format */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Output Format
                </label>
                <select 
                  value={outputFormat} 
                  onChange={(e) => setOutputFormat(e.target.value as Format)}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="RAML 0.8">RAML 0.8</option>
                  <option value="RAML 1.0">RAML 1.0</option>
                  <option value="OAS 2.0">OAS 2.0 (Swagger)</option>
                  <option value="OAS 3.0">OAS 3.0 (OpenAPI)</option>
                </select>
              </div>
            </div>

            {/* Input Mode */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Input Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="url"
                    checked={inputMode === 'url'}
                    onChange={() => setInputMode('url')}
                    className="w-4 h-4 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-200">URL</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="content"
                    checked={inputMode === 'content'}
                    onChange={() => setInputMode('content')}
                    className="w-4 h-4 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-200">Content</span>
                </label>
              </div>
            </div>
          </div>

          {/* Input/Output Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Input
              </h2>
              {inputMode === 'url' ? (
                <input
                  type="text"
                  placeholder="https://example.com/api-spec.json"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              ) : (
                <textarea
                  placeholder="Paste your API spec content here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-96 px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-lg text-white placeholder-slate-500 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              )}
            </div>

            {/* Output */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Output
              </h2>
              <textarea
                readOnly
                value={output}
                placeholder="Converted output will appear here..."
                className="w-full h-96 px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-lg text-white placeholder-slate-500 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Convert Button */}
          <div className="flex justify-center">
            <button 
              onClick={handleConvert} 
              disabled={loading || !input.trim()}
              className="px-8 py-4 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none transition-all duration-200 flex items-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Converting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Convert
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <pre className="text-red-200 font-mono text-sm whitespace-pre-wrap flex-1">
                  {error}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
