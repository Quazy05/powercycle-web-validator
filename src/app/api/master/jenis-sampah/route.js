import { NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db as firestore } from '../../../lib/firebase';

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'master_jenis_sampah'));
    let data = [];
    querySnapshot.forEach((docSnap) => {
      data.push(docSnap.data());
    });

    // Urutkan berdasarkan kategori lalu nama_jenis secara manual
    data.sort((a, b) => {
      if (a.kategori === b.kategori) {
        return a.nama_jenis.localeCompare(b.nama_jenis);
      }
      return a.kategori.localeCompare(b.kategori);
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jenis sampah', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nama_jenis, kategori } = body;
    if (!nama_jenis || !kategori) {
      return NextResponse.json({ error: 'nama_jenis and kategori are required' }, { status: 400 });
    }

    const docId = 'JS_' + Date.now();
    const docRef = doc(firestore, 'master_jenis_sampah', docId);
    
    await setDoc(docRef, {
      id: docId,
      nama_jenis,
      kategori
    });

    return NextResponse.json({ success: true, id: docId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert jenis sampah', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, nama_jenis, kategori } = body;
    if (!id || !nama_jenis || !kategori) {
      return NextResponse.json({ error: 'id, nama_jenis, and kategori are required' }, { status: 400 });
    }

    const docRef = doc(firestore, 'master_jenis_sampah', String(id));
    await setDoc(docRef, {
      id: String(id),
      nama_jenis,
      kategori
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update jenis sampah', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const docRef = doc(firestore, 'master_jenis_sampah', String(id));
    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete jenis sampah', details: error.message }, { status: 500 });
  }
}