const now = new Date();

export const TODAY =
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export const CURRENT_MONTH =
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export const UNIT_LIST = [
  'Wonogiri',
  'Banjarnegara'
];

export const CLIENT_LIST = [
  'PLTA Wonogiri',
  'PLTA Banjarnegara'
];

export const KATEGORI_SAMPAH = ['Organik', 'Anorganik', 'Residu'];
export const JENIS_SAMPAH = ['Sampah Taman', 'Sisa Makanan', 'Kertas', 'Botol Kemasan', 'Plastik', 'Logam', 'Kaca', 'Kain', 'Karet', 'Lainnya'];
export const PROGRAM_PENGELOLAAN_LIST = [
  'Komposting Aerobik',
  'AMS',
  'Online Salary Slip',
  'MAXIMO',
  'Refillable Bottles',
  'Komposting Masyarakat',
  'ECO LAZER',
  'MAGPRO',
  'EatWise Order',
  'MAGGROW'
];

export const formatWeight = (val) => `${Number(val).toFixed(2)} Kg`;
export const formatWeightTon = (val) => `${Number(val).toFixed(3)} Ton`;
