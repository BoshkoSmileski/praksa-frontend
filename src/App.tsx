import { Toaster } from 'sonner'
import { AppRouter } from '@/routes/AppRouter'

export default function App() {
  return (
    <>
      <AppRouter />
      {/* Global toast renderer — used by Sonner */}
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}
