// DevImport: DEV-only page for importing journal entries into the browser app
// Route: /dev/import (not in navigation, dev-only)

import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { JournalService, PortfolioService, type JournalCreateInput } from '@/domain/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import PageHeader from '@/ui/components/PageHeader'

// Check if running in dev mode - allow localhost, 127.0.0.1, or any non-production hostname
const IS_DEV = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.includes('local') ||
  window.location.port === '5173'
)

// ============================================================================
// Types
// ============================================================================

type ActionType = 'buy' | 'sell' | 'long' | 'short' | 'deposit' | 'withdraw'
type RawRecord = Record<string, unknown>

interface NormalizedRecord {
  input: JournalCreateInput
  dedupeHash: string
  sourceIndex: number
  error?: string
  needsPositionResolution?: boolean  // True if SELL/SHORT needs position lookup by ticker
}

interface ValidationResult {
  total: number
  valid: NormalizedRecord[]
  errors: Array<{ index: number; message: string }>
  duplicatesExisting: number
  duplicatesInFile: number
}

interface ImportResult {
  created: number
  failed: Array<{ index: number; message: string }>
}

// ============================================================================
// Constants
// ============================================================================

const DEDUPE_KEY = 'bt_import_dedupe_v1_browser'
const MAX_ERRORS_DISPLAY = 10

// ============================================================================
// Parsing Utilities (adapted from scripts/import-journal.ts)
// ============================================================================

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true
    if (['false', '0', 'no', 'n'].includes(normalized)) return false
  }
  return undefined
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function toString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (value !== null && value !== undefined) {
    return String(value)
  }
  return undefined
}

