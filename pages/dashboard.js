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
  const [activeTab, setActiveTab] = useState('sheets')

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
}
