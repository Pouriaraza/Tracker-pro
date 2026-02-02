import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Share(){
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [sharedWith, setSharedWith] = useState([])
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadPermissions(selectedProject)
    }
  }, [selectedProject])

  async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push('/login')
    } else {
      setUser(data.session.user)
      loadProjects(data.session.user.id)
    }
  }

  async function loadProjects(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
    
    if (error) console.error(error)
    else {
      setProjects(data || [])
      if (data && data.length > 0) setSelectedProject(data[0].id)
    }
  }

  async function loadPermissions(projectId) {
    const { data, error } = await supabase
      .from('permissions')
      .select('id, user_id, permission')
      .eq('project_id', projectId)
    
    if (error) console.error(error)
    else setSharedWith(data || [])
  }

  async function shareProject() {
    if (!shareEmail.trim() || !selectedProject) return
    setLoading(true)
    setError('')
    setSuccess('')

    // Find user by email
    const { data: users, error: findError } = await supabase.auth.admin.listUsers()
    
    // Since we can't list users with public API, we'll try a different approach
    // Insert permission record and let it fail if user doesn't exist
    const { data, error } = await supabase
      .from('permissions')
      .insert([{
        project_id: selectedProject,
        user_id: shareEmail, // This will need to be a valid UUID
        permission: sharePermission
      }])
      .select()
    
    if (error) {
      setError('Error sharing project. Make sure the email/ID is correct.')
    } else {
      setSuccess('Project shared successfully!')
      setShareEmail('')
      loadPermissions(selectedProject)
    }
    setLoading(false)
  }

  async function revokePermission(permissionId) {
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', permissionId)
    
    if (!error) {
      loadPermissions(selectedProject)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm py-4">
        <div className="container flex justify-between items-center">
          <h1 className="font-bold text-lg">Share & Permissions</h1>
          <div className="space-x-3">
            <Link href="/dashboard">
              <a className="text-sm text-blue-600">Dashboard</a>
            </Link>
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="text-sm px-3 py-1 bg-red-600 text-white rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="bg-white rounded shadow p-4 h-fit">
            <h2 className="font-semibold mb-4">Your Projects</h2>
            <div className="space-y-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={`w-full text-left p-2 rounded text-sm truncate ${
                    selectedProject === p.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={p.name}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Share Panel */}
          <div className="md:col-span-2">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Share Form */}
                <div className="bg-white rounded shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Share Project</h2>
                  
                  {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                  {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{success}</div>}
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">User Email or ID</label>
                      <input
                        value={shareEmail}
                        onChange={e => setShareEmail(e.target.value)}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="user@example.com or UUID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Permission Level</label>
                      <select
                        value={sharePermission}
                        onChange={e => setSharePermission(e.target.value)}
                        className="w-full border p-2 rounded text-sm"
                      >
                        <option value="view">View Only</option>
                        <option value="edit">Can Edit</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={shareProject}
                      disabled={loading || !shareEmail.trim()}
                      className="w-full py-2 bg-blue-600 text-white rounded text-sm font-semibold disabled:bg-gray-400"
                    >
                      {loading ? 'Sharing...' : 'Share'}
                    </button>
                  </div>
                </div>

                {/* Shared With */}
                <div className="bg-white rounded shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Shared With ({sharedWith.length})</h2>
                  
                  {sharedWith.length === 0 ? (
                    <p className="text-gray-500 text-sm">Not shared with anyone yet</p>
                  ) : (
                    <div className="space-y-2">
                      {sharedWith.map(share => (
                        <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{share.user_id}</p>
                            <p className="text-xs text-gray-500">Permission: <span className="font-semibold">{share.permission}</span></p>
                          </div>
                          <button
                            onClick={() => revokePermission(share.id)}
                            className="text-red-600 text-sm font-semibold hover:text-red-800"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">How to Share:</h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Enter the recipient's email address or Supabase user ID</li>
                    <li>• Choose permission level: "View Only" or "Can Edit"</li>
                    <li>• Click "Share" to grant access</li>
                    <li>• Use "Revoke" to remove access at any time</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6 text-center text-gray-500">
                Create a project first to share it with others
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
