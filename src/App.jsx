import { AuthProvider } from './hooks/useAuth'
import { MotionProvider } from './components/ui/Motion'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <AuthProvider>
      <MotionProvider>
        <AppRoutes />
      </MotionProvider>
    </AuthProvider>
  )
}
