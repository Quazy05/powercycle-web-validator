import { NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db as firestore } from '../../../lib/firebase';

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'master_pengelola'));
    let data = [];
    querySnapshot.forEach((docSnap) => {
      data.push(docSnap.data());
    });

    // Urutkan berdasarkan nama_pengelola secara ascending secara manual
    data.sort((a, b) => a.nama_pengelola.localeCompare(b.nama_pengelola));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pengelola', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nama_pengelola } = body;
    if (!nama_pengelola) {
      return NextResponse.json({ error: 'nama_pengelola is required' }, { status: 400 });
    }

    const docId = 'PL_' + Date.now();
    const docRef = doc(firestore, 'master_pengelola', docId);
    
    await setDoc(docRef, {
      id: docId,
      nama_pengelola
    });

    return NextResponse.json({ success: true, id: docId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert pengelola', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, nama_pengelola } = body;
    if (!id || !nama_pengelola) {
      return NextResponse.json({ error: 'id and nama_pengelola are required' }, { status: 400 });
    }

    const docRef = doc(firestore, 'master_pengelola', String(id));
    await setDoc(docRef, {
      id: String(id),
      nama_pengelola
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update pengelola', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const docRef = doc(firestore, 'master_pengelola', String(id));
    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete pengelola', details: error.message }, { status: 500 });
  }
}