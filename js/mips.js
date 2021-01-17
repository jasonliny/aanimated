let currentstackposition=0;
let running=false;
function resetTextbox(){
    document.getElementById("inputtedCode").value = 
        "# Sample Program\n" + 
        "# This will demonstrate all the commands that have been implemented\n" +
        "ADDI $sp, $sp, -6 # 6 spaces\n" +
        "ADDI $t0, $zero, 65 # $t0 - starting at 65 'A'\n" +
        "ADDI $s0, $zero, 5 # counter - will count down from 13\n" +
        "\n" +
        "LOOP: SB $t0, 0($sp) # save $t0 to stack\n" +
        "ADDI $t0, $t0, 1 # increment $t0\n" +
        "ADDI $s0, $s0, -1 # decrement counter\n" +
        "ADDI $sp, $sp, 1 # move position in stack forward (offset)\n" +
        "BEQ $s0, $zero, EXIT # when counter reaches 0, go to EXIT\n" +
        "J LOOP # go back to start of loop\n" +
        "\n" +
        "EXIT: SB $zero, 0($sp)\n" +
        "ADDI $sp, $sp, -5\n" +
        "\n" +
        "ADDI $v0, $zero, 4\n" +
        "ADDI $a0, $sp, 0\n" +
        "syscall";
}
function resetRegisters(){
    let groups = ["$v","$a","$t","$s"];
    for(group of groups){
        let grouptable = document.getElementById(group).getElementsByTagName("table")[0];
        let rows = grouptable.rows
        for(row of rows){
            row.cells[1].innerHTML="";
        }
    }

    let stacktable = document.getElementById("$sp").getElementsByTagName("table")[0];
    for(let i=stacktable.rows.length; i>0; i--){
            stacktable.deleteRow(0);
    }
}
function resetOutput(){
    let log = document.getElementById("log").getElementsByTagName("p")[0];
    log.innerHTML="";
}
function readCode(){
    let text = document.getElementById("inputtedCode").value;
    return text;
}
function displayCodeToBeExecuted(){
    let buttonExe = document.getElementById("bexecute");
    if(running==false){
        buttonExe.classList.remove("hide");
    }
    let lines = readCode().trim().split("\n");
    let displayCodeArea = document.getElementById("submittedcode");
    displayCodeArea.innerHTML="";
    //text = "<div class=\"mips\">" + text;
    //text = text.replace(/\n/g, "</div><div class=\"mips\">");
    for(let i = 0; i < lines.length; i++){
        if(lines[i]=="") { continue; }
        displayCodeArea.innerHTML += "<li class=\"mips\">" + lines[i] + "</li>";
    }
    //document.getElementById("output").innerHTML = lines;
    document.getElementById("inputtedCode").style.display="none";
    displayCodeArea.style.display="block";
    document.getElementById("bsubmit").style.display="none";
    document.getElementById("bedit").style.display="inline";
}
function displayCodeEdit(){
    document.getElementById("inputtedCode").style.display="block";
    document.getElementById("submittedcode").style.display="none";
    document.getElementById("bsubmit").style.display="inline";
    document.getElementById("bedit").style.display="none";
    document.getElementById("bexecute").classList.add("hide");
}
function toggleDisplay(ele){
    ele.classList.toggle("hide");
}
async function executeCode(){
    running=true;
    let buttonExe = document.getElementById("bexecute");
    toggleDisplay(buttonExe);

    let lines = document.getElementsByClassName("mips");
    let labels = {};
    for(let i = 0; i < lines.length; ){
        await highlightElementText(lines[i]);
        let result = await executeCommand(lines[i].innerHTML);
        if(result==-1){
            console.log("Error Executing: " + lines[i].innerHTML);
            return;
        }
        if(result>0){
            i=result;
        }
        else{
            i++;
        }
    }

    toggleDisplay(buttonExe);
    running=false;
}
async function executeCommand(line){
    line = line.replace(/  +/g, ' '); // replaces multiple spaces with a single space
    let command = "";
    let args = [];
    // special case for labels
    if(line.indexOf(":")>=0){
        let indexcolon = command.indexOf(":")
        command = ":"; // indicates command is a label
        if(line.indexOf("#")>0){
            line=line.substring(0,line.indexOf("#"));
        }
        args = line.split(":"); // args will be [label_name, command]
        args[1] = args[1].trim();
    }
    // special case for syscall
    else if(line.trim()=="syscall"){
        command = "SYSCALL";
    }
    // special case for comments
    else if(line.substring(0,1)=="#"){
        command="#";
    }
    else{
        if(line.indexOf("#")>0){
            line=line.substring(0,line.indexOf("#"));
        }
        command = line.substring(0, line.indexOf(' ')).toUpperCase(); // gets first word
        args = line.slice(line.indexOf(' ')+1); // gets rest of line
        args = args.replace(/\s/g, ""); //removes spaces
        args = args.split(","); // gets arguments using ',' as a delimiter
    }   
    let result=null;
    switch (command){
        case '#':
            break;
        case 'ADDI':
            result=exeADDI(args);
            break;
        case 'SB':
            result=exeSB(args);
            break;
        case 'BEQ':
            result=exeBEQ(args);
            break;
        case ':':
            result=exeLABEL(args);
            break;
        case 'J':
            result=exeJ(args);
            break;
        case 'SYSCALL':
            result=exeSyscall();
            break;
        default:
            return -1;
    }
    return result;
    
}
async function exeADDI(args){
    try{
        let arg1 = args[0]; // register modified
        let arg2 = args[1]; // register
        let arg3 = Number(args[2]); // immediate value/constant

        // special case for adjusting stack $sp
        if(arg1==arg2 && arg1=="$sp"){
            let tableSP = document.getElementById(arg1).getElementsByTagName("table")[0];
            if(currentstackposition+arg3>tableSP.rows.length){
                return -1;
            }
            currentstackposition+=arg3;
            //let numrows = 0 - arg3;
            let temprow, tempcell;
            while(currentstackposition<0){
                temprow = tableSP.insertRow(0);
                tempcell = temprow.insertCell(0);
                highlightElement(tempcell);
                await sleep(50);
                currentstackposition++;
            }
        }
        // special case for referencing stack pointer $sp
        else if(arg2=="$sp"){
            let group1 = arg1.substring(0,2);
            let regnum1 = parseInt(arg1.substring(2));
            let cell1 = document.getElementById(group1).getElementsByTagName("table")[0].rows[regnum1].cells[1];
            cell1.innerHTML="$sp";
            await highlightElementText(cell1);
        }
        else{
            // checks if the arguments are valid
            if( !(isModifiableRegister(arg1) && isValidRegister(arg2)) || isNaN(arg3) ){
                return -1;
            }

            // attributes of first argument
            let group1 = arg1.substring(0,2);
            let regnum1 = parseInt(arg1.substring(2));
            let cell1 = document.getElementById(group1).getElementsByTagName("table")[0].rows[regnum1].cells[1];

            // attributes of second argument, special case for register $zero
            let num2;
            if(arg2=="$zero"){
                num2 = 0;
            }
            else{
                let group2 = arg2.substring(0,2);
                let regnum2 = parseInt(arg2.substring(2));
                let cell2 = document.getElementById(group2).getElementsByTagName("table")[0].rows[regnum2].cells[1];
                num2 = parseInt(cell2.innerHTML);
            }

            cell1.innerHTML = num2 + arg3;
            await highlightElementText(cell1);
        }
    }
    catch(err){
        return -1;
    }
    return;
}
async function exeSB(args){
    try{
        let arg1 = args[0];
        let arg2 = args[1];

        let offset = currentstackposition + Number(arg2.substring(0,arg2.indexOf("(")));
        let pointer = arg2.substring(arg2.indexOf("(")+1, arg2.indexOf(")"));
        let tableSP = document.getElementById("$sp").getElementsByTagName("table")[0];
        if( !isValidRegister(arg1) || pointer != "$sp" || offset > (tableSP.rows.length-1)){
            return -1;
        }

        let cell = getRegisterCell(arg1);
        await highlightElement(cell);
        let byteval = Number(cell.innerHTML)
        let storagecell = tableSP.rows[offset].cells[0];
        storagecell.innerHTML = byteval;
        await highlightElementText(storagecell);
    }
    catch(err){
        return -1;
    }

}
function getRegisterCell(register){
    if(register=="$zero"){
        let cell = document.getElementById(register).getElementsByTagName("table")[0].rows[0].cells[0];
        return cell;
    }
    else if(isModifiableRegister(register)){
        let group = register.substring(0,2);
        let regnum = parseInt(register.substring(2));
        let cell = document.getElementById(group).getElementsByTagName("table")[0].rows[regnum].cells[1];
        return cell;
    }
}
function exeBEQ(args){
    try{
        let reg1 = getRegisterCell(args[0]);
        let reg2 = getRegisterCell(args[1]);
        let label = args[2];
        let val1 = Number(reg1.innerHTML);
        let val2 = Number(reg2.innerHTML);
        if(val1==val2){
            let linenum = exeJ([label]);
            return linenum;
        }
        else{
            return;
        }
    }
    catch(err){
        return -1;
    }

}
function exeLABEL(args){
    try{
        let line = args[1];
        let result = executeCommand(line);
        return result;
    }
    catch(err){
        return 0;
    }

}
function exeJ(args){
    try{
        if(args.length!=1){
            return 0;
        }
        let lines = document.getElementsByClassName("mips");
        let label = args[0];
        let numline;
        for(let i=0; i<lines.length; i++){
            if(lines[i].innerHTML.indexOf(label)==0){
                numline=i;
            }
        }
        return numline;
    }
    catch(err){
        return -1;
    }

}
async function exeSyscall(){
    try{
        let v0cell = document.getElementById("$v").getElementsByTagName("table")[0].rows[0].cells[1];
        let a0cell = document.getElementById("$a").getElementsByTagName("table")[0].rows[0].cells[1];
        await highlightElement(v0cell);
        await highlightElement(a0cell);
        let arg1 = Number(v0cell.innerHTML);
        let arg2 = a0cell.innerHTML;
        if(arg1==4 && arg2=="$sp"){
            let tableSP = document.getElementById("$sp").getElementsByTagName("table")[0];
            let log = document.getElementById("log").getElementsByTagName("p")[0];
            log.innerHTML = "";
            for(let i=currentstackposition; i<tableSP.rows.length; i++){
                let curcell = tableSP.rows[i].cells[0];
                let val = Number(curcell.innerHTML);
                highlightElement(curcell);
                if(val==0){
                    break;
                }
                else{
                    let ele = document.createElement("span");
                    ele.innerHTML = String.fromCharCode(val);
                    log.appendChild(ele);
                    await highlightElementText(ele);
                }
            }
        }
        else{
            return -1;
        }
    }
    catch(err){
        console.log("error");
        return -1;
    }

}

function isModifiableRegister(register){
    let registersModifiable = ["$v0", "$v1", "$a0", "$a1", "$a2", "$a3", "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7", "$t8", "$t9", "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7"];
    for (reg of registersModifiable){
        if(register==reg){
            return true;
        }
    }
    return false;
}
function isValidRegister(register){
    const registersMIPS = ["$v0", "$v1", "$a0", "$a1", "$a2", "$a3", "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7", "$t8", "$t9", "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7", "$zero"];
    for (reg of registersMIPS){
        if(register==reg){
            return true;
        }
    }
    return false;
}
