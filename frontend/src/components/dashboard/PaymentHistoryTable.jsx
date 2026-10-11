import { format } from "date-fns";
import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { getBscScanTxUrl, formatAddress } from "@/utils/web3";

export default function PaymentHistoryTable({ payments, role }) {
    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 border border-white/10 rounded-xl glass-card">
                No payment history found.
            </div>
        );
    }

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden glass-card shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Project</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Tx / Payment ID</th>
                            <th className="px-4 py-3 font-medium text-right">Amount / Network</th>
                            {role === "ADMIN" && <th className="px-4 py-3 font-medium">Payer</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {payments.map((log) => {
                            const details = log.details || {}; // JSONB
                            const isFailed = log.action === 'PAYMENT_FAILED';
                            const txHash = details.txHash || (details.paymentId && details.paymentId.startsWith('0x') ? details.paymentId : null);

                            return (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-gray-400">
                                        {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-white">
                                        {details.projectTitle || "Unknown Project"}
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{details.projectId}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isFailed ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                                            {isFailed ? <AlertCircle size={12} className="mr-1" /> : <CheckCircle size={12} className="mr-1" />}
                                            {isFailed ? "Failed" : "Success"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-300">
                                        {txHash ? (
                                            <a
                                                href={getBscScanTxUrl(txHash)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                {formatAddress(txHash)} <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            details.paymentId || "-"
                                        )}
                                        {isFailed && details.error && (
                                            <div className="text-red-400 mt-1 max-w-[200px] truncate" title={details.error}>
                                                {details.error}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-white">
                                        <div>{details.amount ? `${details.amount} ${details.currency || 'tBNB'}` : "-"}</div>
                                        {details.network && <div className="text-[10px] text-gray-500">{details.network}</div>}
                                    </td>
                                    {role === "ADMIN" && (
                                        <td className="px-4 py-3 text-xs text-gray-400">
                                            {log.user_email}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
