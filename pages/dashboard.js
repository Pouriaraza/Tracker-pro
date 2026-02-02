import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sheets, setSheets] = useState([])
  const [showNewSheetDialog, setShowNewSheetDialog] = useState(false)
  const [newSheetName, setNewSheetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('sheets')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
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
    else setSheets(data || [])
  }

  async function createNewSheet() {
    if (!newSheetName.trim() || !user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('sheets')
      .insert([{ user_id: user.id, name: newSheetName, is_public: false }])
      .select()

    if (!error && data?.[0]) {
      // Create default columns
      const defaultCols = ['Column 1', 'Column 2', 'Column 3']
      await supabase.from('sheet_columns').insert(
        defaultCols.map((col, i) => ({
          sheet_id: data[0].id,
          name: col,
          "order": i,
        }))
      )

      setShowNewSheetDialog(false)
      setNewSheetName('')
      await loadSheets(user.id)

      // Open the new sheet in its own page
      router.push(`/sheets/${data[0].id}`)
    }

    setLoading(false)
  }

  async function deleteSheet(sheetId) {
    if (!user) return
    if (!confirm('Delete this sheet?')) return

    await supabase.from('sheets').delete().eq('id', sheetId)
    await loadSheets(user.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="bg-slate-900 border-b border-slate-800 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <button
              onClick={logout}
              className="text-sm px-4 py-2 bg-red-600 rounded hover:bg-red-700 whitespace-nowrap"
            >
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
                }`}
              >
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
                        onClick={() => deleteSheet(sheet.id)}
                        className="text-slate-400 hover:text-red-400 ml-2"
                        title="Delete sheet"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="space-y-1 text-sm text-slate-400">
                      <p>
                        Created{' '}
                        {new Date(sheet.created_at).toLocaleDateString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        Last updated{' '}
                        {new Date(sheet.updated_at || sheet.created_at).toLocaleDateString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/sheets/${sheet.id}`)}
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
      </div>
    </div>
  )
}
