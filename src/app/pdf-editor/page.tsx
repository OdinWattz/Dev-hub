'use client'

import { useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  Upload, Type, Download, Trash2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, MousePointer2, FileText, X, Eraser,
  Image as ImageIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tool = 'select' | 'text' | 'image' | 'erase'

interface Overlay {
  id: string
  type: 'text' | 'image' | 'erase'
  page: number
  x: number   // % of page width  (0–100)
  y: number   // % of page height (0–100)
  w: number   // % of page width
  h: number   // % of page height
  text?: string
  fontSize?: number
  color?: string
  bold?: boolean
  src?: string
}

interface PageInfo {
  dataUrl: string
  widthPx: number
  heightPx: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RS = 1.5  // PDF.js render scale — higher = sharper but slower

// ─── Lazy pdfjs loader ────────────────────────────────────────────────────────
let _pdfjs: typeof import('pdfjs-dist') | null = null
const getPdfjs = async () => {
  if (!_pdfjs) {
    _pdfjs = await import('pdfjs-dist')
    // Worker is copied to /public so it works fully offline
    _pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }
  return _pdfjs
}

const uid = () => Math.random().toString(36).slice(2, 9)

// ─── Component ────────────────────────────────────────────────────────────────
export default function PDFEditorPage() {
  const [pages, setPages]       = useState<PageInfo[]>([])
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [curPage, setCurPage]   = useState(0)
  const [tool, setTool]         = useState<Tool>('select')
  const [selected, setSelected] = useState<string | null>(null)
  const [zoom, setZoom]         = useState(1.0)
  const [loading, setLoading]   = useState(false)
  const [pdfName, setPdfName]   = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const imgRef     = useRef<HTMLInputElement>(null)
  const contRef    = useRef<HTMLDivElement>(null)
  const pageImgRef = useRef<HTMLImageElement>(null)

  // Interaction state stored in refs to avoid re-renders
  const dragRef   = useRef<{ id: string; ox: number; oy: number; w: number; h: number } | null>(null)
  const resizeRef = useRef<{ id: string; sx: number; sy: number; ow: number; oh: number } | null>(null)
  const eraseRef  = useRef<{ id: string; sx: number; sy: number } | null>(null)

  const pg          = pages[curPage]
  const displayW    = pg ? pg.widthPx * zoom : 0
  const displayH    = pg ? pg.heightPx * zoom : 0
  const curOverlays = overlays.filter(o => o.page === curPage)
  const selOv       = overlays.find(o => o.id === selected)

  // Convert client coordinates → page percentages
  const toPct = (clientX: number, clientY: number) => {
    const el = contRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((clientX - r.left)  / r.width)  * 100)),
      y: Math.max(0, Math.min(100, ((clientY - r.top)   / r.height) * 100)),
    }
  }

  const updOv = useCallback((id: string, patch: Partial<Overlay>) => {
    setOverlays(p => p.map(o => o.id === id ? { ...o, ...patch } : o))
  }, [])

  // ── Load PDF ──
  const loadPDF = useCallback(async (file: File) => {
    setLoading(true)
    setPdfName(file.name.replace(/\.pdf$/i, ''))
    try {
      const lib = await getPdfjs()
      const buf = await file.arrayBuffer()
      const pdf = await lib.getDocument({ data: buf }).promise
      const newPages: PageInfo[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const p  = await pdf.getPage(i)
        const vp = p.getViewport({ scale: RS })
        const canvas = document.createElement('canvas')
        canvas.width  = vp.width
        canvas.height = vp.height
        await p.render({ canvas, viewport: vp }).promise
        newPages.push({ dataUrl: canvas.toDataURL('image/png'), widthPx: vp.width, heightPx: vp.height })
      }

      setPages(newPages)
      setOverlays([])
      setCurPage(0)
      setSelected(null)
      toast.success(`Loaded ${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}`)
    } catch (e) {
      console.error(e)
      toast.error('Could not render PDF — make sure it is not password-protected')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Pointer handlers ──
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const onBg = e.target === e.currentTarget || e.target === pageImgRef.current
    if (!onBg) return
    const pos = toPct(e.clientX, e.clientY)

    if (tool === 'erase') {
      e.preventDefault()
      const id = uid()
      eraseRef.current = { id, sx: pos.x, sy: pos.y }
      setOverlays(p => [...p, { id, type: 'erase', page: curPage, x: pos.x, y: pos.y, w: 0.5, h: 0.5 }])
      setSelected(id)
    } else if (tool === 'text') {
      e.preventDefault()
      const id = uid()
      setOverlays(p => [...p, { id, type: 'text', page: curPage, x: pos.x, y: pos.y, w: 28, h: 7, text: 'Text', fontSize: 14, color: '#000000', bold: false }])
      setSelected(id)
      setEditingId(id)
      setTool('select')
    } else {
      setSelected(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, curPage])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const pos = toPct(e.clientX, e.clientY)

    if (eraseRef.current) {
      const { id, sx, sy } = eraseRef.current
      setOverlays(p => p.map(o => o.id === id ? {
        ...o, x: Math.min(sx, pos.x), y: Math.min(sy, pos.y),
        w: Math.abs(pos.x - sx), h: Math.abs(pos.y - sy),
      } : o))
    }
    if (dragRef.current) {
      const { id, ox, oy, w, h } = dragRef.current
      setOverlays(p => p.map(o => o.id === id ? {
        ...o,
        x: Math.max(0, Math.min(100 - w, pos.x - ox)),
        y: Math.max(0, Math.min(100 - h, pos.y - oy)),
      } : o))
    }
    if (resizeRef.current) {
      const { id, sx, sy, ow, oh } = resizeRef.current
      setOverlays(p => p.map(o => o.id === id ? {
        ...o,
        w: Math.max(3, ow + pos.x - sx),
        h: Math.max(2, oh + pos.y - sy),
      } : o))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMouseUp = useCallback(() => {
    eraseRef.current  = null
    dragRef.current   = null
    resizeRef.current = null
  }, [])

  const startDrag = (e: React.MouseEvent, ov: Overlay) => {
    if (tool !== 'select') return
    e.stopPropagation()
    e.preventDefault()
    setSelected(ov.id)
    const pos = toPct(e.clientX, e.clientY)
    dragRef.current = { id: ov.id, ox: pos.x - ov.x, oy: pos.y - ov.y, w: ov.w, h: ov.h }
  }

  const startResize = (e: React.MouseEvent, ov: Overlay) => {
    e.stopPropagation()
    e.preventDefault()
    const pos = toPct(e.clientX, e.clientY)
    resizeRef.current = { id: ov.id, sx: pos.x, sy: pos.y, ow: ov.w, oh: ov.h }
  }

  const deleteSelected = () => {
    if (!selected) return
    setOverlays(p => p.filter(o => o.id !== selected))
    setSelected(null)
  }

  const addImage = (src: string) => {
    const id = uid()
    setOverlays(p => [...p, { id, type: 'image', page: curPage, x: 20, y: 20, w: 30, h: 25, src }])
    setSelected(id)
    setTool('select')
  }

  // ── Export ──
  const exportPDF = async () => {
    if (!pages.length) return
    const tid = toast.loading('Exporting PDF…')
    try {
      const { default: jsPDF } = await import('jspdf')
      const f  = pages[0]
      const w0 = f.widthPx / RS
      const h0 = f.heightPx / RS
      const doc = new jsPDF({ orientation: w0 > h0 ? 'landscape' : 'portrait', unit: 'pt', format: [w0, h0] })

      for (let i = 0; i < pages.length; i++) {
        const p   = pages[i]
        const wPt = p.widthPx / RS
        const hPt = p.heightPx / RS
        if (i > 0) doc.addPage([wPt, hPt])

        // Create canvas with page + all overlays for this page
        const canvas = document.createElement('canvas')
        canvas.width  = p.widthPx
        canvas.height = p.heightPx
        const ctx = canvas.getContext('2d')!

        // 1. Draw base page
        await new Promise<void>(res => {
          const img = new Image()
          img.onload = () => { ctx.drawImage(img, 0, 0); res() }
          img.src = p.dataUrl
        })

        // 2. Draw each overlay
        for (const ov of overlays.filter(o => o.page === i)) {
          const ox = (ov.x / 100) * p.widthPx
          const oy = (ov.y / 100) * p.heightPx
          const ow = (ov.w / 100) * p.widthPx
          const oh = (ov.h / 100) * p.heightPx

          if (ov.type === 'erase') {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(ox, oy, ow, oh)
          } else if (ov.type === 'text' && ov.text) {
            const fsPx = (ov.fontSize ?? 14) * RS
            ctx.font      = `${ov.bold ? 'bold ' : ''}${fsPx}px Arial, sans-serif`
            ctx.fillStyle = ov.color ?? '#000000'
            ov.text.split('\n').forEach((line, li) =>
              ctx.fillText(line, ox, oy + fsPx * (li + 1))
            )
          } else if (ov.type === 'image' && ov.src) {
            await new Promise<void>(res => {
              const img = new Image()
              img.onload = () => { ctx.drawImage(img, ox, oy, ow, oh); res() }
              img.src = ov.src!
            })
          }
        }

        // 3. Add flattened page to PDF
        doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, wPt, hPt)
      }

      doc.save(`${pdfName || 'edited'}.pdf`)
      toast.dismiss(tid)
      toast.success('PDF exported!')
    } catch (err) {
      console.error(err)
      toast.dismiss(tid)
      toast.error('Export failed')
    }
  }

  // ── Upload view ──
  if (!pages.length) {
    return (
      <div className="max-w-2xl">
        <h1 className="page-title">PDF Editor</h1>
        <p className="page-subtitle mb-8">
          Edit PDFs locally — add text, images, erase content. Nothing leaves your device.
        </p>

        <div
          className="border-2 border-dashed border-slate-700 rounded-xl p-16 flex flex-col items-center gap-5 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800/20 transition-all"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f?.type === 'application/pdf') loadPDF(f)
            else toast.error('Drop a PDF file')
          }}
        >
          {loading ? (
            <>
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Rendering pages…</p>
            </>
          ) : (
            <>
              <FileText size={48} className="text-slate-600" />
              <div className="text-center">
                <p className="text-slate-300 font-medium">Drop a PDF here or click to browse</p>
                <p className="text-xs text-slate-500 mt-1">
                  100% local — processed in your browser, never uploaded anywhere
                </p>
              </div>
              <button className="btn-primary flex items-center gap-2">
                <Upload size={14} /> Choose PDF
              </button>
            </>
          )}
        </div>

        <div className="mt-6 card bg-slate-900/40 space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 mb-2">What you can do</p>
          {[
            ['🖱️', 'Select & move', 'Click overlays to select, drag to reposition'],
            ['T',  'Add text',     'Click anywhere on the page to place a text box; double-click to edit'],
            ['🖼️', 'Add image',    'Insert a PNG/JPG anywhere on any page'],
            ['⬜', 'Erase',        'Draw a white rectangle over content you want to hide'],
            ['💾', 'Export',       'Saves a new PDF with all your changes baked in'],
          ].map(([icon, label, desc]) => (
            <div key={label} className="flex items-start gap-2.5 py-1">
              <span className="text-sm w-5 text-center shrink-0">{icon}</span>
              <span className="text-xs font-medium text-slate-300 w-20 shrink-0">{label}</span>
              <span className="text-xs text-slate-600">{desc}</span>
            </div>
          ))}
        </div>

        <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadPDF(f); e.target.value = '' }} />
      </div>
    )
  }

  // ── Editor view ──
  const TOOLS: { t: Tool; icon: ReactNode; label: string }[] = [
    { t: 'select', icon: <MousePointer2 size={13} />, label: 'Select' },
    { t: 'text',   icon: <Type size={13} />,          label: 'Add Text' },
    { t: 'image',  icon: <ImageIcon size={13} />,     label: 'Add Image' },
    { t: 'erase',  icon: <Eraser size={13} />,        label: 'Erase' },
  ]

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap shrink-0">
        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-slate-800/60 border border-slate-700/40 rounded-lg p-0.5">
          {TOOLS.map(({ t, icon, label }) => (
            <button
              key={t}
              title={label}
              onClick={() => { setTool(t); if (t === 'image') imgRef.current?.click() }}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all
                ${tool === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-200'}`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 bg-slate-800/60 border border-slate-700/40 rounded-lg p-0.5">
          <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} className="btn-ghost py-1 px-1.5">
            <ZoomOut size={12} />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} className="btn-ghost py-1 px-1.5">
            <ZoomIn size={12} />
          </button>
        </div>

        <span className="text-xs text-slate-600 truncate max-w-[180px]">{pdfName}.pdf</span>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          {selected && (
            <button onClick={deleteSelected} className="btn-ghost px-2 text-red-400 text-xs flex items-center gap-1">
              <Trash2 size={11} /> Delete
            </button>
          )}
          <button onClick={exportPDF} className="btn-primary text-xs flex items-center gap-1.5">
            <Download size={13} /> Export PDF
          </button>
          <button onClick={() => { setPages([]); setOverlays([]); setPdfName('') }} className="btn-ghost px-2" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">

        {/* ── Page thumbnails ── */}
        <div className="w-[68px] shrink-0 flex flex-col gap-1.5 overflow-y-auto pb-2">
          {pages.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurPage(i)}
              className={`rounded border overflow-hidden transition-all
                ${i === curPage
                  ? 'border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : 'border-slate-700/40 opacity-50 hover:opacity-80'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt={`p${i + 1}`} className="w-full block" />
              <p className="text-[9px] text-slate-600 py-0.5 text-center">{i + 1}</p>
            </button>
          ))}
        </div>

        {/* ── Canvas area ── */}
        <div className="flex-1 overflow-auto bg-slate-950/60 rounded-xl border border-slate-800/30">
          <div className="flex justify-center p-6">
            <div
              ref={contRef}
              className="relative shadow-2xl select-none"
              style={{
                width: displayW, height: displayH, flexShrink: 0,
                cursor: tool === 'erase' ? 'crosshair' : tool === 'text' ? 'text' : 'default',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {/* Base page image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={pageImgRef}
                src={pg.dataUrl}
                alt="page"
                style={{ width: displayW, height: displayH, display: 'block', pointerEvents: 'none', userSelect: 'none' }}
                draggable={false}
              />

              {/* Overlays */}
              {curOverlays.map(ov => {
                const isSel = ov.id === selected
                return (
                  <div
                    key={ov.id}
                    style={{
                      position: 'absolute',
                      left: `${ov.x}%`, top: `${ov.y}%`,
                      width: `${ov.w}%`, height: `${ov.h}%`,
                      zIndex: isSel ? 10 : 5,
                      cursor: tool === 'select' ? 'move' : 'default',
                    }}
                    onMouseDown={e => startDrag(e, ov)}
                    onClick={e => { e.stopPropagation(); if (tool === 'select') setSelected(ov.id) }}
                  >
                    {/* Erase box */}
                    {ov.type === 'erase' && (
                      <div
                        className="w-full h-full bg-white"
                        style={{ outline: isSel ? '2px dashed #ef4444' : '1px dashed #94a3b840' }}
                      />
                    )}

                    {/* Text */}
                    {ov.type === 'text' && (
                      editingId === ov.id ? (
                        <textarea
                          autoFocus
                          className="w-full h-full bg-transparent resize-none p-0.5 focus:outline-none"
                          style={{
                            color: ov.color ?? '#000',
                            fontSize: `${ov.fontSize ?? 14}pt`,
                            fontWeight: ov.bold ? 'bold' : 'normal',
                            outline: '2px solid #22d3ee',
                            boxSizing: 'border-box',
                            border: 'none',
                          }}
                          value={ov.text ?? ''}
                          onChange={e => updOv(ov.id, { text: e.target.value })}
                          onMouseDown={e => e.stopPropagation()}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                        />
                      ) : (
                        <div
                          style={{
                            color: ov.color ?? '#000',
                            fontSize: `${ov.fontSize ?? 14}pt`,
                            fontWeight: ov.bold ? 'bold' : 'normal',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            width: '100%', height: '100%',
                            overflow: 'hidden',
                            outline: isSel ? '2px solid #22d3ee' : '1px dashed #22d3ee30',
                            padding: '1px', boxSizing: 'border-box',
                          }}
                          onDoubleClick={e => { e.stopPropagation(); setEditingId(ov.id) }}
                        >
                          {ov.text}
                        </div>
                      )
                    )}

                    {/* Image */}
                    {ov.type === 'image' && ov.src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ov.src}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', outline: isSel ? '2px solid #22d3ee' : 'none' }}
                        draggable={false}
                      />
                    )}

                    {/* Resize handle */}
                    {isSel && (
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-sm z-20"
                        style={{ cursor: 'se-resize', transform: 'translate(50%, 50%)' }}
                        onMouseDown={e => startResize(e, ov)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Properties panel ── */}
        {selOv && (
          <div className="w-44 shrink-0 space-y-3 overflow-y-auto">
            <p className="section-label capitalize">{selOv.type} options</p>

            {selOv.type === 'text' && (
              <>
                <div>
                  <p className="text-[10px] text-slate-600 mb-1">Font size (pt)</p>
                  <input
                    type="number" className="input w-full text-xs" min={6} max={144}
                    value={selOv.fontSize ?? 14}
                    onChange={e => updOv(selected!, { fontSize: +e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 mb-1">Color</p>
                  <input
                    type="color"
                    className="w-full h-7 rounded border border-slate-700 bg-slate-800 cursor-pointer"
                    value={selOv.color ?? '#000000'}
                    onChange={e => updOv(selected!, { color: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox" checked={selOv.bold ?? false} className="accent-cyan-500"
                    onChange={e => updOv(selected!, { bold: e.target.checked })}
                  />
                  Bold
                </label>
                <button className="btn-ghost text-xs w-full" onClick={() => setEditingId(selected)}>
                  Edit text
                </button>
              </>
            )}

            <div>
              <p className="text-[10px] text-slate-600 mb-1.5">Position & size (%)</p>
              <div className="grid grid-cols-2 gap-1">
                {(['x', 'y', 'w', 'h'] as const).map(k => (
                  <div key={k}>
                    <p className="text-[9px] text-slate-700 uppercase mb-0.5">{k}</p>
                    <input
                      type="number" className="input text-[10px] px-1.5 py-1 w-full" min={0} max={100}
                      value={Math.round(selOv[k])}
                      onChange={e => {
                        const patch: Partial<Overlay> = {}
                        patch[k] = +e.target.value
                        updOv(selected!, patch)
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-700 mt-1">% of page dimensions</p>
            </div>

            <button
              onClick={deleteSelected}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-red-400 btn-ghost"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        )}
      </div>

      {/* ── Page navigation ── */}
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3 shrink-0">
          <button
            onClick={() => setCurPage(p => Math.max(0, p - 1))}
            disabled={curPage === 0}
            className="btn-ghost px-2 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-slate-500">Page {curPage + 1} / {pages.length}</span>
          <button
            onClick={() => setCurPage(p => Math.min(pages.length - 1, p + 1))}
            disabled={curPage === pages.length - 1}
            className="btn-ghost px-2 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={imgRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (!f) return
          const r = new FileReader()
          r.onload = ev => { const s = ev.target?.result as string; if (s) addImage(s) }
          r.readAsDataURL(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
