import classes from "./Dropdown.css";

export const Dropdown = (props) => {
    return (
        <select value={props.value} onChange={props.onChange} class={classes.acDropdown}>
            {props.children}
        </select>
    );
};
