import { Timeline, Animation } from "./animation.js";
import { ease } from "./ease.js";

let tl = new Timeline();

tl.start();

tl.add(new Animation(document.querySelector("#el").style,"transform",0,500,2000,0,ease,v=>`translateX(${v}px)`));

document.querySelector("#el").style.transition = '2s ease';
document.querySelector("#el2").style.transform = 'translateX(500)px';

document.querySelector("#pause-btn").addEventListener("click",()=>tl.pause());
document.querySelector("#resume-btn").addEventListener("click",()=>tl.resume());

