var elems = document.getElementsByClassName("exp");

export function expand(index){
    var panel = elems[index].nextElementSibling;
    if(panel.style.maxHeight){
        panel.style.maxHeight = null;
    }
    else{
        panel.style.maxHeight = panel.scroolHeight + "px";
    }
}