import { format } from "date-fns";
import { IndianRupee, AlertCircle, CheckCircle } from "lucide-react";

export default function PaymentHistoryTable({ payments, role }) {
    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                No payment history found.
            </div>
        );
    }

    return (
        <div className="border border-white/10 rounded-lg overflow-hidden glass-card shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Project</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Payment ID</th>
                            <th className="px-4 py-3 font-medium text-right">Reference</th>
                            {role === "ADMIN" && <th className="px-4 py-3 font-medium">Payer</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {payments.map((log) => {
                            const details = log.details; // JSONB
                            const isFailed = log.action === 'PAYMENT_FAILED';

                            return (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-gray-400">
                                        {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-white">
                                        {details.projectTitle || "Unknown Project"}
                                        <div className="text-xs text-gray-500">{details.projectId}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isFailed ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                                            {isFailed ? <AlertCircle size={12} className="mr-1" /> : <CheckCircle size={12} className="mr-1" />}
                                            {isFailed ? "Failed" : "Success"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-300">
                                        {details.paymentId || "-"}
                                        {isFailed && details.error && (
                                            <div className="text-red-400 mt-1 max-w-[200px] truncate" title={details.error}>
                                                {details.error}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-500 text-xs">
                                        {details.amount || details.orderId}
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
