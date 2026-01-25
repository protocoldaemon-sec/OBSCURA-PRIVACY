'use client'

interface LoadingStep {
  label: string
  status: 'pending' | 'loading' | 'success' | 'error'
  description?: string
}

interface Props {
  isOpen: boolean
  title: string
  steps: LoadingStep[]
  onClose?: () => void
}

export default function LoadingModal({ isOpen, title, steps, onClose }: Props) {
  if (!isOpen) return null

  // Find current active step (loading or first pending)
  const currentStepIndex = steps.findIndex(s => s.status === 'loading') !== -1
    ? steps.findIndex(s => s.status === 'loading')
    : steps.findIndex(s => s.status === 'pending')
  
  const currentStep = currentStepIndex !== -1 ? steps[currentStepIndex] : steps[steps.length - 1]
  const completedCount = steps.filter(s => s.status === 'success').length
  const totalSteps = steps.length
  
  // Current step number (1-indexed) - the step being worked on
  // If all steps are complete, show totalSteps/totalSteps (e.g., 4/4)
  // If there's a loading step, show that step number
  // Otherwise, show the next step to be completed
  const allComplete = completedCount === totalSteps
  const loadingStepIndex = steps.findIndex(s => s.status === 'loading')
  
  let currentStepNumber: number
  if (allComplete) {
    currentStepNumber = totalSteps // Show "4 of 4" when all complete
  } else if (loadingStepIndex !== -1) {
    currentStepNumber = loadingStepIndex + 1 // Show current loading step (1-indexed)
  } else {
    currentStepNumber = Math.min(completedCount + 1, totalSteps) // Show next pending step
  }
  
  // Progress percentage based on completed steps
  // When all complete, show 100%. Otherwise show progress toward current step
  const progressPercent = allComplete ? 100 : (completedCount / totalSteps) * 100

  const getStatusIcon = () => {
    // When all complete (100%), still show loading animation
    if (allComplete) {
      return (
        <div className="w-12 h-12 rounded-full border-4 border-t-green-400 border-r-green-400 border-b-green-400/20 border-l-green-400/20 animate-spin" />
      )
    } else if (currentStep.status === 'loading') {
      return (
        <div className="w-12 h-12 rounded-full border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-400/20 border-l-cyan-400/20 animate-spin" />
      )
    } else if (currentStep.status === 'success') {
      return (
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    } else if (currentStep.status === 'error') {
      return (
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {onClose && currentStep.status === 'error' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Current Step Display */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="mb-2">
            {getStatusIcon()}
          </div>

          {/* Step Label */}
          <div>
            <p className={`text-lg font-medium ${
              allComplete ? 'text-green-400' :
              currentStep.status === 'loading' ? 'text-white' : 
              currentStep.status === 'success' ? 'text-green-400' :
              currentStep.status === 'error' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {allComplete ? 'Completing...' : currentStep.label}
            </p>
            {allComplete ? (
              <p className="text-sm text-gray-500 mt-2">Finalizing transaction...</p>
            ) : currentStep.description && (
              <p className="text-sm text-gray-500 mt-2">{currentStep.description}</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full mt-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Step {currentStepNumber} of {totalSteps}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-2 bg-[#0d0d12] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer hint */}
        {(currentStep.status === 'loading' || allComplete) && (
          <div className="mt-6 p-3 bg-[#0d0d12] rounded-lg border border-[#2a2a3a]">
            <p className="text-xs text-gray-500 text-center">
              Please do not close this window or refresh the page
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
