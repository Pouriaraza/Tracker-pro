export default function FeatureCard({title, children}){
  return (
    <div className="p-6 bg-white rounded shadow-sm">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  )
}
