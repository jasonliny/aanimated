function sleep(duration){
    return new Promise(resolve=>setTimeout(resolve, duration))
}
async function highlightElement(ele){
    let clone = ele.cloneNode(true);
    ele.classList.toggle("backcolorchange");
    await sleep(1000);
    ele.replaceWith(clone);
}
async function highlightElementText(ele){
    let clone = ele.cloneNode(true);

    let text = ele.innerHTML;
    let replacement = "";

    for(character of text){
        replacement+="<span>"+character+"</span>";
    }

    ele.innerHTML=replacement;

    spans = ele.getElementsByTagName("span");
    for(span of spans){
        span.classList.toggle("backcolorchange");
        await sleep(15);
    }

    await sleep(1000);
    ele.replaceWith(clone);
}
