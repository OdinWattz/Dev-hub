'use strict'

const { app, BrowserWindow, protocol, net, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// ── Custom app:// protocol ─────────────────────────────────────────────────
// Registered before app.whenReady so it takes effect from the first window.
// This serves the Next.js static export (desktop/web/) under a proper origin
// so that absolute /_next/ asset paths resolve correctly.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: false,
      stream: true,
    },
  },
])

const WEB_DIR = path.join(__dirname, 'web')

// ── Discord Rich Presence ──────────────────────────────────────────────────
// Set your Discord Application ID via the DISCORD_APP_ID environment variable
// or by creating desktop/discord.config.json with { "appId": "YOUR_ID" }.
// Get an app ID at: https://discord.com/developers/applications
// After creating the app, add a Rich Presence art asset named "devhub_icon".

const PAGE_LABELS = {
  '/': { label: 'Dashboard', emoji: '🏠' },
  '/todo': { label: 'Todo', emoji: '📋' },
  '/notes': { label: 'Notes', emoji: '📝' },
  '/snippets': { label: 'Snippets', emoji: '🧩' },
  '/focus': { label: 'Focus Timer', emoji: '⏱️' },
  '/habits': { label: 'Habit Tracker', emoji: '❤️' },
  '/pdf-editor': { label: 'PDF Editor', emoji: '📄' },
  '/weather': { label: 'Weather', emoji: '🌤️' },
  '/github': { label: 'GitHub', emoji: '🐙' },
  '/api-explorer': { label: 'API Explorer', emoji: '🌐' },
  '/settings': { label: 'Settings', emoji: '⚙️' },
}

const appStartTime = new Date()
let rpcClient = null
let mainWindow = null

function loadDiscordAppId() {
  const cfgPath = path.join(__dirname, 'discord.config.json')
  if (process.env.DISCORD_APP_ID) return process.env.DISCORD_APP_ID
  if (fs.existsSync(cfgPath)) {
    try {
      return JSON.parse(fs.readFileSync(cfgPath, 'utf8')).appId || null
    } catch {
      return null
    }
  }
  return null
}

function routeFromUrl(urlStr) {
  try {
    const pathname = new URL(urlStr).pathname.replace(/\/$/, '') || '/'
    const known = Object.keys(PAGE_LABELS).sort((a, b) => b.length - a.length)
    return known.find((r) => pathname === r || pathname.startsWith(r + '/')) ?? '/'
  } catch {
    return '/'
  }
}

function updatePresence(route) {
  if (!rpcClient) return
  const page = PAGE_LABELS[route] ?? { label: 'DevHub', emoji: '💻' }
  rpcClient.setActivity({
    details: 'DevHub — Developer Toolkit',
    state: `${page.emoji} ${page.label}`,
    largeImageKey: 'devhub_icon',
    largeImageText: 'DevHub',
    startTimestamp: appStartTime,
    instance: false,
  }).catch(() => {})
}

async function initDiscordRPC() {
  const appId = loadDiscordAppId()
  if (!appId) {
    console.info('[Discord RPC] No App ID found — Rich Presence disabled.')
    console.info('[Discord RPC] Add your App ID to desktop/discord.config.json:')
    console.info('[Discord RPC]   { "appId": "YOUR_DISCORD_APPLICATION_ID" }')
    return
  }
  try {
    const RPC = require('discord-rpc')
    rpcClient = new RPC.Client({ transport: 'ipc' })
    rpcClient.on('ready', () => {
      console.info('[Discord RPC] Connected as', rpcClient.user.username)
      updatePresence('/')
    })
    rpcClient.on('disconnected', () => {
      rpcClient = null
    })
    await rpcClient.login({ clientId: appId })
  } catch (e) {
    console.warn('[Discord RPC] Could not connect:', e.message)
    rpcClient = null
  }
}

// ── Protocol handler ───────────────────────────────────────────────────────
function handleAppProtocol(request) {
  const url = new URL(request.url)
  let filePath = path.join(WEB_DIR, url.pathname)

  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      const idx = path.join(filePath, 'index.html')
      if (fs.existsSync(idx)) {
        return net.fetch('file:///' + idx.replace(/\\/g, '/'))
      }
    } else {
      return net.fetch('file:///' + filePath.replace(/\\/g, '/'))
    }
  }

  // Fallback: root index.html (shouldn't normally be needed)
  return net.fetch('file:///' + path.join(WEB_DIR, 'index.html').replace(/\\/g, '/'))
}

// ── Browser window ─────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 560,
    title: 'DevHub',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  })

  mainWindow.loadURL('app://devhub/')

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // Update Discord presence on navigation
  mainWindow.webContents.on('did-navigate', (_, url) => updatePresence(routeFromUrl(url)))
  mainWindow.webContents.on('did-navigate-in-page', (_, url) => updatePresence(routeFromUrl(url)))

  // Open external URLs (e.g. GitHub links) in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('app://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  protocol.handle('app', handleAppProtocol)
  createWindow()
  initDiscordRPC()
})

app.on('window-all-closed', () => {
  if (rpcClient) rpcClient.destroy().catch(() => {})
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
