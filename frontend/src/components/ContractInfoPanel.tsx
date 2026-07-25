function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ContractInfoPanel({
  vaultAddress,
  topicId,
}: {
  vaultAddress: string;
  topicId: string;
}) {
  const rows = [
    {
      label: "Vault contract",
      value: truncate(vaultAddress),
      href: `https://hashscan.io/testnet/contract/${vaultAddress}`,
    },
    { label: "HCS topic", value: topicId, href: `https://hashscan.io/testnet/topic/${topicId}` },
    { label: "Network", value: "Hedera Testnet", href: undefined },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-mono uppercase tracking-wide text-slate-400 mb-4">
        Contract Info
      </h2>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">{row.label}</span>
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline"
              >
                {row.value} ↗
              </a>
            ) : (
              <span className="text-slate-300">{row.value}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
