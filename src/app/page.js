import LandingPage from './components/LandingPage';

export default async function Home() {
  // TODO: Fetch data from Firebase Firestore instead of MySQL
  // Menggunakan data kosong sementara sampai Firebase Firestore di-setup
  let initialDeposits = [];
  let mockUsers = [];
  let pemanfaatanData = [];
  
  return <LandingPage initialDeposits={initialDeposits} mockUsers={mockUsers} pemanfaatanData={pemanfaatanData} />;
}
