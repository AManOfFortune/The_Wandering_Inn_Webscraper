# [The Wandering Inn Webscraper](https://the-wandering-inn-webscraper.onrender.com)

### The simple way to download [The Wandering Inn](https://wanderinginn.com) chapters to .doc and .epub

## Usage
The recommended usage is the live hosted version here: [https://the-wandering-inn-webscraper.onrender.com](https://the-wandering-inn-webscraper.onrender.com).
Simply select a volume, select the chapters you want to download and klick submit. Afterwards you can klick on "Download" to download your selected chapters.

## Local install
If you want to install and run this project locally, use the following steps:

1. Clone/Download this repository.
2. Navigate to the downloaded Folder in your terminal and type "npm run build". If this leads to an error, you most likely need to install node package manager first. See [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for a guide.
3. Open the "index.js" file and replace the first line in the file with "const hostingAddress = "http://localhost:80".
4. Open the "script.js" file in the "Client" directory and do the same.
5. After all the previous steps have been completed, you should be able to run "npm run start" in your terminal. This should start the server, which should print "Listening on Port 80" in the console.
6. If the server is running successfully, you can open a browser of your choice and type "localhost" in your searchbar, which opens the app.
7. Done🎉