function parseEntryTime(value: unknown): string {
  const raw = toString(value)
  if (!raw) {
    throw new Error('entryTime is required')
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid entryTime: ${raw}`)
  }
  return parsed.toISOString()
}

function normalizeActionType(value: unknown): ActionType {
  const raw = toString(value)
  if (!raw) {
    throw new Error('actionType is required')
  }
  const normalized = raw.toLowerCase() as ActionType
  if (!['buy', 'sell', 'long', 'short', 'deposit', 'withdraw'].includes(normalized)) {
    throw new Error(`Invalid actionType: ${raw}`)
  }
  return normalized
}

function normalizeTicker(actionType: ActionType, value: unknown): string {
  if (actionType === 'deposit' || actionType === 'withdraw') {
    return 'USD'
  }
  const raw = toString(value)
  if (!raw) {
    throw new Error('ticker is required')
  }
  return raw.trim().toUpperCase()
}

function parsePositionMode(actionType: ActionType, raw: RawRecord): 'new' | 'existing' {
  const positionMode = toString(raw.positionMode)
  if (positionMode === 'new' || positionMode === 'existing') {
    return positionMode
  }
  const positionId = toString(raw.positionId)
  if (positionId) {
    return 'existing'
  }
  // For SELL/SHORT without positionId, we'll auto-resolve by ticker later
  // Mark as 'existing' but don't require positionId at parse time
  if (actionType === 'sell' || actionType === 'short') {
    return 'existing'
  }
  return 'new'
}

// Extract payment info from either flat fields or nested payment object
function extractPayment(raw: RawRecord): { asset?: string; amount?: number; isNewMoney?: boolean } {
  // Try nested payment object first (user export format)
  const nestedPayment = raw.payment as { currency?: unknown; amount?: unknown; newMoney?: unknown } | undefined
  if (nestedPayment && typeof nestedPayment === 'object') {
    return {
      asset: toString(nestedPayment.currency),
      amount: toNumber(nestedPayment.amount),
      isNewMoney: toBoolean(nestedPayment.newMoney),
    }
  }
  // Fall back to flat fields (original importer format)
  return {
    asset: toString(raw.paymentAsset),
    amount: toNumber(raw.paymentAmount),
    isNewMoney: toBoolean(raw.isNewMoney),
  }
}

function buildMeta(raw: RawRecord): Record<string, unknown> | undefined {
  const meta: Record<string, unknown> = {}
  const stringFields = [
    'sector',
    'assetClass',
    'rationale',
    'timeHorizon',
    'priceTargets',
    'invalidation',
    'emotions',
    'confidence',
    'venue',
    'status',
    'reminders',
  ]

  for (const field of stringFields) {
    const value = toString(raw[field])
    if (value !== undefined) {
      meta[field] = value
    }
  }

  const fees = toNumber(raw.fees)
  if (fees !== undefined) {
    meta.fees = fees
  }

  return Object.keys(meta).length > 0 ? meta : undefined
}

function buildDedupeHash(input: JournalCreateInput): string {
  const payment = input.payment
  const parts = [
    input.entryTime,
    input.actionType,
    input.ticker,
    input.quantity.toString(),
    input.price.toString(),
    payment?.asset ?? '',
    payment?.amount?.toString() ?? '',
    payment?.isNewMoney ? 'true' : 'false',
  ]
  // Simple hash for browser (no crypto.createHash)
  const joined = parts.join('|')
  let hash = 0
  for (let i = 0; i < joined.length; i++) {
    const char = joined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(16)
}

function normalizeRecord(raw: RawRecord, sourceIndex: number): NormalizedRecord {
  const actionType = normalizeActionType(raw.actionType)
  const entryTime = parseEntryTime(raw.entryTime)
  const ticker = normalizeTicker(actionType, raw.ticker)
  const quantity = toNumber(raw.quantity)
  if (quantity === undefined || quantity <= 0) {
    throw new Error('quantity must be a positive number')
  }

  const positionMode = parsePositionMode(actionType, raw)
  const positionId = toString(raw.positionId)

  // For SELL/SHORT without positionId, we'll auto-resolve by ticker during import
  // (don't throw error here - mark for resolution instead)
  const needsPositionResolution =
    positionMode === 'existing' &&
    !positionId &&
    (actionType === 'sell' || actionType === 'short')

  // Accept both "price" and "pricePerUnit" as the price field
  let price = toNumber(raw.price) ?? toNumber(raw.pricePerUnit)
  if (actionType === 'deposit' || actionType === 'withdraw') {
    price = 1
  } else if (price === undefined || price < 0) {
    throw new Error('price (or pricePerUnit) is required for non-cash actions')
  }

  let payment: JournalCreateInput['payment']
  if (actionType === 'buy' || actionType === 'long') {
    const extracted = extractPayment(raw)
    if (!extracted.asset || extracted.amount === undefined) {
      throw new Error('payment info required for buy/long actions (either nested payment object or flat paymentAsset/paymentAmount)')
    }
    payment = {
      asset: extracted.asset.toUpperCase(),
      amount: extracted.amount,
      isNewMoney: extracted.isNewMoney ?? false,
    }
  }

  const meta = buildMeta(raw)

  // For actions needing resolution, use 'new' temporarily (will be fixed during import)
  const effectivePositionMode = needsPositionResolution ? 'new' : positionMode

  const input: JournalCreateInput = {
    actionType,
    ticker,
    quantity,
    price: price ?? 0,
    entryTime,
    positionMode: effectivePositionMode,
    positionId: positionMode === 'existing' ? positionId : undefined,
    payment,
    meta,
  }

  return {
    input,
    dedupeHash: buildDedupeHash(input),
    sourceIndex,
    needsPositionResolution,
  }
}

// ============================================================================
// CSV Parser
// ============================================================================

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }
    current += char
  }
  values.push(current)
  return values
}

function parseCsv(content: string): RawRecord[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return []
  }

  const header = parseCsvLine(lines[0]).map((value) => value.trim())
  const rows: RawRecord[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i])
    const row: RawRecord = {}
    header.forEach((key, idx) => {
      row[key] = values[idx] ?? ''
    })
    rows.push(row)
  }

  return rows
}

// ============================================================================
// JSON Parser
// ============================================================================

function parseJson(content: string): RawRecord[] {
  const parsed = JSON.parse(content) as unknown
  if (Array.isArray(parsed)) {
    return parsed as RawRecord[]
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { entries?: unknown }).entries)) {
    return (parsed as { entries: RawRecord[] }).entries
  }
  throw new Error('JSON must be an array or { entries: [...] }')
}

// ============================================================================
// Dedupe Storage
// ============================================================================

function getDedupeMap(): Record<string, { importedAt: string }> {
  const raw = localStorage.getItem(DEDUPE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, { importedAt: string }>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveDedupeMap(map: Record<string, { importedAt: string }>): void {
  localStorage.setItem(DEDUPE_KEY, JSON.stringify(map))
}

// ============================================================================
// Validation
// ============================================================================

function validateRecords(content: string, isJson: boolean): ValidationResult {
  let rawRecords: RawRecord[]
  try {
    rawRecords = isJson ? parseJson(content) : parseCsv(content)
  } catch (error) {
    return {
      total: 0,
      valid: [],
      errors: [{ index: 0, message: error instanceof Error ? error.message : 'Parse error' }],
      duplicatesExisting: 0,
      duplicatesInFile: 0,
    }
  }

  const dedupeMap = getDedupeMap()
  const seenHashes = new Set<string>()
  const valid: NormalizedRecord[] = []
  const errors: Array<{ index: number; message: string }> = []
  let duplicatesExisting = 0
  let duplicatesInFile = 0

  rawRecords.forEach((raw, index) => {
    try {
      const record = normalizeRecord(raw, index)

      if (seenHashes.has(record.dedupeHash)) {
        duplicatesInFile += 1
        return
      }
      seenHashes.add(record.dedupeHash)

      if (dedupeMap[record.dedupeHash]) {
        duplicatesExisting += 1
        return
      }

      valid.push(record)
    } catch (error) {
      errors.push({
        index,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Sort by entryTime
  valid.sort((a, b) => new Date(a.input.entryTime).getTime() - new Date(b.input.entryTime).getTime())

  return {
    total: rawRecords.length,
    valid,
    errors,
    duplicatesExisting,
    duplicatesInFile,
  }
}

// ============================================================================
// Import
// ============================================================================

/**
 * Build a map of ticker -> positionId from existing positions in storage.
 * For the same ticker, prefer open positions over closed ones.
 */
function buildPositionMap(): Map<string, string> {
  const map = new Map<string, string>()
  const positions = PortfolioService.list(true) // include archived

  // Sort: open positions first (no closedAt), then by most recent
  const sorted = [...positions].sort((a, b) => {
    if (!a.closedAt && b.closedAt) return -1
    if (a.closedAt && !b.closedAt) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  for (const pos of sorted) {
    const ticker = pos.ticker.toUpperCase()
    // Only set if not already set (prefer first = open/recent)
    if (!map.has(ticker)) {
      map.set(ticker, pos.id)
    }
  }

  return map
}

function importRecords(records: NormalizedRecord[]): ImportResult {
  const dedupeMap = getDedupeMap()
  const failed: Array<{ index: number; message: string }> = []
  let created = 0

  // Build initial position map from existing storage
  const positionMap = buildPositionMap()

  for (const record of records) {
    try {
      const input = { ...record.input }
      const ticker = input.ticker.toUpperCase()

      // Auto-resolve position by ticker for SELL/SHORT without explicit positionId
      if (record.needsPositionResolution) {
        const existingPositionId = positionMap.get(ticker)
        if (!existingPositionId) {
          throw new Error(`sell before buy for ticker ${ticker} (no position found)`)
        }
        input.positionMode = 'existing'
        input.positionId = existingPositionId
      }

      // Create the journal entry (this also creates/updates positions)
      const result = JournalService.create(input)

      // Update position map with newly created position (for subsequent records)
      if (result.position && (input.actionType === 'buy' || input.actionType === 'long')) {
        positionMap.set(ticker, result.position.id)
      }

      dedupeMap[record.dedupeHash] = { importedAt: new Date().toISOString() }
      created += 1
    } catch (error) {
      failed.push({
        index: record.sourceIndex,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  saveDedupeMap(dedupeMap)

  return { created, failed }
}

// ============================================================================
// Component
// ============================================================================

export default function DevImport() {
  const [inputText, setInputText] = useState('')
  const [isJson, setIsJson] = useState(true)
  const [dryRun, setDryRun] = useState(true)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // DEV-only gate
  if (!IS_DEV) {
    return (
      <div className="p-6">
        <PageHeader title="Dev Import" />
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-destructive">This page is only available in development mode.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInputText(content)
      setIsJson(file.name.endsWith('.json'))
      setValidation(null)
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  const handleValidate = () => {
    if (!inputText.trim()) {
      setValidation(null)
      return
    }
    const result = validateRecords(inputText, isJson)
    setValidation(result)
    setImportResult(null)
  }

  const handleImport = () => {
    if (!validation || validation.valid.length === 0) return

    if (dryRun) {
      // Dry run: just show what would be imported
      setImportResult({ created: validation.valid.length, failed: [] })
      return
    }

    // Real import: confirm first
    const confirmed = window.confirm(
      `This will import ${validation.valid.length} journal entries into the app.\n\n` +
      `This action will:\n` +
      `• Create journal entries\n` +
      `• Create/update portfolio positions\n` +
      `• Cannot be easily undone\n\n` +
      `Continue?`
    )

    if (!confirmed) return

    setIsImporting(true)
    try {
      const result = importRecords(validation.valid)
      setImportResult(result)
      // Clear validation to prevent double import
      setValidation(null)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClear = () => {
    setInputText('')
    setValidation(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Dev Import" />

      <Card>
        <CardHeader>
          <CardTitle>Import Journal Entries</CardTitle>
          <CardDescription>
            Paste JSON or CSV data, or upload a file. This imports directly into the browser's localStorage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format Toggle */}
          <div className="flex items-center gap-4">
            <Label>Format:</Label>
            <div className="flex items-center gap-2">
              <Button
                variant={isJson ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsJson(true)}
              >
                JSON
              </Button>
              <Button
                variant={!isJson ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsJson(false)}
              >
                CSV
              </Button>
            </div>
          </div>

          {/* File Picker */}
          <div>
            <Label>Upload File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {/* Text Input */}
          <div>
            <Label>Or Paste Data</Label>
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                setValidation(null)
                setImportResult(null)
              }}
              placeholder={isJson
                ? '[\n  { "actionType": "buy", "ticker": "AAPL", "quantity": 10, "price": 150, "entryTime": "2024-01-01T10:00:00Z", "paymentAsset": "USD", "paymentAmount": 1500 }\n]'
                : 'actionType,ticker,quantity,price,entryTime,paymentAsset,paymentAmount\nbuy,AAPL,10,150,2024-01-01T10:00:00Z,USD,1500'
              }
              className="mt-1 w-full h-48 p-3 font-mono text-sm border rounded-md bg-background resize-y"
            />
          </div>

          {/* Dry Run Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="dry-run">Dry run (validate only, no writes)</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleValidate} disabled={!inputText.trim()}>
              Validate
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validation || validation.valid.length === 0 || isImporting}
              variant={dryRun ? 'secondary' : 'default'}
            >
              {isImporting ? 'Importing...' : dryRun ? 'Preview Import' : 'Import'}
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total records:</div>
              <div className="font-mono">{validation.total}</div>
              <div>Valid entries:</div>
              <div className="font-mono text-green-600">{validation.valid.length}</div>
              <div>Duplicates (already imported):</div>
              <div className="font-mono text-yellow-600">{validation.duplicatesExisting}</div>
              <div>Duplicates (in file):</div>
              <div className="font-mono text-yellow-600">{validation.duplicatesInFile}</div>
              <div>Errors:</div>
              <div className="font-mono text-red-600">{validation.errors.length}</div>
            </div>

            {/* Preview valid entries */}
            {validation.valid.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Preview (first 5 entries):</h4>
                  <div className="space-y-1 text-sm font-mono">
                    {validation.valid.slice(0, 5).map((record, i) => (
                      <div key={i} className="text-muted-foreground">
                        {new Date(record.input.entryTime).toLocaleDateString()}{' '}
                        <span className="text-foreground font-semibold">{record.input.actionType.toUpperCase()}</span>{' '}
                        {record.input.ticker} {record.input.quantity} @ {record.input.price}
                      </div>
                    ))}
                    {validation.valid.length > 5 && (
                      <div className="text-muted-foreground">...and {validation.valid.length - 5} more</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Show errors */}
            {validation.errors.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Errors:</h4>
                  <div className="space-y-1 text-sm">
                    {validation.errors.slice(0, MAX_ERRORS_DISPLAY).map((err, i) => (
                      <div key={i} className="text-red-600">
                        Row {err.index + 1}: {err.message}
                      </div>
                    ))}
                    {validation.errors.length > MAX_ERRORS_DISPLAY && (
                      <div className="text-muted-foreground">
                        ...and {validation.errors.length - MAX_ERRORS_DISPLAY} more errors
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              {dryRun ? 'Dry Run Results' : 'Import Complete'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>{dryRun ? 'Would create:' : 'Created:'}</div>
              <div className="font-mono text-green-600">{importResult.created}</div>
              {importResult.failed.length > 0 && (
                <>
                  <div>Failed:</div>
                  <div className="font-mono text-red-600">{importResult.failed.length}</div>
                </>
              )}
            </div>

            {/* Show failures */}
            {importResult.failed.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Failed entries:</h4>
                  <div className="space-y-1 text-sm">
                    {importResult.failed.slice(0, MAX_ERRORS_DISPLAY).map((err, i) => (
                      <div key={i} className="text-red-600">
                        Row {err.index + 1}: {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Navigation buttons */}
            {!dryRun && importResult.created > 0 && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/journal">Go to Journal</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/portfolio">Go to Portfolio</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Required:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li><code>actionType</code>: buy, sell, long, short, deposit, withdraw</li>
              <li><code>ticker</code>: Stock symbol (not required for deposit/withdraw)</li>
              <li><code>quantity</code>: Number of shares/units</li>
              <li><code>price</code> or <code>pricePerUnit</code>: Price per unit</li>
              <li><code>entryTime</code>: ISO8601 timestamp</li>
            </ul>
            <p className="mt-3"><strong>For buy actions:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Flat: <code>paymentAsset</code>, <code>paymentAmount</code>, <code>isNewMoney</code></li>
              <li>Or nested: <code>payment: {'{ currency, amount, newMoney }'}</code></li>
            </ul>
            <p className="mt-3"><strong>Optional:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li><code>positionMode</code>: new or existing</li>
              <li><code>positionId</code>: Required if positionMode is existing</li>
              <li><code>sector</code>, <code>rationale</code>, <code>fees</code>, <code>venue</code>, etc.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
