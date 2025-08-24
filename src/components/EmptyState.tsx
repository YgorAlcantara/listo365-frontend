type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};
export default function EmptyState({ title, subtitle, action }: Props) {
  return (
    <div className="grid place-items-center rounded-xl border bg-white p-8 text-center">
      <div className="max-w-md space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
        {action && <div className="pt-3">{action}</div>}
      </div>
    </div>
  );
}
