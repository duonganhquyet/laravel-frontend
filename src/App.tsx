import AppRoutes from './routes';
import './App.css';
import { ToastContainer } from './components/ToastContainer';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  return (
    <>
      <AppRoutes />
      <ToastContainer />
      <ConfirmModal />
    </>
  );
}