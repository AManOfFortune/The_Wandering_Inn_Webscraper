const hostingAddress = "https://the-wandering-inn-webscraper.onrender.com"

function newEl(type, attrs={})
{
    const el = document.createElement(type);

    for (let attr in attrs) 
    {
        const value = attrs[attr];
        if (attr == 'innerText') el.innerText = value;
        else el.setAttribute(attr, value);
    }
    return el;
}

function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
    c = array[i++];
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
        break;
    }
    }

    return out;
}

(async function loadVolumes() {
    const dropdown = document.querySelector('#volumes')

    const res = await fetch(hostingAddress + "/load", {method: 'GET'})

    res.text().then(text => {
        const volume_titles = JSON.parse(text).volumes;
        
        for (let i = 0; i < volume_titles.length; i++) {
            const option = newEl('option', {value: volume_titles[i], innerText: volume_titles[i]})
            dropdown.appendChild(option)
        }
    })

    document.querySelector(".loading-spinner-wrapper").style.display = "none";
})()

function enableButton() {
    const select = document.querySelector('#chapters');
    const button = document.querySelector('#submitChapters')

    var options = [...select.options].filter(option => option.selected).map(option => option.value)

    if(options.length <= 0) {
        button.disabled = true
    } else {
        button.disabled = false
    }
}

async function submitVolume() {

    const dropdown = document.querySelector('#volumes')
    const volume = dropdown.options[dropdown.selectedIndex].value;

    const select = document.querySelector('#chapters')
    select.innerHTML = ""

    const res = await fetch(hostingAddress + "/chapters", {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({volume})
    })

    res.text().then(text => {
        const chapters = JSON.parse(text);
        select.size = chapters.length

        for (var i = 0; i < chapters.length; i++) {
            var link = newEl('option', {innerText: chapters[i].title, value: chapters[i].url})
    
            select.appendChild(link)
        }
    })
}

async function submitChapters() {

    const select = document.querySelector('#chapters')
    const progress = document.querySelector('#progress')
    const form = document.querySelector('#form')
    const messages_container = document.querySelector('#messages')
    const download_button = document.querySelector('#downloadFile')

    var options = [...select.options].filter(option => option.selected).map(option => option.value)

    progress.style.display = 'flex'
    form.style.display = 'none'
    
    const res = await fetch(hostingAddress + "/selection", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({options})
    })

    const reader = res.body.getReader();

    reader.read().then(function processData({done, value}) {
        
        if (done) {
            const done_message = newEl('p', {innerText: "Done!"})
            download_button.removeAttribute('disabled')
            download_button.href = './Output/The_Wandering_Inn.zip'
            messages_container.appendChild(done_message)

            return
        }

        const message = newEl('p', {innerText: "Working on " + Utf8ArrayToStr(value)})
        messages_container.appendChild(message)

        return reader.read().then(processData)
    })

}

function goBack() {
    const progress = document.querySelector('#progress')
    const form = document.querySelector('#form')
    const messages_container = document.querySelector('#messages')
    const download_button = document.querySelector('#downloadFile')
    const button = document.querySelector('#submitChapters')
    const dropdown = document.querySelector('#volumes')
    const select = document.querySelector('#chapters')

    progress.style.display = 'none'
    form.style.display = 'flex'
    messages_container.innerHTML = ""
    download_button.setAttribute('disabled', 'true')
    download_button.removeAttribute('href')
    button.disabled = true
    dropdown.selectedIndex = 0
    select.innerHTML = ""
    select.removeAttribute('size')
}

