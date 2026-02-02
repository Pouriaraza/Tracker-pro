import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Sheet({ projectId }) {
  const [rows, setRows] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  async function fetchData() {
    const { data, error } = await supabase
      .from('tracker_items')
      .select('*')
      .eq('project_id', projectId)
      .order('id', { ascending: true })
    
    if (error) console.error(error)
    else setRows(data || [])
  }

  async function addRow() {
    if (!newTitle.trim()) return
    setLoading(true)
    
    const { data, error } = await supabase
      .from('tracker_items')
      .insert([{ project_id: projectId, title: newTitle, value: newValue }])
      .select()
    
    if (!error) {
      setRows([...rows, data[0]])
      setNewTitle('')
      setNewValue('')
    }
    setLoading(false)
  }

  async function deleteRow(id) {
    await supabase.from('tracker_items').delete().eq('id', id)
    setRows(rows.filter(r => r.id !== id))
  }

  async function updateRow(id, field, value) {
    await supabase.from('tracker_items').update({ [field]: value }).eq('id', id)
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3">Tracking Sheet</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Value</th>
              <th className="border p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="border p-2">
                  <input 
                    value={row.title} 
                    onChange={e => updateRow(row.id, 'title', e.target.value)}
                    className="w-full border-0 outline-none"
                  />
                </td>
                <td className="border p-2">
                  <input 
                    value={row.value} 
                    onChange={e => updateRow(row.id, 'value', e.target.value)}
                    type="number"
                    className="w-full border-0 outline-none"
                  />
                </td>
                <td className="border p-2 text-center">
                  <button 
                    onClick={() => deleteRow(row.id)}
                    className="text-red-600 text-sm font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="border p-2">
                <input 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border-0 outline-none bg-transparent"
                  placeholder="New item..."
                />
              </td>
              <td className="border p-2">
                <input 
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  type="number"
                  className="w-full border-0 outline-none bg-transparent"
                  placeholder="0"
                />
              </td>
              <td className="border p-2 text-center">
                <button 
                  onClick={addRow}
                  disabled={loading}
                  className="text-green-600 text-sm font-semibold disabled:text-gray-400"
                >
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
