import { useState } from 'react'
import './App.css'
import { 
  AMFBaseUnitClient, 
  OASConfiguration, 
  RAMLConfiguration,
  AMFDocumentResult,
  AMFResult,
  PipelineId
} from 'amf-client-js'

type Format = 'RAML 1.0' | 'OAS 2.0' | 'OAS 3.0';
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
      const transformResult: AMFResult = await outputClient.transform(
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
      setError(`Conversion error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>API Spec Converter</h1>
      <div className="converter-container">
        <div className="controls">
          <div className="format-selectors">
            <div className="format-group">
              <label>Input Format:</label>
              <select 
                value={inputFormat} 
                onChange={(e) => setInputFormat(e.target.value as Format)}
              >
                <option value="RAML 1.0">RAML 1.0</option>
                <option value="OAS 2.0">OAS 2.0 (Swagger)</option>
                <option value="OAS 3.0">OAS 3.0 (OpenAPI)</option>
              </select>
            </div>
            <div className="format-group">
              <label>Output Format:</label>
              <select 
                value={outputFormat} 
                onChange={(e) => setOutputFormat(e.target.value as Format)}
              >
                <option value="RAML 1.0">RAML 1.0</option>
                <option value="OAS 2.0">OAS 2.0 (Swagger)</option>
                <option value="OAS 3.0">OAS 3.0 (OpenAPI)</option>
              </select>
            </div>
          </div>

          <div className="input-mode">
            <label>Input Mode:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="url"
                  checked={inputMode === 'url'}
                  onChange={() => setInputMode('url')}
                />
                URL
              </label>
              <label>
                <input
                  type="radio"
                  value="content"
                  checked={inputMode === 'content'}
                  onChange={() => setInputMode('content')}
                />
                Content
              </label>
            </div>
          </div>
        </div>

        <div className="io-container">
          <div className="input-section">
            <h2>Input</h2>
            {inputMode === 'url' ? (
              <input
                type="text"
                placeholder="Enter API spec URL..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="url-input"
              />
            ) : (
              <textarea
                placeholder="Paste your API spec content here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="content-input"
              />
            )}
          </div>

          <div className="output-section">
            <h2>Output</h2>
            <textarea
              readOnly
              value={output}
              placeholder="Converted output will appear here..."
              className="content-output"
            />
          </div>
        </div>

        <div className="actions">
          <button 
            onClick={handleConvert} 
            disabled={loading || !input.trim()}
            className="convert-button"
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </>
  )
}

export default App
