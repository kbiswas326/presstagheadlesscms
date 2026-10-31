"use client";

export default function ExcludeFromHomepageToggle({ checked, onChange, isDark = false }) {
  return (
    <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
      isDark ? "border-gray-600 bg-gray-700/50 text-gray-200" : "border-gray-200 bg-gray-50 text-gray-800"
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded"
      />
      <span>
        <span className="block text-sm font-medium">Exclude from homepage</span>
        <span className={`mt-1 block text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Keep this post out of homepage features, sections, and widgets.
        </span>
      </span>
    </label>
  );
}
