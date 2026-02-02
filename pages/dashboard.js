import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard(){
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sheets, setSheets] = useState([])
  const [selectedSheet, setSelectedSheet] = useState(null)
  const [sheetName, setSheetName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [newColumnName, setNewColumnName] = useState('')
  const [showNewSheetDialog, setShowNewSheetDialog] = useState(false)
  const [newSheetName, setNewSheetName] = useState('')
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push('/login')
    } else {
      setUser(data.session.user)
      loadSheets(data.session.user.id)
    }
  }

  async function loadSheets(userId) {
    const { data, error } = await supabase
      .from('sheets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    else {
      setSheets(data || [])
      if (data && data.length > 0) {
        selectSheet(data[0])
      }
    }
  }

  async function selectSheet(sheet) {
    setSelectedSheet(sheet)
    setSheetName(sheet.name)
    
    // Load columns
    const { data: colData } = await supabase
      .from('sheet_columns')
      .select('*')
      .eq('sheet_id', sheet.id)
      .order('"order"', { ascending: true })
    setColumns(colData || [])

    // Load rows
    const { data: rowData } = await supabase
      .from('sheet_rows')
      .select('*')
      .eq('sheet_id', sheet.id)
      .order('row_number', { ascending: true })
    setRows(rowData || [])
  }

  async function createNewSheet() {
    if (!newSheetName.trim()) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('sheets')
      .insert([{ user_id: user.id, name: newSheetName, is_public: false }])
      .select()
    
    if (!error && data) {
      // Create default columns
      const defaultCols = ['Column 1', 'Column 2', 'Column 3']
      await supabase.from('sheet_columns').insert(
        defaultCols.map((col, i) => ({
          sheet_id: data[0].id,
          name: col,
          "order": i
        }))
      )
      loadSheets(user.id)
      setShowNewSheetDialog(false)
      setNewSheetName('')
    }
    setLoading(false)
  }

  async function updateSheetName() {
    if (!sheetName.trim() || !selectedSheet) return
    
    await supabase
      .from('sheets')
      .update({ name: sheetName })
      .eq('id', selectedSheet.id)
    
    loadSheets(user.id)
    setEditingName(false)
  }

  async function addColumn() {
    if (!newColumnName.trim() || !selectedSheet) return
    
    const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) : 0
    
    await supabase
      .from('sheet_columns')
      .insert([{
        sheet_id: selectedSheet.id,
        name: newColumnName,
        "order": maxOrder + 1
      }])
    
    setNewColumnName('')
    setShowColumnDialog(false)
    selectSheet(selectedSheet)
  }

  async function deleteColumn(colId) {
    await supabase.from('sheet_columns').delete().eq('id', colId)
    selectSheet(selectedSheet)
  }

  async function addRow() {
    if (!selectedSheet || columns.length === 0) return
    
    const maxRow = rows.length > 0 ? Math.max(...rows.map(r => r.row_number)) : 0
    const newData = {}
    columns.forEach(col => {
      newData[`col_${col.id}`] = ''
    })

    const { data, error } = await supabase
      .from('sheet_rows')
      .insert([{
        sheet_id: selectedSheet.id,
        row_number: maxRow + 1,
        data: newData
      }])
      .select()
    
    if (!error) {
      selectSheet(selectedSheet)
    }
  }

  async function updateCell(rowId, colId, value) {
    const row = rows.find(r => r.id === rowId)
    if (!row) return
    
    const updated = { ...row.data, [`col_${colId}`]: value }
    
    await supabase
      .from('sheet_rows')
      .update({ data: updated })
      .eq('id', rowId)
    
    setRows(rows.map(r => r.id === rowId ? { ...r, data: updated } : r))
  }

  async function deleteRow(rowId) {
    await supabase.from('sheet_rows').delete().eq('id', rowId)
    selectSheet(selectedSheet)
  }

  async function deleteSheet() {
    if (!selectedSheet || !confirm('Delete this sheet?')) return
    
    await supabase.from('sheets').delete().eq('id', selectedSheet.id)
    loadSheets(user.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const [activeTab, setActiveTab] = useState('sheets')
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="bg-slate-900 border-b border-slate-800 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <button onClick={logout} className="text-sm px-4 py-2 bg-red-600 rounded hover:bg-red-700 whitespace-nowrap">
              Logout
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 overflow-x-auto">
            {['sheets', 'trackers', 'reserve', 'settlement', 'material'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}>
                {tab === 'sheets' && '📋 Sheets'}
                {tab === 'trackers' && '⚙️ Trackers'}
                {tab === 'reserve' && '📅 Reserve Tracker'}
                {tab === 'settlement' && '💰 Settlement Tracker'}
                {tab === 'material' && '📦 Material'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'sheets' && (
          <div>
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Your Sheets</h2>
              <button
                onClick={() => setShowNewSheetDialog(true)}
                className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 font-medium flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create New Sheet</span>
              </button>
            </div>

            {/* New Sheet Dialog */}
            {showNewSheetDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">New Sheet</h3>
                  <input
                    value={newSheetName}
                    onChange={e => setNewSheetName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && createNewSheet()}
                    placeholder="Sheet name"
                    autoFocus
                    className="w-full bg-slate-700 px-4 py-2 rounded text-white placeholder-slate-400 mb-4 border border-slate-600"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={createNewSheet}
                      disabled={loading || !newSheetName.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-semibold disabled:bg-slate-600"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => setShowNewSheetDialog(false)}
                      className="flex-1 px-4 py-2 bg-slate-600 rounded hover:bg-slate-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sheets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sheets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400 mb-4">No sheets yet. Create one to get started.</p>
                </div>
              ) : (
                sheets.map(sheet => (
                  <div
                    key={sheet.id}
                    className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-white flex-1">{sheet.name}</h3>
                      <button
                        onClick={() => {
                          // open delete confirmation and delete
                          if (confirm('Delete this sheet?')) {
                            supabase.from('sheets').delete().eq('id', sheet.id)
                            loadSheets(user.id)
                          }
                        }}
                        className="text-slate-400 hover:text-red-400 ml-2"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="space-y-1 text-sm text-slate-400">
                      <p>Created {new Date(sheet.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
                      <p>Last updated {new Date(sheet.updated_at || sheet.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSheet(sheet)
                        selectSheet(sheet)
                      }}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-medium text-sm"
                    >
                      Open Sheet
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Other tabs - Placeholder */}
        {activeTab !== 'sheets' && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Coming soon...</p>
          </div>
        )}

        {/* Sheet Editor - When selected */}
        {selectedSheet && activeTab === 'sheets' && (
          <div className="fixed inset-0 bg-slate-950 bg-opacity-95 backdrop-blur z-40 flex flex-col overflow-hidden">
            {/* Editor Header */}
            <div className="bg-slate-900 border-b border-slate-800 py-4 px-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedSheet(null)}
                    className="text-slate-400 hover:text-white text-2xl"
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
                      className="text-2xl font-bold cursor-pointer hover:text-slate-300"
                    >
                      {sheetName || 'Untitled'} ✎
                    </h1>
                  )}
                </div>
                <button
                  onClick={() => setSelectedSheet(null)}
                  className="text-2xl text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Editor Toolbar */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={addRow}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-semibold"
                >
                  + Row
                </button>
                <button
                  onClick={() => setShowColumnDialog(true)}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-semibold"
                >
                  Columns
                </button>
                <button
                  onClick={async () => {
                    if (!selectedSheet) return
                    if (!confirm('Delete this sheet?')) return
                    await supabase.from('sheets').delete().eq('id', selectedSheet.id)
                    setSelectedSheet(null)
                    loadSheets(user.id)
                  }}
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-sm font-semibold ml-auto"
                >
                  Delete Sheet
                </button>
              </div>
            </div>

            {/* Column Manager Dialog */}
            {showColumnDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">Manage Columns</h3>

                  <div className="space-y-2 mb-4">
                    {columns.map(col => (
                      <div key={col.id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                        <span className="truncate">{col.name}</span>
                        <button
                          onClick={() => deleteColumn(col.id)}
                          className="text-red-400 hover:text-red-300 text-sm ml-2 whitespace-nowrap"
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

            {/* Table */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="border border-slate-700 rounded overflow-hidden">
                <table className="w-full border-collapse bg-slate-800 text-sm">
                  <thead>
                    <tr className="bg-slate-700 border-b border-slate-600">
                      <th className="p-3 text-left font-semibold w-12">#</th>
                      {columns.map(col => (
                        <th key={col.id} className="p-3 text-left font-semibold border-l border-slate-600 min-w-40">
                          {col.name}
                        </th>
                      ))}
                      <th className="p-3 text-center w-12 border-l border-slate-600">✕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        {columns.map(col => (
                          <td key={col.id} className="p-3 border-l border-slate-700">
                            <input
                              value={row.data?.[`col_${col.id}`] || ''}
                              onChange={e => updateCell(row.id, col.id, e.target.value)}
                              className="w-full bg-slate-700 text-white text-sm p-2 rounded border-0 outline-none focus:ring-1 focus:ring-blue-500"
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
