import type { Office, Status } from '../types'

export const DEFAULT_OFFICE: Office = {
  name: '1875 Old Alabama Rd, Roswell, GA',
  lat: 34.024,
  lng: -84.306,
}

interface Props {
  stopCount: number
  onStopCountChange: (n: number) => void
  placeCount: number
  onOptimize: () => void
  status: Status
}

function StatusMessage({ status }: { status: Status }) {
  switch (status.type) {
    case 'idle':
      return null
    case 'matrix':
      return (
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <span className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
          Fetching distance matrix ({status.total} waypoints)...
        </div>
      )
    case 'solving':
      return (
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <span className="animate-spin w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full" />
          Solving TSP via Held-Karp...
        </div>
      )
    case 'route':
      return (
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <span className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
          Fetching optimized route geometry...
        </div>
      )
    case 'done':
      return <div className="text-sm text-green-700 font-medium">Route optimized successfully</div>
    case 'error':
      return <div className="text-sm text-red-700 font-medium">Error: {status.message}</div>
  }
}

export default function ControlPanel({
  stopCount, onStopCountChange, placeCount, onOptimize, status,
}: Props) {
  const isRunning = status.type === 'matrix' || status.type === 'solving' || status.type === 'route'

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 className="text-lg font-semibold">Route Controls</h2>

      <div className="text-sm">
        <span className="text-gray-500">Starting from</span>
        <p className="font-medium mt-0.5">{DEFAULT_OFFICE.name}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stops: {stopCount}
        </label>
        <input
          type="range"
          min={2}
          max={Math.min(placeCount || 1, 15)}
          value={stopCount}
          onChange={e => onStopCountChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>2</span>
          <span>max {Math.min(placeCount || 1, 15)}</span>
        </div>
      </div>

      <button
        onClick={onOptimize}
        disabled={placeCount === 0 || isRunning}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isRunning ? 'Optimizing...' : 'Optimize Route'}
      </button>

      <StatusMessage status={status} />
    </div>
  )
}
