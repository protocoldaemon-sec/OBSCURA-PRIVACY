'use client'

import { useState, useEffect, useRef } from 'react'

interface Option {
  value: string
  label: string
  description?: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  label?: string
  placeholder?: string
}

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  label,
  placeholder = 'Select...'
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="block text-sm text-gray-400 mb-2">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white hover:border-[#3a3a4a] transition-colors text-left"
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg shadow-xl z-[100] overflow-hidden max-h-60 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`w-full flex flex-col items-start px-4 py-3 hover:bg-[#252530] transition-colors text-left ${
                value === option.value ? 'bg-[#252530]' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-white font-medium">{option.label}</span>
                {value === option.value && (
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {option.description && (
                <span className="text-xs text-gray-500 mt-0.5">{option.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
