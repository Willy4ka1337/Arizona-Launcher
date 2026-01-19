import { useRef } from "react"
import Search from "./Search"
import classes from "./style.module.css"
import Server from "./Server"
import useInput from "../hooks/useInput"
import { useServers } from "../ServersContext"
export default function Servers() {
    const {servers, selectedServer, setSelectedServer} = useServers()
    const input = useRef()
    const tinput = useInput()

    return (
        <>
            <div className={classes.servers}>
                <div className={classes.serversHeader}>
                    <Search
                        input = {input}
                        tinput = {tinput}
                    />
                </div>
                <div className={classes.serversList}>
                    {servers?.arizona?.filter(
                            server => server.name.toLowerCase().includes(tinput.value.toLowerCase())
                        ).map((server, i) =>
                        <Server
                            key={i}
                            name = {server.name}
                            number = {server.number}
                            icon = {server.icon}
                            selected = {selectedServer === server.number}
                            online = {server.online}
                            max_online = {server.maxplayers}
                            password = {server.password}
                            donateMultiplier = {server.donateMultiplier}
                            experienceMultiplier = {server.experienceMultiplier}
                            selectServer = {setSelectedServer}
                        />
                    )}
                </div>
            </div>
        </>
    )
}