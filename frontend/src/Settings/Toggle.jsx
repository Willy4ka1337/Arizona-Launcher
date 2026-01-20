export default function Toggle({ enabled, children, ...prop }) {
    return (
        <div 
            className="border-none bg-transparent text-white flex items-center mb-3" 
            {...prop}
        >
            <input 
                type="checkbox" 
                className="
                    mr-3
                    appearance-none
                    w-[4em]
                    h-[2em]
                    bg-[#2a2a2a]
                    bg-size[205%]
                    bg-position[0]
                    rounded-full
                    relative
                    cursor-pointer
                    text-base
                    before:content-['']
                    before:w-[1.5em]
                    before:h-[1.5em]
                    before:absolute
                    before:top-[0.25em]
                    before:left-[0.25em]
                    before:bg-[#efefef]
                    before:bg-size-[205%]
                    before:bg-position-[100%]
                    before:rounded-full
                    before:transition-all
                    before:duration-[0.4s]
                    checked:bg-position-[100%]
                    checked:bg-[#efefef]
                    checked:before:left-[calc(100%-1.85em)]
                    checked:before:bg-position-[0]
                    checked:before:bg-[#0B0B0B]
                " 
                defaultChecked={enabled}
            />
            <p className="font-sans font-bold text-[18px] ml-[0.5em]">{children}</p>
        </div>
    )
}