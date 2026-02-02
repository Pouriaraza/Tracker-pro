import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { supabase } from '../lib/supabaseClient'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function Chart({ projectId }) {
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    loadChart()
  }, [projectId])

  async function loadChart() {
    const { data, error } = await supabase
      .from('tracker_items')
      .select('title, value')
      .eq('project_id', projectId)
    
    if (error) return
    
    const titles = data.map(d => d.title)
    const values = data.map(d => d.value || 0)
    
    setChartData({
      labels: titles,
      datasets: [
        {
          label: 'Progress',
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        },
      ],
    })
  }

  if (!chartData) return <div className="text-gray-500">Loading chart...</div>

  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3">Progress Chart</h3>
      <div style={{ position: 'relative', height: '300px' }}>
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
  )
}
