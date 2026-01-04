import classes from "./style.module.css"
import icon from "/Search.svg"
export default function Search({input, tinput}) {
    return (
        <>
            <div className={classes.searchMain}>
                <img src={icon} alt="" className={classes.searchIcon}/>
                <input
                    {...tinput}
                    ref={input}
                    type="text"
                    className={classes.searchInput}
                    placeholder="Поиск"
                />
            </div>
        </>
    )
}