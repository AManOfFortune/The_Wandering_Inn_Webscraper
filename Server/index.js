///////////////////////////////////////////////////////////////////////////////////////////////
///////// To make this work on local, you need to change hrefs from "./" to "../" /////////////
///////////////////////////////////////////////////////////////////////////////////////////////



//Server is listening on Port 8000
const PORT = 8000;

const axios = require('axios')
const cheerio = require('cheerio')
const express = require('express')
const app = express()

//Libraries to create and save a word document
const docx = require('docx')
const fs = require('fs')

//Library to create and save epub
const epub = require('epub-gen')

//Library to create zip archive
const zip = require('adm-zip')

//Saves content from table of contents into all_chapters array
const url = 'https://wanderinginn.com/table-of-contents/'
var all_chapters = []

const cutoff_point = "Author"

//Each paragraph of the word document gets saved in this array
var doc_paragraphs = []
//Each chapter of the epub document gets saved in this array
var epub_chapters = []

//Not 100% sure why this section of code is required, but it breaks without so lenny-shrug
const bodyParser = require('body-parser');
const { HeadingLevel } = require('docx');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // disabled for security on local
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});
//----------

//On load, sends volume count
app.get('/load', async (req, res) => {
    all_chapters = []
    await getVolumes()

    var volume_titles = []
    for (var i = 0; i < all_chapters.length; i++) {
        volume_titles.push(all_chapters[i].volume)
    }
    
    res.json({volumes: volume_titles})
})

//On making a post request to root, sends chapter list
app.post('/', (req, res) => {
    const download_volume = req.body.volume

    for (var i = 0; i < all_chapters.length; i++) {
        if (all_chapters[i].volume == download_volume) {
            res.send(all_chapters[i].chapters)
        }
    }
})

//After selecting what chapters are wanted, makes a post request to /selection, that then goes and pull all data from links
app.post('/selection', async (req, res) => {
    
    doc_paragraphs = []
    epub_chapters = []
    var chapters = req.body.options

    res.setHeader('Content-Type', 'text/html')

    await parseChapters(chapters, res)
        .then(async () => {
            //Creates the word document object with all paragraphs
            const doc = new docx.Document({
                styles: {
                    paragraphStyles: [
                        {
                            id: "wellSpaced",
                            name: "Well Spaced",
                            basedOn: "Normal",
                            quickFormat: true,
                            paragraph: {
                                spacing: { line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 },
                            },
                        },
                    ],
                },
                sections: [{
                    properties: {},
                    children: doc_paragraphs,
                }],
            })
            //Creates the epub document object
            const options = {
                title: 'The_Wandering_Inn',
                author: 'pirateaba',
                output: './Output/The_Wandering_Inn.epub',
                content: epub_chapters
              }

            //Saves the epub document
            await new epub(options).promise.then(() => console.log('Epub done'))

            //Saves the word document object as a word document
            await docx.Packer.toBuffer(doc).then((buffer) => {
                fs.writeFileSync("./Output/The_Wandering_Inn.doc", buffer);
                console.log("Doc done")
            })

            //Creates a zip archive from the "Output" Directory
            const folder = new zip()
            folder.addLocalFolder("./Output")
            folder.writeZip("./The_Wandering_Inn.zip")
            console.log(`Zip done`)
        })

    res.end()
})

app.post('/close' , (req, res) => {
    process.exit(0)
})

async function parseChapters(chapters, res) {
    for (var i = 0; i < chapters.length; i++) {
        //Goes to each link sent back
        await axios(chapters[i])
            .then(response => {
                const html = response.data
                const $ = cheerio.load(html)

                res.write($('.entry-title', html).text())
                console.log('Working on ' + $('.entry-title', html).text())

                doc_paragraphs.push(
                    new docx.Paragraph({
                        text: $('.entry-title', html).text(),
                        heading: HeadingLevel.HEADING_1,
                    })
                )

                var data = $('.entry-content', html)
                data.find('a').remove()

                epub_chapters.push( {
                    title: $('.entry-title', html).text(),
                    data: data.html()
                })

                //Searches for the content
                $('.entry-content', html).each(function() {
                    //Cutoff indicates we have reached the authors note, meaning we stop adding text to our paragraph array
                    var cutoff = false

                    $('p', this).each(function(index, element) {
                        //Looks for strong tags in each paragraph, sets cutoff to true if we reach authors note
                        if($('strong', this).text().search(cutoff_point) != -1) {
                            cutoff = true
                        }
                        //Adds a paragraph to the paragraphs array
                        if(cutoff == false) {
                            doc_paragraphs.push(
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun($(this).text()),
                                    ],
                                    style: 'wellSpaced',
                                })
                            )
                        }
                    })
                })
            }).catch(err => {console.log(err)})
    }
}

async function getVolumes() {
    await axios(url)
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)

            $('.entry-content', html).each(function() {

                var volume
                
                $('p', this).each(function() {

                    var chapters = []

                    if($(this).find('a').text()) {

                        $('a', this).each(function() {

                            const title = $(this).text()
                            const url = $(this).attr('href')

                            chapters.push({
                                title,
                                url
                            })
                        })

                        all_chapters.push({
                            volume,
                            chapters
                        })

                    } else {
                        volume = $(this).find('strong').text().replace(/(\r\n|\n|\r)/gm, "")
                    }
                })
            })

        }).catch(err => console.log(err));
}

app.listen(PORT, () => console.log('listening on port ' + PORT));