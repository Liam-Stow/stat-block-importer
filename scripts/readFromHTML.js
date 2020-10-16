
$(document).ready(function () {
    // let inputElement = document.getElementById('inputfile');
    // inputElement.onchange = function (event) {
    //     let fileReader = new FileReader();
    //     fileReader.onload = () => {
    //         convert(fileReader.result);
    //     }
    //     fileReader.readAsText(inputElement.files.item(0));
    // }    
})

$(function () {
    $("#gobutton").click(function () {
        console.log('going')
        let textInput = document.getElementById('statstextinput').value;
        convert(textInput);
    })
})