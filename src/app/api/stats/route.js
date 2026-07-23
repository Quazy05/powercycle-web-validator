import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch verified deposits from Firebase
    const depositsSnapshot = await getDocs(collection(db, 'deposits'));
    const deposits = [];
    depositsSnapshot.forEach(doc => {
      deposits.push({ id: doc.id, ...doc.data() });
    });

    // Fetch temporary deposits (pending) from Firebase
    const tempSnapshot = await getDocs(collection(db, 'temporary_deposits'));
    const tempDeposits = [];
    tempSnapshot.forEach(doc => {
      tempDeposits.push({ id: doc.id, ...doc.data() });
    });

    // Combine all deposits
    const allDeposits = [...deposits, ...tempDeposits];

    // Calculate stats
    const totalWeight = allDeposits.reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const verifiedWeight = deposits.reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const pendingCount = tempDeposits.filter(d => d.status === 'Menunggu Validasi').length;
    const verifiedCount = deposits.filter(d => d.status === 'Terverifikasi').length;
    const rejectedCount = deposits.filter(d => d.status === 'Ditolak').length + 
                          tempDeposits.filter(d => d.status === 'Ditolak').length;

    const organikWeight = allDeposits.filter(d => d.category === 'Organik').reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const anorganikWeight = allDeposits.filter(d => d.category === 'Anorganik').reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const residuWeight = allDeposits.filter(d => d.category === 'Residu').reduce((s, d) => s + (Number(d.weight) || 0), 0);

    // Unique users
    const uniqueUsers = new Set(allDeposits.map(d => d.user).filter(Boolean));

    // Monthly data for chart (current year)
    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ bulan: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i], berat: 0 }));
    allDeposits.forEach(d => {
      if (d.date) {
        const date = new Date(d.date);
        if (date.getFullYear() === currentYear) {
          monthlyData[date.getMonth()].berat += Number(d.weight) || 0;
        }
      }
    });

    // Unit stats
    const unitMap = {};
    allDeposits.forEach(d => {
      const unit = d.unit || 'Lainnya';
      if (!unitMap[unit]) unitMap[unit] = { unit, totalWeight: 0, totalTransactions: 0, users: new Set() };
      unitMap[unit].totalWeight += Number(d.weight) || 0;
      unitMap[unit].totalTransactions++;
      if (d.user) unitMap[unit].users.add(d.user);
    });
    const unitStats = Object.values(unitMap).map(u => ({
      unit: u.unit,
      totalWeight: u.totalWeight,
      totalTransactions: u.totalTransactions,
      nasabah: u.users.size
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalWeight,
        verifiedWeight,
        organikWeight,
        anorganikWeight,
        residuWeight,
        totalTransactions: allDeposits.length,
        verifiedCount,
        pendingCount,
        rejectedCount,
        totalUsers: uniqueUsers.size
      },
      monthlyData,
      unitStats,
      deposits: allDeposits
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats', details: error.message }, { status: 500 });
  }
}
