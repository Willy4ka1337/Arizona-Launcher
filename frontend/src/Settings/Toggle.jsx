import classes from "./style.module.css"
export default function Toggle({enabled, children, ...prop}) {
    return (
        <>
        <div className={classes.toggleWrapper} {...prop}>
            <input type="checkbox" className={classes.themeCheckbox} defaultChecked={enabled}/>
            <p className={classes.toggleText}>{children}</p>
        </div>
        </>
    )
}