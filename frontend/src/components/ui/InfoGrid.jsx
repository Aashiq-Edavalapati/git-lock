"use client";

export default function InfoGrid({ items }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">{item.label}</div>
                    <div className="text-white font-medium truncate" title={item.value}>{item.value || '-'}</div>
                </div>
            ))}
        </div>
    )
}
