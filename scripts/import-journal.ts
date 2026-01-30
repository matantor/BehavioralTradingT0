import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'

const DEDUPE_KEY = 'bt_import_dedupe_v1'
const DEFAULT_STORAGE_FILE = path.resolve('data/import/localStorage.json')
const PREVIEW_COUNT = 5

type ActionType = 'buy' | 'sell' | 'long' | 'short' | 'deposit' | 'withdraw'

type RawRecord = Record<string, unknown>

interface JournalCreateInput {
  actionType: ActionType
  ticker: string
  quantity: number
  price: number
  entryTime: string
  positionMode: 'new' | 'existing'
  positionId?: string
  payment?: {
    asset: string
    amount: number
    isNewMoney?: boolean
  }
  meta?: Record<string, unknown>
}

interface NormalizedRecord {
  input: JournalCreateInput
  dedupeHash: string
  sourceIndex: number
  raw: RawRecord
}

class FileLocalStorage {
  private filePath: string
  private data: Record<string, string>

  constructor(filePath: string) {
    this.filePath = filePath
    this.data = {}
    this.load()
  }

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null
  }

  setItem(key: string, value: string): void {
    this.data[key] = value
    this.persist()
  }

  removeItem(key: string): void {
    delete this.data[key]
    this.persist()
  }

  clear(): void {
    this.data = {}
    this.persist()
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) {
      return
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as Record<string, string>
      if (parsed && typeof parsed === 'object') {
        this.data = parsed
      }
    } catch (error) {
      console.error('Failed to load localStorage file:', error)
    }
  }

  private persist(): void {
    const dir = path.dirname(this.filePath)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }
}

function ensureLocalStorage(storageFile: string): void {
  if (typeof globalThis.localStorage !== 'undefined') {
    return
  }
  globalThis.localStorage = new FileLocalStorage(storageFile) as unknown as Storage
}

function parseArgs(argv: string[]): { file: string; dryRun: boolean; storageFile: string } {
  const args = [...argv]
  let file = ''
  let dryRun = false
  let storageFile = DEFAULT_STORAGE_FILE

  while (args.length > 0) {
    const arg = args.shift()
    if (!arg) break
    if (arg === '--file') {
      file = args.shift() || ''
      continue
    }
    if (arg === '--dry-run') {
      dryRun = true
      continue
    }
    if (arg === '--storage-file') {
      storageFile = args.shift() || storageFile
      continue
    }
  }

  if (!file) {
    console.error('Missing --file argument')
    process.exit(1)
  }

  return { file, dryRun, storageFile }
}

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

function parseJson(content: string): RawRecord[] {
  const parsed = JSON.parse(content) as unknown
  if (Array.isArray(parsed)) {
    return parsed as RawRecord[]
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { entries?: unknown }).entries)) {
    return (parsed as { entries: RawRecord[] }).entries
  }
  throw new Error('JSON file must be an array or { entries: [...] }')
}

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
  if (actionType === 'sell') {
    return 'existing'
  }
  return 'new'
}

function parseRelatedEntryIds(value: unknown): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const ids = value.map((item) => String(item).trim()).filter(Boolean)
    return ids.length > 0 ? ids : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          const ids = parsed.map((item) => String(item).trim()).filter(Boolean)
          return ids.length > 0 ? ids : undefined
        }
      } catch {
        return undefined
      }
    }
    const ids = trimmed.split(';').map((item) => item.trim()).filter(Boolean)
    return ids.length > 0 ? ids : undefined
  }
  return undefined
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

  const relatedEntryIds = parseRelatedEntryIds(raw.relatedEntryIds)
  if (relatedEntryIds && relatedEntryIds.length > 0) {
    meta.relatedEntryIds = relatedEntryIds
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
  const joined = parts.join('|')
  return crypto.createHash('sha256').update(joined).digest('hex')
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
  if (positionMode === 'existing' && !positionId && actionType !== 'deposit' && actionType !== 'withdraw') {
    throw new Error('positionId is required when positionMode is existing')
  }

  let price = toNumber(raw.price)
  if (actionType === 'deposit' || actionType === 'withdraw') {
    price = 1
  } else if (price === undefined || price < 0) {
    throw new Error('price is required for non-cash actions')
  }

  let payment: JournalCreateInput['payment']
  if (actionType === 'buy') {
    const paymentAsset = toString(raw.paymentAsset)
    const paymentAmount = toNumber(raw.paymentAmount)
    if (!paymentAsset || paymentAmount === undefined) {
      throw new Error('paymentAsset and paymentAmount are required for buy actions')
    }
    const isNewMoney = toBoolean(raw.isNewMoney)
    payment = {
      asset: paymentAsset.toUpperCase(),
      amount: paymentAmount,
      isNewMoney: isNewMoney ?? false,
    }
  }

  const meta = buildMeta(raw)

  const input: JournalCreateInput = {
    actionType,
    ticker,
    quantity,
    price: price ?? 0,
    entryTime,
    positionMode,
    positionId: positionMode === 'existing' ? positionId : undefined,
    payment,
    meta,
  }

  return {
    input,
    dedupeHash: buildDedupeHash(input),
    sourceIndex,
    raw,
  }
}

