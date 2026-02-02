import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'

export default function SheetPage() {
  const router = useRouter()
  const sheetId = router.query.id

  const [user, setUser] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [sheetName, setSheetName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [newColumnName, setNewColumnName] = useState('')
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (!sheetId) return

    checkAuthAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, sheetId])

  async function checkAuthAndLoad() {
    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
      router.push('/login')
      return
    }

    setUser(data.session.user)
    await loadSheet(data.session.user.id, sheetId)
  }

  async function loadSheet(userId, id) {
    setPageError('')

    const { data: sheetData, error: sheetError } = await supabase
      .from('sheets')
      .select('*')
      .eq('id', id)
      .single()

    if (sheetError || !sheetData) {
      setPageError('Sheet not found')
      return
    }

    // If your RLS already handles this, this is just a friendly guard.
    if (sheetData.user_id && sheetData.user_id !== userId) {
      setPageError('Access denied')
      return
    }

    setSheet(sheetData)
    setSheetName(sheetData.name || '')

    // Load columns
    const { data: colData } = await supabase
      .from('sheet_columns')
      .select('*')
      .eq('sheet_id', id)
      .order('"order"', { ascending: true })
    setColumns(colData || [])

    // Load rows
    const { data: rowData } = await supabase
      .from('sheet_rows')
      .select('*')
      .eq('sheet_id', id)
      .order('row_number', { ascending: true })
    setRows(rowData || [])
  }

  async function updateSheetName() {
    if (!sheetName.trim() || !sheet) return

    await supabase.from('sheets').update({ name: sheetName }).eq('id', sheet.id)

    setSheet({ ...sheet, name: sheetName })
    setEditingName(false)
  }

  async function addColumn() {
    if (!newColumnName.trim() || !sheet) return

    const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order || 0)) : 0

    await supabase.from('sheet_columns').insert([
      {
        sheet_id: sheet.id,
        name: newColumnName,
        "order": maxOrder + 1,
      },
    ])

    setNewColumnName('')
    setShowColumnDialog(false)
    await loadSheet(user?.id, sheet.id)
  }

  async function deleteColumn(colId) {
    if (!sheet) return
    await supabase.from('sheet_columns').delete().eq('id', colId)
    await loadSheet(user?.id, sheet.id)
  }

  async function addRow() {
    if (!sheet || columns.length === 0) return

    const maxRow = rows.length > 0 ? Math.max(...rows.map(r => r.row_number)) : 0
    const newData = {}
    columns.forEach(col => {
      newData[`col_${col.id}`] = ''
    })

    const { error } = await supabase
      .from('sheet_rows')
      .insert([
        {
          sheet_id: sheet.id,
          row_number: maxRow + 1,
          data: newData,
        },
      ])

    if (!error) {
      await loadSheet(user?.id, sheet.id)
    }
  }

  async function updateCell(rowId, colId, value) {
    const row = rows.find(r => r.id === rowId)
    if (!row) return

    const updated = { ...row.data, [`col_${colId}`]: value }

    await supabase.from('sheet_rows').update({ data: updated }).eq('id', rowId)

    setRows(rows.map(r => (r.id === rowId ? { ...r, data: updated } : r)))
  }

  async function deleteRow(rowId) {
    if (!sheet) return
    await supabase.from('sheet_rows').delete().eq('id', rowId)
    await loadSheet(user?.id, sheet.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded p-6 space-y-4">
          <h1 className="text-xl font-bold">{pageError}</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!sheet) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Editor Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-4 px-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-400 hover:text-white text-2xl p-2 rounded hover:bg-slate-800"
                title="Back"
              >
                ←
              </button>

              {editingName ? (
                <input
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  onBlur={updateSheetName}
                  onKeyPress={e => e.key === 'Enter' && updateSheetName()}
                  autoFocus
                  className="bg-slate-800 text-white px-4 py-2 rounded text-2xl font-bold border border-slate-700"
                />
              ) : (
                <h1
                  onClick={() => setEditingName(true)}
                  className="text-2xl font-bold cursor-pointer hover:text-slate-300 flex items-center space-x-2"
                >
                  <span>{sheetName || 'Untitled'}</span>
                  <span className="text-base">✎</span>
                </h1>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={async () => {
                  if (!sheet) return
                  await supabase.from('sheets').update({ is_public: true }).eq('id', sheet.id)
                  const link = `${window.location.origin}/share?sheetId=${sheet.id}`
                  try {
                    await navigator.clipboard.writeText(link)
                  } catch (e) {}
                  alert('Public link copied!')
                }}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm flex items-center space-x-2"
              >
                <span>🔗</span>
                <span>Create Public Link</span>
              </button>

              <button
                onClick={() => router.push(`/share?sheetId=${sheet?.id}`)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm flex items-center space-x-2"
              >
                <span>👥</span>
                <span>Manage Access</span>
              </button>

              <button
                onClick={() => setShowDeleteConfirm('sheet')}
                className="px-3 py-2 bg-red-600 rounded hover:bg-red-700 text-sm text-white"
              >
                🗑️ Delete Sheet
              </button>

              <button
                onClick={logout}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Toolbar - Row 2 */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowColumnDialog(true)}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-semibold flex items-center space-x-2"
            >
              <span>⚙️</span>
              <span>Manage Columns</span>
            </button>

            <button
              onClick={addRow}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm"
            >
              + New Row
            </button>

            <button
              onClick={async () => {
                if (!sheet) return
                const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order || 0)) : 0
                const { data } = await supabase
                  .from('sheet_columns')
                  .insert([{ sheet_id: sheet.id, name: 'Status', "order": maxOrder + 1 }])
                  .select()

                if (data && data[0]) {
                  const colId = data[0].id
                  for (const r of rows) {
                    const updated = { ...r.data, [`col_${colId}`]: 'Done' }
                    await supabase.from('sheet_rows').update({ data: updated }).eq('id', r.id)
                  }
                  await loadSheet(user?.id, sheet.id)
                }
              }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm"
            >
              Add Status Column
            </button>

            <button
              onClick={async () => {
                await updateSheetName()
                await loadSheet(user?.id, sheet.id)
              }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm"
            >
              Save
            </button>

            <div className="ml-auto px-3 py-2 bg-emerald-100 text-emerald-800 rounded text-sm font-medium">
              Auto-save: On
            </div>

            <button
              onClick={async () => {
                const header = ['#', ...columns.map(c => c.name)].join(',')
                const csvRows = [header]
                rows.forEach((r, idx) => {
                  const values = columns.map(c => {
                    const val = (r.data?.[`col_${c.id}`] || '').toString()
                    return val.includes(',') ? `"${val.replace(/"/g, '""')}"` : val
                  })
                  csvRows.push([idx + 1, ...values].join(','))
                })
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${sheet.name || 'sheet'}.csv`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm"
            >
              Export to Excel
            </button>

            <label className="px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-sm cursor-pointer">
              Import Excel
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file || !sheet) return
                  const text = await file.text()
                  const lines = text.split(/\r?\n/).filter(Boolean)
                  if (lines.length <= 1) return
                  const cols = columns
                  for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').slice(1)
                    const dataObj = {}
                    for (let j = 0; j < cols.length; j++) {
                      dataObj[`col_${cols[j].id}`] = values[j]
                        ? values[j].replace(/^"|"$/g, '')
                        : ''
                    }
                    const maxRow = rows.length > 0 ? Math.max(...rows.map(r => r.row_number)) : 0
                    await supabase.from('sheet_rows').insert([
                      {
                        sheet_id: sheet.id,
                        row_number: maxRow + 1 + (i - 1),
                        data: dataObj,
                      },
                    ])
                  }
                  await loadSheet(user?.id, sheet.id)
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <input
            type="text"
            placeholder="Search across all fields..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white px-4 py-2 rounded border border-slate-700 placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Manage Columns Dialog */}
      {showColumnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto border border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Manage Columns</h3>

            <div className="space-y-2 mb-4">
              {columns.map(col => (
                <div key={col.id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                  <span className="truncate">{col.name}</span>
                  <button
                    onClick={async () => {
                      await deleteColumn(col.id)
                      setShowColumnDialog(false)
                    }}
                    className="text-red-400 hover:text-red-300 text-sm ml-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <input
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addColumn()}
                placeholder="New column name"
                className="w-full bg-slate-700 px-4 py-2 rounded text-white placeholder-slate-400 border border-slate-600"
              />
              <div className="flex space-x-2">
                <button
                  onClick={addColumn}
                  disabled={!newColumnName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-semibold disabled:bg-slate-600"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowColumnDialog(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 rounded hover:bg-slate-500 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-slate-400 mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  if (!sheet) return
                  await supabase.from('sheets').delete().eq('id', sheet.id)
                  setShowDeleteConfirm(null)
                  router.push('/dashboard')
                }}
                className="flex-1 px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-sm font-semibold"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-600 rounded hover:bg-slate-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="border border-slate-700 rounded overflow-hidden bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-700 border-b border-slate-600">
                    <th className="p-3 text-left font-semibold w-12 text-white">#</th>
                    {columns.map(col => (
                      <th
                        key={col.id}
                        className="p-3 text-left font-semibold border-l border-slate-600 min-w-48 text-white"
                      >
                        <div className="flex items-center justify-between">
                          <span>{col.name}</span>
                          <span className="text-slate-400">⬍</span>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center w-12 border-l border-slate-600 text-white">✕</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const matches =
                      !searchTerm ||
                      columns.some(col =>
                        (row.data?.[`col_${col.id}`] || '')
                          .toString()
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                    if (!matches) return null

                    return (
                      <tr key={row.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        {columns.map(col => (
                          <td key={col.id} className="p-3 border-l border-slate-700">
                            <input
                              value={row.data?.[`col_${col.id}`] || ''}
                              onChange={e => updateCell(row.id, col.id, e.target.value)}
                              className="w-full bg-slate-800 text-white text-sm p-2 rounded border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                        <td className="p-3 text-center border-l border-slate-700">
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-semibold"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
