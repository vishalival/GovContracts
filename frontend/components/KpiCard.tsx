type KpiCardProps = {
  label: string;
  value: string;
  loading?: boolean;
};

export default function KpiCard({ label, value, loading = false }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      {loading ? (
        <div className="mt-3 h-7 w-36 animate-pulse rounded bg-gray-200" />
      ) : (
        <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      )}
    </div>
  );
}