function readImportFile(filePath: string): RawRecord[] {
  const absolute = path.resolve(filePath)
  const content = fs.readFileSync(absolute, 'utf-8')
  if (absolute.endsWith('.csv')) {
    return parseCsv(content)
  }
  if (absolute.endsWith('.json')) {
    return parseJson(content)
  }
  throw new Error('Unsupported file type. Use .csv or .json')
}

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
  localStorage.setItem(DEDUPE_KEY, JSON.stringify(map, null, 2))
}

function summarizePreview(records: NormalizedRecord[]): void {
  const preview = records.slice(0, PREVIEW_COUNT)
  console.log(`Preview (first ${preview.length} entries):`)
  for (const record of preview) {
    const { input } = record
    console.log(
      `- ${input.entryTime} ${input.actionType.toUpperCase()} ${input.ticker} ${input.quantity} @ ${input.price}`
    )
  }
}

async function main(): Promise<void> {
  const { file, dryRun, storageFile } = parseArgs(process.argv.slice(2))
  ensureLocalStorage(storageFile)

  const { JournalService } = await import('@/domain/services/JournalService')

  let rawRecords: RawRecord[] = []
  try {
    rawRecords = readImportFile(file)
  } catch (error) {
    console.error('Failed to read import file:', error)
    process.exit(1)
  }

  const dedupeMap = getDedupeMap()
  const seenHashes = new Set<string>()
  const normalized: NormalizedRecord[] = []
  const errors: Array<{ index: number; message: string }> = []
  let duplicateExisting = 0
  let duplicateInFile = 0

  rawRecords.forEach((raw, index) => {
    try {
      const record = normalizeRecord(raw, index)
      if (seenHashes.has(record.dedupeHash)) {
        duplicateInFile += 1
        return
      }
      seenHashes.add(record.dedupeHash)

      if (dedupeMap[record.dedupeHash]) {
        duplicateExisting += 1
        return
      }

      normalized.push(record)
    } catch (error) {
      errors.push({
        index,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  normalized.sort((a, b) => new Date(a.input.entryTime).getTime() - new Date(b.input.entryTime).getTime())

  console.log(`Parsed records: ${rawRecords.length}`)
  console.log(`Valid entries: ${normalized.length}`)
  console.log(`Duplicates (existing): ${duplicateExisting}`)
  console.log(`Duplicates (in file): ${duplicateInFile}`)
  console.log(`Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log('Sample errors:')
    errors.slice(0, PREVIEW_COUNT).forEach((err) => {
      console.log(`- Row ${err.index + 1}: ${err.message}`)
    })
  }

  summarizePreview(normalized)

  if (dryRun) {
    console.log('Dry run enabled. No entries were created.')
    return
  }

  let created = 0
  let failed = 0

  for (const record of normalized) {
    try {
      JournalService.create(record.input)
      dedupeMap[record.dedupeHash] = { importedAt: new Date().toISOString() }
      created += 1
    } catch (error) {
      failed += 1
      console.error(
        `Failed to import entry (row ${record.sourceIndex + 1}):`,
        error instanceof Error ? error.message : error
      )
    }
  }

  saveDedupeMap(dedupeMap)

  console.log('Import complete.')
  console.log(`Created: ${created}`)
  console.log(`Failed: ${failed}`)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
