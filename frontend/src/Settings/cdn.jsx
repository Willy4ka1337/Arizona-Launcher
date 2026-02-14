export function CDNSettings({title, name, ...props}) {
    return (
        <div className="flex items-center w-full justify-between">
            <p className="font-bold text-lg text-white z-10">{title}</p>
            <div className="w-32 bg-neutral-800 rounded-xl px-4 py-2 flex ml-5">
                <select {...props} name={name} className="bg-neutral-800 w-full h-8 outline-0 rounded-xl px-4">
                    <option value={0}>USA</option>
                    <option value={1}>RU</option>
                </select>
            </div>
        </div>
    )
}