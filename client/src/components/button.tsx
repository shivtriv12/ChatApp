import { ReactElement } from "react";

interface ButtonProps{
    variant:"primary"|"secondary";
    text:string;
    startIcon?:ReactElement;
    onClick?:()=>void;
    fullWidth?:boolean;
    loading?:boolean;
}

const variantStyles = {
    "primary": "bg-blue-500 text-white",
    "secondary": "bg-blue-100 text-blue-700"
};

const defaultStyles = "px-4 py-2 font-light flex items-center rounded-md flex";

export const Button = (props:ButtonProps)=>{
    return <button onClick={props.onClick} className={`${variantStyles[props.variant]} ${defaultStyles} 
    ${props.fullWidth?"w-full flex justify-center items-center":""} ${props.loading?"opacity-45":""}`}>
        <div className="pr-2">
            {props.startIcon}
        </div>
        {props.text}
    </button>
}