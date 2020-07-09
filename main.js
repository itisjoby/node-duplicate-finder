// Get process.stdin as the standard input object.
var standard_input = process.stdin;
var fs = require("fs");
var p = require("path");
const chalk = require('chalk');
var promise = require('promise');
const {getVideoDurationInSeconds} = require('get-video-duration');
let path = "D://music/";
let destination = path + "destination/";

// Set input character encoding.
standard_input.setEncoding("utf-8");

// Prompt user to input data in console.
console.log("type 1 to begin.");

// When user input data and click enter key.
standard_input.on("data", function (data) {
    // User input exit.
    if (data == 1) {

        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        } else {
            console.log(chalk.redBright('directory exists!') + "\n");
        }
        let filecollection = {};
        var i = 0;
        let ignored_file_count = 0;
//https://airbrake.io/blog/nodejs-error-handling/err_buffer_out_of_bounds

        fs.readdir(path, (err, files) => {

            files.forEach(async file => {

                if (file.trim() != "destination") {
                    if (p.extname(path + file).trim() == ".mp4") {

//                        console.log(file)
//                        getVideoDurationInSeconds(path + file).then((duration) => {
//                            console.log(duration)
//                        })
                        var buff = Buffer.alloc(2000);
                        fs.open(path + file, "r", function (err, fd) {

                            fs.read(fd, buff, 0, 100, 0, function (err, bytesRead, buffer) {
                                var start = buffer.indexOf(Buffer.from("mvhd")) + 17;
                                var timeScale = buffer.readUInt32BE(start, 4);
                                var duration = buffer.readUInt32BE(start + 4, 4);
                                var movieLength = Math.floor(duration / timeScale);

                                i++;
                                let filesize = getFilesizeInBytes(path + file);
                                let temp = {};
                                temp["name"] = file;
                                temp["size"] = filesize;
                                temp["duration"] = movieLength;
                                filecollection[i] = temp;

                                if (files.length - ignored_file_count == i) {
                                    getDuplicate(filecollection);
                                }
                            });

                        });
                    } else {
                        ignored_file_count++;
                    }
                } else {
                    ignored_file_count++;
                }

            });
        })

    } else {
        console.log("unknown command try agian");
        process.exit();
    }
});
/**
 * 
 * @param {type} filecollection
 * @returns {undefined}
 */
function getDuplicate(filecollection) {


    console.log("\n" + chalk.green('finding duplicates begins!' + "\n"));
    for (let first in filecollection) {
        let has_duplicate = false;
        if (filecollection[first].duration == 0) {
            continue;
        }
        for (let second in filecollection) {

            if (second <= first) {
                continue;
            }
            if (filecollection[second].duration == 0) {
                continue;
            }
            if ((filecollection[first].size == filecollection[second].size) || (filecollection[first].duration == filecollection[second].duration)) {
                has_duplicate = true;
                console.log(chalk.magentaBright("***************************************************\n"));
                console.log(chalk.red("\nPossible duplicate founded\n"));
                console.log(chalk.yellow("\nMatching File 1\n"));
                console.log("Name : " + filecollection[first].name + "\n");
                console.log("Size : " + filecollection[first].size + "\n");
                console.log("Duration : " + filecollection[first].duration + "\n");
                console.log(chalk.yellow("\nMatching File 2\n"));
                console.log("\nName : " + filecollection[second].name + "\n");
                console.log("\nSize : " + filecollection[second].size + "\n");
                console.log("\nDuration : " + filecollection[second].duration + "\n");

                console.log(chalk.greenBright("\n Moving to " + destination + " \n"));
                fs.rename(path + filecollection[second].name, destination + first + filecollection[second].name, function () {
                    console.log(chalk.greenBright("\n Moved Successfully " + filecollection[second].name + " to " + destination + " \n"));
                })
                console.log(chalk.magentaBright("_________________________________________________________\n"));
            }
        }
        if (has_duplicate) {

            fs.rename(path + filecollection[first].name, destination + first + filecollection[first].name, function () {
                console.log(chalk.greenBright("\n Moved Successfully " + filecollection[first].name + " to " + destination + " \n"));
            })
        }
    }
    console.log(chalk.greenBright("\n Completed sucessfully\n"));

}

function getFilesizeInBytes(filename) {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

