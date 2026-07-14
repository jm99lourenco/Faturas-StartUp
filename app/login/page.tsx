'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#4adeb5] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">A redirecionar para o painel...</p>
      </div>
    </div>
  )
}
