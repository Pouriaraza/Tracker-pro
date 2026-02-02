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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-xl">←</button>
            {editingName && selectedSheet ? (
              <input
                value={sheetName}
                onChange={e => setSheetName(e.target.value)}
                onBlur={updateSheetName}
                onKeyPress={e => e.key === 'Enter' && updateSheetName()}
                autoFocus
                className="bg-gray-700 text-white px-3 py-1 rounded text-lg font-semibold"
              />
            ) : (
              <h1 
                onClick={() => setEditingName(true)}
                className="text-xl sm:text-2xl font-bold cursor-pointer hover:text-gray-300 truncate"
              >
                {sheetName || 'Untitled'} ✎
              </h1>
            )}
          </div>
          <button onClick={logout} className="text-sm px-3 py-1 bg-red-600 rounded hover:bg-red-700 whitespace-nowrap">
            Logout
          </button>
        </div>
      </nav>

      {/* Toolbar */}
      {selectedSheet && (
        <div className="bg-gray-800 border-b border-gray-700 py-3 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
            <button 
              onClick={addRow}
              className="px-3 sm:px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-semibold whitespace-nowrap"
            >
              + Row
            </button>
            <button 
              onClick={() => setShowColumnDialog(true)}
              className="px-3 sm:px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-semibold whitespace-nowrap"
            >
              Columns
            </button>
            <button 
              onClick={deleteSheet}
              className="px-3 sm:px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-sm font-semibold ml-auto whitespace-nowrap"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!selectedSheet ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No sheets yet</p>
            <button
              onClick={() => setShowNewSheetDialog(true)}
              className="px-6 py-3 bg-green-600 rounded hover:bg-green-700 font-semibold"
            >
              Create First Sheet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* New Sheet Dialog */}
            {showNewSheetDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">New Sheet</h3>
                  <input
                    value={newSheetName}
                    onChange={e => setNewSheetName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && createNewSheet()}
                    placeholder="Sheet name"
                    autoFocus
                    className="w-full bg-gray-700 px-3 py-2 rounded text-white placeholder-gray-400 mb-4"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={createNewSheet}
                      disabled={loading || !newSheetName.trim()}
                      className="flex-1 px-3 py-2 bg-green-600 rounded hover:bg-green-700 text-sm font-semibold disabled:bg-gray-600"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => setShowNewSheetDialog(false)}
                      className="flex-1 px-3 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Column Manager Dialog */}
            {showColumnDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded p-6 max-w-md w-full max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-4">Manage Columns</h3>
                  
                  <div className="space-y-2 mb-4">
                    {columns.map(col => (
                      <div key={col.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
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
                      className="w-full bg-gray-700 px-3 py-2 rounded text-white placeholder-gray-400"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={addColumn}
                        disabled={!newColumnName.trim()}
                        className="flex-1 px-3 py-2 bg-green-600 rounded hover:bg-green-700 text-sm font-semibold disabled:bg-gray-600"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowColumnDialog(false)}
                        className="flex-1 px-3 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table - Responsive */}
            <div className="overflow-x-auto border border-gray-700 rounded">
              <table className="w-full border-collapse bg-gray-800 text-sm">
                <thead>
                  <tr className="bg-gray-700 border-b border-gray-600">
                    <th className="p-2 text-left font-semibold w-12">#</th>
                    {columns.map(col => (
                      <th key={col.id} className="p-2 text-left font-semibold border-l border-gray-600 min-w-32">
                        {col.name}
                      </th>
                    ))}
                    <th className="p-2 text-center w-12 border-l border-gray-600">✕</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="p-2 text-gray-400">{idx + 1}</td>
                      {columns.map(col => (
                        <td key={col.id} className="p-2 border-l border-gray-700">
                          <input
                            value={row.data?.[`col_${col.id}`] || ''}
                            onChange={e => updateCell(row.id, col.id, e.target.value)}
                            className="w-full bg-gray-700 text-white text-sm p-1 rounded border-0 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center border-l border-gray-700">
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
        )}
      </div>

      {/* Sidebar - Sheet List */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto hidden md:block">
        <h2 className="font-semibold mb-4 mt-20">Your Sheets</h2>
        <div className="space-y-2 mb-4">
          {sheets.map(sheet => (
            <button
              key={sheet.id}
              onClick={() => selectSheet(sheet)}
              className={`w-full text-left p-2 rounded text-sm truncate ${
                selectedSheet?.id === sheet.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewSheetDialog(true)}
          disabled={loading}
          className="w-full px-3 py-2 bg-green-600 rounded hover:bg-green-700 text-sm font-semibold disabled:bg-gray-600"
        >
          + New Sheet
        </button>
      </div>

      {/* Mobile Sheet Selector */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 md:hidden z-20">
        <select
          value={selectedSheet?.id || ''}
          onChange={e => {
            const sheet = sheets.find(s => s.id === e.target.value)
            if (sheet) selectSheet(sheet)
          }}
          className="w-full bg-gray-700 text-white p-2 rounded"
        >
          <option value="">Select Sheet...</option>
          {sheets.map(sheet => (
            <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .md\:block {
          display: block;
        }
        @media (max-width: 768px) {
          .md\:block {
            display: none;
          }
          .md\:hidden {
            display: block;
          }
        }
      `}</style>
    </div>
  )
}
