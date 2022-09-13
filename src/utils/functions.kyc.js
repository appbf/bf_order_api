
async function uploadImage(data_stream, is_base64, file_name) {
    const mime = require('mime');
    const fs = require('fs');
    try {
        var decodedImg = is_base64?decodeBase64Image(data_stream):data_stream;
        var imageBuffer = decodedImg.data;
        var type = decodedImg.mimetype;
        var extension = mime.getExtension(type);
        const newname = file_name.split('/').join('');
        var fileName = newname+"-image." + extension;
        try {
            fs.writeFileSync("./src/d/images/" + fileName, imageBuffer, 'utf8');
        } catch (err) {
            console.log("Error: ", err.message)
            return undefined;
        }
        const file_path = `/images/${fileName}`;
        return file_path;
    } catch (error) {
        return undefined;
    }
}
function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}
module.exports = {
    uploadImage
}