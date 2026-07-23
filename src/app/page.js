import LandingPage from './components/LandingPage';

export default async function Home() {
  let initialDeposits = [];
  let mockUsers = [];
  let pemanfaatanData = [];
  
  return <LandingPage initialDeposits={initialDeposits} mockUsers={mockUsers} pemanfaatanData={pemanfaatanData} />;
}
