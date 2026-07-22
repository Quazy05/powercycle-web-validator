import { NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db as firestore } from '../../lib/firebase';
import { query } from '../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');
    const user = searchParams.get('user');

    // Ambil dari Firebase
    const querySnapshot = await getDocs(collection(firestore, 'temporary_deposits'));
    let deposits = [];
    querySnapshot.forEach((docSnap) => {
      deposits.push(docSnap.data());
    });

    // Filter secara manual di server (menghindari keperluan composite index Firebase)
    if (unit) {
      deposits = deposits.filter(d => d.unit === unit);
    }
    if (user) {
      deposits = deposits.filter(d => d.user === user);
    }

    // Urutkan berdasarkan tanggal terbaru
    deposits.sort((a, b) => {
      const dtA = new Date(`${a.date} ${a.time}`);
      const dtB = new Date(`${b.date} ${b.time}`);
      return dtB - dtA;
    });

    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch temporary deposits', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, date, time, user, client, unit, category, jenis, pengelola, weight, remarks } = data;

    const depositId = id || 'TD' + Date.now();
    const depositStatus = 'Menunggu Validasi';

    // Simpan ke Firebase
    const docRef = doc(firestore, 'temporary_deposits', depositId);
    await setDoc(docRef, {
      id: depositId,
      date: date || '', 
      time: time || '', 
      user: user || '', 
      client: client || '', 
      unit: unit || '', 
      category: category || '', 
      jenis: jenis || '', 
      pengelola: pengelola || '', 
      weight: weight || 0, 
      status: depositStatus, 
      remarks: remarks || '', 
      alasan_penolakan: ''
    });

    // Catat log ke MySQL
    const timestamp = time.length === 5 ? `${date} ${time}:00` : `${date} ${time}`;
    const detailLog = `${category} (${jenis}) ${weight} kg - ${pengelola} (Menunggu Validasi)`;
    await query(
      'INSERT INTO activity_log (timestamp, user, action, detail, type) VALUES (?, ?, ?, ?, ?)',
      [timestamp, user, 'Input Data Sementara', detailLog, 'input']
    );

    return NextResponse.json({ success: true, id: depositId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save temporary deposit', details: error.message }, { status: 500 });
  }
}
