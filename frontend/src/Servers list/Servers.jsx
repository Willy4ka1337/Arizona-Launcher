import { useRef } from "react"
import Search from "./Search"
import Server from "./Server"
import useInput from "../hooks/useInput"
import { useServers } from "../ServersContext"
export default function Servers() {
    const {servers, selectedServer, setSelectedServer} = useServers()
    const input = useRef()
    const tinput = useInput()

    return (
        <div className="min-w-[300px] w-[300px] h-full select-none outline-none z-2 bg-[#0B0B0B]">
            <div className="w-full h-[90px] border-b border-white/50 box-border px-10 flex items-center">
                <Search input={input} tinput={tinput} />
            </div>

            <div className="box-border p-4 ml-1.5 overflow-y-scroll max-h-[calc(100%-90px)] cursor-pointer outline-none">
                {servers?.arizona
                    ?.filter(server => server.name.toLowerCase().includes(tinput.value.toLowerCase()))
                    .map((server, i) => (
                        <Server
                            key={i}
                            name={server.name}
                            number={server.number}
                            icon={server.icon}
                            selected={selectedServer === server.number}
                            online={server.online}
                            max_online={server.maxplayers}
                            password={server.password}
                            donateMultiplier={server.donateMultiplier}
                            experienceMultiplier={server.experienceMultiplier}
                            selectServer={setSelectedServer}
                        />
                    ))}
            </div>
        </div>
    )
}