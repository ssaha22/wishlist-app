function toggleDisplay(elementID) {
    let element = document.getElementById(elementID);
    if (element.style.display === "block") {
        element.style.display = "none";
    } else {
        element.style.display = "block";
    }
}

function copy(elementID) {
    var copyText = document.getElementById(elementID);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
}