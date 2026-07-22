import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db as firestore } from '../../../lib/firebase';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const docRef = doc(firestore, 'temporary_deposits', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: docSnap.data()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Gagal mengambil data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    const {
      status,
      alasan_penolakan,
      validator_name,
      category,
      jenis,
      pengelola,
      weight
    } = await request.json();

    const docRef = doc(firestore, 'temporary_deposits', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    const finalCategory = category || data.category;
    const finalJenis = jenis || data.jenis;
    const finalPengelola = pengelola || data.pengelola;
    const finalWeight = weight ? parseFloat(weight) : parseFloat(data.weight);
    const validator = validator_name || 'Validator';

    // Jika Data Ditolak
    if (status === 'Ditolak') {
      const finalRemarks = `Ditolak oleh: ${validator} | Alasan: ${alasan_penolakan || '-'}`;

      // Simpan ke collection 'deposits' dengan status Ditolak
      const depositRef = doc(firestore, 'deposits', id);
      await setDoc(depositRef, {
        id: data.id,
        date: data.date,
        time: data.time,
        user: data.user,
        client: data.client,
        unit: data.unit,
        category: finalCategory,
        jenis: finalJenis,
        pengelola: finalPengelola,
        weight: finalWeight,
        status: 'Ditolak',
        alasan_penolakan: alasan_penolakan || '',
        remarks: finalRemarks,
        validator_name: validator,
        validated_at: new Date().toISOString(),
        validated_by: validator,
        synced_to_mysql: false,
        updated_at: new Date().toISOString()
      });

      // Hapus dari temporary_deposits
      await deleteDoc(docRef);

      return NextResponse.json({
        success: true,
        message: 'Data berhasil ditolak'
      });
    }

    // Jika Data Terverifikasi / Sesuai
    if (status === 'Terverifikasi' || status === 'Tervalidasi') {
      const finalRemarks = `Divalidasi oleh: ${validator}` + (data.remarks ? ` | ${data.remarks}` : '');

      // Simpan ke collection 'deposits' dengan status Terverifikasi
      const depositRef = doc(firestore, 'deposits', id);
      await setDoc(depositRef, {
        id: data.id,
        date: data.date,
        time: data.time,
        user: data.user,
        client: data.client,
        unit: data.unit,
        category: finalCategory,
        jenis: finalJenis,
        pengelola: finalPengelola,
        weight: finalWeight,
        status: 'Terverifikasi',
        remarks: finalRemarks,
        validator_name: validator,
        validated_at: new Date().toISOString(),
        validated_by: validator,
        synced_to_mysql: false,
        updated_at: new Date().toISOString()
      });

      // Hapus dari temporary_deposits
      await deleteDoc(docRef);

      return NextResponse.json({
        success: true,
        message: 'Data berhasil diverifikasi'
      });
    }

    return NextResponse.json(
      { error: 'Status tidak valid' },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Gagal memperbarui data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const docRef = doc(firestore, 'temporary_deposits', id);
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: 'Berhasil dihapus'
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Gagal menghapus data',
        details: error.message
      },
      { status: 500 }
    );
  }
}